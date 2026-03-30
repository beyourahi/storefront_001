# Plan: Security & API Hardening

## Summary

Addresses 12 security vulnerabilities across API routes, CSP configuration, redirect handling, and output encoding. These items share the common theme of inadequate input validation, missing access controls, and insecure defaults that are exploitable in production.

## Items Covered

| # | Description | File | Severity |
|---|---|---|---|
| 19 | No rate limiting on newsletter endpoint | `app/routes/api.newsletter.tsx` | Medium |
| 20 | `Math.random()` for password generation | `app/routes/api.newsletter.tsx:24` | Medium |
| 21 | No rate limiting on recommendations endpoint | `app/routes/api.product.recommendations.tsx` | Medium |
| 22 | No rate limiting on product data endpoint | `app/routes/api.products.$handle.tsx` | Medium |
| 23 | No rate limiting on share tracking endpoint | `app/routes/api.share.track.tsx` | Medium |
| 24 | No rate limiting on wishlist products endpoint | `app/routes/api.wishlist-products.tsx` | Medium |
| 25 | GraphQL proxy forwards all request headers | `app/routes/api.$version.[graphql.json].tsx` | **Critical** |
| 26 | No validation on `params.version` in GraphQL proxy | `app/routes/api.$version.[graphql.json].tsx` | **Critical** |
| 27 | Ngrok domain hardcoded in production CSP | `app/entry.server.tsx:97-98` | High |
| 28 | CSP style-src includes `'unsafe-inline'` | `app/entry.server.tsx:82` | Low |
| 29 | Open redirect bypass via backslash/encoded variants | `app/routes/discount.$code.tsx:12` | High |
| 109 | URL not HTML-attribute-escaped in `<a href>` | `app/lib/text-format.ts:32` | Medium |

## Current State

### GraphQL Proxy (`app/routes/api.$version.[graphql.json].tsx`)
- 11 lines total. Forwards `request.headers` verbatim to `https://${PUBLIC_CHECKOUT_DOMAIN}/api/${params.version}/graphql.json`
- `params.version` is interpolated into the URL with zero validation — path traversal possible
- All client headers (Cookie, Authorization, custom tokens) leak to the upstream Shopify endpoint

### API Routes (5 files)
- None of the 5 API routes have any rate limiting
- `api.newsletter.tsx` uses `Math.random()` at line 24 for password generation in `generateSecurePassword()`
- All run on Cloudflare Workers/Shopify Oxygen — no shared state between isolates

### CSP (`app/entry.server.tsx`)
- Lines 96-98: ngrok tunnel domain `hermelinda-nonsegmentary-hettie.ngrok-free.dev` in `connectSrc` — present in all builds
- Line 82: `'unsafe-inline'` in `styleSrc` — required by Radix UI portals that inject inline `style` attributes

### Open Redirect (`app/routes/discount.$code.tsx`)
- Line 12: `redirectParam.includes("//")` is the only guard — bypassed by `\evil.com`, `/%2Fevil.com`, protocol-less URLs

### HTML Escaping (`app/lib/text-format.ts`)
- Line 32: `href="${safeUrl}"` — `safeUrl` passes protocol whitelist but is not escaped for HTML attribute context. A URL like `https://x.com" onclick="alert(1)` breaks out of the attribute.

## Target State

1. **GraphQL proxy**: Whitelist-only header forwarding + regex validation on `params.version`
2. **API routes**: Lightweight in-memory sliding-window rate limiter per IP, shared via a new `app/lib/rate-limit.ts` module
3. **Password generation**: `crypto.getRandomValues()` (Web Crypto API, available in Workers/Oxygen)
4. **CSP**: Ngrok domain gated behind `import.meta.env.DEV`; `'unsafe-inline'` documented with rationale
5. **Open redirect**: URL constructor validation ensuring same-origin redirects
6. **HTML escaping**: Apply existing `escapeHtml()` to URL in attribute context

## Implementation Approach

### 1. GraphQL Proxy Rewrite (Items 25, 26)

**File:** `app/routes/api.$version.[graphql.json].tsx`

Rewrite the entire 11-line file:

```typescript
import type {Route} from "./+types/api.$version.[graphql.json]";

const VALID_API_VERSION = /^\d{4}-\d{2}$/;
const FORWARDED_HEADERS = ["Content-Type", "Accept"] as const;

export const action = async ({params, context, request}: Route.ActionArgs) => {
    if (!params.version || (!VALID_API_VERSION.test(params.version) && params.version !== "unstable")) {
        return new Response(JSON.stringify({error: "Invalid API version"}), {
            status: 400,
            headers: {"Content-Type": "application/json"}
        });
    }

    const upstreamHeaders = new Headers();
    for (const name of FORWARDED_HEADERS) {
        const value = request.headers.get(name);
        if (value) upstreamHeaders.set(name, value);
    }
    upstreamHeaders.set("X-Shopify-Storefront-Access-Token", context.env.PUBLIC_STOREFRONT_API_TOKEN);

    const response = await fetch(
        `https://${context.env.PUBLIC_CHECKOUT_DOMAIN}/api/${params.version}/graphql.json`,
        {method: "POST", body: request.body, headers: upstreamHeaders}
    );

    return new Response(response.body, {headers: new Headers(response.headers)});
};
```

Key decisions:
- Whitelist approach: only `Content-Type` and `Accept` are forwarded
- API token set server-side from `context.env` — never trust client-sent auth headers
- Version regex `^\d{4}-\d{2}$` matches Shopify's `YYYY-MM` format plus allows `"unstable"`

### 2. Rate Limiter Module (Items 19, 21-24)

**New file:** `app/lib/rate-limit.ts`

Create a lightweight in-memory sliding-window rate limiter:

```typescript
interface RateLimitConfig {
    windowMs: number;
    maxRequests: number;
}

interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    retryAfterMs: number | null;
}
```

Implementation details:
- `Map<string, {count: number, windowStart: number}>` storage
- Periodic cleanup: every 100 `check()` calls, evict entries older than `2 * windowMs`
- Cap at 10,000 entries with oldest-first eviction
- `getClientIP(request)`: reads `CF-Connecting-IP` > `X-Forwarded-For` (first entry) > `"unknown"`
- `getRateLimitResponse(result)`: returns `429 Too Many Requests` with `Retry-After` header, or `null` if allowed

**Limitation acknowledged:** On Workers, each isolate has its own Map. This provides burst protection within an isolate but not global rate limiting. This is the best available approach without external state (Redis/KV). The in-memory approach raises the cost of abuse significantly even if not perfect.

Rate limit tiers:

| Endpoint | Limit | Rationale |
|---|---|---|
| `api.newsletter.tsx` | 5 req / 60s | Creates accounts — highest abuse risk |
| `api.share.track.tsx` | 30 req / 60s | Analytics write |
| `api.product.recommendations.tsx` | 30 req / 60s | Read-only, but hits Storefront API |
| `api.products.$handle.tsx` | 30 req / 60s | Read-only, but hits Storefront API |
| `api.wishlist-products.tsx` | 20 req / 60s | Batch query, heavier per request |

For each API route: create a module-level limiter instance and add a 3-line check at the top of the `action`/`loader` function.

### 3. Crypto Password Fix (Item 20)

**File:** `app/routes/api.newsletter.tsx`, line 24

Replace `Math.floor(Math.random() * chars.length)` with:
```typescript
const randomBytes = new Uint8Array(24);
crypto.getRandomValues(randomBytes);
// then: chars.charAt(randomBytes[i] % chars.length)
```

`crypto.getRandomValues` is a Web Standard API available in Workers, Oxygen, and all modern runtimes. No import needed.

### 4. CSP Hardening (Items 27, 28)

**File:** `app/entry.server.tsx`

**Item 27 (ngrok removal):** Replace the hardcoded ngrok entries in `connectSrc` with:
```typescript
...(import.meta.env.DEV
    ? ["wss://hermelinda-nonsegmentary-hettie.ngrok-free.dev:*",
       "https://hermelinda-nonsegmentary-hettie.ngrok-free.dev"]
    : [])
```
`import.meta.env.DEV` is Vite's built-in flag — `true` in dev, tree-shaken out in production builds.

**Item 28 (unsafe-inline):** Keep `'unsafe-inline'` in `styleSrc` but add an explanatory comment:
```typescript
// Radix UI portals (Dialog, Popover, Select, Drawer) inject inline style
// attributes for positioning at runtime without nonce support. Removing
// 'unsafe-inline' breaks all overlay components. Monitor Radix nonce
// support for future removal. Style-based XSS (CSS expression()) only
// affects IE < 10.
styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.shopify.com", "https://fonts.googleapis.com"],
```

### 5. Open Redirect Fix (Item 29)

**File:** `app/routes/discount.$code.tsx`, lines 10-14

Replace the `includes("//")` check with URL constructor validation:
```typescript
let redirectParam = searchParams.get("redirect") || searchParams.get("return_to") || "/";

try {
    const parsed = new URL(redirectParam, request.url);
    const requestOrigin = new URL(request.url).origin;
    if (parsed.origin !== requestOrigin) {
        redirectParam = "/";
    }
} catch {
    redirectParam = "/";
}
```

This handles all bypass variants: `//evil.com`, `\evil.com`, `/\evil.com`, `https:evil.com`, `javascript:alert(1)`, URL-encoded sequences — because the `URL` constructor normalizes all of them and origin comparison catches cross-domain redirects.

### 6. HTML Attribute Escaping (Item 109)

**File:** `app/lib/text-format.ts`, line 32

One-word change — apply the existing `escapeHtml()` to `safeUrl`:
```typescript
// Before:
result += `<a href="${safeUrl}" class="...
// After:
result += `<a href="${escapeHtml(safeUrl)}" class="...
```

The `escapeHtml` function at lines 1-7 already handles `"` → `&quot;`, which prevents attribute breakout.

## Constraints

- No external dependencies (no Redis, no KV store for rate limiting)
- CSP must not break: Shopify checkout, CDN images, Google Fonts, GTM, Radix UI overlays
- All fixes must work on both Cloudflare Workers (portfolio) and Shopify Oxygen (client production)
- `import.meta.env.DEV` is the correct Vite flag — do NOT use `process.env.NODE_ENV` (not reliably set in Workers)
- The `escapeHtml` function in text-format.ts must not be modified — it is correct as-is

## Execution Order

1. **GraphQL proxy** (Items 25, 26) — highest severity, self-contained
2. **Open redirect** (Item 29) — exploitable, self-contained
3. **HTML escaping** (Item 109) — one-line fix, zero regression risk
4. **Crypto password** (Item 20) — self-contained within one function
5. **CSP ngrok removal** (Item 27) — straightforward conditional
6. **CSP unsafe-inline doc** (Item 28) — comment-only change
7. **Rate limiter module** (new file) — foundation for step 8
8. **Rate limiting on 5 API routes** (Items 19, 21-24) — depends on step 7

Steps 1-6 are independent and can execute in parallel. Steps 7-8 are sequential.

## Parallelism Notes

This plan is fully independent from all other plans. It can execute in a dedicated worktree concurrently with any other plan. No files overlap with the other 4 plans except `app/entry.server.tsx` (CSP changes here, but no other plan touches CSP directives).

## Verification

- **GraphQL proxy:** `curl -X POST /api/../../admin/graphql.json` returns 400. Send request and verify upstream does not receive client `Cookie`/`Authorization` headers.
- **Open redirect:** Test `redirect=//evil.com`, `redirect=\evil.com`, `redirect=javascript:alert(1)`, `redirect=/collections/summer` (last one should pass)
- **HTML escaping:** Render `[click](https://x.com" onclick="alert(1))` through `parseMarkdownLinks` and verify output contains `&quot;`
- **Rate limiting:** Hit each endpoint beyond its limit from same IP, verify 429 responses
- **CSP:** `bun run build` + check output for ngrok domain (should be absent). Dev server: verify Customer Account API still works with ngrok.
- **Password:** Subscribe via newsletter form end-to-end
