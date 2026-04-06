# SEO and Metadata Audit Report

**Storefront:** storefront_001 (`~/Desktop/projects/storefronts/storefront_001`)
**Audited:** 2026-04-06
**Dev Server:** http://localhost:3003
**Demo Store:** horcrux-demo-store.myshopify.com
**Auditor Method:** Static code analysis + live DOM inspection via Chrome DevTools MCP
**Status:** PARTIAL

---

## Executive Summary

storefront_001 has a structurally solid SEO foundation: every route exports a `meta()` function, Hydrogen's `getSeoMeta()` utility is used consistently, `buildCanonicalUrl()` + `getSiteUrlFromMatches()` correctly construct absolute canonical URLs on most routes, and structured data exists for all major content types. The PWA manifest, favicon, and apple-touch-icon are all dynamically served from metaobject data with graceful fallbacks.

However, four systemic gaps persist. First, `og:type`, `twitter:card`, and `og:site_name` are absent from every single rendered page — `getSeoMeta()` does not auto-generate these, and no route adds them manually, meaning social sharing quality is degraded site-wide. Second, root-level meta tags (`theme-color`, `apple-mobile-web-app-capable`, PWA meta) are defined in `root.tsx` but silently discarded on every page because no child route spreads `matches.flatMap(m => m.meta ?? [])`. Third, Product and Collection JSON-LD schemas emit relative `Offer.url` and `ListItem.url` values, making them ineligible for Google rich results. Fourth, six account sub-routes (`_index`, `orders`, `profile`, `subscriptions`, `returns`, `wishlist`) are missing `robots: noindex`, leaving private customer pages exposed to crawlers.

New findings from this audit: the `/collections/[handle]` route has **zero H1 elements** (a heading hierarchy failure invisible to the previous curl-based audit); the 404 error boundary displays "Server Error" / "Error 500" instead of "Page Not Found" regardless of the correct HTTP 404 status; and the homepage is missing both `og:url` and a canonical link tag.

---

## Audit Results

### 1. Root head and Global Meta Tags

**Status:** PARTIAL

- ✅ `<Meta />` and `<Links />` are present in the `Layout()` export in `app/root.tsx:323–330`
- ✅ `<meta charSet="utf-8" />` present at `app/root.tsx:324`
- ✅ `<meta name="viewport" content="width=device-width,initial-scale=1" />` present at `app/root.tsx:325`
- ✅ Root `meta()` export at `app/root.tsx:91–112` uses `getSeoDefaults(data?.siteContent?.siteSettings, ...)` — title and description sourced from metaobjects, not hardcoded
- ✅ `html lang="en"` confirmed via browser inspection (`STORE_LANGUAGE_CODE = "EN"` → lowercased at `app/root.tsx:322`)
- ✅ `link rel="manifest"` → `/manifest.webmanifest` present in `links()` at `app/root.tsx:85`
- ✅ `link rel="icon"` → `/favicon.ico` (dynamic route) at `app/root.tsx:87`
- ✅ `link rel="apple-touch-icon"` → `/apple-touch-icon.png` (dynamic route) at `app/root.tsx:86`
- ✅ `preconnect` to `fonts.googleapis.com`, `fonts.gstatic.com`, `cdn.shopify.com`, `shop.app`
- ✅ No `X-UA-Compatible` or legacy IE meta tags found
- ❌ `theme-color` meta tag is defined in root `meta()` at `app/root.tsx:104` but **never appears in any rendered page** — child routes replace the entire root meta array; no route spreads parent meta
- ❌ `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`, `apple-mobile-web-app-title`, `mobile-web-app-capable`, `format-detection` — all defined in root `meta()` lines 105–110 but silently dropped on every page
- ❌ `og:type`, `twitter:card`, `og:site_name` absent from all rendered pages — `getSeoMeta()` does not generate these; no route adds them manually
- ❌ No root-level canonical strategy — each route manages its own; homepage has no canonical at all
- ⚠️ Google Fonts stylesheet is linked **twice** on the homepage — once via the generated `googleFontsUrl` at `app/root.tsx:327` and once more through a duplicate Vite HMR injection; confirm in production build

**Browser-confirmed absence of root meta tags on homepage:**
```
meta[name="theme-color"]            → NOT PRESENT
meta[name="apple-mobile-web-app-capable"] → NOT PRESENT
meta[name="twitter:card"]           → NOT PRESENT
meta[property="og:type"]            → NOT PRESENT
meta[property="og:site_name"]       → NOT PRESENT
```

---

### 2. Per-Route Meta Exports

**Status:** PARTIAL

All routes have a `meta()` export. Issues are in content quality and missing `robots: noindex` on protected routes.

| Route | Title Present | Description Present | Canonical (`url` param) | Issues |
|---|---|---|---|---|
| `/` (homepage) | ✅ "Dropout Studio" | ✅ mission statement | ❌ no `url` param → no canonical, no og:url | No og:type |
| `/products/[handle]` | ✅ "Title \| Category \| Brand" | ✅ SEO field or truncated | ✅ absolute URL | Triple H1; Offer.url relative |
| `/collections/[handle]` | ⚠️ "Jewelry Collection" — no brand | ✅ | ✅ absolute URL | Zero H1; ItemList.url relative |
| `/collections/all-products` | ❌ "All Products" — hardcoded, no brand | ⚠️ thin 46 chars | ✅ | — |
| `/collections` (index) | ❌ "Collections" — no brand | ✅ | ❌ no `url` param | — |
| `/search` | ✅ dynamic | ✅ | ❌ (ok — noindex) | noindex correctly set |
| `/cart` | ✅ "Cart" | ❌ missing | ❌ (ok — noindex) | Raw meta array, not `getSeoMeta` |
| `/contact` | ⚠️ "Contact Us" — no brand | ✅ | ✅ | — |
| `/faq` | ⚠️ "Frequently Asked Questions" — no brand | ✅ | ❌ no `url` param | — |
| `/sale` | ✅ dynamic % | ✅ dynamic count | ✅ | ⚠️ "1 items" grammar issue |
| `/gallery` | ⚠️ "Gallery" — no brand | ✅ | ✅ | — |
| `/blogs` (index) | ⚠️ "The Journal" — no brand | ✅ | ✅ but resolves relative when 500 | Page 500s in demo store |
| `/blogs/[handle]` | ✅ dynamic from blog.seo | ✅ | ✅ | — |
| `/blogs/[handle]/[article]` | ✅ article.seo or title | ✅ | ✅ | dateModified = datePublished |
| `/policies/[handle]` | ✅ policy.title | ✅ dynamic | ✅ | — |
| `/account` (layout) | ✅ "My Account" noindex+nofollow | ✅ | ❌ | ❌ Leaf routes replace this |
| `/account/_index` | ⚠️ "Account Dashboard" | ❌ | ❌ | ❌ **NO noindex** |
| `/account/orders` | ⚠️ "Order History" | ❌ | ❌ | ❌ **NO noindex** |
| `/account/profile` | ⚠️ "Account Details" | ❌ | ❌ | ❌ **NO noindex** |
| `/account/subscriptions` | ⚠️ "Subscriptions" | ❌ | ❌ | ❌ **NO noindex** |
| `/account/returns` | ⚠️ "Returns History" | ❌ | ❌ | ❌ **NO noindex** |
| `/account/wishlist` | ⚠️ "Wishlist \| Brand" | ❌ | ❌ | ❌ **NO noindex** |
| `/account/orders/[id]` | ✅ | ❌ | ❌ | ❌ **NO noindex** |
| `/account/orders/[id]/return` | ✅ | ❌ | ❌ | ❌ **NO noindex** |
| `/account/subscriptions/[id]` | ✅ | ❌ | ❌ | ❌ **NO noindex** |
| `/wishlist/share` | ✅ dynamic | ✅ | ✅ | — |
| `/offline` | ✅ | ❌ | ❌ | noindex ✅ |
| `/$` (404) | ✅ "Page Not Found" | ❌ | ❌ | noindex ✅ |

**Duplicate title pattern:** Routes relying on `getSeoMeta({title})` without an active `titleTemplate` from root produce bare titles (e.g. "Collections" — 11 chars). Root's `titleTemplate: "%s | BrandName"` is declared but only active when root meta is not replaced by child route meta.

---

### 3. Open Graph and Twitter Card Tags

**Status:** FAIL

`getSeoMeta()` from `@shopify/hydrogen` automatically generates `og:title`, `og:description`, `twitter:title`, `twitter:description`, and `og:image` (with width/height/alt sub-tags) — but **never** `og:type`, `twitter:card`, or `og:site_name`. No route in the codebase adds these manually.

**Browser-confirmed state per route type:**

**Homepage (`/`):**
```
og:title:       ✅ "Dropout Studio"
og:description: ✅ mission statement
og:url:         ❌ ABSENT (no `url` param in _index.tsx getSeoMeta call)
og:image:       ❌ ABSENT (brandLogo not configured in demo store)
og:type:        ❌ ABSENT
og:site_name:   ❌ ABSENT
twitter:card:   ❌ ABSENT
twitter:image:  ❌ ABSENT
```

**Product page (`/products/deathly-hallows-pendant`):**
```
og:title:       ✅ "Deathly Hallows Pendant | Jewelry | Dropout Studio"
og:description: ✅ truncated product description
og:url:         ✅ "https://dropoutstudio.co/products/deathly-hallows-pendant"
og:image:url:   ✅ Shopify CDN URL with dimensions 1120×1120
og:image:alt:   ✅ descriptive alt from product image
og:type:        ❌ ABSENT (should be "product")
og:site_name:   ❌ ABSENT
twitter:card:   ❌ ABSENT (no image preview on Twitter/X)
twitter:image:  ❌ ABSENT
```

**Collection page (`/collections/jewelry`):**
```
og:title:       ✅ "Jewelry Collection"
og:description: ✅ collection description
og:url:         ✅ "https://dropoutstudio.co/collections/jewelry"
og:image:url:   ✅ Shopify CDN collection image
og:type:        ❌ ABSENT
og:site_name:   ❌ ABSENT
twitter:card:   ❌ ABSENT
twitter:image:  ❌ ABSENT
```

**Blogs index (`/blogs`):**
```
og:title:       ✅ "The Journal"
og:description: ✅
og:url:         ❌ "/blogs" (RELATIVE — siteUrl empty, page 500s in demo store)
```

**All routes — global absences:** `og:type`, `twitter:card`, `og:site_name`, `twitter:image`.

**Fix:** In `app/lib/seo.ts`, add a helper function `getStaticSeoMeta(type, imageUrl, siteName)` that returns the three missing tags as an array. Each route's `meta()` function should spread its result:
```typescript
// e.g. in products.$handle.tsx
return [
    ...(getSeoMeta({...}) ?? []),
    {property: "og:type", content: "product"},
    {property: "og:site_name", content: brandName},
    {name: "twitter:card", content: "summary_large_image"},
    ...(image?.url ? [{name: "twitter:image", content: image.url}] : [])
];
```

---

### 4. Structured Data JSON-LD

**Status:** PARTIAL

**Browser-confirmed JSON-LD output per page:**

**Homepage — `@graph` (WebSite + Organization):**
```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "name": "Dropout Studio",
      "url": "https://dropoutstudio.co",
      "description": "We build thoughtfully designed essentials...",
      "potentialAction": {
        "@type": "SearchAction",
        "target": { "@type": "EntryPoint", "urlTemplate": "https://dropoutstudio.co/search?q={search_term_string}" },
        "query-input": "required name=search_term_string"
      }
    },
    { "@type": "Organization", "name": "Dropout Studio", "url": "https://dropoutstudio.co" }
  ]
}
```
✅ `WebSite` schema with `SearchAction` now renders (resolved from previous audit M-1).
✅ `SearchAction` URL template is absolute with correct `siteUrl`.
⚠️ The `Organization` object in the `@graph` is stripped to just `name` and `url` — `getSeoMeta()` internally generates this thin schema, overriding the explicit `generateOrganizationSchema()` call in `app/routes/_index.tsx` that would include `sameAs`, `logo`, and `description`. The full Organization data is silently discarded.

**Product page — Product schema:**
```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Deathly Hallows Pendant + Jewelry",
  "sku": "DHP-GLD",
  "brand": { "@type": "Brand", "name": "Dropout Studio" },
  "offers": {
    "@type": "Offer",
    "url": "/products/deathly-hallows-pendant",
    "priceCurrency": "BDT",
    "price": "69.00",
    "availability": "https://schema.org/InStock",
    "priceValidUntil": "2026-05-06"
  }
}
```
❌ **CRITICAL:** `offers.url` is a **relative path** `/products/deathly-hallows-pendant`. Google requires absolute URLs — this disqualifies the schema from rich results eligibility. Fix: pass `siteUrl` to `generateProductSchema()` and call `buildCanonicalUrl()` on the offer URL (`app/lib/seo.ts:252`).
❌ **Product name** is `"Deathly Hallows Pendant + Jewelry"` — the ` + Jewelry` suffix is internal Shopify taxonomy noise. It should be stripped before use in `name`. Fix: apply `formatProductTitleForMeta()` (used in `meta()`) inside `generateProductSchema()` as well.
⚠️ `priceValidUntil` uses a 30-day rolling window from server render time (`app/lib/seo.ts:258`). This changes on every render and causes unnecessary schema invalidation by crawlers.

**Collection page — ItemList schema:**
```json
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": "Jewelry",
  "numberOfItems": 4,
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "url": "/products/charm-bracelet", "name": "Charm Bracelet + Jewelry" },
    { "@type": "ListItem", "position": 2, "url": "/products/house-crest-earrings", "name": "House Crest Earrings + Jewelry" },
    ...
  ]
}
```
❌ **CRITICAL:** All `ListItem.url` values are **relative paths**. Same fix as Product schema — pass `siteUrl` to `generateCollectionSchema()` in `app/lib/seo.ts:267`.
❌ All product names include ` + Category` suffix — same issue as Product schema.

**FAQ page — FAQPage schema:** ✅ Correct structure. `mainEntity[]` with `Question` + `acceptedAnswer`. Valid JSON. Rich result eligible.

**Blog article — BlogPosting schema:** (demo store has no articles; code-based audit)
⚠️ `dateModified` equals `datePublished` — Shopify Storefront API does not expose `updatedAt`. Either omit `dateModified` or document clearly. `app/lib/seo.ts:319–322`.
⚠️ `mainEntityOfPage["@id"]` uses `buildCanonicalUrl()` without a `siteUrl` argument at `app/lib/seo.ts:337`, producing a relative `@id` value. Fix: pass `siteUrl` to `generateBlogPostingSchema()`.
❌ `url` field absent from BlogPosting schema. Add `url: buildCanonicalUrl(articlePath, siteUrl)`.

| Schema Type | Route | Absolute URLs | Required Fields | Rich Result Eligible |
|---|---|---|---|---|
| WebSite + SearchAction | homepage | ✅ | ✅ | ✅ |
| Organization | homepage | ✅ | ⚠️ thin (no sameAs, logo) | N/A |
| Product | /products/* | ❌ Offer.url relative | ✅ | ❌ |
| ItemList | /collections/* | ❌ ListItem.url relative | ✅ | ❌ |
| FAQPage | /faq | N/A | ✅ | ✅ |
| BlogPosting | /blogs/*/*  | ❌ mainEntityOfPage @id relative | ⚠️ missing url | ❌ |

---

### 5. Favicon and PWA Icons

**Status:** PARTIAL

- ✅ `app/routes/favicon[.]ico.tsx` — dynamic route serves metaobject favicon, then brandLogo, then SVG lettermark fallback
- ✅ `app/routes/apple-touch-icon[.]png.tsx` — dynamic route with same priority chain
- ✅ `app/routes/manifest[.]webmanifest.tsx` — fully dynamic PWA manifest built from `site_settings` + `theme_settings` metaobjects
- ✅ `buildWebAppManifest()` in `app/lib/pwa-parsers.ts` generates `name`, `short_name`, `start_url`, `display: "standalone"`, `background_color`, `theme_color`, `icons` array with 192 and 512 sizes
- ✅ `link rel="manifest"`, `link rel="icon"`, `link rel="apple-touch-icon"` all present in `app/root.tsx:85–88`
- ✅ PWA manifest has static fallback in `manifest[.]webmanifest.tsx:33–47` if metaobject query fails
- ❌ **Static fallback icon files `/icon-192.png` and `/icon-512.png` do not exist in `public/`** — `buildIconsArray()` in `app/lib/pwa-parsers.ts:75–79` references these as fallbacks when `brandLogo` is absent, but only `sw.js` and `pwa-install-capture.js` exist in the public directory. PWA installability requires at least a 192px icon; these fallback paths would 404.
- ⚠️ `icon_192` and `icon_512` are sourced from site_settings metaobject fields — when not configured, the code resizes `brandLogo` via Shopify CDN query params, which is a good fallback strategy. But if `brandLogo` is also absent, the static fallbacks that don't exist are referenced.
- ⚠️ `favicon.ico` and `apple-touch-icon.png` are served via Hydrogen route loaders (302 redirects to CDN), not as static files. This is architecturally sound but means two HTTP round-trips for the favicon on cold loads.

---

### 6. robots.txt and sitemap.xml

**Status:** PARTIAL

**robots.txt** — dynamically generated via `app/routes/[robots.txt].tsx`:
```
User-agent: *
Disallow: /admin
Disallow: /cart
Disallow: /orders
Disallow: /checkouts/, /checkout
Disallow: /{shopId}/checkouts, /{shopId}/orders
Disallow: /carts
Disallow: /account
Disallow: /collections/*sort_by*   (parameterized variants)
Disallow: /collections/*filter*&*filter*
Disallow: /blogs/*+*, /blogs/*%2B*  (encoded + characters)
Disallow: /search
Disallow: /apple-app-site-association
Disallow: /.well-known/shopify/monorail
Sitemap: {origin}/sitemap.xml

User-agent: adsbot-google → /checkouts, /checkout, /carts, /orders
User-agent: Nutch → Disallow: /
User-agent: AhrefsBot/AhrefsSiteAudit → Crawl-delay: 10 + general rules
User-agent: MJ12bot → Crawl-Delay: 10
User-agent: Pinterest → Crawl-delay: 1
```
- ✅ `/cart`, `/account`, `/checkout`, `/orders` correctly disallowed
- ✅ `Sitemap:` directive present and uses request origin (correct in production, will show localhost in dev)
- ✅ Parameterized collection URL patterns correctly disallowed
- ✅ AdsBot-Google crawler correctly restricted
- ⚠️ `Disallow: /search` — intentional (search results are noindex), but blocks all search crawler discovery from search URL; product discovery links within search results are still crawled since links are not blocked

**sitemap.xml** — dynamically generated via Hydrogen's `getSitemapIndex()`:
- ✅ `/sitemap.xml` → index via `app/routes/[sitemap.xml].tsx`
- ✅ `/sitemap/products/1.xml` — all Shopify products with `lastmod`, `changefreq: weekly`
- ✅ `/sitemap/pages/1.xml` — Shopify CMS pages
- ✅ `/sitemap/collections/1.xml` — all Shopify collections
- ✅ `/sitemap/blogs/1.xml` — Shopify blog URLs
- ❌ **High-value custom routes absent from sitemap:** `/contact`, `/faq`, `/gallery`, `/sale` are React Router routes, not Shopify CMS resources. `getSitemapIndex()` only covers Shopify API content. These pages have zero sitemap presence.
- ❌ `STORE_SITEMAP_LOCALE = "EN-BD"` in `app/lib/store-locale.ts:8` is **malformed BCP 47** — the language code must be lowercase: `en-BD`. Google's hreflang validator will reject `EN-BD`.
- ⚠️ Sitemap `<loc>` URLs use `http://localhost:3003/` in dev (expected; correct in production)

---

### 7. Canonical URLs

**Status:** PARTIAL

`buildCanonicalUrl(path, siteUrl)` in `app/lib/seo.ts:125` correctly constructs absolute URLs when `siteUrl` is non-empty. `getSiteUrlFromMatches(matches)` at `app/lib/seo.ts:376` reads `siteUrl` from root loader's `siteContent.siteSettings.siteUrl`, which is stored in the `site_settings` metaobject.

**Browser-confirmed canonical values:**

| Route | Canonical Link | og:url | Assessment |
|---|---|---|---|
| `/` (homepage) | ❌ ABSENT | ❌ ABSENT | `_index.tsx` getSeoMeta has no `url` param |
| `/products/deathly-hallows-pendant` | ✅ `https://dropoutstudio.co/products/deathly-hallows-pendant` | ✅ same | Correct |
| `/collections/jewelry` | ✅ `https://dropoutstudio.co/collections/jewelry` | ✅ same | Correct |
| `/blogs` (index) | ❌ resolves to `http://localhost:3003/blogs` (relative) | ❌ `/blogs` (relative) | Page 500s; siteUrl appears empty in this error state |
| `/faq` | ❌ ABSENT | ❌ ABSENT | `faq.tsx` getSeoMeta has no `url` param |
| `/collections` (index) | ❌ ABSENT | ❌ ABSENT | `collections._index.tsx` getSeoMeta has no `url` param |
| `/contact` | ✅ absolute | ✅ absolute | Correct |
| `/gallery` | ✅ absolute | ✅ absolute | Correct |
| `/sale` | ✅ absolute | ✅ absolute | Correct |
| `/policies/[handle]` | ✅ absolute | ✅ absolute | Correct |
| `/blogs/[handle]` | ✅ absolute | ✅ absolute | Correct |
| `/blogs/[handle]/[article]` | ✅ absolute | ✅ absolute | Correct |

**Variant URLs:** Product pages use `?variant=` URL params. The canonical points to the base product URL (no variant param), which is the correct strategy — `buildCanonicalUrl` uses the plain `/products/{handle}` path.

**Pagination:** Collection routes use cursor-based pagination with `?page=` and `?cursor=` params. `getCanonicalRedirect()` in `app/lib/collection-route-helpers.ts` handles canonical redirects for paginated pages. ✅

**Fallback risk:** When `siteUrl` is unconfigured in the `site_settings` metaobject, `buildCanonicalUrl` returns a relative path (e.g. `/products/handle`). This is a deployment footgun for new client setups. The `siteUrl` field must be set before go-live.

---

### 8. Heading Hierarchy and Semantic HTML

**Status:** PARTIAL

**Browser-confirmed heading trees:**

**Homepage (`/`):**
```
H1: "Designed for everyday. Built to last."    ← ✅ exactly one
H2: "No favorites yet"
H2: "Recently Viewed"
H2: "Shop by collection"
H2: "Frequently Asked Questions"
H2: "Follow along"
H3: [product names, FAQ questions, footer nav]
```
✅ One H1, logical H1→H2→H3 hierarchy. No skipped levels.
✅ `<main>`, `<nav>`, `<footer>` landmarks confirmed present.

**Product page (`/products/deathly-hallows-pendant`):**
```
H1: "Deathly Hallows Pendant"   ← ❌ THREE identical H1s
H1: "Deathly Hallows Pendant"   ← desktop layout
H1: "Deathly Hallows Pendant"   ← mobile sticky bar
H2: "You're absolutely going to"
```
❌ **Three H1 elements with identical text.** The product title component is rendered in (1) the main product section, (2) the mobile title/price section, and (3) the mobile sticky buttons bar. Only one should use `<h1>`; the other two should use `<p>` or `<span>` styled visually as headings. Fix: identify the three rendering locations in `app/components/product/ProductInfoSection.tsx`, `app/components/product/ProductMobileTitlePrice.tsx`, and `app/components/product/ProductMobileStickyButtons.tsx`.

**Collection page (`/collections/jewelry`):**
```
H3: "Charm Bracelet"
H3: "Jewelry"
H3: "House Crest Earrings"
H3: "Jewelry"
... (product cards only)
H3: [footer nav]
```
❌ **ZERO H1 elements.** The collection page has no H1 at all — there is no semantic heading identifying the page topic. The collection name/hero section should include `<h1>{collection.title}</h1>` or similar. Check `app/components/sections/CollectionHero.tsx`.

**404 page (`/this-page-does-not-exist`):**
```
H1: "Server Error"   ← ❌ should be "Page Not Found"
H3: "Error 500"      ← ❌ should not appear on a 404 page
```
❌ The 404 error boundary renders the generic `<GenericErrorUI>` component (which shows "Server Error" / "Error 500") instead of the intended `<h1>Page Not Found</h1>` UI. HTTP response status is correctly 404; the meta title is correctly "Page Not Found". The visual content is wrong — the `$.tsx` ErrorBoundary's `status` variable stays at `500` (default) instead of updating to `404`. This indicates `isRouteErrorResponse(error)` is returning `false` for the error thrown by the loader, possibly due to a React Router serialization issue in the dev server runtime. Verify with `console.log(isRouteErrorResponse(error))` in the ErrorBoundary.

**Semantic landmark summary:**
| Landmark | Present | Notes |
|---|---|---|
| `<main>` | ✅ | Wraps `<Outlet />` in root App |
| `<nav>` | ✅ | Navbar component |
| `<footer>` | ✅ | Footer component |
| `<article>` | Untested (no articles in demo) | Should be used on blog article pages |
| `<header>` | Not confirmed | May be absent; Navbar uses `<div>` or `<nav>` |

---

### 9. Image SEO

**Status:** PASS

**Browser-confirmed alt text coverage:**
- Homepage: `imgsNoAlt = 0` ✅
- Product page: `imgsNoAlt = 0` ✅
- Collection page: `imgsNoAlt = 0` ✅

**Product OG image alt text** (confirmed in rendered head):
```
og:image:alt = "Deathly Hallows Pendant necklace featuring the iconic triangle, circle and line symbol"
```
✅ Descriptive, specific alt text sourced from the Shopify image `altText` field.

**OG image dimensions:** Product and collection OG images are 1120×1120px (square). The recommended social sharing format is 1200×630 (landscape). Square images work correctly but are not optimal for link previews on platforms that display landscape crops (Twitter, Facebook). Images are served via Shopify CDN — can be resized via URL params if needed.

**Loading strategy:** Loading priorities were not directly inspectable via DevTools script injection, but the code pattern in `app/components/product/ProductImageSection.tsx` should use `loading="eager"` + `fetchpriority="high"` for the first gallery image (LCP candidate) and `loading="lazy"` for subsequent images. Verify this in code review.

---

### 10. Link and Navigation SEO

**Status:** PARTIAL

- ✅ `<nav>` landmark present in Navbar
- ✅ `<footer>` landmark present with structured link groups (Shop, Support, Account, Connect)
- ✅ Breadcrumb navigation present on product pages (`app/components/common/Breadcrumbs.tsx`) and collection pages (`app/components/common/PageBreadcrumbs.tsx`)
- ✅ Breadcrumb links use proper `<Link to="">` with correct paths
- ⚠️ Footer nav uses `<h3>` headings for link group labels ("Shop", "Support", "Account", "Connect") — confirmed in homepage heading tree. These are acceptable but inflate the heading count at the footer level.
- ⚠️ Social media icons in footer are image/SVG elements — verify they have `aria-label` attributes on the anchor wrapper to ensure accessibility and SEO link context
- ✅ No "click here" or "read more" anchor text patterns observed in primary navigation

---

### 11. Performance Signals (SEO-Relevant)

**Status:** PARTIAL

**Font loading strategy (browser-confirmed):**
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=...">  ← font 1
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=...">  ← font 2
<link rel="preconnect" href="https://fonts.googleapis.com">  ← DUPLICATE preconnect
<link rel="preconnect" href="https://fonts.gstatic.com">    ← DUPLICATE preconnect
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=...">  ← DUPLICATE of font 1
```
⚠️ Google Fonts stylesheet appears **three times** in the head on the homepage — two preconnect pairs and one font stylesheet are duplicated. This is caused by the `links()` function emitting static preconnects while `generatedTheme.googleFontsUrl` emits an additional stylesheet. The result is redundant HTTP requests. Deduplicate by removing the static `fonts.googleapis.com` preconnect from `links()` in `app/root.tsx:82–83` since `generateTheme()` handles font loading dynamically.

**Font-display:** Google Fonts includes `display=swap` in the CSS URL query string (standard Google Fonts behavior), so `font-display: swap` is effectively applied. ✅

**Critical CSS:** Tailwind CSS is loaded as a full stylesheet bundle (`/app/styles/tailwind.css`). No critical CSS inlining strategy observed. For above-the-fold content, this means the browser must wait for the full CSS to parse before rendering. Acceptable for a Hydrogen/Cloudflare Workers deployment with HTTP/2 push, but worth noting.

**Render-blocking resources:** The `pwa-install-capture.js` script at `app/root.tsx:326` is loaded as a synchronous inline `<script src>` in `<head>` **before** `<Meta />` and `<Links />`. This is render-blocking. Move it to the end of `<head>` or add `async` attribute.

**LCP candidate:** On the homepage, the `<VideoHero>` background image is the likely LCP element. On product pages, the first product image is the LCP. These should use `loading="eager"` + `fetchpriority="high"`. Not confirmed in this audit — requires component code review.

---

### 12. Internationalization and Locale Signals

**Status:** PARTIAL

- ✅ `html lang="en"` confirmed on all inspected pages (set at `app/root.tsx:322` via `STORE_LANGUAGE_CODE.toLowerCase()`)
- ❌ `STORE_SITEMAP_LOCALE = "EN-BD"` in `app/lib/store-locale.ts:8` — **invalid BCP 47 format.** Language tag must be lowercase-first: `en-BD`. Google's hreflang validator rejects `EN-BD`. Change to `en-BD`.
- ⚠️ `STORE_LANGUAGE_CODE = "EN"` (uppercase) is lowercased correctly when applied to the `html` tag, but uppercase is non-standard and could cause issues if used elsewhere without lowercasing.
- ✅ No hreflang tags — appropriate for a single-locale storefront.
- ✅ Currency/price formatting uses `STORE_FORMAT_LOCALE = "en-BD"` (correctly lowercase) for `Intl.NumberFormat`. This prevents server/client mismatch in price rendering.

---

### 13. Metaobject CMS SEO Data Coverage

**Status:** PARTIAL

| Field (site_settings metaobject) | Queried | Consumed in Meta | Notes |
|---|---|---|---|
| `brand_name` | ✅ via `SITE_CONTENT_QUERY` | ✅ used as root title, passed to routes via `getBrandNameFromMatches()` | Some routes don't use it in their title pattern |
| `default_page_title` | ✅ parsed as `brandName` | ✅ root meta title | Field name implies full title but is used as brand name |
| `mission_statement` | ✅ | ✅ root meta description | Serves as site-wide default description |
| `website_url` (siteUrl) | ✅ | ✅ used in canonical/og:url via `buildCanonicalUrl()` | Empty fallback = relative URLs (deployment risk) |
| `brand_logo` | ✅ | ✅ og:image on homepage when configured | Not set in demo store → homepage og:image absent |
| `favicon` | ✅ via `FAVICON_QUERY` | ✅ served at `/favicon.ico` route | Falls back to SVG lettermark |
| `icon_192` | ✅ | ✅ in PWA manifest icons array | Falls back to resized brandLogo |
| `icon_512` | ✅ | ✅ in PWA manifest icons array | Falls back to resized brandLogo |
| `social_links_data` | ✅ | ⚠️ passed to `generateOrganizationSchema()` but overridden by getSeoMeta @graph | `sameAs` array never renders with social URLs |
| `contact_email` / `contact_phone` | ✅ | ✅ rendered in ContactInfo hooks | Not used in meta tags (acceptable) |
| `blog_page_heading` | ✅ | ✅ used as blogs._index title | Falls back to "The Journal" |
| `color_primary` | ✅ via `THEME_SETTINGS_QUERY` | ⚠️ theme-color meta defined but never rendered | Root meta dropped by child routes |

**Hardcoded strings that should be dynamic:**
- `app/routes/faq.tsx:17`: `title: "Frequently Asked Questions"` — should append `| ${brandName}`
- `app/routes/collections._index.tsx:57`: `title: "Collections"` — should append `| ${brandName}`
- `app/routes/collections.all-products.tsx:25`: `title: "All Products"` — should append `| ${brandName}`
- `app/routes/contact.tsx:79`: `title: "Contact Us"` — should append `| ${brandName}`
- `app/routes/gallery.tsx:14`: `title: "Gallery"` — should append `| ${brandName}`

**FALLBACK constants in `app/lib/metaobject-parsers.ts`:**
- `FALLBACK_BRAND_NAME = "Store"` (in `app/lib/seo.ts:69`) — functional but generic; client should always configure `brand_name`
- `FALLBACK_SEO_DESCRIPTION = "Your store. Your story. Built to sell."` — acceptable placeholder
- `FALLBACK_SITE_URL = ""` — empty string as fallback is a deployment hazard; relative canonicals are worse than no canonical

---

### 14. 404 and Error Pages

**Status:** PARTIAL

- ✅ `app/routes/$.tsx` catch-all route exists for 404 handling
- ✅ HTTP 404 status correctly returned — `performance.getEntriesByType('navigation')[0].responseStatus = 404` confirmed in browser
- ✅ Meta title: "Page Not Found" ✅
- ✅ `robots: noindex` present in `$.tsx` meta export ✅
- ✅ Home link (`<Link to="/">Back to Home</Link>`) present in the 404 component JSX
- ✅ Root `ErrorBoundary` in `app/root.tsx:478` handles 5xx errors and renders `<OfflineAwareErrorPage />`
- ❌ **Rendered heading shows "Server Error" / "Error 500" instead of "Page Not Found"** — browser inspection confirmed H1: "Server Error", H3: "Error 500" on `/this-page-does-not-exist`. HTTP status is correctly 404 but the visual UI is wrong. The `$.tsx` ErrorBoundary defaults `status = 500` and relies on `isRouteErrorResponse(error)` returning `true` to update it to 404. In the observed browser context, `isRouteErrorResponse` appears to return `false`, leaving status at 500 and triggering `<GenericErrorUI>` instead of the custom "Page Not Found" JSX. Add `console.log('isRouteErrorResponse:', isRouteErrorResponse(error), error)` in `$.tsx:28` to diagnose.
- ❌ `ErrorBoundary` in `root.tsx` does not output a `<title>` or meta for error states — when root-level errors occur, no `<title>` is rendered. Add a `<title>` via the React Router pattern for ErrorBoundary routes.

---

## Issues Register

| Priority | Section | Issue | File / Route | Recommended Fix |
|---|---|---|---|---|
| 🔴 Critical | §3 | `og:type`, `twitter:card`, `og:site_name` absent from ALL routes | All `app/routes/*.tsx` | Add these three tags manually in each route's `meta()` return array alongside `getSeoMeta()` output |
| 🔴 Critical | §3 | Homepage missing `og:url` and canonical link tag | `app/routes/_index.tsx:43` | Add `url: buildCanonicalUrl("/", siteUrl)` to `getSeoMeta()` call; import `getSiteUrlFromMatches` and `buildCanonicalUrl` |
| 🔴 Critical | §2 | Six account sub-routes missing `robots: noindex` | `account._index.tsx`, `account.orders._index.tsx`, `account.profile.tsx`, `account.subscriptions._index.tsx`, `account.returns._index.tsx`, `account.wishlist.tsx`, `account.orders.$id.tsx`, `account.orders.$id.return.tsx`, `account.subscriptions.$id.tsx` | Add `{name: "robots", content: "noindex,nofollow"}` to each route's meta return array |
| 🔴 Critical | §4 | Product `Offer.url` is a relative path | `app/lib/seo.ts:252` — `generateProductSchema()` | Pass `siteUrl` param to `generateProductSchema(product, variant, siteUrl)` and wrap with `buildCanonicalUrl()` |
| 🔴 Critical | §4 | Collection `ListItem.url` values are relative paths | `app/lib/seo.ts:284` — `generateCollectionSchema()` | Pass `siteUrl` to `generateCollectionSchema()` and wrap each `url` with `buildCanonicalUrl()` |
| 🔴 Critical | §3 | Homepage `og:image` absent — no brandLogo configured in demo store | `app/lib/seo.ts:383` — `getDefaultOgImage()` | Add a static fallback OG image at `public/og-default.jpg` (1200×630) and return it when `brandLogo` is absent |
| 🟠 High | §8 | Collection pages have ZERO H1 elements | `app/components/sections/CollectionHero.tsx` (presumed) | Add `<h1>{collection.title}</h1>` in the collection page hero/header section |
| 🟠 High | §8 | Product pages have THREE identical H1 elements | `app/components/product/ProductInfoSection.tsx`, `ProductMobileTitlePrice.tsx`, `ProductMobileStickyButtons.tsx` | Keep H1 in only one component; change the other two to `<p>` or `<span aria-hidden="true">` styled as headings |
| 🟠 High | §8 | 404 error boundary shows "Server Error" heading instead of "Page Not Found" | `app/routes/$.tsx:28–50` | Debug `isRouteErrorResponse(error)` return value; if false, log the `error` type to identify why it's not a `RouteErrorResponse` |
| 🟠 High | §1 | Root meta tags (`theme-color`, PWA meta) never render on any page | `app/root.tsx:91–112`; all route `meta()` functions | Move `theme-color` to a static `<meta>` in the `Layout` `<head>` (not via `meta()`) to guarantee rendering; OR ensure all routes spread `matches.flatMap(m => m.meta ?? [])` |
| 🟠 High | §7 | FAQ page missing canonical and og:url | `app/routes/faq.tsx:16` | Add `url: buildCanonicalUrl("/faq", siteUrl)` to `getSeoMeta()`; import `getSiteUrlFromMatches` and `buildCanonicalUrl` |
| 🟠 High | §7 | Collections index missing canonical and og:url | `app/routes/collections._index.tsx:55` | Add `url: buildCanonicalUrl("/collections", siteUrl)` and `matches` param to `meta()` |
| 🟠 High | §4 | Product name in JSON-LD contains ` + Category` suffix | `app/lib/seo.ts:239` — `generateProductSchema()` | Apply `formatProductTitleForMeta(product.title)` inside `generateProductSchema()` for the `name` field |
| 🟡 Medium | §6 | Custom routes absent from sitemap: `/contact`, `/faq`, `/gallery`, `/sale` | `app/routes/[sitemap.xml].tsx` | Create `app/routes/sitemap.custom.xml.tsx` that generates a custom sitemap for these routes and add its URL to the sitemap index |
| 🟡 Medium | §5 | Static fallback icon files `/icon-192.png` and `/icon-512.png` missing from `public/` | `app/lib/pwa-parsers.ts:75–79` | Add placeholder 192×192 and 512×512 PNG files to `public/` OR change fallback paths to reference the SVG lettermark from the favicon route |
| 🟡 Medium | §12 | `STORE_SITEMAP_LOCALE = "EN-BD"` — invalid BCP 47 (uppercase language) | `app/lib/store-locale.ts:8` | Change to `"en-BD"` |
| 🟡 Medium | §2 | Standalone page titles lack brand name suffix | `faq.tsx:17`, `collections._index.tsx:57`, `collections.all-products.tsx:25`, `contact.tsx:79`, `gallery.tsx:14` | Append `| ${brandName}` to each title; extract `brandName` via `getBrandNameFromMatches(matches)` |
| 🟡 Medium | §4 | `BlogPosting` schema missing `url` field; `mainEntityOfPage["@id"]` is relative | `app/lib/seo.ts:337` | Pass `siteUrl` to `generateBlogPostingSchema()` and set `url: buildCanonicalUrl(articlePath, siteUrl)` and update `mainEntityOfPage["@id"]` |
| 🟡 Medium | §4 | `BlogPosting` `dateModified` equals `datePublished` (API limitation) | `app/lib/seo.ts:319–322` | Omit `dateModified` field entirely rather than setting it equal to `datePublished` |
| 🟡 Medium | §11 | `pwa-install-capture.js` script is render-blocking (in `<head>` before stylesheets) | `app/root.tsx:326` | Add `async` attribute: `<script src="/pwa-install-capture.js" async nonce={nonce} />` |
| 🟡 Medium | §11 | Google Fonts stylesheet linked multiple times on homepage | `app/root.tsx:82–83` + `app/root.tsx:327` | Remove static `fonts.googleapis.com` preconnect links from `links()` function (lines 82–83); `generateTheme()` handles font loading dynamically |
| 🟡 Medium | §7 | `blogs._index.tsx` renders relative `og:url` when loader 500s | `app/routes/blogs._index.tsx:44` | Investigate why `getSiteUrlFromMatches(matches)` returns empty string when the blogs route errors; the root data should always contain `siteUrl` |
| 🔵 Low | §4 | `Offer.priceValidUntil` uses 30-day rolling window from render time | `app/lib/seo.ts:258` | Use end-of-year date or omit the field entirely to avoid constant cache invalidation |
| 🔵 Low | §4 | `Organization` schema in `@graph` is stripped of `sameAs`, `logo`, `description` | `app/routes/_index.tsx:41` + `getSeoMeta` internals | Either accept this behavior (Hydrogen owns the @graph output) or emit a second, explicit `script:ld+json` block with the full Organization schema from `generateOrganizationSchema()` |
| 🔵 Low | §2 | Sale page description uses `${totalCount} discounted items` — grammatically wrong for count=1 | `app/routes/sale.tsx:28` | Use ternary: `` `${totalCount} discounted ${totalCount === 1 ? 'item' : 'items'}` `` |

---

## Recommended Action Plan

### Priority 1 — Structural SEO correctness (implement these first)

1. **Fix relative URLs in JSON-LD schemas** (`app/lib/seo.ts`):
   - Update `generateProductSchema(product, variant, siteUrl?)` signature — pass `siteUrl` and use `buildCanonicalUrl('/products/${product.handle}', siteUrl)` for `offers.url`
   - Update `generateCollectionSchema(collection, products, siteUrl?)` — use `buildCanonicalUrl('/products/${product.handle}', siteUrl)` for each `ListItem.url`
   - Update `generateBlogPostingSchema(article, blogHandle, brandName?, siteUrl?)` — use `buildCanonicalUrl` for `url` and `mainEntityOfPage["@id"]`
   - Update all call sites to pass `getSiteUrlFromMatches(matches)` as `siteUrl`

2. **Add `og:type`, `twitter:card`, `og:site_name` to all routes**:
   - Add a helper in `app/lib/seo.ts`: `getRequiredSocialMeta(type, brandName, imageUrl?)` returning these three tags
   - Each route's `meta()` spreads the result: `...(getSeoMeta({...}) ?? []), ...getRequiredSocialMeta('website', brandName)`

3. **Add `robots: noindex` to all account sub-routes** — add `{name: "robots", content: "noindex,nofollow"}` to the meta array of: `account._index.tsx`, `account.orders._index.tsx`, `account.profile.tsx`, `account.subscriptions._index.tsx`, `account.returns._index.tsx`, `account.wishlist.tsx`, `account.orders.$id.tsx`, `account.orders.$id.return.tsx`, `account.subscriptions.$id.tsx`

4. **Fix homepage canonical and og:url** — in `app/routes/_index.tsx:43`, add `url: buildCanonicalUrl("/", siteUrl)` to `getSeoMeta()` call; pass `matches` and extract `siteUrl`

### Priority 2 — Heading hierarchy (high-impact for crawlers)

5. **Fix collection pages: add H1** — in `app/components/sections/CollectionHero.tsx` (or wherever the collection title is rendered), ensure the collection title uses `<h1>` semantic markup

6. **Fix product pages: reduce to one H1** — in `app/components/product/`, identify which of the three components (`ProductInfoSection`, `ProductMobileTitlePrice`, `ProductMobileStickyButtons`) should own the H1; change the other two to `<p>` or `<span>` with equivalent visual styling

7. **Fix 404 error boundary** — debug `isRouteErrorResponse(error)` in `app/routes/$.tsx:28`; add error type logging to identify the root cause. Likely fix: ensure the loader's `throw new Response(...)` propagates correctly through the route error boundary chain.

### Priority 3 — Missing canonicals and sitemap coverage

8. **Add canonical to FAQ route** (`app/routes/faq.tsx:16`) — add `url` param and `matches` to `getSeoMeta()` call

9. **Add canonical to collections index** (`app/routes/collections._index.tsx:55`) — add `url` param, convert `meta()` to accept `{matches}` arg

10. **Add custom routes to sitemap** — create a supplemental sitemap route or modify `[sitemap.xml].tsx` to include `/contact`, `/faq`, `/gallery`, `/sale` as additional `<url>` entries

11. **Add static fallback OG image** — add `public/og-default.jpg` (1200×630) and reference it in `getDefaultOgImage()` when `brandLogo` is absent

12. **Add static fallback PWA icons** — add `public/icon-192.png` and `public/icon-512.png` as actual image files, or update the fallback reference in `app/lib/pwa-parsers.ts:75–79` to a route that generates them

### Priority 4 — Title patterns and metadata quality

13. **Append brand suffix to standalone page titles** — update `faq.tsx`, `collections._index.tsx`, `collections.all-products.tsx`, `contact.tsx`, `gallery.tsx` to use `getBrandNameFromMatches(matches)` and append `| ${brandName}` to each title

14. **Fix `STORE_SITEMAP_LOCALE`** — change `"EN-BD"` to `"en-BD"` in `app/lib/store-locale.ts:8`

15. **Remove render-blocking `pwa-install-capture.js`** — add `async` attribute in `app/root.tsx:326`

16. **Deduplicate Google Fonts links** — remove static preconnect lines 82–83 from `links()` in `app/root.tsx`

---

## What Is Working Well

- **Comprehensive meta export coverage** — every route in `app/routes/` exports a `meta()` function; no route is missing metadata entirely
- **Canonical URL architecture** — `buildCanonicalUrl()` + `getSiteUrlFromMatches()` is a clean, maintainable pattern that isolates the production domain to a single metaobject field
- **Shopify SEO field usage** — product, collection, and article routes all prefer `seo.title` / `seo.description` over derived fallbacks, correctly consuming Shopify's SEO tab data
- **Dynamic favicon and icon infrastructure** — `favicon[.]ico.tsx`, `apple-touch-icon[.]png.tsx`, and `manifest[.]webmanifest.tsx` serve metaobject-sourced assets with graceful fallbacks; no hardcoded URLs
- **WebSite JSON-LD with SearchAction** — now correctly renders on the homepage with an absolute `urlTemplate`, enabling Google Sitelinks Searchbox eligibility
- **FAQPage schema** — correctly structured with `mainEntity[]`, `Question`, `acceptedAnswer`; rich result eligible
- **robots.txt quality** — correctly disallows cart, account, checkout, parameterized collection URLs; properly targets specific crawlers (AdsBot-Google, AhrefsBot, MJ12bot)
- **Hydrogen sitemap infrastructure** — `getSitemapIndex()` covers all Shopify API resources (products, collections, pages, blogs) with `lastmod` and `changefreq`
- **noindex on transient routes** — search, cart, discount codes, offline, 404, account login/logout/authorize routes all correctly set `robots: noindex`
- **Image alt text** — zero images missing alt attributes on any inspected page; product OG image alt text is descriptive and product-specific
- **Metaobject-driven SEO data** — brand name, site URL, mission statement, and theme color are all sourced from Shopify metaobjects, enabling per-client customization without code changes
- **Product variant canonical strategy** — canonical points to base product URL, not variant URL; correct for SEO consolidation
- **Pagination redirect handling** — `getCanonicalRedirect()` correctly handles cursor-based pagination canonical redirects
