# SEO & Metadata Audit Report — storefront_001

**Audit Date:** 2026-04-06
**Dev Server:** http://localhost:3003 (storefront_001)
**Demo Store:** horcrux-demo-store.myshopify.com
**Auditor Method:** Static code analysis + live HTTP head extraction via curl

---

## 1. Executive Summary

storefront_001 demonstrates a solid foundation for SEO — every indexable route exports a `meta()` function, the Shopify Hydrogen `getSeoMeta()` utility is used throughout, structured data is generated for all major content types (Product, ItemList, BlogPosting, FAQPage, Organization), and canonical URL construction is environment-aware via metaobject-stored `siteUrl`. However, a systemic architectural flaw undermines the entire system: **no route spreads parent meta from `matches`**, meaning the root-level meta function's output (theme-color, PWA tags, WebSite JSON-LD) is completely discarded on every page. Additionally, `getSeoMeta()` from `@shopify/hydrogen` does not auto-generate `og:type`, `twitter:card`, or `og:site_name`, and these fields are absent site-wide. The Product and Collection schema generators call `buildCanonicalUrl()` without a `siteUrl` argument, producing relative offer/list-item URLs that disqualify the schemas from Google rich results. The overall meta completeness ratio is approximately 60% when accounting for missing social graph fields — adequate for basic indexing but insufficient for social preview quality or structured data rich results eligibility.

---

## 2. Meta Tag System Overview

| Route | Title | Desc | Canonical | og:image | robots | JSON-LD Types |
|---|---|---|---|---|---|---|
| `/` (homepage) | ✓ | ✓ | ✗ | ✗ | ✗ | Organization |
| `/products/[handle]` | ✓ | ✓ | ✓ | ✓ | ✗ | Product |
| `/collections/[handle]` | ✓ | ✓ | ✓ | ✓ | ✗ | ItemList |
| `/collections/all-products` | ✓ | ⚠ | ✓ | ✗ | ✗ | — |
| `/collections` (index) | ✓ | ✓ | ✗ | ✗ | ✗ | — |
| `/search` | ✓ | ⚠ | ✗ | ✗ | ✓ (noindex) | — |
| `/cart` | ✓ | ✗ | ✗ | ✗ | ✓ (noindex) | — |
| `/contact` | ✓ | ✓ | ✓ | ✗ | ✗ | — |
| `/faq` | ✓ | ✓ | ✗ | ✗ | ✗ | FAQPage |
| `/sale` | ✓ | ⚠ | ✓ | ✗ | ✗ | — |
| `/gallery` | ✓ | ✓ | ✓ | ✗ | ✗ | — |
| `/blogs` (index) | ✓ | ✓ | ✓ | ⚠ | ✗ | — |
| `/blogs/[handle]` (blog index) | ✓ | ✓ | ✓ | ⚠ | ✗ | — |
| `/blogs/[handle]/[article]` | ✓ | ✓ | ✓ | ⚠ | ✗ | BlogPosting |
| `/policies/[handle]` | ✓ | ✓ | ✓ | ✗ | ✗ | — |
| `/account` (layout) | ✓ | ✓ | ✗ | ✗ | ✓ (noindex+nofollow) | — |
| `/account` (index) | ✓ | ✗ | ✗ | ✗ | ✗ | — |
| `/account/orders` | ✓ | ✗ | ✗ | ✗ | ✗ | — |
| `/account/profile` | ✓ | ✗ | ✗ | ✗ | ✗ | — |
| `/account/subscriptions` | ✓ | ✗ | ✗ | ✗ | ✗ | — |
| `/account/returns` | ✓ | ✗ | ✗ | ✗ | ✗ | — |
| `/account/wishlist` | ✓ | ✗ | ✗ | ✗ | ✗ | — |
| `/wishlist/share` | ✓ | ✓ | ✓ | ✗ | ✗ | — |
| `/offline` | ✓ | ✗ | ✗ | ✗ | ✗ | — |
| `/$` (404) | ✓ | ✗ | ✗ | ✗ | ✓ (noindex) | — |

**Legend:** ✓ = present | ✗ = missing | ⚠ = present but problematic

**Global absences (every route):** `og:type`, `twitter:card`, `og:site_name`

---

## 3. Playwright Rendered Head Findings

> Note: Browser automation tools were unavailable in this session. All rendered head data was obtained via direct HTTP fetches (`curl`) against the live dev server at `localhost:3003`. Findings are based on SSR-rendered HTML, which is identical to what crawlers receive.

### Tags Present in Source but Absent in Rendered Output

The root-level `meta()` function in `app/root.tsx` exports:
- `theme-color` (dynamic, from theme config)
- `apple-mobile-web-app-capable`
- `apple-mobile-web-app-status-bar-style`
- `apple-mobile-web-app-title`
- `mobile-web-app-capable`
- `format-detection`
- `WebSite` JSON-LD (via `websiteSchema`)

**None of these appear in rendered page heads.** In React Router 7, a child route's `meta()` function completely replaces — rather than merges with — parent route meta unless the child explicitly spreads `matches.flatMap(m => m.meta ?? [])`. No route in this codebase does this, so all root-level meta is silently dropped site-wide.

### Canonical URL Values and Correctness

Canonical URLs are constructed via `buildCanonicalUrl(path, siteUrl)` where `siteUrl` comes from `getSiteUrlFromMatches(matches)`. In the demo store, this resolves to `https://dropoutstudio.co`. For a fresh client deployment where no `siteUrl` metaobject field is set, `buildCanonicalUrl` receives an empty string and emits a **relative path** (e.g., `/products/handle`) instead of an absolute canonical URL.

Canonicals are **present on:** product pages, collection pages, all-products, sale, gallery, contact, policies, blogs, blog handles, wishlist share.

Canonicals are **absent on:** homepage (`/`), FAQ (`/faq`), collections index (`/collections`), account routes, search, cart.

### Duplicate Meta Tags

No duplicate `<title>` or `<meta name="description">` tags were detected. Each page emits exactly one title and one description. However, the product page title appears in three variations in the HTML body (via three separate H1 elements with identical text), which is not a meta duplication but a heading hierarchy issue.

### Social Preview Quality Per Route Type

- **Products:** Strong — title, description, og:image (variant image) all present. Missing `og:type="product"` and `twitter:card`.
- **Collections:** Good — title, description, og:image (collection image if set). Missing `og:type` and `twitter:card`.
- **Homepage:** Poor — title and description only. **No og:image** (brandLogo not configured in demo store). Missing `og:type`, `twitter:card`, `og:site_name`.
- **Static pages (FAQ, contact, gallery):** Minimal — title and description only. No image, no type.
- **Blog pages:** Moderate — title, description, og:image from featured article (when available). No `og:type="article"`, no `twitter:card`.

### Structured Data Parse Results

All JSON-LD blocks in rendered HTML are valid JSON with correct `@context` and `@type` fields. However, structural issues exist (detailed in Section 7).

---

## 4. Storefront API SEO Field Verification

### Products (`/products/[handle]`)

| Check | Status | Evidence |
|---|---|---|
| `seo { title description }` in query | ✓ Yes | `PRODUCT_FRAGMENT` in `products.$handle.tsx` includes `seo { description title }` |
| Rendered title uses SEO field | ✓ Yes | `product.seo?.title` is preferred; falls back to `formatProductTitleForMeta(product.title)` |
| Rendered description uses SEO field | ✓ Yes | `product.seo?.description` is preferred; falls back to `product.description` |
| Match between API value and rendered | ✓ Yes | Demo product "Deathly Hallows Pendant" — Shopify SEO title rendered correctly |
| Empty field fallback | ✓ Correct | Falls back to formatted product title / product.description |

### Collections (`/collections/[handle]`)

| Check | Status | Evidence |
|---|---|---|
| `seo { title description }` in query | ✓ Yes | `COLLECTION_QUERY` (inferred from meta function using `collection.seo?.title`) |
| Rendered title uses SEO field | ✓ Yes | `collection.seo?.title \|\| collection.title + " Collection"` |
| Rendered description uses SEO field | ✓ Yes | `collection.seo?.description \|\| collection.description \|\| ""` |
| Match between API value and rendered | ✓ Yes | `/collections/jewelry` renders Shopify-set collection description correctly |
| Empty field fallback | ✓ Correct | Falls back to `{title} Collection` and collection.description |

### Blog Articles (`/blogs/[handle]/[article]`)

| Check | Status | Evidence |
|---|---|---|
| `seo { title description }` in query | ✓ Yes | `ARTICLE_QUERY` includes `seo { title description }` |
| Rendered title uses SEO field | ✓ Yes | `article.seo?.title \|\| article.title` |
| Rendered description uses SEO field | ✓ Yes | `article.seo?.description \|\| article.excerpt.substring(0, 155)` |
| Match between API value and rendered | N/A | Demo store has no blog articles to test |
| Empty field fallback | ✓ Correct | Falls back to article.title and truncated excerpt |

### Pages (`/pages/[handle]`)

> No `/pages/[handle]` route exists in this storefront. All content pages (FAQ, contact, gallery) are custom routes, not Shopify CMS pages. There is no PageSEO query risk here, but this means Shopify-managed CMS pages cannot be deployed without a new route.

---

## 5. Findings by Severity

### CRITICAL

**C-1: All routes missing `og:type`, `twitter:card`, and `og:site_name`**
- **Location:** Site-wide; `getSeoMeta()` does not auto-generate these fields
- **Current Value:** None of these meta tags appear in any rendered page
- **Recommended Value:** `og:type="website"` (homepage/static), `og:type="product"` (products), `og:type="article"` (blog articles); `twitter:card="summary_large_image"` (all pages); `og:site_name="{brandName}"` (all pages)
- **Reason:** Without `twitter:card`, Twitter/X renders a plain link preview with no image. Without `og:type`, Facebook and LinkedIn social crawlers cannot categorize content correctly.

**C-2: Root-level meta (theme-color, WebSite JSON-LD, PWA meta) absent on all pages**
- **Location:** `app/root.tsx` lines 91–111; no route in `app/routes/` spreads parent meta
- **Current Value:** Root `meta()` exports 7 tags that never render because child routes replace rather than merge with parent meta
- **Recommended Value:** Every `meta()` function in routes should begin with `const parentMeta = matches.flatMap(m => m.meta ?? [])` and include `...parentMeta.filter(tag => ...)` to inherit root-level tags while overriding per-page values
- **Reason:** `theme-color` controls the browser chrome color on mobile; `WebSite` JSON-LD enables sitelinks searchbox in Google. Both are currently inoperative.

**C-3: Account sub-routes lack `robots: noindex`**
- **Location:** `app/routes/account._index.tsx`, `account.orders._index.tsx`, `account.profile.tsx`, `account.subscriptions._index.tsx`, `account.returns._index.tsx`, `account.wishlist.tsx`, `account.orders.$id.tsx`, `account.orders.$id.return.tsx`
- **Current Value:** Only `account.tsx` (layout) has `robots: {noIndex: true, noFollow: true}` via `getSeoMeta`, but in React Router 7 the leaf route meta replaces the layout's meta, so noindex is silently dropped
- **Recommended Value:** Each account sub-route meta must explicitly include `{name: "robots", content: "noindex,nofollow"}`
- **Reason:** Account dashboard pages, order history, and profile pages are private user data — allowing them to be indexed would expose customer-facing URLs to search crawlers and potentially create duplicate content.

**C-4: Product and Collection schema uses relative URLs in `offers.url` and `itemListElement[].url`**
- **Location:** `app/lib/seo.ts` — `generateProductSchema()` line 255 and `generateCollectionSchema()` line 286
- **Current Value:** `"url": "/products/deathly-hallows-pendant"` (relative path — confirmed in live rendered JSON-LD)
- **Recommended Value:** `"url": "https://dropoutstudio.co/products/deathly-hallows-pendant"` (absolute URL using passed siteUrl)
- **Reason:** Google's structured data guidelines require absolute URLs for `Offer.url` and `ListItem.url`. Relative URLs will cause rich result validation failures in Google Search Console.

**C-5: Homepage missing `og:image` entirely**
- **Location:** `app/routes/_index.tsx` meta function; `getSeoDefaults()` returns `media: undefined` when `brandLogo` is not configured
- **Current Value:** No `og:image` on homepage — confirmed via live HTTP inspection
- **Recommended Value:** Either ensure `brandLogo` is always set in site metaobjects, or add a static fallback image path in `getDefaultOgImage()` within `app/lib/seo.ts`
- **Reason:** When a page has no `og:image`, social platforms (Facebook, LinkedIn, iMessage) display a blank card — critically damaging for a commercial storefront's social sharing performance.

---

### MAJOR

**M-1: `WebSite` JSON-LD schema never renders**
- **Location:** `app/root.tsx` loader generates `websiteSchema` and root `meta()` includes `{"script:ld+json": data.websiteSchema}`, but child routes replace the entire root meta array
- **Current Value:** `WebSite` schema with `SearchAction` potentialAction is absent from all pages — confirmed in live HTML
- **Recommended Value:** Pass `websiteSchema` down via the parentMeta inheritance mechanism, or emit it as a static script tag in the Layout function's `<head>` instead of via `meta()`
- **Reason:** The `WebSite` schema with `potentialAction.SearchAction` enables the Google Sitelinks Searchbox feature in SERPs, which is a high-value SEO enhancement for e-commerce sites.

**M-2: Product title in JSON-LD schema contains raw ` + ` separator**
- **Location:** `app/lib/seo.ts` `generateProductSchema()` uses `product.title` directly; `app/routes/products.$handle.tsx` line 79
- **Current Value:** `"name": "Deathly Hallows Pendant + Jewelry"` in rendered Product JSON-LD
- **Recommended Value:** `"name": "Deathly Hallows Pendant"` (primary title only, stripping the ` + Category` suffix used for internal taxonomy)
- **Reason:** The ` + Jewelry` suffix is a Shopify product naming convention for internal categorization. Including it in structured data name fields confuses Google's product understanding and may cause schema validation warnings.

**M-3: Product pages contain three `<h1>` elements**
- **Location:** `app/components/product/` — the product title component is rendered in desktop layout, mobile title component, and mobile sticky bar simultaneously
- **Current Value:** Three identical H1 tags with text "Deathly Hallows Pendant" on the same page — confirmed via live HTML inspection
- **Recommended Value:** Only one `<h1>` should exist per page. The other two should use `<p>`, `<span>`, or `aria-hidden` equivalents styled visually to look like headings
- **Reason:** Multiple H1 elements are a WCAG accessibility issue and send conflicting signals about page topic to search engines, diluting keyword relevance.

**M-4: FAQ page missing canonical URL**
- **Location:** `app/routes/faq.tsx` — `getSeoMeta()` called without `url` parameter
- **Current Value:** No canonical `<link>` tag and no `og:url` on `/faq`
- **Recommended Value:** Add `url: buildCanonicalUrl("/faq", siteUrl)` and accept `matches` in the meta function to extract `siteUrl`
- **Reason:** Without a canonical, search engines may treat different representations of the FAQ page (with/without trailing slash, query strings) as separate documents, splitting link equity.

**M-5: Collections index (`/collections`) missing canonical URL**
- **Location:** `app/routes/collections._index.tsx` — `getSeoMeta()` called without `url` parameter
- **Current Value:** No canonical link tag on `/collections`
- **Recommended Value:** Add `url: buildCanonicalUrl("/collections", siteUrl)` to the `getSeoMeta()` call
- **Reason:** Same canonicalization risk as FAQ — collections index is a high-value page that must have an explicit canonical.

**M-6: `generateWebsiteSchema()` uses empty `siteUrl` fallback for `urlTemplate`**
- **Location:** `app/lib/seo.ts` line 208 — `potentialAction.target.urlTemplate` falls back to `SEO_CONFIG.siteUrl` which is `""`
- **Current Value:** When no `siteUrl` metaobject is configured, the SearchAction URL template becomes `/search?q={search_term_string}` (relative)
- **Recommended Value:** `generateWebsiteSchema()` should accept and use an explicit `siteUrl` parameter, passed from the root loader's detected URL
- **Reason:** Relative URLs in schema.org `SearchAction` are invalid and would fail Google's rich result validator.

**M-7: `BlogPosting` schema missing `url` and `articleBody` fields**
- **Location:** `app/lib/seo.ts` `generateBlogPostingSchema()` — function does not emit `url` or `articleBody`
- **Current Value:** BlogPosting schema lacks `url` (the article's canonical page URL) and `articleBody`
- **Recommended Value:** Add `url: buildCanonicalUrl(articlePath, siteUrl)` and optionally truncated `articleBody` from `article.content`
- **Reason:** `url` is a recommended field for `BlogPosting` rich results. Its absence reduces eligibility for article carousels and AMP-style rich results.

---

### MINOR

**m-1: Most standalone page titles lack brand name suffix**
- **Location:** `app/routes/collections._index.tsx`, `contact.tsx`, `faq.tsx`, `gallery.tsx`, `blogs._index.tsx`, `policies.$handle.tsx`
- **Current Value:** Titles like "Collections" (11 chars), "Gallery" (7 chars), "Contact Us" (10 chars), "Privacy Policy" (14 chars)
- **Recommended Value:** Append ` | {brandName}` — e.g., "Collections | Dropout Studio", "Gallery | Dropout Studio"
- **Reason:** Short titles below 30 characters don't fully utilize the ~60-character SERP title budget and miss an opportunity to reinforce brand recognition in search results.

**m-2: `/collections/all-products` description is dynamically count-based and can be too short**
- **Location:** `app/routes/collections.all-products.tsx` line 28–32
- **Current Value:** `"Browse our complete collection of 24 products."` (46 chars — below the 70-char recommended minimum)
- **Recommended Value:** Expand to `"Browse our complete collection of {n} products. Discover {brandName}'s full range of quality items, from {category} to {category}."`
- **Reason:** The current description is technically accurate but thin. Sub-70-character descriptions underutilize available snippet space.

**m-3: `/sale` description uses improper singular/plural grammar**
- **Location:** `app/routes/sale.tsx` line 28-30
- **Current Value:** `"Discover 1 discounted items with savings up to 84% off."` — "1 items" is grammatically incorrect
- **Recommended Value:** `totalCount > 1 ? "...${totalCount} discounted items..." : "...${totalCount} discounted item..."`
- **Reason:** Minor grammar error; could affect perceived content quality and auto-snippet generation.

**m-4: `BlogPosting` schema `dateModified` equals `datePublished`**
- **Location:** `app/lib/seo.ts` lines 320-322
- **Current Value:** `dateModified` is set to `article.publishedAt` because the Shopify Storefront API does not expose `updatedAt` on the Article type — correctly documented via code comment
- **Recommended Value:** Omit `dateModified` entirely if it cannot be accurately determined, rather than setting it equal to `datePublished`
- **Reason:** Setting `dateModified === datePublished` tells crawlers the article has never been updated, which is usually inaccurate and may reduce freshness signals.

**m-5: `Organization` schema missing `logo` in demo store**
- **Location:** `app/lib/seo.ts` `generateOrganizationSchema()` — `logo: siteSettings?.brandLogo?.url` is `undefined` in current demo store configuration
- **Current Value:** `"logo": null` (or absent) in live rendered Organization JSON-LD
- **Recommended Value:** Ensure `brandLogo` is configured in the `site_settings` metaobject; add fallback URL pointing to a static logo asset
- **Reason:** Google uses the `Organization.logo` field for knowledge panel brand display and rich result enhancement.

**m-6: `twitter:image` never emitted**
- **Location:** All routes — `getSeoMeta()` generates `og:image` when `media` is provided, but Twitter-specific card image (`twitter:image`) is not separately generated
- **Current Value:** No `twitter:image` meta tag on any page
- **Recommended Value:** Manually add `{name: "twitter:image", content: imageUrl}` alongside `getSeoMeta()` calls on product and collection pages, or handle in a shared utility
- **Reason:** Twitter uses `twitter:image` preferentially over `og:image` for card image display when both are available; without it, some Twitter clients may not show the image.

**m-7: `Offer.priceValidUntil` uses a 30-day rolling window from server render time**
- **Location:** `app/lib/seo.ts` line 258 — `new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)`
- **Current Value:** `"priceValidUntil": "2026-05-05"` (30 days from render) — confirmed in live Product JSON-LD
- **Recommended Value:** Use a more stable value (end of current year, or omit if no actual expiry) to avoid constantly changing structured data
- **Reason:** Constantly changing `priceValidUntil` causes unnecessary schema cache invalidation on each render and could confuse Google's price update detection.

---

## 6. Crawler and Indexability Report

### robots.txt Assessment

The robots.txt is dynamically generated via `app/routes/[robots.txt].tsx` using the shop's Shopify ID for scoped rules. It is accessible and well-structured.

**Content summary:**
- `User-agent: *` blocks: admin, cart, orders, checkouts, accounts, sort/filter parameterized collection URLs, blog encoded URLs, search, oseid/preview params, apple-app-site-association, monorail endpoint
- `User-agent: adsbot-google` block: checkout/cart/order paths
- `User-agent: Nutch`: full site block (`Disallow: /`)
- `User-agent: AhrefsBot` / `AhrefsSiteAudit`: 10-second crawl delay with general rules
- `User-agent: MJ12bot`: 10-second crawl delay
- `User-agent: Pinterest`: 1-second crawl delay
- Sitemap declaration present: `Sitemap: {origin}/sitemap.xml`

**Issues:**
- `Disallow: /search` in the general rules blocks search pages for all bots. This is correct intent (search results are noindex), but the general Disallow should not prevent product discovery through crawls of search-generated links.
- `Sitemap: http://localhost:3003/sitemap.xml` — during local dev, the Sitemap URL contains `localhost`. In Oxygen/Cloudflare production, this will correctly use the origin domain. This is expected behavior but should be verified on production.

### Sitemap Coverage and Quality

The sitemap index at `/sitemap.xml` is generated via `@shopify/hydrogen`'s `getSitemapIndex()` and includes four sub-sitemaps:
- `/sitemap/products/1.xml` — all products with `lastmod`, `changefreq: weekly`
- `/sitemap/pages/1.xml` — Shopify CMS pages
- `/sitemap/collections/1.xml` — all collections
- `/sitemap/blogs/1.xml` — blog index URLs

**Issues:**
1. **Custom routes absent from sitemap:** `/contact`, `/faq`, `/gallery`, `/sale`, `/blogs` (the unified blog index) are custom React routes not tied to Shopify CMS resources. `getSitemapIndex()` only includes Shopify API-sourced content. These high-value custom pages have no sitemap presence.
2. **Sitemap URLs use `localhost` in dev:** Sub-sitemap `<loc>` entries use `http://localhost:3003/...` in development. This is expected and will resolve correctly in production.
3. **`hreflang` entries use `EN-BD`** (`STORE_SITEMAP_LOCALE`): The locale tag `EN-BD` may not be recognized by Google's hreflang validator — the correct BCP 47 format is `en-BD`. Review `app/lib/store-locale.ts` constant `STORE_SITEMAP_LOCALE`.

### Noindex Audit

| Route | robots value | Correct? |
|---|---|---|
| `/` (homepage) | Not set (indexable) | ✓ Yes |
| `/products/[handle]` | Not set (indexable) | ✓ Yes |
| `/collections/[handle]` | Not set (indexable) | ✓ Yes |
| `/search` | `noindex,follow` | ✓ Yes |
| `/cart` | `noindex` | ✓ Yes |
| `/account` (layout) | `noindex,nofollow` | ⚠ Layout meta replaced by leaf route |
| `/account` (index) | **Not set** | ✗ Should be noindex |
| `/account/orders` | **Not set** | ✗ Should be noindex |
| `/account/profile` | **Not set** | ✗ Should be noindex |
| `/account/subscriptions` | **Not set** | ✗ Should be noindex |
| `/account/returns` | **Not set** | ✗ Should be noindex |
| `/account/wishlist` | **Not set** | ✗ Should be noindex |
| `/account_.login` | `noindex` | ✓ Yes |
| `/account_.logout` | `noindex` | ✓ Yes |
| `/account_.authorize` | `noindex` | ✓ Yes |
| `/account.$` (redirect) | `noindex` | ✓ Yes |
| `/wishlist` (redirect) | `noindex` | ✓ Yes |
| `/collections/all` (redirect) | `noindex` | ✓ Yes |
| `/discount.$code` | `noindex` | ✓ Yes |
| `/$` (404 catch-all) | `noindex` | ✓ Yes |
| `/offline` | `noindex` (via MetaFunction) | ✓ Yes |
| `/faq` | Not set (indexable) | ✓ Yes |
| `/contact` | Not set (indexable) | ✓ Yes |
| `/policies/[handle]` | Not set (indexable) | ✓ Yes |
| `/sale` | Not set (indexable) | ✓ Yes |
| `/gallery` | Not set (indexable) | ✓ Yes |

### Canonical Strategy Assessment

**Strengths:**
- `buildCanonicalUrl(path, siteUrl)` correctly constructs absolute canonical URLs from the metaobject-stored `siteUrl`
- `getSiteUrlFromMatches(matches)` correctly reads `siteUrl` from root loader data without coupling routes to environment variables
- The canonical domain (`dropoutstudio.co`) is stored in a Shopify metaobject, making it manageable without code changes per deployment

**Weaknesses:**
1. **Hardcoded production domain in local dev:** Canonicals point to `https://dropoutstudio.co` even when browsing `localhost:3003`. This is correct for crawlers but misleading during development.
2. **No fallback when `siteUrl` is empty:** When a client deploys without configuring `siteUrl` in their site_settings metaobject, canonical URLs silently become relative paths (e.g., `/products/handle` with no domain prefix). This is a deployment footgun.
3. **No request-URL-based canonical detection:** Unlike some Hydrogen implementations, this storefront does not derive canonical from `request.url` — it relies entirely on the metaobject value. For Cloudflare Workers portfolio deployments where the URL differs from the metaobject value, canonicals will still point to the configured `siteUrl`.

---

## 7. Structured Data Report

| Schema Type | Route(s) | Required Fields Present | Recommended Fields Missing | Rich Result Eligible? | Validation Issues |
|---|---|---|---|---|---|
| `Organization` | `/` (homepage) | `@context`, `@type`, `name`, `url`, `description` | `logo` (missing in demo), `contactPoint`, `address` | N/A (not a rich result type) | `sameAs: []` — empty array is valid but provides no value |
| `WebSite` + `SearchAction` | Root (intended) | — | — | ✗ Not rendered | Generated in root loader but never emitted due to meta replacement bug |
| `Product` | `/products/[handle]` | `name`, `description`, `image`, `sku`, `brand`, `offers` | `aggregateRating`, `review`, `gtin`, `mpn` | ⚠ Partially — `Offer.url` is relative | **CRITICAL:** `Offer.url` is a relative path (`/products/handle`), not absolute |
| `ItemList` | `/collections/[handle]` | `name`, `numberOfItems`, `itemListElement` | `itemListOrder`, `description` at top-level | ⚠ Partially — `ListItem.url` is relative | **CRITICAL:** All `ListItem.url` values are relative paths |
| `BlogPosting` | `/blogs/[handle]/[article]` | `headline`, `datePublished`, `author`, `publisher`, `image`, `mainEntityOfPage` | `url`, `articleBody`, `keywords`, `wordCount` | ⚠ Partial | `dateModified === datePublished` (API limitation); `mainEntityOfPage.@id` is relative |
| `FAQPage` | `/faq` | `mainEntity[]` with `Question` + `acceptedAnswer` | — | ✓ Yes (eligible if FAQs are real questions) | Valid structure. FAQ content appears to be placeholder data in demo store |

---

## 8. Metrics Tables

### Meta Completeness Ratio

| Tag Type | Present | Missing | Routes Missing |
|---|---|---|---|
| `<title>` | All routes | None | — |
| `meta description` | ~70% of routes | Account sub-routes, cart, offline, 404 | `/account`, `/account/orders`, `/account/profile`, etc. |
| `canonical link` | ~60% of routes | Homepage, FAQ, collections index, account, search, cart | See Section 6 noindex audit |
| `og:title` | All routes | None | — |
| `og:description` | ~70% of routes | Account sub-routes, cart, offline | Same as description gap |
| `og:image` | ~40% of routes | Homepage, FAQ, contact, sale, gallery, collections index, policies, account routes | All routes without `media` param in `getSeoMeta()` |
| `og:url` | ~60% of routes | Homepage, FAQ, collections index, search | Routes without `url` param in `getSeoMeta()` |
| `og:type` | 0% | ALL routes | Site-wide gap |
| `og:site_name` | 0% | ALL routes | Site-wide gap |
| `twitter:card` | 0% | ALL routes | Site-wide gap |
| `twitter:image` | 0% | ALL routes | Site-wide gap |
| `robots meta` | ~30% of routes | Most indexable routes (intentional) | Non-indexable routes correctly set; indexable routes omit robots (correct) |
| `JSON-LD` | ~35% of routes | All routes except product, collection, homepage, FAQ, article | Static utility pages lack structured data |

### Title Length Audit

| Route | Title | Char Count | Flag |
|---|---|---|---|
| `/` | Dropout Studio | 14 | Too short — no brand suffix possible; consider "Dropout Studio — Your Brand Tagline" |
| `/products/deathly-hallows-pendant` | Deathly Hallows Pendant \| Jewelry \| Dropout Studio | 50 | OK |
| `/collections/jewelry` | Jewelry Collection | 18 | Too short — no brand suffix |
| `/collections/all-products` | All Products | 12 | Too short — no brand suffix |
| `/collections` | Collections | 11 | Too short — no brand suffix |
| `/search` | Search results for "pendant" | 28 | Too short (query-dependent) |
| `/contact` | Contact Us | 10 | Too short — no brand suffix |
| `/faq` | Frequently Asked Questions | 26 | Too short — no brand suffix |
| `/blogs` | The Journal | 11 | Too short — no brand suffix |
| `/policies/privacy-policy` | Privacy Policy | 14 | Too short — no brand suffix |
| `/sale` | Save Up to 84% — Special Offers | 31 | OK (dynamic, varies by store) |
| `/gallery` | Gallery | 7 | Too short — no brand suffix |
| `/404` | Page Not Found | 14 | OK (error page) |

**Pattern issue:** Routes using `getSeoMeta({title})` without the root's `titleTemplate: "%s | BrandName"` active produce bare titles. The root's `titleTemplate` is defined but only applies when root meta is active — since every route replaces root meta entirely, the template never propagates.

### Description Length Audit

| Route | Description | Char Count | Flag |
|---|---|---|---|
| `/` | We build thoughtfully designed essentials that look good, feel better... | 137 | OK |
| `/products/deathly-hallows-pendant` | Embody the three Deathly Hallows with this beautifully crafted pendant... | 155 | OK (at truncation limit) |
| `/collections/jewelry` | Add a touch of magic to your outfit with our enchanting jewelry... | 142 | OK |
| `/collections/all-products` | Browse our complete collection of 24 products. | 46 | Too short |
| `/collections` | Explore our curated collections of premium products. From luxury accessories... | 143 | OK |
| `/search` | Search our collection of products, collections, and articles. | 61 | Too short |
| `/contact` | Get in touch with our team. We're here to help with any questions... | 106 | OK |
| `/faq` | Find answers to common questions about our products, shipping, and policies. | 76 | OK |
| `/blogs` | Short reads on new releases, care tips, and the occasional opinion we stand behind. | 83 | OK |
| `/policies/privacy-policy` | Learn how Dropout Studio collects, uses, and protects your personal information. | 80 | OK |
| `/sale` | Discover 1 discounted items with savings up to 84% off. | 55 | Too short + grammar error |
| `/gallery` | Explore our complete collection through a visual gallery of all product images. | 79 | OK |

### Duplicate Meta Report

No identical title or description values appear across multiple distinct routes. All per-route titles and descriptions are unique. The homepage title "Dropout Studio" is the store name and will naturally appear as a substring in other titles like "Deathly Hallows Pendant \| Jewelry \| Dropout Studio" but these are not duplicates.

**Structural duplicate concern:** The `/collections/all-products` description contains a live product count (`24 products`) that changes with inventory. This creates technically unique descriptions per count value, but when products are added/removed, the page's description changes silently, which can confuse search engine snippet caching.

### Heading Hierarchy Report

| Route | H1 Count | H1 Content | Issues |
|---|---|---|---|
| `/` (homepage) | 1 | "Designed for everyday. Built to last." | OK — single H1, relevant to page |
| `/products/deathly-hallows-pendant` | **3** | "Deathly Hallows Pendant" (×3) | **CRITICAL:** Three identical H1 elements (desktop layout, mobile title block, mobile sticky bar) |
| `/collections/jewelry` | 1 | "Jewelry" | OK (inferred from collection hero component) |
| `/contact` | Varies | "Get in Touch" | OK |
| `/faq` | 1 | "Frequently Asked Questions" | OK |
| `/blogs` | 1 | Blog index heading | OK |
| `/sale` | 1 | Sale hero heading | OK |
| `/gallery` | 0 | — | The page uses `GiantText` component for visual heading — verify it renders as `<h1>` |

---

## 9. Standardization Recommendations

### What a Production-Grade SEO System Looks Like for This Hydrogen Codebase

#### 1. Fix the Meta Inheritance Architecture (Highest Priority)

The most impactful single fix is implementing proper React Router 7 meta inheritance. Every route's `meta()` function should inherit from parent/root meta and selectively override:

```typescript
// Recommended pattern for all routes
export const meta: Route.MetaFunction = ({data, matches}) => {
    // Inherit root-level meta (theme-color, PWA tags, site-name, etc.)
    const parentMeta = matches.flatMap(m => m.meta ?? []);
    
    // Filter out tags you're overriding
    const inherited = parentMeta.filter(tag => {
        const key = (tag as any).name || (tag as any).property;
        return !["title", "og:title", "og:description", "og:url", "og:image",
                 "description", "twitter:title", "twitter:description"].includes(key);
    });
    
    const pageMeta = getSeoMeta({ title: "...", description: "...", url: "..." }) ?? [];
    
    return [...inherited, ...pageMeta];
};
```

This ensures `theme-color`, `WebSite` JSON-LD, `og:site_name`, and `apple-mobile-web-app-*` tags appear on every page.

#### 2. Add `og:type` and `twitter:card` to Every Route

Since `getSeoMeta()` doesn't generate these, add them explicitly. The recommended approach is a shared utility:

```typescript
// app/lib/seo.ts — add to getSeoMeta call sites or wrap
export function getBaseSocialMeta(type: "website" | "product" | "article" = "website", brandName?: string) {
    return [
        { property: "og:type", content: type },
        { name: "twitter:card", content: "summary_large_image" },
        ...(brandName ? [{ property: "og:site_name", content: brandName }] : [])
    ];
}
```

#### 3. Fix Schema URL Generation

Pass `siteUrl` to all schema generators:

```typescript
// app/lib/seo.ts — update function signatures
export function generateProductSchema(product, variant, siteUrl?: string): JsonLdSchema {
    // ...
    offers: {
        url: buildCanonicalUrl(`/products/${product.handle}`, siteUrl),
        // ...
    }
}

export function generateCollectionSchema(collection, products, siteUrl?: string): JsonLdSchema {
    // ...
    itemListElement: products?.map((product, index) => ({
        url: buildCanonicalUrl(`/products/${product.handle}`, siteUrl),
        // ...
    }))
}
```

And update call sites in product and collection route meta functions to pass `siteUrl`.

#### 4. Canonical URL Resilience

Add a request-URL fallback so canonical is always absolute, even when no metaobject `siteUrl` is configured:

```typescript
// app/lib/seo.ts
export function getSiteUrlFromMatchesOrRequest(
    matches: Array<...>,
    requestUrl?: string
): string {
    const metaobjectUrl = getSiteUrlFromMatches(matches);
    if (metaobjectUrl) return metaobjectUrl;
    if (requestUrl) {
        const url = new URL(requestUrl);
        return `${url.protocol}//${url.host}`;
    }
    return "";
}
```

This prevents the silent fallback to relative canonicals when a client hasn't configured `siteUrl`.

#### 5. Add Missing Canonicals

Routes needing canonical URLs added to their `getSeoMeta()` calls:
- `app/routes/_index.tsx` — homepage (pass root's `siteUrl` via `getSiteUrlFromMatches`)
- `app/routes/faq.tsx` — add `matches` parameter and `url: buildCanonicalUrl("/faq", siteUrl)`
- `app/routes/collections._index.tsx` — add `url: buildCanonicalUrl("/collections", siteUrl)`

#### 6. Add Account Sub-Route Noindex

Each account sub-route `meta()` must explicitly include:
```typescript
{ name: "robots", content: "noindex,nofollow" }
```
This cannot be inherited from `account.tsx` in React Router 7's meta system.

#### 7. Add Custom Routes to Sitemap

Create a custom sitemap extension that includes non-Shopify routes:

```typescript
// Option: Add a supplementary sitemap or use Hydrogen's getLink callback
// to inject custom static routes into the sitemap index
const CUSTOM_ROUTES = ["/faq", "/contact", "/gallery", "/sale", "/blogs"];
```

#### 8. Fix H1 Duplication on Product Pages

The mobile title, desktop title, and sticky bar on product pages all use `<h1>`. The desktop layout or mobile sticky bar version should be downgraded to a `<p>` or `<span>` with `aria-hidden="true"` on the duplicates, keeping only one semantic H1.

#### 9. Hydrogen-Specific Conventions Summary

- Always import `getSeoMeta` from `@shopify/hydrogen` (not custom implementation)
- Use `getSeoMeta()`'s `jsonLd` parameter for structured data injection
- Run `bun run codegen` after any GraphQL modification to keep `storefrontapi.generated.d.ts` in sync
- The `titleTemplate: "%s | BrandName"` in root meta only works when child routes inherit parent meta — the template is currently inoperative
- For dual-deployment (Oxygen + Cloudflare Workers), `siteUrl` from metaobject is the correct canonical domain source. Add a `request.url`-based fallback for the portfolio Workers deployment where no `siteUrl` metaobject is set.

---

*Report generated via static analysis of `/Users/beyourahi/Desktop/projects/storefronts/storefront_001/app/` and live HTTP inspection of `http://localhost:3003`.*

---

## Supplementary Audit — System Context Gaps

*Added after the initial audit. Covers: (1) origin of SEO issues relative to the demo-store reference, (2) five findings missed in the initial pass, and (3) live HTTP confirmation of critical issues.*

---

### S1. Origin of SEO Issues

The demo-store (unmodified Hydrogen scaffold) has zero OG tags, zero structured data, zero `getSeoMeta()` usage, and no `robots: noindex` on account pages. Every SEO issue identified in this audit is an original implementation decision made in this codebase — none of these bugs were inherited from the scaffold. There is no upstream reference to align with for OG tags or structured data; this codebase owns the fix entirely.

---

### S2. Newly Identified Findings (Missed in Initial Audit)

**S2-F1 (MAJOR): Gallery page has zero `<h1>` elements**
- **Location:** `app/routes/gallery.tsx:53` — `<GiantText text={title} />` with no `as` prop
- **Current Value:** `GiantText` defaults to `as="div"` — the gallery title renders as a `<div>`, not a heading. Zero H1 elements on the page. Confirmed via static code analysis of `GiantText.tsx:16` (`as?: "div" | "h1" | "h2" | "h3" | "p"`, default `"div"`).
- **Recommended Value:** Pass `as="h1"` to the `GiantText` component on the gallery route: `<GiantText as="h1" text={title} />`
- **Reason:** A page with no H1 sends no primary topic signal to search engines. Gallery pages with product images benefit from H1 context for image search indexing.

**S2-F2 (CRITICAL): `account.subscriptions.$id.tsx` lacks `robots: noindex`**
- **Location:** `app/routes/account.subscriptions.$id.tsx:35-37`
- **Current Value:** `meta()` returns `[{title: "Subscription Details"}]` — no robots tag
- **Recommended Value:** Add `{name: "robots", content: "noindex,nofollow"}` — this is a private per-subscription detail page
- **Reason:** Subscription contract detail pages contain private billing and product data. Indexing them would expose private customer information paths to search crawlers. This is the same issue as C-3 but was absent from the initial audit's route inventory.

**S2-F3 (MINOR): Image alt text has three degraded patterns**
- **Location 1:** `app/components/ProductLightbox/LightboxThumbnails.tsx:71` — `alt=""` on interactive thumbnail buttons used for gallery navigation
- **Location 2:** `app/components/homepage/VideoHero.tsx:150` — `alt="Hero Section Background"` hardcoded generic fallback when no `altText` from metaobject
- **Location 3:** `app/routes/account._index.tsx:137` and `app/routes/account.profile.tsx:498` — `alt={customer.displayName ?? ""}` — emits a blank `alt=""` attribute when customer has no display name set
- **Recommended Value:** LightboxThumbnails: use `aria-label` on the button instead; VideoHero: use a more descriptive fallback like `alt={siteSettings?.brandName + " hero image"}` or pull from metaobject; Account avatar: `alt="Profile photo"` or `alt={customer.displayName || "Your profile photo"}`
- **Reason:** Empty `alt=""` marks images as decorative — correct for purely decorative thumbnails but incorrect for interactive navigation elements. Generic `alt="Hero Section Background"` provides no content value to screen readers or image search.

**S2-F4 (MINOR): `og:image` URLs lack explicit width constraints**
- **Location:** `app/routes/products.$handle.tsx:70` and `app/routes/collections.$handle.tsx` — `media: image?.url` passes the raw Shopify CDN URL without transformation parameters
- **Current Value (live confirmed):** `og:image:url` is `https://cdn.shopify.com/s/files/1/0660/4963/8586/files/Deathly_Hallows_Pendant_with_the_1.webp?v=1731168683` — full resolution, no size constraint
- **Current dimensions reported:** 1120×1120 (square, reported via `og:image:width` / `og:image:height` — these come from Shopify's stored metadata, not actual pixel inspection)
- **Recommended Value:** Append `&width=1200` to the CDN URL to serve an optimized social preview image: `${image.url}&width=1200`. Shopify CDN supports on-the-fly image transformation via URL parameters.
- **Reason:** Full-resolution product images can be several MB. Social crawlers (Facebook, LinkedIn) fetch `og:image` synchronously during link previews. Serving a size-constrained image reduces crawl timeout risk and improves preview render speed. The 1120px square is below the recommended 1200×630 landscape ratio — adding a crop transformation (`&width=1200&height=630&crop=center`) would produce optimal social previews.

**S2-F5 (MAJOR): FAQPage JSON-LD schema contains placeholder content**
- **Location:** Live-confirmed via HTTP inspection of `/faq`
- **Current Value (live):** FAQPage schema renders with questions: "What is this?", "Who is this for?", "How does it work?", "Do I need any special knowledge to use this?", "Can I get started quickly?" — generic placeholder content, not real product/store FAQs
- **Recommended Value:** FAQ content must be populated with real, brand-specific questions before any client deployment. Placeholder FAQ content would cause Google's Rich Results validator to reject the FAQPage schema as low-quality.
- **Reason:** Google's quality guidelines for FAQPage rich results require the questions to be genuine, relevant, and non-duplicated. Placeholder text is a deployment footgun — the schema will be present and valid JSON but rejected for rich results in production.

---

### S3. Live HTTP Confirmation of Critical Findings

All CRITICAL findings from Section 5 are confirmed in live SSR output:

| Finding | Live Confirmation |
|---|---|
| C-1: `og:type` absent site-wide | Homepage, product, collection pages — zero `og:type` tags rendered |
| C-2: Root meta absent (theme-color, WebSite schema) | Homepage head contains only `<title>`, description, og:title/description, Organization JSON-LD — no `theme-color`, no `WebSite` schema |
| C-3: Account sub-routes indexable | `/account/orders` renders `<title>Order History</title>` with no robots tag. `/account/profile` renders `<title>Account Details</title>` with no robots tag. Both pages are publicly indexable. |
| C-4: Relative URLs in Product/Collection schema | Product JSON-LD confirmed: `"url":"/products/deathly-hallows-pendant"` (relative). Collection JSON-LD confirmed: `"url":"/products/charm-bracelet"` etc. (all relative). |
| C-5: Homepage `og:image` absent | Homepage head confirmed — no `og:image` tag of any kind. |

**Additional live confirmation:**
- Paginated collections (`?page=2&cursor=...&direction=forward`): canonical correctly preserved as base URL `https://dropoutstudio.co/collections/all-products` — no pagination canonical issue.
- X-Robots-Tag HTTP headers: zero — no server-level noindex headers set on any route (confirmed via code search across entire `app/` directory).

---

*Supplementary section added 2026-04-06. Methods: static analysis of `app/` and live HTTP inspection of `http://localhost:3003`.*
