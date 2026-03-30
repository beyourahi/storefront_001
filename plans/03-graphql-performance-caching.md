# Plan: GraphQL Performance & Caching

## Summary

Addresses 20 audit items covering two systemic issues: (1) massive GraphQL overfetching — queries requesting 250 products/variants where 10-50 suffice, with nested fetches multiplying to 25,000-62,500 nodes per page load; and (2) universal `CacheNone()` misuse on queries returning data that changes at most every few minutes, defeating Hydrogen's entire cache layer. Together these cause every page to make uncached requests fetching orders of magnitude more data than needed.

## Items Covered

| # | Description | File | Category |
|---|---|---|---|
| 65 | `EXPLORE_COLLECTIONS_QUERY` fetches `products(first: 250)` per collection to count items | `_index.tsx:340` | Overfetch |
| 66 | `ALL_PRODUCTS_QUERY` fetches `products(first: 250)` with full data on homepage | `_index.tsx:407` | Overfetch |
| 67 | `SIDEBAR_COLLECTIONS_QUERY` fetches `products(first: 250)` per collection (50 cols) | `products.$handle.tsx:650` | Overfetch |
| 68 | Collections index fetches `collections(first: 250)` with `products(first: 250)` each | `collections._index.tsx:225` | Overfetch |
| 69 | Collection page fetches 250 products per page | `collections.$handle.tsx:76` | Overfetch |
| 70 | All Products fetches 250 products per page | `collections.all-products.tsx:41` | Overfetch |
| 71 | Sale page fetches 250 products per page | `sale.tsx:41` | Overfetch |
| 72 | Gallery fetches 250 products with 250 images each | `gallery.tsx:24` | Overfetch |
| 73 | Root `MENU_COLLECTIONS_QUERY` fetches `products(first: 250)` per collection on every page | `fragments.ts:463` | Overfetch |
| 74 | Collection product fragment fetches `variants(first: 100)` in 250-product page | `collections.$handle.tsx:302` | Overfetch |
| 75 | `PRODUCT_FRAGMENT` fetches `variants(first: 100)` duplicating variant data | `products.$handle.tsx:531` | Overfetch |
| 76 | Theme settings query uses `CacheNone()` | `root.tsx:134` | Cache |
| 77 | Site content query uses `CacheNone()` | `root.tsx:138` | Cache |
| 78 | Collection page query uses `CacheNone()` | `collections.$handle.tsx:92` | Cache |
| 79 | Collections index query uses `CacheNone()` | `collections._index.tsx:96` | Cache |
| 80 | All products query uses `CacheNone()` | `collections.all-products.tsx:48` | Cache |
| 81 | Sale page query uses `CacheNone()` | `sale.tsx:49` | Cache |
| 82 | Product + sidebar queries use `CacheNone()` | `products.$handle.tsx:105-108` | Cache |
| 83 | Recommendations query uses `CacheNone()` | `products.$handle.tsx:177` | Cache |
| 84 | `isLoggedIn()` called twice in `loadDeferredData` | `root.tsx:250,253` | Duplicate call |

## Current State

### Overfetching Scale

| Route | Query | Current Fetch | Max Nodes |
|---|---|---|---|
| Every page (root) | `MENU_COLLECTIONS_QUERY` | 50 cols x 250 products + 250 allProducts x 10 variants | ~15,000 |
| Homepage | `EXPLORE_COLLECTIONS_QUERY` | 20 cols x 250 products | ~5,000 |
| Homepage | `ALL_PRODUCTS_QUERY` | 250 products x 10 variants x 5 images | ~5,000 |
| PDP | `SIDEBAR_COLLECTIONS_QUERY` | 50 cols x 250 products + 250 allProducts x 10 variants | ~15,000 |
| PDP | `PRODUCT_FRAGMENT` | 100 variants (redundant with selectedVariant) | 100 |
| Collections index | `COLLECTIONS_PAGE_QUERY` | 250 cols x 250 products + 250 allProducts x 10 variants | ~65,000 |
| Collection page | Collection query | 250 products x 100 variants | ~25,000 |
| All Products | Catalog query | 250 products x 100 variants | ~25,000 |
| Sale | Sale query | 250 products x 250 variants | ~62,500 |
| Gallery | Gallery query | 250 products x 250 images | ~62,500 |

### Cache Misuse

Every query listed above (plus theme, site content, recommendations) uses `CacheNone()`. The Hydrogen demo-store (`~/Desktop/projects/demo-store`) uses `CacheLong()` for layout/menu data and default `CacheShort()` for product data. `CacheNone()` is not used anywhere in the demo-store.

Hydrogen cache strategies:
- `CacheShort()` — 1s stale-while-revalidate, 10s max-age (default when no cache specified)
- `CacheLong()` — 1h max-age, 23h stale-while-revalidate
- `CacheNone()` — bypass cache entirely (appropriate for cart mutations, customer data)

### Duplicate `isLoggedIn()` Call

`root.tsx` lines 250 and 253 both call `customerAccount.isLoggedIn()`. Each call hits the customer account session check. Should be stored in a single promise and reused.

## Target State

- **Overfetch reduction**: ~260,000 nodes/page-load → ~3,000 nodes/page-load (combined across all routes)
- **Cache**: All product/collection/content queries use `CacheShort()` or `CacheLong()` as appropriate
- **Duplicate call**: Single `isLoggedIn()` promise reused
- **All queries still functional**: Components consuming the data work correctly with reduced datasets

## Implementation Approach

### Phase 1: Root Loader (`app/root.tsx`, `app/lib/fragments.ts`) — Highest Impact

**Every page load** triggers these queries. Fixing them has the broadest performance impact.

#### 1a. `MENU_COLLECTIONS_QUERY` in `app/lib/fragments.ts` (Item 73)

**Lines ~463-509.** This query currently fetches `products(first: 250)` per collection with fields `id, title, productType, availableForSale`, plus `allProducts: products(first: 250)` with `variants(first: 10)`.

**Changes:**
- Inner `products(first: 250)` → `products(first: 1, filters: [{available: true}])` — only need to check if collection has any available products. Reduces from 250 to 1 product per collection.
- `allProducts: products(first: 250)` → `allProducts: products(first: 50)` — used for popular search terms, discount count, and popular products carousel. 50 is sufficient.
- `variants(first: 10)` → `variants(first: 3)` on allProducts — only price/compareAtPrice/availableForSale are read. 3 variants covers discount detection.

**Update consuming code in `root.tsx` lines 158-218:**
- `productsCount` computation: change from `.filter(p => p.availableForSale).length` to `.length > 0 ? 1 : 0` (boolean-ish). The sidebar and nav only use this to show/hide collections.

**Node reduction:** ~15,000 → ~200 per page load.

#### 1b. Cache fixes in `app/root.tsx` (Items 76, 77)

- **Line 134:** `THEME_SETTINGS_QUERY` — change `CacheNone()` → `CacheLong()`. Theme data changes extremely rarely.
- **Line 138:** `SITE_CONTENT_QUERY` — change `CacheNone()` → `CacheLong()`. Site content metaobjects are admin-configured, change infrequently.

Also add explicit caching to queries that currently use Hydrogen defaults:
- **Line 123-125:** `HEADER_QUERY` — add `{cache: dataAdapter.CacheLong()}`. Menus change rarely.
- **Line 126-129:** `MENU_COLLECTIONS_QUERY` — add `{cache: dataAdapter.CacheShort()}`. Product availability changes more frequently.
- **Line 130-132:** `SHOP_SHIPPING_CONFIG_QUERY` — add `{cache: dataAdapter.CacheLong()}`.
- **Line 142-145:** `HAS_BLOG_QUERY` — add `{cache: dataAdapter.CacheLong()}`.

#### 1c. Duplicate `isLoggedIn()` fix (Item 84)

**Lines 250, 253.** Store in a single promise:
```typescript
const isLoggedInPromise = customerAccount.isLoggedIn();
const isLoggedIn = withTimeoutAndFallback(isLoggedInPromise, false, TIMEOUT_DEFAULTS.AUTH);
const hasStoreCredit: Promise<boolean> = isLoggedInPromise.then(async loggedIn => { ... });
```

### Phase 2: Homepage (`app/routes/_index.tsx`)

#### 2a. `EXPLORE_COLLECTIONS_QUERY` (Item 65, lines ~340-349)

- `products(first: 250)` → `products(first: 1, filters: [{available: true}])` — only used to check existence of available products.
- Update `exploreCollections` mapping at lines 139-145 to handle the reduced shape.
- **Node reduction:** ~5,000 → ~20.

#### 2b. `ALL_PRODUCTS_QUERY` (Item 66, lines ~407-444)

- `products(first: 250)` → `products(first: 50)` — homepage carousel shows ~10 products, 50 provides buffer for filtering.
- `variants(first: 10)` → `variants(first: 3)` — only need price/compareAtPrice.
- `images(first: 5)` → `images(first: 2)` — product cards show at most 2 images.
- **Node reduction:** ~5,000 → ~300.

### Phase 3: PDP (`app/routes/products.$handle.tsx`)

#### 3a. Eliminate `SIDEBAR_COLLECTIONS_QUERY` (Item 67, lines ~650-678)

This query is nearly identical to `MENU_COLLECTIONS_QUERY` from the root loader. After Phase 1 fixes the root query, **remove `SIDEBAR_COLLECTIONS_QUERY` entirely** and read the data from root loader via `useRouteLoaderData("root")` in the component.

- Delete the query definition (lines ~633-678)
- Remove the `sidebarData` query call from `loadCriticalData` (around line 108)
- In the component, access `rootData.menuCollections`, `rootData.totalProductCount`, `rootData.discountCount`
- **Node reduction:** ~15,000 → 0 (eliminated entirely).

If the sidebar requires distinct data from root (unlikely based on code review), as fallback: reduce `products(first: 250)` → `products(first: 1, filters: [{available: true}])` and `allProducts` → `products(first: 50)` with `variants(first: 3)`.

#### 3b. `PRODUCT_FRAGMENT` variants (Item 75, lines ~531-544)

- `variants(first: 100)` → `variants(first: 10)`. The variants are used only for discount percentage calculation. `priceRange`/`compareAtPriceRange` on the product already provide min/max prices. 10 variants is more than sufficient.
- **Node reduction:** 100 → 10.

#### 3c. `RECOMMENDED_PRODUCT_FRAGMENT` (lines ~680-738)

- `variants(first: 100)` → `variants(first: 3)`. Product cards need 1-2 variants for pricing.
- `images(first: 10)` → `images(first: 2)`. Cards show at most 2 images.

#### 3d. Cache fixes (Items 82, 83)

- **Line 105:** `PRODUCT_QUERY` — change `CacheNone()` → `CacheShort()`. Product data needs freshness but not zero-caching.
- **Line 108:** `SIDEBAR_COLLECTIONS_QUERY` — remove entirely (see 3a), or change `CacheNone()` → `CacheShort()`.
- **Line 177:** `RECOMMENDATIONS_QUERY` — change `CacheNone()` → `CacheShort()`.

### Phase 4: Collections Index (`app/routes/collections._index.tsx`)

#### 4a. Query overfetch (Item 68, lines ~220-318)

- `collections(first: 250)` → `collections(first: 50)`. Most stores have <50 collections.
- Inner `products(first: 250)` → `products(first: 1, filters: [{available: true}])`. Only used for availability check.
- `allProducts` `variants(first: 10)` → `variants(first: 3)`.
- Remove unused fields from allProducts: `images(first: 5)` (never consumed), `seo`, `selectedOptions`, `quantityAvailable` on variants.
- Update `countInStockCollectionProducts` at line 66 to handle reduced shape.
- **Node reduction:** ~65,000 → ~200.

#### 4b. Cache fix (Item 79, line 96)

Change `CacheNone()` → `CacheShort()`.

### Phase 5: Collection Detail (`app/routes/collections.$handle.tsx`)

#### 5a. Page size (Item 69, line 76)

Change `buildPaginationVariables(cursor, direction, 250)` → `buildPaginationVariables(cursor, direction, 48)`. Standard e-commerce pagination.

#### 5b. Variant overfetch (Item 74, lines ~302-324)

`variants(first: 100)` → `variants(first: 10)`. Product cards in a grid need at most 10 variants for price/swatch display. With 48 products: 480 vs 25,000 nodes.

#### 5c. Cache fix (Item 78, line 92)

Change `CacheNone()` → `CacheShort()`.

### Phase 6: All Products (`app/routes/collections.all-products.tsx`)

#### 6a. Page size (Item 70, line 41)

Change `buildPaginationVariables(cursor, direction, 250)` → `buildPaginationVariables(cursor, direction, 48)`.

#### 6b. Variant overfetch (line ~186)

`variants(first: 100)` → `variants(first: 10)`.

#### 6c. Cache fix (Item 80, line 48)

Change `CacheNone()` → `CacheShort()`.

### Phase 7: Sale Page (`app/routes/sale.tsx`)

#### 7a. Page size + variants (Item 71)

- Line 41: Change `250` → `48` in pagination.
- `SALE_PRODUCT_FRAGMENT`: `variants(first: 250)` → `variants(first: 20)`. Sale page needs more variants than grid cards because it calculates discount percentages across variants. 20 is sufficient.

#### 7b. Cache fix (Item 81, line 49)

Change `CacheNone()` → `CacheShort()`.

### Phase 8: Gallery (`app/routes/gallery.tsx`)

#### 8a. Overfetch (Item 72)

- `products(first: 250)` → `products(first: 100)`. 100 products with multiple images is plenty for a gallery.
- `images(first: 250)` → `images(first: 10)`. Most products have 5-10 images.
- Add explicit `{cache: dataAdapter.CacheShort()}`.
- **Node reduction:** ~62,500 → ~1,000.

### Phase 9: API Product Route (`app/routes/api.products.$handle.tsx`)

Change `CacheNone()` at line 16 → `CacheShort()`.

### Phase 10: Post-Change Steps

1. **Run codegen:** `bun run codegen` — every GraphQL query change regenerates `storefrontapi.generated.d.ts`
2. **TypeScript check:** `bun run typecheck` — verify no type errors from changed query shapes
3. **Visual verification:** Test every affected page in browser

## Constraints

- All GraphQL changes require `bun run codegen` afterward — generated types must stay in sync
- Reducing `products(first: N)` may require updating components that iterate over the results — verify each consuming component
- `CacheShort()` on product pages means ~10s staleness for inventory — acceptable per Hydrogen defaults
- `CacheLong()` on theme/content means ~1h delay for admin changes — acceptable for template products
- The `filters: [{available: true}]` Storefront API filter must be verified against the current API version (2026-01)
- Sidebar elimination (Phase 3a) requires verifying that root loader data provides everything the PDP sidebar needs

## Execution Order

Phases 1-8 are ordered by impact but mostly independent. Phase 1 (root loader) should be done first because Phase 3a depends on it (PDP sidebar reads root data). Phase 10 (codegen) must be last.

**Dependency chain:** Phase 1 → Phase 3a (sidebar elimination depends on root data being available). All other phases are independent.

## Parallelism Notes

This plan is independent from all other plans except:
- **Overlap with Plan: SEO/Meta** — both modify `app/root.tsx`. The SEO plan adds meta exports; this plan changes cache strategies and the `isLoggedIn` call. These changes are in different functions and don't conflict.
- **Overlap with Plan: UI/Rendering** — both may modify `app/routes/collections.$handle.tsx`. This plan changes the query; the UI plan may change the rendering. Non-conflicting.

Within this plan, Phases 2-8 can execute in parallel after Phase 1 is complete. Use separate worktrees if desired.

## Verification

After all changes + `bun run codegen`:

1. **Homepage:** Discounted products carousel renders, collections section shows collections, recently viewed works
2. **PDP:** Variant selection works, pricing correct, sidebar collections populate, recommendations load
3. **Collection pages:** Product grid loads with pagination at 48 items, filters work
4. **Collections index:** All collections show with availability indicators
5. **Sale page:** Discount percentages display correctly
6. **Gallery:** Images display in masonry grid
7. **Search overlay:** Popular products and terms populate
8. **Nav:** Collections dropdown populates correctly
9. **Performance:** Compare Storefront API response sizes before/after in DevTools Network tab — expect 90%+ reduction
