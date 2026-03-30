# Audit Findings

1. React Router version mismatch — Hydrogen requires 7.9.x but 7.12.0 is installed for `react-router`, `react-router-dom`, `@react-router/dev`, and `@react-router/fs-routes`
2. Pages intermittently auto-navigate to random unrelated routes without user interaction — observed on homepage, search, FAQ, contact, gallery, and product pages; likely caused by focus landing on nav links and keyboard/scroll events being intercepted
3. Pressing Escape while any overlay (search, cart drawer) is open navigates to a random page instead of closing the overlay
4. Multiple product cards across homepage, collections, and recommendations display inverted prices — "Current price: BDT 420 / Original price: BDT 69" where the current price is higher than the original
5. Homepage sections below the hero render as solid black rectangles until scrolled into view — scroll-triggered CSS animations/opacity prevent content from being visible to users without scroll interaction or to screenshot tools
6. Gallery page (`/gallery`) masonry grid images are present in the DOM but render as a solid black rectangle — same animation opacity issue
7. Horizontal overflow at 375px mobile viewport — body.scrollWidth (407px) exceeds window.innerWidth (375px) by 32px
8. `/blogs` returns 404 with 17+ hydration errors instead of rendering an empty state when the demo store has no blogs
9. Cart page (`/cart`) triggers React hydration failures on every load — "Hydration failed because the initial UI does not match what was rendered on the server"
10. Cart page throws `validateDOMNesting` errors indicating invalid HTML nesting in server-rendered markup
11. Product page title contains duplicated store name — "Ravenclaw Robe | Hogwarts House Robes | Dropout Studio | Dropout Studio"
12. Cart page title is "Dropout Studio | Dropout Studio" with no "Cart" text and store name duplicated
13. Console error on every page: `Error initializing PerfKit: Either themeInstanceId or storefrontId must be defined`
14. Console error on every page: `[h2:error:ShopifyAnalytics] Unable to send Shopify analytics: Missing shop.hydrogenSubchannelId configuration`
15. Console error when cart drawer opens: `DialogContent requires a DialogTitle` — missing accessible title for screen readers
16. Console warning when cart drawer opens: `Missing Description or aria-describedby` on cart drawer dialog
17. Console warning: `Function components cannot be given refs` when cart drawer or lightbox opens
18. SEO console warnings on product pages: `title should not be duplicated` and `description should not be duplicated`
19. `app/routes/api.newsletter.tsx` — No rate limiting on customer creation endpoint
20. `app/routes/api.newsletter.tsx:24` — Uses `Math.random()` for password generation instead of cryptographically secure `crypto.getRandomValues()`
21. `app/routes/api.product.recommendations.tsx` — No rate limiting on recommendations endpoint
22. `app/routes/api.products.$handle.tsx` — No rate limiting on product data endpoint
23. `app/routes/api.share.track.tsx` — No rate limiting on share tracking endpoint
24. `app/routes/api.wishlist-products.tsx` — No rate limiting on wishlist products endpoint
25. `app/routes/api.$version.[graphql.json].tsx` — GraphQL proxy forwards all request headers (including cookies/auth) to upstream without filtering
26. `app/routes/api.$version.[graphql.json].tsx` — No validation on `params.version`; arbitrary path segments interpolated into upstream URL
27. `app/entry.server.tsx:97-98` — Ngrok development tunnel domain hardcoded in production CSP connect-src
28. `app/entry.server.tsx:82` — CSP style-src includes `'unsafe-inline'`
29. `app/routes/discount.$code.tsx:12` — Open redirect guard only checks for `//`; can be bypassed with backslash or encoded variants in some user agents
30. `app/lib/seo.ts:70` — `FALLBACK_SITE_URL = "https://example.com"` leaks into production structured data when siteUrl is not configured
31. `app/lib/seo.ts:251` — Product schema `offers.url` uses `buildCanonicalUrl()` with example.com default
32. `app/lib/seo.ts:286` — Collection schema `itemListElement[].url` uses example.com default
33. `app/lib/seo.ts:334` — BlogPosting schema `mainEntityOfPage` uses example.com default
34. `app/lib/seo.ts:176` — `generateOrganizationSchema()` is defined but never called; homepage has no Organization JSON-LD
35. `app/lib/seo.ts:266` — `generateCollectionSchema()` is defined but never called; collection pages have no ItemList JSON-LD
36. `app/lib/seo.ts:317` — BlogPosting `dateModified` always equals `datePublished` because article query has no `updatedAt` field
37. `app/routes/cart.tsx` — Missing `meta` export; no page title or robots tag
38. `app/routes/offline.tsx` — Missing `meta` export
39. `app/routes/$.tsx` — Missing `meta` export on 404 catch-all
40. `app/routes/account_.login.tsx` — Missing `meta` export
41. `app/routes/account_.authorize.tsx` — Missing `meta` export
42. `app/routes/account_.logout.tsx` — Missing `meta` export
43. `app/routes/discount.$code.tsx` — Missing `meta` export
44. `app/routes/cart.$lines.tsx` — Missing `meta` export
45. `app/routes/account.addresses.tsx` — Missing `meta` export
46. `app/routes/account.$.tsx` — Missing `meta` export
47. `app/routes/collections.all.tsx` — Missing `meta` export
48. `app/routes/wishlist.tsx` — Missing `meta` export
49. `app/routes/faq.tsx:8-9` — FAQ page meta has no description and no OG image
50. `app/routes/collections.$handle.tsx` — Collection meta has no `url` property; no canonical URL emitted
51. `app/routes/collections.all-products.tsx` — All Products meta has no `url` property; no canonical URL
52. `app/routes/blogs._index.tsx` — Blog index meta has no `url` property; no canonical URL
53. `app/routes/blogs.$blogHandle._index.tsx` — Blog handle meta has no `url` property; no canonical URL
54. `app/routes/blogs.$blogHandle.$articleHandle.tsx` — Article meta has no `url` property; no canonical URL
55. `app/routes/contact.tsx` — Contact meta has no `url` property and no OG image
56. `app/routes/sale.tsx` — Sale meta has no `url` property and no OG image
57. `app/routes/gallery.tsx` — Gallery meta has no `url` property and no OG image
58. `app/routes/policies.$handle.tsx` — Policy meta has no `url` property; no canonical URL
59. `app/routes/[robots.txt].tsx:86` — robots.txt blocks `/policies/` entirely, preventing search engines from indexing privacy policy, terms of service, shipping policy, and refund policy
60. `app/routes/[robots.txt].tsx:90-92` — robots.txt blocks `/search` but allows `/search/`; inconsistent trailing slash handling
61. `app/routes/wishlist.share.tsx:109` — Hardcodes "Your Store" in page title instead of dynamic brand name
62. `app/routes/products.$handle.tsx:67` — Product canonical URL uses relative path when siteUrl is empty, producing OG URL without domain
63. `app/lib/store-locale.ts:1-6` — Hardcodes Bangladesh (BD) as store country/locale; limits template portability
64. `app/root.tsx:309` — `<html lang="en">` hardcoded instead of using `STORE_LANGUAGE_CODE`
65. `app/routes/_index.tsx:340` — EXPLORE_COLLECTIONS_QUERY fetches `products(first: 250)` per collection (20 collections) just to count available items
66. `app/routes/_index.tsx:407` — ALL_PRODUCTS_QUERY fetches `products(first: 250)` with full variant/image data on homepage
67. `app/routes/products.$handle.tsx:650` — SIDEBAR_COLLECTIONS_QUERY fetches `products(first: 250)` per collection (50 collections) to count available products
68. `app/routes/collections._index.tsx:225` — Collections page query fetches `collections(first: 250)` with nested `products(first: 250)` each — potential 62,500 product nodes
69. `app/routes/collections.$handle.tsx:76` — Fetches 250 products per page instead of typical 24-48 for a paginated grid
70. `app/routes/collections.all-products.tsx:41` — Fetches 250 products per page
71. `app/routes/sale.tsx:41` — Fetches 250 products per page
72. `app/routes/gallery.tsx:24` — Gallery loader fetches 250 products with 250 images each
73. `app/lib/fragments.ts:463` — Root loader MENU_COLLECTIONS_QUERY fetches `products(first: 250)` per collection on every single page navigation
74. `app/routes/collections.$handle.tsx:302` — Collection product fragment fetches `variants(first: 100)` per product in a 250-product page — up to 25,000 variant nodes
75. `app/routes/products.$handle.tsx:531` — PRODUCT_FRAGMENT fetches `variants(first: 100)` duplicating data in selectedOrFirstAvailableVariant and adjacentVariants
76. `app/root.tsx:134` — Theme settings query uses `CacheNone()` but theme data changes rarely; should use CacheShort or CacheLong
77. `app/root.tsx:138` — Site content query uses `CacheNone()` but content data changes rarely
78. `app/routes/collections.$handle.tsx:92` — Collection page query uses `CacheNone()`
79. `app/routes/collections._index.tsx:96` — Collections index query uses `CacheNone()`
80. `app/routes/collections.all-products.tsx:48` — All products query uses `CacheNone()`
81. `app/routes/sale.tsx:49` — Sale page query uses `CacheNone()`
82. `app/routes/products.$handle.tsx:105-108` — Both product and sidebar queries use `CacheNone()` on PDP
83. `app/routes/products.$handle.tsx:177` — Recommendations query uses `CacheNone()`
84. `app/root.tsx:250,253` — `customerAccount.isLoggedIn()` called twice in `loadDeferredData`; should reuse single call
85. `app/components/ui/sonner.tsx:2` — Imports `useTheme` from `next-themes` (Next.js-specific package) in a Hydrogen project
86. `package.json:47` — `next-themes` is a production dependency but this is not a Next.js project
87. `package.json:50` — `react-icons` (~3MB) is used in only 5 files; can be replaced with `lucide-react` already used in 90+ files
88. `package.json:53` — `react-router-dom` listed as separate dependency; unnecessary in React Router 7
89. `app/components/policy/` and `app/components/legal/` — Duplicate component directories with overlapping `PolicyTableOfContents`, `PolicyPageWithTOC`, `PolicySectionsGrid`, `PolicySectionCard`
90. `app/components/sections/PolicyContentSection.tsx` vs `app/components/legal/PolicyContentSection.tsx` — `PolicyContentSection` exists in two locations
91. `app/lib/site-content-context.tsx:106-109` — `useGeneratedTheme()` calls `generateTheme()` on every render without `useMemo`
92. `app/components/RecentlyViewedProvider.tsx:20-22` — Passes new object reference as context value on every render, causing unnecessary consumer re-renders
93. 132 total `any` type usages across 31 files — pervasive type safety erosion
94. `app/lib/product/product-card-normalizers.ts` — 22 `any` usages; worst offender for untyped code
95. `app/lib/metaobject-parsers.ts` — 19 `any` usages across parser functions
96. `app/routes/cart.tsx:160` — `optimisticCart as any` cast bypasses cart type checking
97. `app/routes/faq.tsx:24` — FAQ JSON-LD injected via innerHTML script tag instead of `getSeoMeta({jsonLd})`, inconsistent with other routes
98. `/products` route returns 404 — wishlist "Start Browsing" link and empty state links point to dead `/products` route instead of `/collections/all-products`
99. PWA manifest (`manifest.webmanifest`) returns empty `icons` array — PWA install will fail without icons
100. PWA manifest `short_name` is "Dropout Stud" (truncated) instead of a meaningful abbreviation
101. FAQ page accordion items all render fully expanded by default; no collapsed/single-expand behavior
102. Contact page main heading "Get in Touch" renders as a `div` instead of semantic heading tag
103. No discount/coupon code input field on the cart page
104. No blog link in main navigation despite blog routes existing in the codebase
105. Cart drawer opens automatically on some PDP navigations without user interaction
106. Account pages show full navigation sidebar (Dashboard, Orders, Wishlist, Returns, Account Details) to unauthenticated users
107. Privacy policy page exposes personal email (`beyourahi@gmail.com`) instead of business email
108. 404 page primary heading uses `h2` instead of `h1`
109. `app/lib/text-format.ts:32` — URL in generated `<a href>` is not HTML-attribute-escaped; crafted CMS content could break out of attribute
110. `app/components/GoogleTagManager.tsx:85-86` — Cart update event uses total quantity comparison to decide between `add_to_cart` and `remove_from_cart`, incorrect when items are both added and removed simultaneously
111. `app/routes/_index.tsx:38-40` — Homepage intentionally omits Organization JSON-LD (comment says "to prevent hydration mismatch"), losing rich snippet opportunity
