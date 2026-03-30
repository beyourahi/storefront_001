# Plan: UI, Rendering, Navigation, & Accessibility

## Summary

Addresses 26 audit items covering runtime UI bugs (auto-navigation, price display inversion, black rectangles from scroll animations), hydration failures, accessibility violations (missing dialog titles, heading hierarchy), broken routes, and UX gaps (missing coupon input, blog nav link, account page guards). These items share the common surface of user-visible rendering and interaction behavior.

## Items Covered

| # | Description | File | Category |
|---|---|---|---|
| 1 | React Router version mismatch (7.9.x required, 7.12.0 installed) | `package.json` | Dependency |
| 2 | Pages auto-navigate to random routes without user interaction | Multiple | Navigation bug |
| 3 | Escape key navigates to random page instead of closing overlay | Search/cart overlays | Navigation bug |
| 4 | Product cards display inverted prices (current > original) | `product-card-normalizers.ts` | Price display |
| 5 | Homepage sections render as black rectangles until scrolled | Homepage components | Animation |
| 6 | Gallery masonry grid renders as black rectangle | Gallery components | Animation |
| 7 | Horizontal overflow at 375px mobile (407px body width) | Layout/components | Responsive |
| 8 | `/blogs` returns 404 + 17 hydration errors with no blogs | `blogs._index.tsx` | Route handling |
| 9 | Cart page hydration failures on every load | `cart.tsx` | Hydration |
| 10 | Cart page `validateDOMNesting` errors (invalid HTML nesting) | `cart.tsx` | HTML structure |
| 13 | Console error: PerfKit missing themeInstanceId or storefrontId | Analytics config | Console error |
| 14 | Console error: ShopifyAnalytics missing hydrogenSubchannelId | Analytics config | Console error |
| 15 | Cart drawer missing `DialogTitle` for screen readers | `CartAside.tsx` | Accessibility |
| 16 | Cart drawer missing `aria-describedby` | `CartAside.tsx` | Accessibility |
| 17 | "Function components cannot be given refs" warning | Cart drawer/lightbox | React warning |
| 98 | `/products` route 404 -- wishlist links point to dead route | Wishlist components | Broken link |
| 99 | PWA manifest returns empty `icons` array | `manifest[.]webmanifest.tsx` | PWA |
| 100 | PWA manifest `short_name` is "Dropout Stud" (truncated) | `manifest[.]webmanifest.tsx` | PWA |
| 101 | FAQ accordion items all expanded by default | `faq.tsx` | UX |
| 102 | Contact page heading renders as `div` instead of semantic tag | `contact.tsx` | Accessibility |
| 103 | No discount/coupon code input on cart page | `cart.tsx` | Missing feature |
| 104 | No blog link in main navigation | `navigation.ts` | Missing link |
| 105 | Cart drawer auto-opens on some PDP navigations | Cart drawer logic | UX bug |
| 106 | Account pages show full nav sidebar to unauthenticated users | `account.tsx` | UX/security |
| 107 | Privacy policy exposes personal email | Policy content | Privacy |
| 108 | 404 page heading uses `h2` instead of `h1` | `$.tsx` | Accessibility |

## Current State

### Navigation Bugs (Items 1-3)

**Item 1:** `package.json` has `react-router: 7.12.0` and `react-router-dom: 7.12.0`. Hydrogen `^2026.1.0` may require a specific React Router range. Need to verify Hydrogen's peer dependency.

**Items 2-3 (auto-navigation):** Exploration found no obvious auto-navigation code in the navbar, mobile menu, or search overlay. The components use standard `<Link>` elements and proper keyboard handling. The bug may be caused by:
- A browser extension or service worker interfering
- Focus management issues where keyboard events (Enter/Space) on focused nav links trigger navigation
- The `Lenis` smooth scroll library intercepting scroll events near nav links
- The `react-intersection-observer` or `useInView` hook triggering side effects

**Investigation needed:** This is the least understood bug. The exploration agents found no direct cause. Need to check:
1. `app/hooks/useInView.ts` -- does IntersectionObserver callback trigger navigation?
2. `Lenis` scroll library integration -- does it fire click events?
3. Focus trap behavior in overlays -- does closing an overlay leave focus on a nav link, and does a subsequent keypress trigger navigation?
4. Service worker (`public/sw.js`) -- does it intercept navigation events?

### Price Display (Item 4)

`app/lib/product/product-card-normalizers.ts` normalizes prices from Storefront API data. The `normalizeVariant` function at line 43 maps `variant.price` to `price` and `variant.compareAtPrice` to `compareAtPrice`. The product card component at `app/components/display/ProductCard.tsx` lines 129-149 renders:
- Current price (non-struck): `price`
- Original price (struck through): `compareAtPrice`

If `compareAtPrice < price`, the display shows a higher "current" price and lower "original" price, which is visually inverted. The Storefront API returns `compareAtPrice` as the original (higher) price and `price` as the sale (lower) price. If data is correct from Shopify, the display logic may have the labels swapped, or the data normalization is inverting them.

### Black Rectangles (Items 5, 6)

`app/hooks/useInView.ts` implements IntersectionObserver with default `opacity: 0` until `inView` becomes true. `app/components/sections/AnimatedSection.tsx` applies animation classes like `translate-y-8 opacity-0` by default, with `!opacity-100` on `inView`.

The problem: content starts invisible and relies on scroll interaction to become visible. If a user doesn't scroll, or if a screenshot tool captures the page without scroll, entire sections appear as black rectangles.

### Cart Hydration (Items 9, 10)

Cart page `app/routes/cart.tsx` has no `meta` export (addressed in SEO plan). Hydration failures suggest server-rendered HTML doesn't match client render -- likely caused by:
- Conditional rendering based on `typeof window` or `useEffect` state
- Cart data loading asynchronously and changing the DOM structure
- Invalid HTML nesting (Item 10) contributing to parser recovery differences

### Cart Drawer Accessibility (Items 15, 16)

`app/components/cart/CartAside.tsx` uses Drawer (mobile) and Sheet (desktop) from Radix primitives but does not include `DrawerTitle`/`SheetTitle` or `DrawerDescription`/`SheetDescription`. Radix Dialog requires these for accessibility compliance.

### 404 Heading (Item 108)

`app/routes/$.tsx` line 69: `<h2 className="text-5xl...">Page Not Found</h2>` -- should be `<h1>`.

## Target State

- Navigation bugs investigated and fixed (or documented if caused by external factors)
- Price display shows lower price as current, higher as original
- Animated sections visible by default, enhanced with animation on scroll (progressive enhancement)
- Cart page hydration clean -- no console errors
- Cart drawer has proper DialogTitle and aria-describedby
- All broken links fixed (`/products` -> `/collections/all-products`)
- FAQ accordion starts collapsed
- Contact page uses semantic `<h1>`
- Discount code input on cart page
- Blog link in main nav (conditional on blog existence)
- Account nav hidden for unauthenticated users
- 404 page uses `<h1>`
- PWA manifest has proper icons and short_name

## Implementation Approach

### Phase 1: Animation Visibility Fix (Items 5, 6) -- Most Visually Impactful

**Files:** `app/hooks/useInView.ts`, `app/components/sections/AnimatedSection.tsx`

**Strategy: Progressive Enhancement.** Content should be visible by default. Animation is an enhancement that plays when the user scrolls to it.

**Option A (recommended):** Change the default state from `opacity: 0` to `opacity: 1`, and only apply the animation entrance class when `inView` transitions from `false` to `true`:
- In `useInView.ts`: change default `inView` state to `true` for server rendering (SSR), then set to `false` on mount in a `useEffect`, and back to `true` when IntersectionObserver fires. This way: SSR render shows content (visible), client hydration briefly hides it, then scroll reveals it.
- Better: Use CSS `@starting-style` or `animation-play-state: paused` so the content is visible but the animation hasn't played yet.

**Option B (simpler):** Add `noscript` / SSR fallback: in AnimatedSection, render with `opacity: 1` by default on the server, then apply animation classes only after mount.

**Implementation for AnimatedSection.tsx:**
```typescript
// Add a mounted state
const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []);

// Only apply opacity-0 after mount (client-side)
const animationClasses = mounted ? (inView ? "opacity-100 ..." : "opacity-0 ...") : "";
```

This ensures SSR output has full opacity (no black rectangles), and client-side gets the scroll animation.

### Phase 2: Price Display Fix (Item 4)

**File:** `app/lib/product/product-card-normalizers.ts`

Investigate the price normalization chain:
1. Read how `normalizeVariant` (line 43) maps `variant.price` and `variant.compareAtPrice`
2. Check `fromStorefrontNode` (line 133) for how it processes the product
3. Verify the Storefront API response: `price` should be the current (sale) price, `compareAtPrice` should be the original (higher) price

**File:** `app/components/display/ProductCard.tsx` (lines 129-149)

Check the rendering logic:
- If the card shows `price` as "Current price" with a larger number and `compareAtPrice` as "Original price" with a smaller number, the labels or values are swapped
- Fix: Add a guard that only shows the compare-at/sale display when `compareAtPrice > price`

```typescript
const isOnSale = compareAtPrice && parseFloat(compareAtPrice.amount) > parseFloat(price.amount);
// Only show strikethrough + sale styling when isOnSale is true
```

### Phase 3: Cart Drawer Accessibility (Items 15, 16, 17)

**File:** `app/components/cart/CartAside.tsx`

Add accessibility elements to both the Drawer (mobile) and Sheet (desktop) paths:

For the Sheet (desktop) path:
```tsx
<SheetContent>
    <SheetTitle className="sr-only">Shopping Cart</SheetTitle>
    <SheetDescription className="sr-only">Review and manage items in your cart</SheetDescription>
    {/* existing content */}
</SheetContent>
```

For the Drawer (mobile) path:
```tsx
<DrawerContent>
    <DrawerTitle className="sr-only">Shopping Cart</DrawerTitle>
    <DrawerDescription className="sr-only">Review and manage items in your cart</DrawerDescription>
    {/* existing content */}
</DrawerContent>
```

Using `sr-only` (screen-reader-only) keeps the visual design unchanged while satisfying Radix's accessibility requirements.

**Item 17 (refs warning):** Check if `DialogPrimitive.Close asChild` in `ProductLightbox.tsx` wraps a function component without `forwardRef`. If so, wrap the child with `forwardRef` or use a native element as the `asChild` target.

### Phase 4: Blog Route Empty State (Item 8)

**File:** `app/routes/blogs._index.tsx`

Current behavior: throws `new Response("Not found", {status: 404})` when no blogs have articles (line 86). This triggers the ErrorBoundary instead of showing a friendly empty state.

**Fix:** Instead of throwing 404, return an empty-state flag and render a "No blog posts yet" message:
```typescript
if (!hasRealContent) {
    return {blogs: null, hasContent: false, ...};
}
```

In the component, check `hasContent` and render an appropriate empty state with a link back to the store.

### Phase 5: Cart Hydration Fix (Items 9, 10)

**File:** `app/routes/cart.tsx`

**Step 1:** Identify the hydration mismatch source. Common causes:
- Server rendering cart items differently than client (e.g., formatting differences, conditional rendering based on `typeof window`)
- Invalid HTML nesting (Item 10) -- browsers fix invalid nesting differently during parsing vs React hydration

**Step 2:** Fix `validateDOMNesting` errors. Search for:
- `<p>` containing `<div>` or block elements
- `<a>` containing `<a>`
- `<button>` containing `<button>`
- Table elements in wrong nesting order

**Step 3:** Ensure cart data is handled consistently between SSR and client with `<Suspense>` and `<Await>`.

### Phase 6: Heading Hierarchy Fixes (Items 102, 108)

**`app/routes/$.tsx` line 69** (Item 108): Change `<h2>` to `<h1>` for "Page Not Found".

**`app/routes/contact.tsx`** (Item 102): Check `GiantText` component. If it renders a `<div>`, either:
- Pass a `tag="h1"` prop to GiantText
- Or wrap the title in an explicit `<h1>` and use GiantText for styling only

Read `app/components/common/GiantText.tsx` to determine the current tag.

### Phase 7: Broken Links & Missing Navigation (Items 98, 104)

**Item 98:** The `/products` route doesn't exist. Wishlist empty states and "Start Browsing" links point to it.

Search for all references to `/products` (not `/products/`) and replace with `/collections/all-products`:
- Wishlist components
- Empty state components
- Any "Browse Products" or "Start Shopping" CTAs

**Item 104:** Add blog link to main navigation.

**File:** `app/lib/navigation.ts`

Add a conditional blog link. The root loader already queries `HAS_BLOG_QUERY` and provides `hasBlog` data. The navigation config should include the blog link only when `hasBlog` is true.

If navigation is static (no access to loader data), add `{href: "/blogs", label: "Blog"}` to the `NAVIGATION_LINKS` array. Then conditionally render it in the navbar based on the root loader's `hasBlog` flag.

### Phase 8: FAQ Accordion Behavior (Item 101)

**File:** `app/routes/faq.tsx`

Current: `type="multiple"` with `defaultValue={faqItems.map((_, index) => \`faq-${index}\`)}` -- all items open.

**Fix:** Change to single-expand or collapsed default:
```typescript
// Option A: Single expand (recommended for FAQ)
<Accordion type="single" collapsible defaultValue="">

// Option B: Multiple expand, all collapsed by default
<Accordion type="multiple" defaultValue={[]}>
```

Option A (single expand, collapsible) is the standard FAQ UX pattern.

### Phase 9: Account Page Guards (Item 106)

**File:** `app/routes/account.tsx` (AccountMenu component)

Currently, the account navigation sidebar shows all links (Dashboard, Orders, Wishlist, Returns, Account Details) regardless of authentication state.

**Fix:** Conditionally render the navigation based on `isAuthenticated`:
```typescript
{isAuthenticated && <AccountMenu />}
```

Or disable/hide navigation items and show only the login prompt for unauthenticated users.

### Phase 10: Cart Discount Input (Item 103)

**File:** `app/routes/cart.tsx`

Add a discount/coupon code input field to the cart page. Use `CartForm.ACTIONS.DiscountCodesUpdate` (already available in the cart actions reference).

Implementation:
```tsx
<CartForm route="/cart" action={CartForm.ACTIONS.DiscountCodesUpdate}>
    <input type="text" name="discountCode" placeholder="Discount code" />
    <button type="submit">Apply</button>
</CartForm>
```

Refer to the demo-store at `~/Desktop/projects/demo-store` for the canonical Hydrogen discount code pattern.

### Phase 11: PWA Manifest Fixes (Items 99, 100)

**File:** `app/routes/manifest[.]webmanifest.tsx`

**Item 99 (empty icons):** When no PWA icons are configured in site settings, provide default fallback icons. Generate simple placeholder icons or reference a default icon path.

```typescript
icons: manifest?.icons?.length > 0 ? manifest.icons : [
    {src: "/favicon.ico", sizes: "48x48", type: "image/x-icon"},
    {src: "/favicon.svg", sizes: "any", type: "image/svg+xml"}
],
```

**Item 100 (short_name):** Replace the naive `.slice(0, 12)` truncation:
```typescript
short_name: siteSettings.shortName || siteSettings.brandName?.slice(0, 12) || "Store",
```

If a `shortName` metafield exists, use it. Otherwise fall back to truncated brand name. The truncation should break at word boundaries if possible.

### Phase 12: Privacy Policy Email (Item 107)

**File:** Policy content (metaobject or fallback data)

This is a content issue, not a code issue. The privacy policy text references `beyourahi@gmail.com`. Since this is a template product:
- Replace with a placeholder like `contact@yourbrand.com` or `[your-email@domain.com]`
- Check `app/lib/metaobject-parsers.ts` fallback data for the policy content

### Phase 13: Console Errors (Items 13, 14)

**Item 13 (PerfKit):** The error "Either themeInstanceId or storefrontId must be defined" comes from Shopify's performance monitoring script. This is typically configured via `getShopAnalytics()` in `root.tsx`. Verify that `env.PUBLIC_STOREFRONT_ID` is set in the environment. If not available during local dev / portfolio mode, suppress the error by providing a fallback value.

**Item 14 (ShopifyAnalytics):** "Missing shop.hydrogenSubchannelId" -- this is a Shopify Oxygen-specific configuration. During local dev / Cloudflare Workers portfolio mode, this ID is not available.

**Fix for both:** In `root.tsx`, wrap analytics initialization with conditional logic that provides placeholder values or skips analytics in non-Oxygen environments.

### Phase 14: Cart Auto-Open (Item 105)

Investigation needed. The exploration found no auto-open logic in `useCartDrawer.tsx`. Possible causes:
- A `fetcher` in ProductVariantDialog or AddToCart that opens the cart drawer after successful cart mutation
- An `useEffect` that watches cart state changes and opens the drawer

Search for all calls to `cartDrawer.open()` or `setIsOpen(true)` across the codebase to find the trigger.

### Phase 15: React Router Version (Item 1)

Check Hydrogen 2026.1.0's peer dependency for React Router. If it requires `~7.9.x`, downgrade:
```bash
bun add react-router@7.9.0
bun remove react-router-dom  # Redundant in RR7 (also covered in dependencies plan)
```

If Hydrogen supports 7.12.x, this is a non-issue. Verify by checking `node_modules/@shopify/hydrogen/package.json` peerDependencies.

### Phase 16: Horizontal Overflow (Item 7)

**Investigation needed at 375px viewport.** Likely culprits:
- Fixed-width elements that exceed 375px (badges, buttons, product card carousels)
- Padding/margin on the body or root container
- `AnnouncementBanner` scroll animation container
- Account navigation with `min-w-max` and `overflow-x-auto`

Debug approach:
1. Open DevTools at 375px width
2. Use "Highlight all elements" to find the overflow source
3. Apply `overflow-x: hidden` to the offending container
4. Or fix the element's width to be responsive

## Constraints

- Animation fix must maintain SSR compatibility (no `window` access during server render)
- Price fix must handle edge cases: free products, zero-dollar variants, products without compareAtPrice
- Cart hydration fix must not break the existing `<Suspense>` + `<Await>` pattern
- Heading hierarchy must maintain visual design -- use className adjustments, not just tag changes
- Blog nav link must be conditional -- only show when store has blog content
- Discount code input must use Hydrogen's CartForm pattern, not custom fetch
- Account page guard must not break the AuthRequiredFallback pattern used in child routes
- PWA manifest changes must work for both Oxygen and Cloudflare Workers deployments

## Execution Order

**Critical path (do first -- most visible bugs):**
1. Phase 1 (animation visibility) -- black rectangles are the most dramatic visual bug
2. Phase 2 (price display) -- incorrect prices are a business-critical bug
3. Phase 5 (cart hydration) -- console errors on every cart load

**Accessibility (do second):**
4. Phase 3 (cart drawer a11y)
5. Phase 6 (heading hierarchy)

**UX improvements (do third, all independent):**
6. Phase 4 (blog empty state)
7. Phase 7 (broken links + blog nav)
8. Phase 8 (FAQ accordion)
9. Phase 9 (account guards)
10. Phase 10 (cart discount input)
11. Phase 11 (PWA manifest)

**Investigation-dependent (do last):**
12. Phase 13 (console errors) -- requires env var investigation
13. Phase 14 (cart auto-open) -- requires codebase search
14. Phase 15 (RR version) -- requires peer dep check
15. Phase 16 (horizontal overflow) -- requires browser debugging
16. Phase 12 (privacy email) -- content change

Items 2-3 (auto-navigation) are listed under Phase 14/15/16 because they need investigation. The React Router version mismatch (Item 1) may be the root cause.

## Parallelism Notes

This plan is independent from all other plans except:
- **Overlap with Plan: SEO** on `app/routes/faq.tsx` (this plan: accordion; SEO plan: meta/JSON-LD). Non-conflicting.
- **Overlap with Plan: SEO** on `app/routes/$.tsx` (this plan: h1 heading; SEO plan: meta export). Non-conflicting.
- **Overlap with Plan: Dependencies** on `package.json` (this plan: RR version; Dependencies plan: remove react-router-dom). Coordinate version changes.

Within this plan, Phases 1-3 should be done first. Phases 4-11 are all independent and can run in parallel.

## Verification

1. **Animations:** Take screenshot of homepage without scrolling -- all sections should be visible (not black)
2. **Prices:** Check product cards on homepage, collections, search results -- current price should always be <= original price
3. **Cart hydration:** Open `/cart` -- zero hydration errors in console
4. **Cart drawer:** Open cart drawer -- no console warnings about missing DialogTitle
5. **FAQ:** Load `/faq` -- accordion items should be collapsed
6. **Blog:** Load `/blogs` with no blog data -- should show empty state, not 404
7. **Links:** Click "Start Browsing" in wishlist -- should navigate to `/collections/all-products`
8. **Account:** Load `/account` while unauthenticated -- navigation should not show Dashboard/Orders/etc.
9. **404 page:** Load invalid URL -- heading should be `<h1>`
10. **Mobile:** Load homepage at 375px -- no horizontal scrollbar
11. **PWA:** Check `/manifest.webmanifest` -- icons array should not be empty
