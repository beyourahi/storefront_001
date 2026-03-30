# Plan: SEO, Meta Tags, Structured Data, & Localization

## Summary

Addresses 40 audit items covering title duplication, missing meta exports on 12 routes, missing canonical URLs on 9 routes, structured data gaps (Organization, Collection, FAQ JSON-LD), the `example.com` fallback URL leaking into production schemas, robots.txt blocking policy pages, and hardcoded locale/lang values that limit template portability. All items share the SEO module (`app/lib/seo.ts`) and the `getSeoMeta()` pattern as their implementation surface.

## Items Covered

| # | Description | Category |
|---|---|---|
| 11 | Product page title duplicated: "Product \| Store \| Store" | Title |
| 12 | Cart page title: "Store \| Store" with no "Cart" text | Title |
| 18 | SEO console warnings: title/description duplicated on product pages | Title |
| 30 | `FALLBACK_SITE_URL = "https://example.com"` leaks into structured data | Schema |
| 31 | Product schema `offers.url` uses example.com default | Schema |
| 32 | Collection schema `itemListElement[].url` uses example.com default | Schema |
| 33 | BlogPosting schema `mainEntityOfPage` uses example.com default | Schema |
| 34 | `generateOrganizationSchema()` defined but never called | Schema |
| 35 | `generateCollectionSchema()` defined but never called | Schema |
| 36 | BlogPosting `dateModified` always equals `datePublished` | Schema |
| 37 | `cart.tsx` missing `meta` export | Meta |
| 38 | `offline.tsx` missing `meta` export | Meta |
| 39 | `$.tsx` missing `meta` export on 404 | Meta |
| 40 | `account_.login.tsx` missing `meta` export | Meta |
| 41 | `account_.authorize.tsx` missing `meta` export | Meta |
| 42 | `account_.logout.tsx` missing `meta` export | Meta |
| 43 | `discount.$code.tsx` missing `meta` export | Meta |
| 44 | `cart.$lines.tsx` missing `meta` export | Meta |
| 45 | `account.addresses.tsx` missing `meta` export | Meta |
| 46 | `account.$.tsx` missing `meta` export | Meta |
| 47 | `collections.all.tsx` missing `meta` export | Meta |
| 48 | `wishlist.tsx` missing `meta` export | Meta |
| 49 | FAQ meta: no description, no OG image | Meta |
| 50 | `collections.$handle.tsx` meta missing canonical URL | Canonical |
| 51 | `collections.all-products.tsx` meta missing canonical URL | Canonical |
| 52 | `blogs._index.tsx` meta missing canonical URL | Canonical |
| 53 | `blogs.$blogHandle._index.tsx` meta missing canonical URL | Canonical |
| 54 | `blogs.$blogHandle.$articleHandle.tsx` meta missing canonical URL | Canonical |
| 55 | `contact.tsx` meta missing canonical URL, no OG image | Canonical |
| 56 | `sale.tsx` meta missing canonical URL, no OG image | Canonical |
| 57 | `gallery.tsx` meta missing canonical URL, no OG image | Canonical |
| 58 | `policies.$handle.tsx` meta missing canonical URL | Canonical |
| 59 | robots.txt blocks `/policies/` entirely | Robots |
| 60 | robots.txt blocks `/search` but allows `/search/` | Robots |
| 61 | `wishlist.share.tsx` hardcodes "Your Store" in title | Title |
| 62 | Product canonical URL uses relative path when siteUrl empty | Canonical |
| 63 | `store-locale.ts` hardcodes Bangladesh (BD) locale | Locale |
| 64 | `<html lang="en">` hardcoded instead of using `STORE_LANGUAGE_CODE` | Locale |
| 97 | FAQ JSON-LD uses raw innerHTML script injection instead of `getSeoMeta({jsonLd})` | Schema |
| 111 | Homepage omits Organization JSON-LD ("to prevent hydration mismatch") | Schema |

## Current State

### Title Duplication (Root Cause)

`app/root.tsx` line 94 sets:
```typescript
titleTemplate: `%s | ${seoDefaults.brandName}`
```

This template applies to ALL routes. Routes that already include the brand name in their title get double-suffixing:
- `products.$handle.tsx` line 71: `title: \`${title} | ${shopName}\`` -> renders as "Product | Store | Store"
- `contact.tsx` line 78: `title: \`Contact Us - ${shopName}\`` -> renders as "Contact Us - Store | Store"

**Fix principle:** Routes must return only their page-specific title. The root `titleTemplate` handles brand suffixing universally.

### Missing Meta Exports

12 routes have no `meta` export at all. Most are redirect-only routes (account_.login, etc.) but some are user-visible pages (cart.tsx, offline.tsx, $.tsx).

### Missing Canonical URLs

9 routes pass meta via `getSeoMeta()` but omit the `url` property, so no `<link rel="canonical">` or `og:url` is emitted. The existing `buildCanonicalUrl(path, siteUrl)` function in `seo.ts` handles this -- routes just need to call it.

### FALLBACK_SITE_URL

`app/lib/seo.ts` line 70: `FALLBACK_SITE_URL = "https://example.com"`. Used by `buildCanonicalUrl()` when `siteUrl` is not configured. This leaks into Product, Collection, and BlogPosting schema URLs.

### Unused Schema Generators

- `generateOrganizationSchema()` (line 176): defined, never called. No Organization JSON-LD anywhere.
- `generateCollectionSchema()` (line 266): defined, never called. No ItemList JSON-LD on collection pages.
- Homepage comment at `_index.tsx:38-40` says Organization schema omitted "to prevent hydration mismatch."

### FAQ JSON-LD

`faq.tsx` line 24 injects FAQ schema via a raw innerHTML `<script>` tag in the component body instead of using the Hydrogen-idiomatic `getSeoMeta({jsonLd})` pattern in the meta function. This is inconsistent with other routes and bypasses the Hydrogen SEO pipeline.

### robots.txt

- Line 86: `Disallow: /policies/` blocks privacy policy, terms of service, etc. from search engines
- Lines 90-92: `Disallow: /search` blocks `/search` but `Allow: /search/` allows `/search/` -- inconsistent

### Locale/Lang

- `app/lib/store-locale.ts` lines 1-6: hardcodes `BD`, `en-BD`, `en_BD`
- `app/root.tsx` line 309: `<html lang="en">` hardcoded

## Target State

- **Title template:** Routes return bare page titles; root template adds `| ${brandName}` exactly once
- **All routes:** Have appropriate meta exports (proper titles for visible pages; `noindex` for redirect routes)
- **Canonical URLs:** All user-facing routes emit `<link rel="canonical">` and `og:url`
- **FALLBACK_SITE_URL:** Replaced with empty string -- `buildCanonicalUrl()` returns relative paths when siteUrl is unconfigured (safe degradation) rather than pointing to `example.com`
- **Schema generators:** Organization JSON-LD on homepage, ItemList JSON-LD on collection pages, FAQ JSON-LD via `getSeoMeta({jsonLd})` pattern
- **robots.txt:** Policy pages allowed, search blocking consistent
- **Locale:** Marked as template-configurable, `<html lang>` uses the configured language code

## Implementation Approach

### Phase 1: Fix Title Template Pattern (Items 11, 12, 18)

The root cause is routes manually including `${shopName}` or `${brandName}` in their title when the root `titleTemplate` already appends it.

**Files to change:**

1. **`app/routes/products.$handle.tsx`** (~line 71):
   ```typescript
   // Before: title: `${title} | ${shopName}`
   // After:  title: title
   ```
   Also check if the product's `seo.title` already includes the shop name from Shopify -- if so, override `titleTemplate: null` for that case.

2. **`app/routes/contact.tsx`** (~line 78):
   ```typescript
   // Before: title: `Contact Us - ${shopName}`
   // After:  title: "Contact Us"
   ```

3. **`app/routes/blogs.$blogHandle._index.tsx`**: Check if blog title includes brand name. Fix similarly.

4. **`app/routes/sale.tsx`** (~line 23): Check if title includes brand name. Currently `"Save Up to X% -- Special Offers"` -- verify no duplication.

**Verification:** After changes, page titles should be:
- Product: "Product Title | Store Name"
- Contact: "Contact Us | Store Name"
- Cart: "Cart | Store Name" (after Phase 2 adds meta)

### Phase 2: Add Missing Meta Exports (Items 37-48)

**User-visible pages** (need proper titles):

1. **`app/routes/cart.tsx`** (Item 37): Add meta export with `title: "Cart"` and `robots: {noIndex: true}` (cart contains personalized/session data).

2. **`app/routes/offline.tsx`** (Item 38): Add meta with `title: "Offline"` and `robots: {noIndex: true}`.

3. **`app/routes/$.tsx`** (Item 39): Add meta with `title: "Page Not Found"` and `robots: {noIndex: true}`.

**Redirect-only routes** (9 routes, need minimal `noindex` meta):

For each: `account_.login.tsx`, `account_.authorize.tsx`, `account_.logout.tsx`, `discount.$code.tsx`, `cart.$lines.tsx`, `account.addresses.tsx`, `account.$.tsx`, `collections.all.tsx`, `wishlist.tsx`:
```typescript
export const meta: Route.MetaFunction = () => [
    {title: "Redirecting..."},
    {name: "robots", content: "noindex"}
];
```

### Phase 3: Add Canonical URLs (Items 50-58, 62)

For each route, add `url: buildCanonicalUrl(path, siteUrl)` to the `getSeoMeta()` call. The `siteUrl` comes from root loader data via `getSiteUrlFromMatches(matches)`.

| File | Canonical Path |
|---|---|
| `collections.$handle.tsx` | `/collections/${handle}` |
| `collections.all-products.tsx` | `/collections/all-products` |
| `blogs._index.tsx` | `/blogs` |
| `blogs.$blogHandle._index.tsx` | `/blogs/${blogHandle}` |
| `blogs.$blogHandle.$articleHandle.tsx` | `/blogs/${blogHandle}/${articleHandle}` |
| `contact.tsx` | `/contact` |
| `sale.tsx` | `/sale` |
| `gallery.tsx` | `/gallery` |
| `policies.$handle.tsx` | `/policies/${handle}` |

For `products.$handle.tsx` (Item 62): after Phase 4 changes `buildCanonicalUrl()`, an empty `siteUrl` produces a relative path `/products/${handle}` instead of `https://example.com/products/${handle}`.

### Phase 4: Fix FALLBACK_SITE_URL (Items 30-33)

**File:** `app/lib/seo.ts`

**Line 70:** Change `FALLBACK_SITE_URL = "https://example.com"` to `FALLBACK_SITE_URL = ""`.

**`buildCanonicalUrl()` (lines 125-128):** Modify to handle empty siteUrl:
```typescript
export const buildCanonicalUrl = (path: string, siteUrl?: string): string => {
    const base = siteUrl?.replace(/\/$/, "") || "";
    return base ? `${base}${path}` : path;
};
```

When `siteUrl` is empty, canonical URLs become relative paths. When a client configures their real domain, full absolute URLs are emitted.

### Phase 5: Wire Up Schema Generators (Items 34, 35, 111)

#### 5a. Organization JSON-LD on Homepage (Items 34, 111)

The hydration mismatch concern can be resolved by generating the schema from loader data passed to the `meta` function. Since `meta` receives the same `data` from the loader on both server and client, there is no mismatch.

In `app/routes/_index.tsx` meta function:
```typescript
export const meta: Route.MetaFunction = ({data, matches}) => {
    const siteUrl = getSiteUrlFromMatches(matches);
    const brandName = getBrandNameFromMatches(matches);
    return getSeoMeta({
        title: shopName,
        titleTemplate: null,
        description,
        jsonLd: [
            generateOrganizationSchema(brandName, siteUrl, ogImage),
        ]
    }) ?? [];
};
```

#### 5b. Collection ItemList JSON-LD (Item 35)

In `app/routes/collections.$handle.tsx` meta function, add:
```typescript
const collectionSchema = generateCollectionSchema(collection, siteUrl);
return getSeoMeta({
    // existing props...
    jsonLd: [collectionSchema]
}) ?? [];
```

### Phase 6: BlogPosting dateModified (Item 36)

Shopify Storefront API `Article` type does not expose `updatedAt`. This is an API limitation, not a code bug. Add a comment in `generateBlogPostingSchema()` documenting this constraint.

### Phase 7: FAQ JSON-LD Pattern (Item 97)

**File:** `app/routes/faq.tsx`

Move FAQ schema from the raw `<script>` tag injection in the component body into the `meta` function using `getSeoMeta({jsonLd})`. The FAQ items are available via loader data.

```typescript
export const meta: Route.MetaFunction = ({data}) => {
    const faqSchema = data?.faqItems ? generateFAQPageSchema(data.faqItems) : null;
    return getSeoMeta({
        title: "Frequently Asked Questions",
        description: "Find answers to common questions about our products, shipping, and policies.",
        jsonLd: faqSchema ? [faqSchema] : undefined
    }) ?? [];
};
```

Remove the `<script type="application/ld+json">` element from the component's JSX.

Also fixes Item 49 (adds `description` to FAQ meta).

### Phase 8: Wishlist Share Title (Item 61)

**File:** `app/routes/wishlist.share.tsx`, line 109

Replace `"Your Store"` with dynamic brand name via `getBrandNameFromMatches(matches)`.

### Phase 9: robots.txt Fixes (Items 59, 60)

**File:** `app/routes/[robots.txt].tsx`

**Item 59:** Remove `Disallow: /policies/`. Policy pages should be indexable.

**Item 60:** Make search blocking consistent. Use `Disallow: /search` (blocks all search URLs including `/search/`). Remove the separate `Allow: /search/` line.

### Phase 10: Locale Portability (Items 63, 64)

#### 10a. `app/lib/store-locale.ts` (Item 63)

On Cloudflare Workers, `process.env` is not available. Locale values would need to come from `context.env` in loaders or be defined in `wrangler.jsonc` vars. For a template product, the pragmatic approach is to keep the current values but mark them clearly as template-configurable:

```typescript
// TEMPLATE CONFIGURATION: Update these values per client deployment.
// These constants define the store's locale for analytics, SEO, and i18n.
export const STORE_COUNTRY_NAME = "Bangladesh" as const;
export const STORE_COUNTRY_CODE = "BD" as const;
export const STORE_LANGUAGE_CODE = "EN" as const;
export const STORE_FORMAT_LOCALE = "en-BD" as const;
export const STORE_LOCALE = "en_BD" as const;
export const STORE_SITEMAP_LOCALE = "EN-BD" as const;
```

#### 10b. `app/root.tsx` line 309 (Item 64)

Change `<html lang="en">` to `<html lang={STORE_LANGUAGE_CODE.toLowerCase()}>`. Import from `~/lib/store-locale`. Apply to both Layout (line 309) and ErrorBoundary (line 452).

## Constraints

- Use the existing `getSeoMeta()` + `seo.ts` module -- no parallel systems
- `getBrandNameFromMatches(matches)` and `getSiteUrlFromMatches(matches)` are the correct helpers for accessing root loader data in meta functions
- Redirect-only routes that throw `redirect()` in loader never render, but `meta` prevents flash-of-wrong-title
- `buildCanonicalUrl()` must degrade gracefully when `siteUrl` is empty -- relative paths are valid
- JSON-LD via `getSeoMeta({jsonLd})` is the Hydrogen-idiomatic pattern
- Organization schema must use data from loader/matches to avoid hydration mismatch

## Execution Order

1. **Phase 4** (FALLBACK_SITE_URL) -- foundational for all canonical URL and schema fixes
2. **Phase 1** (title template fix) -- most visible user-facing issue
3. **Phase 2** (missing meta exports) -- can parallel with Phase 3
4. **Phase 3** (canonical URLs) -- depends on Phase 4
5. **Phase 5** (schema generators) -- depends on Phase 4
6. **Phase 7** (FAQ JSON-LD) -- independent
7. **Phase 8** (wishlist title) -- independent
8. **Phase 9** (robots.txt) -- independent
9. **Phase 10** (locale) -- independent
10. **Phase 6** (dateModified comment) -- independent

Phases 6-10 are all independent and can run in parallel.

## Parallelism Notes

This plan overlaps with **Plan: GraphQL Performance** on `app/root.tsx` (that plan changes cache strategies; this plan changes meta/lang). Changes are in different functions -- non-conflicting.

This plan overlaps with **Plan: UI/Rendering** on `app/routes/faq.tsx` (that plan fixes accordion behavior; this plan fixes meta/JSON-LD). Non-conflicting sections.

All phases within this plan are largely independent after Phase 4.

## Verification

1. **Title duplication:** Load product pages, contact page -- verify title shows "Page Title | Store" not "Page Title | Store | Store"
2. **Cart title:** Navigate to `/cart` -- verify title is "Cart | Store Name"
3. **Canonical URLs:** View page source on collection, blog, contact, sale, gallery, policy pages -- verify `<link rel="canonical">` present
4. **Structured data:** Use Google Rich Results Test on homepage (Organization), product page (Product), collection page (ItemList), FAQ page (FAQPage) -- verify schemas are valid and contain no `example.com` URLs
5. **robots.txt:** Fetch `/robots.txt` -- verify `/policies/` is NOT disallowed; verify `/search` blocking is consistent
6. **HTML lang:** View page source -- verify `<html lang="en">` uses configured language code
7. **Meta on redirect routes:** Navigate to `/account/login` -- verify no blank title flash; verify `noindex` in source
