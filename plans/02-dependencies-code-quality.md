# Plan: Dependencies, Code Quality, & Cleanup

## Summary

Addresses 13 audit items covering unnecessary dependencies (next-themes, react-icons, react-router-dom), duplicate component directories, missing memoization causing unnecessary re-renders, pervasive `any` type usage eroding type safety, and an incorrect GTM cart event tracking implementation. These items share the theme of code quality and maintainability -- none are user-facing bugs, but they increase bundle size, hurt performance, and create maintenance burden.

## Items Covered

| # | Description | File | Category |
|---|---|---|---|
| 85 | `sonner.tsx` imports `useTheme` from `next-themes` (Next.js package) | `app/components/ui/sonner.tsx:2` | Wrong dependency |
| 86 | `next-themes` is a production dependency in a non-Next.js project | `package.json:47` | Unnecessary dep |
| 87 | `react-icons` (~3MB) used in only 5 files; `lucide-react` used in 90+ | `package.json:50` | Bloated dep |
| 88 | `react-router-dom` listed as separate dependency | `package.json:53` | Unnecessary dep |
| 89 | `app/components/policy/` and `app/components/legal/` overlap | Both directories | Duplicate code |
| 90 | `PolicyContentSection` exists in two locations | `sections/` and `legal/` | Duplicate code |
| 91 | `useGeneratedTheme()` calls `generateTheme()` every render without `useMemo` | `site-content-context.tsx:106-109` | Performance |
| 92 | `RecentlyViewedProvider` passes new object reference as context value every render | `RecentlyViewedProvider.tsx:20-22` | Performance |
| 93 | 132 total `any` type usages across 31 files | Codebase-wide | Type safety |
| 94 | `product-card-normalizers.ts` -- 22 `any` usages | `app/lib/product/` | Type safety |
| 95 | `metaobject-parsers.ts` -- 19 `any` usages | `app/lib/` | Type safety |
| 96 | `optimisticCart as any` cast bypasses cart type checking | `cart.tsx:160` | Type safety |
| 110 | GTM cart event uses total quantity comparison for add/remove detection | `GoogleTagManager.tsx:85-86` | Incorrect logic |

## Current State

### Dependencies

**`next-themes` (v0.4.6):** Used only in `app/components/ui/sonner.tsx` line 2 for `useTheme`. This is a Next.js-specific package. In a Hydrogen project, theme management uses a custom system (`app/lib/theme-utils.ts`, `app/lib/site-content-context.tsx`). The `useTheme` call is used by the Sonner toast library to match toast styling to the current theme.

**`react-icons` (v5.5.0, ~3MB):** Used in only 5 files:
- `app/components/WishlistButton.tsx`
- `app/components/layout/MobileMenuSettings.tsx`
- `app/components/WishlistCount.tsx`
- `app/routes/wishlist.share.tsx`
- `app/routes/account.wishlist.tsx`

The project already uses `lucide-react` (v0.563.0) in 90+ files. All react-icons imports can be replaced with lucide-react equivalents.

**`react-router-dom` (v7.12.0):** In React Router 7, `react-router-dom` is re-exported from `react-router`. The project correctly imports from `react-router` everywhere. The `react-router-dom` dependency is unused and can be removed.

### Duplicate Components

Two directories contain overlapping policy/legal components:

**`app/components/legal/`:**
- LegalPageHero.tsx
- LegalPageLayout.tsx
- PolicyContentSection.tsx
- PolicyPageWithTOC.tsx
- PolicySectionCard.tsx
- PolicySectionsGrid.tsx
- PolicyTableOfContents.tsx

**`app/components/policy/`:**
- PolicyPageWithTOC.tsx
- PolicySectionCard.tsx
- PolicySectionsGrid.tsx
- PolicyTableOfContents.tsx

**`app/components/sections/`:**
- PolicyContentSection.tsx (third copy)

Need to determine which directory is canonical (likely `legal/` since it has the most files) and update all imports.

### Performance Issues

**`useGeneratedTheme()` in `app/lib/site-content-context.tsx` lines 106-109:**
```typescript
export const useGeneratedTheme = (): GeneratedTheme | null => {
    const themeConfig = useThemeConfig();
    return generateTheme(themeConfig.colors, themeConfig.fonts, themeConfig.borderRadius);
};
```
`generateTheme()` performs OKLCH color transformations -- computationally non-trivial. Called on every render of any component that consumes this hook.

**`RecentlyViewedProvider` in `app/components/RecentlyViewedProvider.tsx` lines 20-22:**
```typescript
const recentlyViewed = useRecentlyViewed();
return <RecentlyViewedContext.Provider value={recentlyViewed}>{children}</RecentlyViewedContext.Provider>;
```
`useRecentlyViewed()` likely returns a new object on every call, causing all context consumers to re-render even if the underlying data hasn't changed.

### Type Safety

132 `any` usages across 31 files. The worst offenders:
- `product-card-normalizers.ts`: 22 `any` -- all normalization functions accept `any` instead of typed Storefront API response types
- `metaobject-parsers.ts`: 19 `any` -- all parser functions accept `any` instead of typed metaobject fields
- `cart.tsx:160`: `optimisticCart as any` bypasses the Hydrogen cart type

### GTM Cart Event

`app/components/GoogleTagManager.tsx` lines 85-86: Uses total item quantity comparison (`currTotal > prevTotal`) to decide between `add_to_cart` and `remove_from_cart` events. This is incorrect when items are both added and removed simultaneously (e.g., replacing one item with another). The event should compare individual line items, not totals.

## Target State

- `next-themes` removed; Sonner toast uses the project's own theme system or a simple hardcoded theme
- `react-icons` removed; all 5 files use `lucide-react` equivalents
- `react-router-dom` removed from `package.json`
- Single `app/components/legal/` directory for all policy/legal components; `policy/` directory deleted
- `useGeneratedTheme()` memoized with `useMemo`
- `RecentlyViewedProvider` context value memoized
- Most critical `any` usages replaced with proper types (at minimum: product-card-normalizers.ts and cart.tsx)
- GTM cart events correctly detect added vs removed line items

## Implementation Approach

### Phase 1: Remove `next-themes` (Items 85, 86)

**File:** `app/components/ui/sonner.tsx`

The Sonner toast component uses `useTheme` from `next-themes` to get the current theme mode. In this project, the theme is managed via `app/lib/site-content-context.tsx` and CSS variables.

**Option A (simplest):** Replace `useTheme` with a hardcoded theme or CSS-variable-based detection:
```typescript
// Remove: import { useTheme } from "next-themes"
// Replace with:
const theme = "light"; // or detect from CSS: document.documentElement.classList.contains("dark") ? "dark" : "light"
```

**Option B:** Use the project's theme context:
```typescript
import { useThemeConfig } from "~/lib/site-content-context";
const themeConfig = useThemeConfig();
// Map themeConfig to "light" | "dark" | "system"
```

After updating, remove `next-themes` from `package.json`:
```bash
bun remove next-themes
```

### Phase 2: Replace `react-icons` with `lucide-react` (Item 87)

**5 files to update.** For each file, find the react-icons import and replace with the lucide-react equivalent.

Common mappings:
- `FaHeart` (Font Awesome) → `Heart` from lucide-react
- `FaRegHeart` → `Heart` with `fill="none"`
- `FaShareAlt` → `Share2`
- `IoMdSettings` → `Settings`
- `FiTrash` → `Trash2`

Check each import in the 5 files, find the exact icons used, and map to lucide-react:
1. `app/components/WishlistButton.tsx`
2. `app/components/layout/MobileMenuSettings.tsx`
3. `app/components/WishlistCount.tsx`
4. `app/routes/wishlist.share.tsx`
5. `app/routes/account.wishlist.tsx`

After updating all imports:
```bash
bun remove react-icons
```

### Phase 3: Remove `react-router-dom` (Item 88)

```bash
bun remove react-router-dom
```

Verify no imports reference `react-router-dom`:
```bash
grep -r "react-router-dom" app/ --include="*.ts" --include="*.tsx"
```

### Phase 4: Consolidate Policy Components (Items 89, 90)

**Step 1:** Determine which version of each duplicate is canonical. Read both versions, check git blame for which is newer/more complete.

**Step 2:** Keep `app/components/legal/` as the canonical directory (it has more files and includes the legal-specific components like `LegalPageHero` and `LegalPageLayout`).

**Step 3:** Delete `app/components/policy/` entirely.

**Step 4:** Delete `app/components/sections/PolicyContentSection.tsx`.

**Step 5:** Update all imports across the codebase:
```typescript
// Before: import { PolicyPageWithTOC } from "~/components/policy/PolicyPageWithTOC"
// After:  import { PolicyPageWithTOC } from "~/components/legal/PolicyPageWithTOC"
```

Search for all imports from `~/components/policy/` and `~/components/sections/PolicyContentSection` and redirect to `~/components/legal/`.

### Phase 5: Memoization Fixes (Items 91, 92)

#### 5a. `useGeneratedTheme()` (`app/lib/site-content-context.tsx` lines 106-109)

```typescript
import { useMemo } from "react";

export const useGeneratedTheme = (): GeneratedTheme | null => {
    const themeConfig = useThemeConfig();
    return useMemo(
        () => generateTheme(themeConfig.colors, themeConfig.fonts, themeConfig.borderRadius),
        [themeConfig.colors, themeConfig.fonts, themeConfig.borderRadius]
    );
};
```

#### 5b. `RecentlyViewedProvider` (`app/components/RecentlyViewedProvider.tsx` lines 20-22)

Read `useRecentlyViewed()` to understand its return type, then memoize:
```typescript
import { useMemo } from "react";

export function RecentlyViewedProvider({children}: {children: ReactNode}) {
    const recentlyViewed = useRecentlyViewed();
    const memoizedValue = useMemo(() => recentlyViewed, [
        recentlyViewed.products,
        recentlyViewed.addProduct,
        // ... stable references from the hook
    ]);
    return <RecentlyViewedContext.Provider value={memoizedValue}>{children}</RecentlyViewedContext.Provider>;
}
```

Note: If `useRecentlyViewed()` returns functions created with `useCallback`, those references will be stable and the memo will work correctly. If it returns new function references each render, those functions need `useCallback` wrapping first.

### Phase 6: GTM Cart Event Fix (Item 110)

**File:** `app/components/GoogleTagManager.tsx` lines 72-111

Current logic compares total quantities. This fails when items are both added and removed simultaneously.

**Fix:** Compare individual line items between `prevCart` and `cart`:

```typescript
subscribe("cart_updated", data => {
    const prevNodes = /* prevCart lines */;
    const currNodes = /* cart lines */;

    // Build maps of lineId -> quantity
    const prevMap = new Map(prevNodes.map(l => [l.id, Number(l.quantity) || 0]));
    const currMap = new Map(currNodes.map(l => [l.id, Number(l.quantity) || 0]));

    // Detect added items (new lines or increased quantity)
    const addedItems = currNodes.filter(l => {
        const prevQty = prevMap.get(l.id) || 0;
        return (Number(l.quantity) || 0) > prevQty;
    });

    // Detect removed items (deleted lines or decreased quantity)
    const removedItems = prevNodes.filter(l => {
        const currQty = currMap.get(l.id) || 0;
        return currQty < (Number(l.quantity) || 0);
    });

    if (addedItems.length > 0) {
        window.dataLayer?.push({event: "add_to_cart", ecommerce: {items: /* addedItems */}});
    }
    if (removedItems.length > 0) {
        window.dataLayer?.push({event: "remove_from_cart", ecommerce: {items: /* removedItems */}});
    }
});
```

### Phase 7: Type Safety Improvements (Items 93-96)

This is the largest phase. Prioritize the worst offenders.

#### 7a. `product-card-normalizers.ts` (Item 94, 22 `any`)

The normalizer functions accept raw Storefront API data. Create proper types from the generated `storefrontapi.generated.d.ts`:

```typescript
import type {ProductCardFragment} from "storefrontapi.generated";

// Replace: function normalizeProduct(product: any)
// With:    function normalizeProduct(product: ProductCardFragment)
```

Map each normalizer function to the appropriate generated type. The exact fragment names depend on which GraphQL fragments feed into these normalizers -- check the imports and query associations.

#### 7b. `metaobject-parsers.ts` (Item 95, 19 `any`)

Metaobject parsers receive raw Shopify metaobject field data. Create typed interfaces for the metaobject field structure:

```typescript
interface MetaobjectField {
    key: string;
    value: string | null;
    type: string;
    reference?: {
        __typename: string;
        // ...
    } | null;
    references?: {
        nodes: Array<{/* ... */}>;
    } | null;
}
```

Replace `any` in parser function signatures with `MetaobjectField | null`.

#### 7c. `cart.tsx:160` (Item 96)

Replace `optimisticCart as any` with the correct Hydrogen cart type. Check what `useOptimisticCart` returns and what the component expects.

#### 7d. Remaining `any` (Item 93)

The remaining ~91 `any` usages across 28 other files should be addressed incrementally. For this plan, focus on the 3 worst offenders above (41 of 132 total). Create a follow-up ticket for the remaining 91.

## Constraints

- `lucide-react` icon API differs from `react-icons` -- check prop names (`size` vs `fontSize`, `strokeWidth`, etc.)
- `sonner.tsx` is in `components/ui/` which is normally auto-generated by shadcn -- this is an exception where editing is necessary because the import is project-specific
- Memoization deps must be stable references -- if `useRecentlyViewed` returns new function references each render, those functions need `useCallback` first
- Generated types from `storefrontapi.generated.d.ts` are the source of truth for product/collection types -- use them directly
- Consolidating policy components requires updating ALL import paths across the codebase
- GTM event fix must maintain GA4 ecommerce event format compliance

## Execution Order

1. **Phase 3** (remove react-router-dom) -- zero risk, one command
2. **Phase 1** (remove next-themes) -- low risk, one file + package removal
3. **Phase 2** (replace react-icons) -- moderate effort, 5 files
4. **Phase 5** (memoization) -- two small changes, immediate perf benefit
5. **Phase 4** (consolidate policy) -- moderate effort, many import updates
6. **Phase 6** (GTM fix) -- single file, but needs careful logic
7. **Phase 7** (type safety) -- largest phase, do last

Phases 1-3 are dependency removals (independent, can parallel). Phases 4-7 are code quality (independent, can parallel).

## Parallelism Notes

This plan is independent from all other plans except:
- **Overlap with Plan: UI/Rendering** on `package.json` (that plan may change React Router version; this plan removes `react-router-dom`). Coordinate package.json changes.
- **Overlap with Plan: SEO** -- no file conflicts.
- **Overlap with Plan: Security** -- no file conflicts.
- **Overlap with Plan: GraphQL Performance** -- no file conflicts.

All phases within this plan are independent and can execute in parallel.

## Verification

1. **Dependencies:** `bun install` succeeds, `bun run build` succeeds, no runtime errors
2. **react-icons removal:** Verify all 5 files render their icons correctly (visual check)
3. **next-themes removal:** Verify Sonner toasts still display correctly
4. **Policy consolidation:** `grep -r "components/policy" app/` returns no results
5. **Memoization:** React DevTools Profiler -- verify `useGeneratedTheme` consumers don't re-render unnecessarily
6. **GTM events:** Add item, remove item, replace item -- verify correct `add_to_cart`/`remove_from_cart` events in `window.dataLayer`
7. **Type safety:** `bun run typecheck` passes with zero errors
8. **Build size:** Compare `bun run build` output size before/after -- expect ~3MB reduction from react-icons removal
