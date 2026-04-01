/**
 * Sort and filter helpers for collection routes.
 *
 * Maps URL search params to Shopify ProductCollectionSortKeys + reverse flag,
 * and provides the canonical list of sort options shown in the SortFilterBar.
 */

export type SortOption = {
    /** Value stored in the URL `?sort=` param */
    value: string;
    /** Human-readable label */
    label: string;
    /** Shopify ProductCollectionSortKeys enum value */
    sortKey: string;
    /** Whether results are reversed (descending) */
    reverse: boolean;
};

/** Ordered list of sort options displayed in the dropdown. */
export const SORT_OPTIONS: SortOption[] = [
    {value: "price-asc", label: "Price: Low to High", sortKey: "PRICE", reverse: false},
    {value: "price-desc", label: "Price: High to Low", sortKey: "PRICE", reverse: true},
    {value: "newest", label: "Newest", sortKey: "CREATED", reverse: true},
    {value: "best-selling", label: "Best Selling", sortKey: "BEST_SELLING", reverse: false},
    {value: "title-asc", label: "A \u2192 Z", sortKey: "TITLE", reverse: false},
    {value: "title-desc", label: "Z \u2192 A", sortKey: "TITLE", reverse: true}
];

/** Default sort when no `?sort=` param is present */
export const DEFAULT_SORT = "price-asc";

/** Default availability filter — true means "show in-stock only" */
export const DEFAULT_IN_STOCK_ONLY = true;

/**
 * Look up a SortOption by its URL value, falling back to the default.
 */
export function getSortOption(sortParam: string | null): SortOption {
    const match = SORT_OPTIONS.find(o => o.value === sortParam);
    return match ?? SORT_OPTIONS.find(o => o.value === DEFAULT_SORT)!;
}

/**
 * Parse sort and filter params from a request URL.
 */
export function parseSortFilterParams(url: URL) {
    const sortParam = url.searchParams.get("sort");
    const availableParam = url.searchParams.get("available");

    const sortOption = getSortOption(sortParam);

    // "available" param: "true" or absent → in-stock only; "false" → show all
    const showInStockOnly = availableParam !== "false";

    return {
        sort: sortOption.value,
        sortKey: sortOption.sortKey,
        reverse: sortOption.reverse,
        sortLabel: sortOption.label,
        showInStockOnly
    };
}
