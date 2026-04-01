# QA Audit Results — storefront_001

**Date:** 2026-04-01
**URL:** http://localhost:3000
**Viewport Tested:** Desktop (1440x900), Mobile (375x812), Tablet (768x1024)

---

## Critical (Blocks Purchase / Crashes)

- [PDP] Product image lightbox/gallery dialog fails to open on double-click — generates React forwardRef error in DialogOverlay and missing DialogTitle accessibility error from Radix Dialog. The button says "Open image gallery (desktop only)" but nothing visually appears. Source: ProductImageGalleryDialog.tsx
- [All Policy Pages] React hydration mismatch on innerHTML prop — server renders HTML with newline+indent whitespace between tags, client strips it. Triggers on /policies/privacy-policy, /policies/terms-of-service, /policies/shipping-policy, /policies/refund-policy. Source: PolicySectionCard.tsx
- [PDP] React hydration mismatch on product pages — server sends className "min-h-dvh ..." but client renders "min-h-screen ...". The h-dvh vs h-screen mismatch means server and client disagree on which CSS class to use. Source: products.$handle.tsx

## High (Broken Feature / Bad UX)

- [/account, /account/wishlist] React Suspense hydration error on every load — "This Suspense boundary received an update before it finished hydrating. This caused the boundary to switch to client rendering." Forces full client-side re-render, causing flash of content
- [/account, /account/wishlist] Nested main landmark elements — the account layout wraps content in a main inside the root layout main, violating HTML semantics and confusing screen readers
- [Collections] No sort or filter controls on collection pages — /collections/all-products shows "Price: Low to High" as static text but provides no UI to change sort order or apply filters. Customers cannot sort by name, price, or date, or filter by type/availability
- [Homepage] No newsletter signup form anywhere on the site — the /api/newsletter POST endpoint exists (returns 405 on GET) but no email input or subscription form is rendered on the homepage, footer, or any other page
- [/offline] Offline page redirects to homepage — navigating to /offline just redirects to /, so the PWA service worker has no dedicated offline fallback page to serve when the network is unavailable
- [PWA Manifest] Only a single 48x48 favicon.ico icon in manifest — PWA requires at least 192x192 and 512x512 icons for installability. Current manifest will fail Lighthouse PWA installability check
- [PDP Lightbox] Missing DialogTitle accessibility violation — when lightbox attempts to open, Radix logs: "DialogContent requires a DialogTitle for the component to be accessible for screen reader users." Screen readers cannot announce what the dialog is for
- [/account/wishlist] Page title shows "Wishlist | Your Store" instead of "Wishlist | Dropout Studio" — placeholder store name not replaced in the meta title

## Medium (Visual Bug / Minor Functional)

- [Homepage Featured Section] Price display order inconsistency — Featured product shows "BDT 420" then "BDT 69" (original first, sale second), while all product cards show "BDT 69" then "BDT 420" (sale first, original second). Inconsistent mental model for shoppers
- [Homepage] Live clock in hero section shows real-time updating clock with date — while technically functional, displaying "Wed, Apr 1 - 1:58:11 AM" in the hero is unusual for a commerce storefront and may confuse customers about what it represents
- [/gallery] React warning: fetchPriority prop not recognized on DOM element — should be lowercase fetchpriority. Source: MasonryImageGrid.tsx. Not user-visible but indicates code quality issue
- [Homepage] Below-fold carousel images requested at width=100 but rendered at 338x422+ pixels — images will appear extremely blurry/pixelated when they first load into view. Shopify CDN width parameter is too small for the display size. Affects product card images in Best Sellers, New Arrivals, Trending, and Recently Viewed carousels
- [Contact] No contact form on the contact page — page only shows email/phone/address cards and FAQ accordion. Users cannot submit a message directly from the site; they must use external email or phone
- [PDP] No breadcrumb navigation on product detail pages — collection and other pages have breadcrumbs, but PDP has none, making it harder for users to navigate back to the collection they came from
- [All Pages] SEO meta description exceeds 160 characters — Hydrogen logs "Error in SEO input: description should not be longer than 160 characters" on product pages. Repeated 4-6 times per PDP load
- [Search Overlay] Predictive search shows both current and original price inline without clear formatting — "Voldemort's Wand Wands BDT 420 BDT 69" in search results makes it unclear which is the real price

## Low (Polish / Nitpick)

- [All Pages] Vite HMR WebSocket connection fails on initial page load — "WebSocket connection to ws://localhost:3000/?token=... failed: Unexpected response code: 400". Dev-only issue, does not affect production, but appears on every page load during development
- [Homepage] Threads social link icon has no alt text on the img — Instagram and Facebook links have alt text but Threads does not (empty alt attribute)
- [Homepage] Footer is minimal — only policy links and copyright. No newsletter, no quick links, no store description. Compared to the mobile menu which is comprehensive, the footer feels empty
- [/blogs] Shows "No blog posts published yet" — expected for demo store, but the nav does not include a Blog link so users would only find this by directly navigating to /blogs
- [PDP] Quantity decrease button is disabled at quantity 1 but has no visible disabled styling differentiation — the minus button just stops working without clear visual feedback
- [/discount/TESTCODE] Discount route silently redirects to homepage — no feedback shown to the user about whether the code was valid or applied
- [Cart Page] "3 items" in cart summary but only 2 line item groups visible — likely one product has quantity 2, but the phrasing "3 items" next to 2 visible product rows could momentarily confuse shoppers

## Console Errors

- [PDP] `Warning: Prop className did not match. Server: "min-h-dvh ..." Client: "min-h-screen ..."` — hydration mismatch in products.$handle.tsx
- [/policies/*] `Warning: Prop innerHTML did not match` — whitespace differences in HTML content between server and client rendering
- [/gallery] `Warning: React does not recognize the fetchPriority prop on a DOM element` — in MasonryImageGrid.tsx
- [PDP Lightbox] `Warning: Function components cannot be given refs` — in DialogOverlay / Primitive.button.SlotClone
- [PDP Lightbox] `DialogContent requires a DialogTitle for accessibility` — Radix Dialog accessibility violation (appears twice)
- [/account, /wishlist] `Suspense boundary received update before finishing hydration` — forces client re-render
- [All Pages] `Vite WebSocket connection failed: Unexpected response code: 400` — dev-only HMR issue
- [PDP] `Error in SEO input: description should not be longer than 160 characters` — repeated 4-6 times per product page

## Failed Network Requests

- None observed — all Shopify Storefront API GraphQL requests returned 200 OK. No 4xx/5xx errors on any page.

---

**Total Issues Found:** 24

**Summary by Severity:**
- Critical: 3
- High: 8
- Medium: 8
- Low: 7

**Key Patterns:**
1. **Hydration mismatches** are the most pervasive issue — affecting PDP (h-dvh vs h-screen), all policy pages (HTML whitespace), and account pages (Suspense). These cause content flicker and potentially break SSR benefits.
2. **Accessibility gaps** — lightbox missing DialogTitle, nested main landmarks, missing Threads icon alt text.
3. **Missing features** — newsletter signup form, product sort/filter, contact form, offline page, proper PWA icons, blog link in nav.
4. **Image optimization** — carousel images fetched at width=100 but displayed at 300-800px+, causing blur.
