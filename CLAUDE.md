# storefront_001

## Always Do First

**Invoke the `frontend-design` skill** before writing any frontend code, every session, no exceptions.

## ⚠️ Git Worktree Workflow (MANDATORY)

**NEVER CREATE BRANCHES**. Use git worktrees for parallel work:

```bash
git worktree add ../storefront_001-<feature-name>   # Create worktree
git worktree list                                   # List worktrees
git worktree remove <path>                          # Remove worktree
git worktree prune                                  # Clean stale refs
```

Direct commits to `main` only. This keeps the repo aligned with the worktree-only workflow and avoids branch sprawl.

**Always break large tasks into focused scopes** — run parallel agents with git worktrees, each with a narrow, well-defined goal.

---

## Project Overview

Part of the **storefront family** (`storefront_001`, `storefront_002`, `storefront_003`, etc.) — a collection of commercial Shopify Hydrogen templates built to be sold to multiple client brands across different niches. High-performance storefront based on React Router 7, Shopify Oxygen, and Cloudflare Workers with PWA support, metaobject CMS, wishlist flows, recently viewed products, account returns, subscriptions, blog surfaces, and offline/error handling. **Critical**: import from `react-router`, never `@remix-run/react`.

Backend behavior, data flow, and Hydrogen conventions **must remain consistent** across all storefronts — the frontend layer (UI, presentation, visual identity) is where storefronts differentiate.

### Hydrogen Implementation Reference

`~/Desktop/projects/demo-store` is a **freshly scaffolded, unmodified Shopify Hydrogen codebase** — the **primary source of truth** for all non-frontend-visual-design patterns. Consult it first when uncertain about core Hydrogen conventions, data-fetching patterns, route/loader structure, or server-side implementation details.

### Dual Deployment Targets

| Target                             | Purpose                         | Data Source                               |
| ---------------------------------- | ------------------------------- | ----------------------------------------- |
| **Shopify Oxygen**                 | Client production deployments   | Client's own Shopify store (no fallback)  |
| **Cloudflare Workers + local dev** | Portfolio showcase + dev server | Demo Shopify store credentials + in-repo content defaults |

- On **Oxygen**: use the client's Shopify credentials only
- On **Cloudflare Workers** portfolio deployments: `wrangler.jsonc` is preconfigured with the demo-store credentials
- During **local development**: point `.env` at the desired Shopify store; UI and content defaults currently live in `app/lib/metaobject-parsers.ts`

## Tech Stack

| Category      | Tech             | Version    | Notes                               |
| ------------- | ---------------- | ---------- | ----------------------------------- |
| **Framework** | React            | 18.3.1     |                                     |
|               | React Router     | 7.12.0     | Hydrogen preset, file-based routing |
|               | Shopify Hydrogen | 2026.4.1   | Storefront + Customer Account APIs  |
|               | Storefront API   | 2026-04    | GraphQL API version                 |
|               | TypeScript       | 5.9        | Strict mode, ES2022 target          |
|               | Vite             | 6          | Build tooling                       |
| **UI**        | Tailwind CSS     | v4         | CSS-first config via `@import`      |
|               | shadcn/ui        | Latest     | Radix-backed components             |
|               | Lucide React     | Latest     | Icons                               |
|               | OKLCH colors     | -          | Theme + contrast pipeline           |
|               | sonner           | ^2         | Toast notifications                 |
|               | @unpic/react     | ^1         | Optimized image rendering           |
|               | colorjs.io       | ^0.6       | Color science (OKLCH pipeline)      |
|               | schema-dts       | ^1.1       | JSON-LD structured data types       |
| **Features**  | Embla Carousel   | 8          | Product galleries, auto-scroll, trackpad/wheel scroll (wheel-gestures plugin) |
|               | Lenis            | 1.3        | Smooth scrolling                    |
|               | Vaul             | 1.1        | Drawer primitives                   |
|               | react-intersection-observer | ^10 | Scroll/viewport-triggered rendering |
|               | Wishlist         | Custom     | Account + share flows               |
|               | Recently Viewed  | Custom     | History tracking + provider         |
|               | Quick Add        | Custom     | Add-to-cart overlay (button/dialog/sheet) |
|               | Newsletter Signup| Custom     | API endpoint + component + marketing mutation |
|               | Blog             | Custom     | Article + author surfaces           |
|               | PWA              | Custom     | Workbox 7 service worker, offline routes, install prompt |
|               | Metaobjects      | Shopify    | Theme + content CMS                 |
| **Dev**       | ESLint           | 9          | Flat config                         |
|               | Workbox CLI      | 7          | Self-hosts SW runtime via `prebuild` into `public/workbox-v7/` |
|               | npm              | Latest     | Package manager + scripts           |
|               | Node.js          | >= 20.19.0 | **Strict requirement**              |

**GraphQL**: Dual-project (Storefront API + Customer Account API)  
**Path Alias**: `~/` → `app/`

## Core Architecture

```text
storefront_001/
├── app/
│   ├── routes/                    # Route modules
│   ├── components/                # UI and feature components
│   │   ├── *.tsx                  # Root-level shared components (QuantitySelector, WishlistButton, WishlistCount, ShareDialog, DiscountBadge, ProductDiscountBadge, QuickAddButton, QuickAddDialog, QuickAddSheet, RecentlyViewedProvider, NetworkStatusIndicator, ServiceWorkerRegistration, RouteErrorBoundary, OfflineAwareErrorPage, FloatingChatWidget, GoogleTagManager, GtmScript, HomepageWishlistSection, ProductVariantDialog, ProductImagePlaceholder, etc.)
│   │   ├── ui/                    # shadcn/ui generated primitives
│   │   ├── account/               # Account dashboard surfaces
│   │   ├── blog/                  # Blog surfaces
│   │   ├── cart/                  # Cart drawer, line items, and product suggestions
│   │   ├── collection/            # Collection page components (sort/filter bar)
│   │   ├── common/                # Shared presentational (breadcrumbs, price, skeletons)
│   │   ├── custom/                # Custom overrides (collection pagination)
│   │   ├── display/               # Product/collection cards
│   │   ├── gallery/               # Masonry grid
│   │   ├── homepage/              # Hero, sections, promotions
│   │   ├── icons/                 # Custom icon components
│   │   ├── layout/                # Navbar, footer, mobile menu, search overlay
│   │   ├── legal/                 # Policy/legal page layouts
│   │   ├── motion/                # Animation primitives (parallax)
│   │   ├── product/               # PDP components (gallery, options, purchase)
│   │   ├── pwa/                   # Install prompts, SW update banner
│   │   ├── search/                # Search results + controls
│   │   ├── sections/              # Reusable page sections
│   │   └── ProductLightbox/       # Fullscreen image lightbox
│   ├── lib/                       # Shared utilities
│   │   ├── color/                 # OKLCH + contrast helpers
│   │   ├── performance/           # Image optimization helpers
│   │   ├── product/               # Product parsing, pricing, variants
│   │   ├── queries/               # Shared GraphQL queries
│   │   ├── search/                # Search URL utilities
│   │   ├── types/                 # Shared type definitions
│   │   ├── validation/            # Custom validators (regex-based)
│   │   ├── metaobject-*.ts        # CMS queries/parsers/fragments
│   │   ├── data-source.ts         # Data adapter abstraction
│   │   └── site-content-context.tsx # Site-wide content React context
│   ├── graphql/customer-account/  # Customer account queries
│   ├── hooks/                     # Shared hooks
│   ├── assets/icons/              # Static icon assets
│   └── styles/app.css             # Tailwind v4 + theme tokens
├── public/                        # Static assets (sw.js, pwa-install-capture.js, workbox-v7/)
├── vite.config.ts                 # Vite build config
└── react-router.config.ts         # Hydrogen preset
```

## Common Commands

```bash
npm run dev              # Dev server + GraphQL codegen
npm run build            # Production build (runs prebuild to copy Workbox libs)
npm run preview          # Preview build
npm run lint             # ESLint
npm run typecheck        # TypeScript + route types
npm run codegen          # Regenerate GraphQL types
npm run deploy           # Build + deploy to Cloudflare Workers
npm run deploy:workers   # Same as deploy (explicit alias)
npm run deploy:workers:dry  # Build + wrangler dry-run (no deploy)
npm run dev:workers      # Build + run via Wrangler locally
npm run cf-typegen       # Regenerate Cloudflare Worker types
```

## Code Style

**ESLint**: Flat config with TypeScript, React, and accessibility rules

- camelCase/PascalCase naming
- object shorthand preferred
- keep code readable over clever

**Formatting**: 4 spaces, 120 chars, double quotes, semicolons required

**TypeScript**: Strict mode, ES2022 target, `~/` alias only

**React**: Import from `react-router`.

**Files**: Keep components in PascalCase, utilities in camelCase, and co-locate related feature code.

## MCP Servers

**shopify-dev**: Hydrogen, Storefront API, Customer Account API, GraphQL validation  
**context7**: Tailwind, Radix UI, React, TypeScript

Prefer MCP documentation tools over web search for official docs. Run `npm run codegen` after any GraphQL change.

## Testing

**Current**: No committed test suite expected in this repo state  
**Recommended when adding tests later**: Vitest, React Testing Library, Playwright, MSW

## Cart Actions Reference (`app/routes/cart.tsx`)

| Action                                 | Method                          | Notes                                  |
| -------------------------------------- | ------------------------------- | -------------------------------------- |
| `CartForm.ACTIONS.LinesAdd`            | `cart.addLines()`               | Add line items                         |
| `CartForm.ACTIONS.LinesUpdate`         | `cart.updateLines()`            | Update quantities / attributes         |
| `CartForm.ACTIONS.LinesRemove`         | `cart.removeLines()`            | Remove line items                      |
| `CartForm.ACTIONS.DiscountCodesUpdate` | `cart.updateDiscountCodes()`    | Replace all discount codes             |
| `CartForm.ACTIONS.GiftCardCodesUpdate` | `cart.updateGiftCardCodes()`    | Replace all gift card codes            |
| `CartForm.ACTIONS.GiftCardCodesAdd`    | `cart.addGiftCardCodes()`       | Append gift card codes (2026.1.0+)     |
| `CartForm.ACTIONS.GiftCardCodesRemove` | `cart.removeGiftCardCodes()`    | Remove applied gift card codes         |
| `CartForm.ACTIONS.NoteUpdate`          | `cart.updateNote()`             | Update cart note                       |
| `CartForm.ACTIONS.BuyerIdentityUpdate` | `cart.updateBuyerIdentity()`    | Update buyer country / customer        |

## Repository

**Commits**: Conventional prefixes preferred: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`, `perf:`  
**Before Push**: `npm run typecheck`, `npm run lint`, `npm run codegen` after GraphQL changes  
**Code Review**: Read comments before editing; preserve intent and constraints

## Environment

**Node.js**: `>= 20.19.0`  
**Env Vars** (`.env`):

```bash
SESSION_SECRET=<32chars>                        # Required
PUBLIC_STORE_DOMAIN=<store>.myshopify.com      # Required in real store mode
PUBLIC_STOREFRONT_API_TOKEN=<token>            # Required in real store mode
PUBLIC_GTM_CONTAINER_ID=GTM-XXXXXXX            # Optional
```

**Fallback Demo Store (Cloudflare Workers, Local Dev, and Portfolio Showcase ONLY):**

> ⚠️ Used during local development and Cloudflare Workers portfolio deployments. **NEVER use on Oxygen / client deployments.**

```bash
PUBLIC_STOREFRONT_API_TOKEN=586d8fd7c598fea7e1b97a8eff48ed49
PUBLIC_STORE_DOMAIN=horcrux-demo-store.myshopify.com
PUBLIC_CHECKOUT_DOMAIN=horcrux-demo-store.myshopify.com
PRIVATE_STOREFRONT_API_TOKEN=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
PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID=d59946cb-1d27-415f-bb8e-c8ea32ffb5eb
PUBLIC_CUSTOMER_ACCOUNT_API_URL=https://shopify.com/66049638586
SHOP_ID=66049638586
```

For portfolio Workers deploys, demo-store credentials live in `wrangler.jsonc`. UI and content defaults are currently embedded in `app/lib/metaobject-parsers.ts` rather than a separate fallback-data module.

**Setup**: `npm install && npm run codegen && npm run dev`

## Key Files

**Architecture**: `app/lib/context.ts` (Hydrogen Context Factory — creates the per-request storefront, cart, session, and i18n context; called from `server.ts` on every request), `app/lib/metaobject-queries.ts`, `app/lib/metaobject-parsers.ts` (parsers + fallbacks for all content types — site settings, product, cart, account, search, UI messages, error, wishlist; `parseSiteContent`, `parseShopBrand`), `app/lib/metaobject-fragments.ts`, `app/lib/data-source.ts`, `app/lib/site-content-context.tsx`, `app/lib/color/`, `app/lib/wishlist-context.tsx`, `app/lib/wishlist-utils.ts`, `app/lib/recently-viewed.ts`, `app/lib/LenisProvider.tsx` (note: component in `lib/`, not `components/`), `app/lib/cart-utils.ts` (cart mutation key + `useCartMutationPending` hook for global state + `useCartLineMutating(lineId)` for per-line mutation state), `app/lib/social-share.tsx` (social sharing toolkit — Web Share API, Facebook, X, WhatsApp, Pinterest, clipboard), `app/lib/fragments.ts` (shared GraphQL fragments and cross-route queries — `CART_QUERY_FRAGMENT`, `MENU_COLLECTIONS_QUERY`, `SIDEBAR_COLLECTIONS_QUERY`), `app/lib/promise-utils.ts` (`withTimeoutAndFallback` for deferred data with graceful timeouts + `TIMEOUT_DEFAULTS` named constants), `app/lib/store-locale.ts` (template config — locale, country, i18n settings; update per client deployment; drives currency formatter and sitemap locale), `app/lib/shipping.ts` (`parseShippingConfig` — parses free shipping threshold + currency from shop metafields), `app/lib/popularSearches.ts` (`extractPopularSearchTerms` — derives popular search terms from product/collection catalog data), `app/lib/discounts.ts` (`countDiscountedProducts`, `LightweightProduct` — discount analysis and badge count utilities), `app/lib/seo.ts` (`generateWebsiteSchema`, `getSeoDefaults` — JSON-LD schema generation and SEO defaults derived from site content), `app/lib/currency-formatter.ts` (`CurrencyFormatter` singleton, `formatPrice`, `formatShopifyMoney`, `formatPriceRange` — locale-aware currency formatting via `Intl.NumberFormat` with symbol fallback; used by all price display components), `app/lib/pricing-analysis.ts` (`analyzeProductPricing`, `PriceDisplayStrategy` — determines optimal price display strategy for product cards based on variant price uniformity and compare-at price availability; drives badge and range display logic), `app/lib/blog-utils.ts` (`calculateReadingTime`, `formatArticleDate`, `createArticleShareData`, `findRelatedArticles` — blog article processing; used across blog routes and components), `app/lib/product-tags.ts` (`hasSpecialTag`, `getSpecialTags`, `filterDisplayTags`, `getButtonLabel`, `sortWithPinnedFirst` — centralized detection for `pin`, `premium`, `preorder`, `newArrival` special tags; drives badges, CTA labels, and collection sort order), `app/lib/size-chart.ts` (size chart type system — `GarmentCategory`, `SizeRegion`, `SizeConversion`; used by PDP size chart component), `app/lib/collections.ts` (`COLLECTION_PATTERNS`, `buildCollectionTabs` — categorizes collections by handle pattern and builds tab navigation with empty-collection fallback; used by homepage collection tabs), `app/lib/collection-route-helpers.ts` (`parsePaginationParams`, `buildPaginationVariables`, `buildPaginationData`, `getCanonicalRedirect` — cursor-based pagination utilities for collection routes), `app/lib/legacy-redirect.ts` (`redirectLegacyProductUrl` — catches two-segment URLs not matching known route prefixes and redirects legacy Shopify handles via Storefront API lookup), `app/lib/media-utils.ts` (`extractImagesFromMedia`, `FlatImage` — extracts flat image arrays from Shopify product media union types, eliminating the redundant `images` field)
**Config**: `vite.config.ts`, `react-router.config.ts`, `eslint.config.js`, `prettier.config.js`, `app/styles/app.css`, `wrangler.jsonc`
**GraphQL**: `storefrontapi.generated.d.ts`, `customer-accountapi.generated.d.ts`
**Types**: `types.d.ts` (centralized hand-written type definitions — component prop types, utility types, shared interfaces; GraphQL-generated types remain in `*.generated.d.ts`)
**Theme System**: `app/lib/theme-utils.ts` (semantic theme engine — `generateTheme()` is the public entry point; derives a full OKLCH semantic color scheme + CSS variables from brand seed colors; `resolveTheme()` is the lower-level variant accepting raw seed inputs directly), `app/lib/theme-storage.ts`, `app/root.tsx`, `app/styles/app.css`
**PWA/Offline**: `app/components/OfflineAwareErrorPage.tsx`, `app/routes/manifest[.]webmanifest.tsx`, `app/routes/offline.tsx`, `public/sw.js` (Workbox 7 — routing, caching, offline fallback), `public/workbox-v7/` (self-hosted Workbox runtime, generated by `prebuild`), `app/lib/pwa-parsers.ts`, `app/lib/pwa-queries.ts`, `app/lib/pwa-storage.ts`
**Changelog**: `app/lib/changelog-data.ts` (entry source of truth), `app/routes/changelog.tsx` (public-facing route)
**Sitemap**: `app/routes/sitemap[.]custom[.]xml.tsx` (custom sitemap for routes outside Shopify's generated sitemap index — `/faq`, `/gallery`, `/sale`, `/changelog`, `/wishlist`)
**Session**: `app/lib/session.ts` (`AppSession` — custom cookie-based Hydrogen session; stores cart ID, customer tokens, and flash messages; lazy-commit pattern with cookies encrypted via `SESSION_SECRET`; implements `HydrogenSession`)
**Navigation**: `app/lib/navigation.ts` (`NAVIGATION_LINKS`, `POLICY_LINKS`, `DEVELOPER_CONFIG` — site-wide nav and footer link constants; update per client deployment), `app/lib/navigation-icons.ts` (`navigationIcons`, `specialCollectionIcons` — Lucide icon maps keyed by route path for nav items and special collection pages), `app/lib/collection-icons.ts` (`getCollectionIcon()` — maps a collection to a Lucide icon via handle pattern matching; used in collection cards and navigation)
**Search & Filtering**: `app/lib/search.ts` (`PredictiveSearchReturn`, `getEmptyPredictiveSearchResult()`, `urlWithTrackingParams()` — predictive search return types and URL construction with Shopify tracking params for search analytics), `app/lib/search-utils.ts` (`filterProducts()`, `filterCollections()`, `filterPolicies()`, `policyPages` — client-side filtering helpers for instant search results; includes `policyPages` registry for policy-aware search), `app/lib/sort-filter-helpers.ts` (`SORT_OPTIONS`, `DEFAULT_SORT`, `getSortOption()`, `parseSortFilterParams()`, `SEARCH_SORT_OPTIONS`, `SEARCH_DEFAULT_SORT` — sort/filter URL param parsing shared by collection and search routes; note: collection pages use `ProductCollectionSortKeys`, search uses `SearchSortKeys`)
**Product Utilities**: `app/lib/variants.ts` (`useVariantUrl()`, `getVariantUrl()` — encode selected variant options as URL query params; handle locale prefixes; used by PDP option selectors), `app/lib/product-sorting.ts` (`sortProductsByPrice()`, `sortProductsByDiscount()` — client-side product array sort by price or discount amount)
**Account Utilities**: `app/lib/order-status.ts` (`getOrderStatusVariant()`, `formatOrderStatus()` — returns shadcn badge variant and human-readable label for Shopify order/fulfillment status values), `app/lib/orderFilters.ts` (`buildOrderSearchQuery()`, `parseOrderFilters()`, `ORDER_FILTER_FIELDS` — builds Shopify Customer Account API query strings for filtering customer orders by status, date range, etc.)
**UI & Layout**: `app/lib/utils.ts` (`cn()`, `truncateText()` — shadcn className merge utility + text truncation; `cn` is used throughout the codebase), `app/lib/gridColumns.ts` (`GridColumns`, `getValidColumnsForScreenSize()`, `getDefaultColumnsForScreenSize()`, `getGridClassName()` — responsive grid column management for product listing views; constrains column options per breakpoint), `app/lib/color-name-map.ts` (`getColorHex()`, `isColorOption()`, `getSwatchFromColorName()` — maps CSS and English color names to hex values for variant color swatch rendering), `app/lib/gallery.ts` (`GalleryImageData`, `GalleryPageInfo`, `transformToGalleryImages()` — types and cursor-pagination transformer for the gallery route), `app/lib/smoothScroll.ts` (`SMOOTH_SCROLL` config object, `initSmoothScroll()` — Lenis smooth scroll configuration and factory; consumed by `LenisProvider.tsx`)
**Infrastructure**: `app/lib/rate-limit.ts` (`createRateLimiter()`, `getClientIP()`, `getRateLimitResponse()` — in-memory sliding-window rate limiter for API routes; per-isolate only, not globally shared across Workers instances), `app/lib/redirect.ts` (`redirectIfHandleIsLocalized()` — issues a redirect when the URL handle differs from the localized resource handle returned by Shopify), `app/lib/policy.ts` (`parsePolicySections()` — parses Shopify shop policy HTML into structured sections for the policy page layout component)
**General Utilities**: `app/lib/number-utils.ts` (`NumberUtils` singleton + convenience exports — `clamp`, `roundToDecimals`, `calculateSavings`, `calculatePercentage`, `ensurePositive`, `ensureInteger`), `app/lib/string-utils.ts` (`kebabToCamelCase()`), `app/lib/debounce.ts` (generic `debounce<T>()` — delays function execution; used by search inputs and scroll handlers), `app/lib/text-format.ts` (`parseMarkdownLinks()` — converts markdown-style `[text](url)` links in plain strings to HTML anchor tags; used for rendering CMS text with embedded links)

## Critical Warnings

**1. React Router Imports**

- **Problem**: `@remix-run/react` causes runtime and compatibility issues
- **Solution**: Always import from `react-router`

**2. GraphQL Codegen**

- **Problem**: Stale generated types after query or fragment changes
- **Solution**: Run `npm run codegen` after ANY GraphQL modification

**3. Theme and Contrast**

- **Problem**: Hardcoded colors drift from semantic tokens and break contrast
- **Solution**: Use semantic theme tokens from `app/styles/app.css` and `app/lib/theme-utils.ts`

**4. Metaobject Fallbacks**

- **Problem**: Missing CMS data can break pages
- **Solution**: Keep fallbacks aligned in `app/lib/metaobject-parsers.ts`

**5. Offline/Cache Behavior**

- **Problem**: Cached UI can hold stale content after changes
- **Solution**: Review service worker and offline flows when touching PWA behavior

**6. Node Version**

- **Problem**: Node < 20.19.0 causes build/runtime issues
- **Solution**: Use the required version and confirm via `node --version`

**7. Path Alias**

- **Problem**: Relative imports create churn and inconsistency
- **Solution**: Always use `~/`

## Execution Strategy

- Use **multiple sub-agents** for independent tasks (research, implementation, review)
- Use **git worktrees** for parallel implementation work
- Provide agents with **context, constraints, and objectives** — not overly prescriptive step-by-step instructions
- Quality priorities: **clarity > technical correctness > practical usefulness > context density > signal over noise**

## Code Comments (MANDATORY)

Read all comments before editing. Update comments when changing behavior. Add concise comments where logic, constraints, or intent are not obvious.

## Accessibility (MANDATORY)

### Contrast Ratios

| Content                      | Minimum | WCAG        |
| ---------------------------- | ------- | ----------- |
| Normal text                  | 4.5:1   | 1.4.3 (AA)  |
| Large text (≥18pt/14pt bold) | 3:1     | 1.4.3 (AA)  |
| UI components                | 3:1     | 1.4.11 (AA) |
| Touch targets                | 44x44px | 2.5.5 (A)   |

**Color System**: OKLCH-based tokens live in `app/styles/app.css`, with theme derivation in `app/lib/theme-utils.ts`.

---

## Cleanup (MANDATORY)

- **MANDATORY CLEANUP**: After every successful task implementation, if the `tmp_screenshots/` directory was created during the work, it must be deleted before the task is considered complete. Do not skip this step — it is a hard requirement.
- **MANDATORY CLEANUP**: After every successful task implementation, if the `.playwright-mcp/` directory exists in the project root, it must be deleted before the task is considered complete. This directory is created by the Playwright MCP server during browser automation and is a transient artifact that must not persist in the codebase. Do not skip this step — it is a hard requirement.

## Changelog Entries (MANDATORY)

Every meaningful commit — one that adds a feature, improves the shopping experience, or fixes something users would notice — **MUST** include a corresponding entry in `app/lib/changelog-data.ts`.

**Rules:**
- Add the entry in the **same commit** that ships the change (never as a follow-up)
- Place the new entry at the **top** of `CHANGELOG_ENTRIES` (newest first)
- Write in plain English for shoppers — no SHAs, file paths, variable names, branch names, or technical jargon
- Use the correct category: `"New Feature"` | `"Improvement"` | `"Fix"` | `"Maintenance"` | `"Performance"`
- Keep `headline` under 80 characters, focused on the user benefit

**Skip entries for:** `chore`, `ci`, `build`, `docs`, `lint`, dependency bumps, internal refactors with no visible user effect, and commits under ~20 lines changed.

**Do NOT rely on automation or AI to generate entries retroactively.** The entry must be written at commit time by the person who understands the change. Context is lost after the fact.
