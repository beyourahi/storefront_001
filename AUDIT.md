# Audit Findings

1. React Router version mismatch — Hydrogen requires 7.9.x but 7.12.0 is installed for `react-router`, `react-router-dom`, `@react-router/dev`, and `@react-router/fs-routes`
2. Pages intermittently auto-navigate to random unrelated routes without user interaction — observed on homepage, search, FAQ, contact, gallery, and product pages; likely caused by focus landing on nav links and keyboard/scroll events being intercepted
3. Pressing Escape while any overlay (search, cart drawer) is open navigates to a random page instead of closing the overlay
4. Horizontal overflow at 375px mobile viewport — body.scrollWidth (407px) exceeds window.innerWidth (375px) by 32px
5. Console error on every page: `Error initializing PerfKit: Either themeInstanceId or storefrontId must be defined`
6. Console error on every page: `[h2:error:ShopifyAnalytics] Unable to send Shopify analytics: Missing shop.hydrogenSubchannelId configuration`
7. Console warning: `Function components cannot be given refs` when cart drawer or lightbox opens
8. `app/entry.server.tsx:82` — CSP style-src includes `'unsafe-inline'`
9. `app/lib/seo.ts:317` — BlogPosting `dateModified` always equals `datePublished` because article query has no `updatedAt` field
10. `app/routes/[robots.txt].tsx:89` — robots.txt blocks `/search` entirely, preventing search results from being indexed
11. `app/routes/collections.$handle.tsx:302` — Collection product fragment fetches `variants(first: 100)` per product in a 250-product page — up to 25,000 variant nodes
12. `app/routes/products.$handle.tsx:531` — PRODUCT_FRAGMENT fetches `variants(first: 100)` duplicating data in selectedOrFirstAvailableVariant and adjacentVariants
13. 82 total `any` type usages across source files — top offenders: `root.tsx` (12), `_index.tsx` (11), `api.products.$handle.tsx` (8), `data-source.ts` (8)
14. `app/lib/store-locale.ts:1-6` — Hardcodes Bangladesh (BD) as store country/locale; limits template portability
15. `app/root.tsx:309` — `<html lang="en">` hardcoded instead of using `STORE_LANGUAGE_CODE`
16. Cart drawer opens automatically on some PDP navigations without user interaction
17. Privacy policy page exposes personal email (`beyourahi@gmail.com`) via `app/lib/navigation.ts:38` DEVELOPER_CONFIG instead of business email
18. `app/components/GoogleTagManager.tsx:85-86` — Cart update event uses total quantity comparison to decide between `add_to_cart` and `remove_from_cart`, incorrect when items are both added and removed simultaneously
19. `app/routes/_index.tsx:38-40` — Homepage intentionally omits Organization JSON-LD (comment says "to prevent hydration mismatch"), losing rich snippet opportunity
