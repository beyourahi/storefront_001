# AGENTS.md

## Always Do First

**Invoke the `frontend-design` skill** before writing any frontend code, every session, no exceptions.

This file provides guidance to AI coding agents when working with code in this repository.

---

# ⚠️ CRITICAL: Git Worktree Workflow — NEVER CREATE BRANCHES

**This project uses git worktrees exclusively for parallel development.**

```bash
# CORRECT: Create a worktree for new work
git worktree add ../storefront_001-feature-name

# WRONG: NEVER do this
git checkout -b feature-branch  # ❌ NEVER CREATE BRANCHES
```

**Why:** This workspace enforces a strict worktree workflow across all projects to enable parallel AI development, eliminate context switching, and maintain linear git history. **This is a HARD REQUIREMENT.**

**Always break large tasks into focused scopes** — run parallel agents with git worktrees, each with a narrow, well-defined goal.

---

## Quick Reference

| Component       | Technology                          | Version   |
| --------------- | ----------------------------------- | --------- |
| Framework       | Shopify Hydrogen                    | 2026.1.0  |
| Storefront API  | Shopify Storefront API              | 2026-01   |
| Router          | React Router 7                      | 7.12.0    |
| React           | React (with Compiler)               | 18.3.1    |
| Styling         | Tailwind CSS v4                     | 4.1.18    |
| Components      | Radix UI + shadcn/ui                | Latest    |
| Deployment      | Shopify Oxygen (Cloudflare Workers) | —         |
| Package Manager | Bun                                 | —         |
| Node            | >=20.19.0                           | Required  |

---

## Commands

```bash
# Development
bun run dev              # Hydrogen dev + codegen
bun run build            # Production build
bun run preview          # Test production build

# Code Quality
bun run lint             # ESLint (flat config)
bun run typecheck        # TypeScript + router types
bun run codegen          # GraphQL types + router types (ALWAYS after GraphQL changes)
```

---

## Critical Patterns

### Imports

**ALWAYS use `~/` prefix, NEVER relative paths:**

```typescript
// ✅ CORRECT
import {Button} from "~/components/ui/button";
import {formatPrice} from "~/lib/currency-formatter";

// ❌ WRONG
import {Button} from "../components/ui/button";
import {formatPrice} from "../../lib/currency-formatter";
```

### React Router 7

**ALWAYS import from `"react-router"`, NEVER old packages:**

```typescript
// ✅ CORRECT
import {useLoaderData, Form, Link} from "react-router";

// ❌ WRONG - Will cause runtime errors
import {useLoaderData} from "@remix-run/react";
import {useLoaderData} from "react-router-dom";
```

### GraphQL Codegen

**Run after ANY GraphQL change:**

```bash
bun run codegen  # CRITICAL - generates storefrontapi.generated.d.ts
```

**When to run:**

- After adding/modifying GraphQL queries or fragments
- TypeScript errors in query results
- After pulling changes with GraphQL updates
- Before committing GraphQL file changes

### Tailwind CSS v4

**NO `tailwind.config.js` - CSS-first config only:**

```css
/* app/styles/app.css */
@import "tailwindcss";

@theme inline {
    --color-primary: oklch(0.5 0.2 200);
    /* ... */
}
```

### shadcn/ui Components

**NEVER edit `components/ui/` directly (auto-generated):**

```bash
# Add/update components
bunx shadcn@latest add button
bunx shadcn@latest add button --overwrite

# Create wrapper components instead
# ✅ components/custom-button.tsx
# ❌ components/ui/button.tsx (editing directly)
```

---

## Frontend UI Visual Verification (REQUIRED)

**During any frontend UI or design work, you MUST use Playwright MCP to visually verify your changes.**

### Workflow

1. **Determine the active port** for this project before taking screenshots (see Port Detection below)
2. **Take screenshots** via Playwright MCP targeting the correct `http://localhost:<port>`
3. **Save to `tmp_screenshots/`** at the root of this repository
4. **Analyze each screenshot** against the plan or requirements to verify accuracy
5. **Iterate** — fix discrepancies, re-screenshot, re-analyze until requirements are met

### Rules

- **ALWAYS** take at least one screenshot per UI change before considering it done
- **NEVER** mark frontend work as complete without visual verification
- Screenshots go in `tmp_screenshots/` at the project root (create the directory if it doesn't exist)
- Name screenshots descriptively: `tmp_screenshots/homepage-hero.png`, `tmp_screenshots/cart-drawer-open.png`
- Take screenshots at multiple viewport sizes when responsive behavior matters (mobile + desktop)
- After each batch of changes, compare the screenshots against the original requirements or design spec and explicitly state what matches and what still needs work

### Port Detection

Multiple dev servers may be running simultaneously across projects. **Always identify the correct port before screenshotting.**

Detection order (use the first that works):

1. **Check dev server output** — the terminal running `bun run dev` prints the active URL (e.g. `Local: http://localhost:4457`)
2. **Check `vite.config.ts`** — look for an explicit `server.port` value
3. **Check `package.json`** — some scripts hardcode a port via `--port` flag
4. **Scan active ports** — run `lsof -i :3000-4999 | grep LISTEN` to see what's bound, then match the process to this project's directory

**Never assume port 3000.** If multiple Vite/Hydrogen servers are running, confirm you're screenshotting the right one by checking the page title or a unique element.

### Example Playwright MCP Usage

```
// First confirm the port (e.g. from dev server output: http://localhost:4457)
navigate to http://localhost:4457
take screenshot → tmp_screenshots/homepage-initial.png

// After making changes, verify
take screenshot → tmp_screenshots/homepage-after-fix.png
// Analyze: does this match the requirement?
```

### What to Check in Screenshots

- Layout matches the intended design/spec
- Spacing, typography, and colors are correct
- Interactive states (hover, focus, open/closed) render properly
- No visible layout breaks or overflow issues
- Responsive breakpoints behave as expected

---

## Code Organization

```
app/
├── routes/              # File-based routes (React Router 7)
│   ├── _index.tsx       # Homepage
│   ├── account.*.tsx    # Customer account pages
│   ├── collections.*.tsx# Collection pages
│   └── products.*.tsx   # Product pages
├── components/
│   ├── ui/              # shadcn/ui (AUTO-GENERATED - DO NOT EDIT)
│   ├── layout/          # Navbar, Footer
│   ├── homepage/        # Homepage section components (Hero, FAQ, Testimonials, Blog, etc.)
│   ├── blog/            # Blog article components (ArticleCard, ArticleHero, AuthorBio, etc.)
│   ├── product/         # Product components
│   ├── cart/            # Cart components
│   ├── account/         # Account-related components
│   ├── sections/        # Generic section components
│   ├── search/          # Search components
│   ├── gallery/         # Gallery/lightbox components
│   ├── display/         # Display/presentation components
│   ├── common/          # Shared utility components
│   ├── icons/           # Icon components
│   ├── contact/         # Contact form components
│   ├── legal/           # Legal/policy components
│   ├── custom/          # Custom one-off components
│   └── pwa/             # Service worker, offline
├── lib/
│   ├── context.ts       # Hydrogen context factory
│   ├── fragments.ts     # GraphQL fragments
│   ├── metaobject-*.ts  # CMS metaobject parsers/queries
│   ├── site-content-context.tsx # Site content React context
│   ├── product/         # Product utilities
│   ├── color/           # OKLCH color utilities
│   ├── validation/      # Zod schemas
│   ├── search/          # Search utilities
│   ├── queries/         # Shared GraphQL queries
│   └── types/           # Shared TypeScript types
├── hooks/               # React hooks
├── styles/
│   ├── app.css          # Tailwind v4 config + globals
│   └── view-transitions.css
├── graphql/
│   └── customer-account/# Customer Account API queries
├── routes.ts            # Route configuration
├── root.tsx             # Root layout
├── entry.server.tsx     # SSR entry point
└── entry.client.tsx     # Client hydration
```

---

## GraphQL

### Two Schemas

**Storefront API** (`storefrontapi.generated.d.ts`)

- Products, collections, cart, checkout
- Config: `.graphqlrc.ts` → `projects.default`
- Files: All `app/**/*.{ts,tsx}` except `graphql/customer-account/`

**Customer Account API** (`customer-accountapi.generated.d.ts`)

- Customer profile, orders, addresses, subscriptions
- Config: `.graphqlrc.ts` → `projects.customer`
- Files: `app/graphql/customer-account/*.{ts,tsx}`

### Fragments

```typescript
// lib/fragments.ts - Shared fragments
import {PRODUCT_CARD_FRAGMENT} from "~/lib/fragments";

const QUERY = `#graphql
  query ProductsGrid($first: Int!) {
    products(first: $first) {
      nodes {
        ...ProductCard
      }
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
`;
```

**Key fragments:**

- `PRODUCT_CARD_FRAGMENT` - Product card data
- `CART_QUERY_FRAGMENT` - Cart data
- `HEADER_QUERY` - Navigation
- `FOOTER_QUERY` - Footer links

### Metaobject CMS

```
lib/metaobject-queries.ts    → GraphQL queries
lib/metaobject-parsers.ts    → Response parsers
lib/site-content-context.tsx → React context
```

**Usage:**

1. Query metaobjects in `root.tsx`
2. Parse with `parseSiteContent()`
3. Consume via `useSiteContent()`

---

## React Router 7

### Route File Pattern

```typescript
import type {Route} from "./+types/collections.$handle";

export async function loader({params, context}: Route.LoaderArgs) {
  const {handle} = params;
  const {storefront} = context;

  const data = await storefront.query(QUERY, {variables: {handle}});
  return {collection: data.collection};
}

export default function CollectionRoute() {
  const {collection} = useLoaderData<typeof loader>();
  return <div>...</div>;
}
```

### File-Based Routing

```
_index.tsx                 → / (index route)
products.$handle.tsx       → /products/:handle (dynamic param)
account.orders.$id.tsx     → /account/orders/:id (nested dynamic)
$.tsx                      → /* (catch-all)
[robots.txt].tsx           → /robots.txt (resource route)
```

### Context Available in Loaders

```typescript
export async function loader({context}: Route.LoaderArgs) {
    const {
        storefront, // Storefront API client
        cart, // Cart utilities
        session, // Session storage
        env, // Environment variables
        waitUntil // Cloudflare Workers waitUntil
    } = context;
}
```

---

## React Compiler

**Automatic optimization via Babel plugin in `vite.config.ts`:**

```typescript
const ReactCompilerConfig = {
    target: "18" // MUST match React version (18.3.1)
};
```

**What it does:**

- Automatic memoization (no `useMemo`/`useCallback` needed)
- Optimizes re-renders
- Zero code changes

**CRITICAL:** Update `target` if React version changes.

---

## Environment Variables

### Required (.env)

```bash
SHOPIFY_STOREFRONT_ACCESS_TOKEN=your_token
SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID=your_client_id
SESSION_SECRET=32_character_random_string  # Generate: openssl rand -base64 32
```

### Accessing in Code

```typescript
// Server-side only (loaders, actions)
export async function loader({context}: Route.LoaderArgs) {
    const secret = context.env.SESSION_SECRET;
}

// ❌ NEVER access in components (server-only)
```

---

## Critical Gotchas

1. **Stale GraphQL Types** → Run `bun run codegen`
2. **React Router Imports** → ALWAYS `"react-router"`, NEVER `"@remix-run/react"` or `"react-router-dom"`
3. **Tailwind Config** → NO `tailwind.config.js`, use CSS-first in `app/styles/app.css`
4. **shadcn/ui Edits** → NEVER edit `components/ui/`, create wrappers
5. **SESSION_SECRET Missing** → Add to `.env` (generate: `openssl rand -base64 32`)
6. **React Compiler Target** → Update `vite.config.ts` target if React version changes
7. **Metaobject Parsers** → Verify `lib/metaobject-parsers.ts` matches Shopify definitions
8. **Import Paths** → ALWAYS `~/`, NEVER relative (`../`)
9. **GraphQL After Pull** → Run codegen after pulling changes with GraphQL updates
10. **Node Version** → Requires >=20.19.0

---

## Code Style

### TypeScript

| Pattern      | Enforcement               |
| ------------ | ------------------------- |
| Strict mode  | Required (no `any` types) |
| Target       | ES2022                    |
| Path aliases | ALWAYS `~/`, NEVER `../`  |

### Formatting

| Rule            | Value          |
| --------------- | -------------- |
| Indentation     | 4 spaces       |
| Line width      | 120 characters |
| Quotes          | Double `"`     |
| Trailing commas | ES5 style      |
| Semicolons      | Required       |

### Naming Conventions

| Type              | Pattern                              | Example                 |
| ----------------- | ------------------------------------ | ----------------------- |
| GraphQL queries   | `SCREAMING_SNAKE_CASE`               | `PRODUCTS_QUERY`        |
| GraphQL fragments | `SCREAMING_SNAKE_CASE` + `_FRAGMENT` | `PRODUCT_CARD_FRAGMENT` |
| Components        | `PascalCase`                         | `ProductCard`           |
| Hooks             | `camelCase` + `use` prefix           | `useCartDrawer`         |

---

## PWA Support

**Service Worker:** `components/ServiceWorkerRegistration.tsx`
**Manifest:** `public/manifest.webmanifest`
**Offline:** `components/OfflineAwareErrorPage.tsx`

---

## Deployment

### Shopify Oxygen (Recommended)

```bash
bun run build  # Creates production build in dist/
# Shopify CLI or GitHub Actions deploys to Oxygen
```

**Environment:** Cloudflare Workers (global edge)
**URL:** `*.myshopify.com` or custom domain

### Self-Hosted Cloudflare Workers

```bash
bunx wrangler deploy dist/worker/
```

---

## MCP Server Integration

**Use MCP tools for official documentation:**

1. **shopify-dev** → GraphQL queries, Oxygen deployment, Hydrogen patterns (`validate_graphql_codeblocks`)
2. **context7** → Tailwind CSS, Radix UI, React patterns (fallback for non-Shopify docs)
3. **svelte** → NOT USED (React project)

**Always validate GraphQL before committing:** `bun run codegen`

---

## Utilities Reference

| Category   | Files                       | Purpose                                                   |
| ---------- | --------------------------- | --------------------------------------------------------- |
| Product    | `lib/product/*`             | Options, media, price, availability, variants             |
| Color      | `lib/color/*`               | OKLCH conversion, parsing, contrast                       |
| Currency   | `lib/currency-formatter.ts` | Price formatting                                          |
| Validation | `lib/validation/*`          | Zod schemas (customer, address, payment)                  |
| Hooks      | `hooks/*`                   | Cart drawer, debounce, intersection observer, media query |

### Cart Actions Reference (`app/routes/cart.tsx`)

| Action                              | Method                          | Notes                                  |
| ----------------------------------- | ------------------------------- | -------------------------------------- |
| `CartForm.ACTIONS.LinesAdd`         | `cart.addLines()`               | Add line items                         |
| `CartForm.ACTIONS.LinesUpdate`      | `cart.updateLines()`            | Update quantities / attributes         |
| `CartForm.ACTIONS.LinesRemove`      | `cart.removeLines()`            | Remove line items                      |
| `CartForm.ACTIONS.DiscountCodesUpdate` | `cart.updateDiscountCodes()` | Replace all discount codes             |
| `CartForm.ACTIONS.GiftCardCodesUpdate` | `cart.updateGiftCardCodes()` | Replace all gift card codes            |
| `CartForm.ACTIONS.GiftCardCodesAdd`    | `cart.addGiftCardCodes()`    | Append gift card codes (2026.1.0+)     |
| `CartForm.ACTIONS.GiftCardCodesRemove` | `cart.removeGiftCardCodes()` | Remove applied gift card codes         |
| `CartForm.ACTIONS.NoteUpdate`       | `cart.updateNote()`             | Update cart note                       |
| `CartForm.ACTIONS.BuyerIdentityUpdate` | `cart.updateBuyerIdentity()` | Update buyer country / customer        |

---

**Last Updated:** 2026-02-23
**Maintained By:** Rahi Khan (@beyourahi)
