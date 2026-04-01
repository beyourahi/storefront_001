import {useSearchParams, useNavigate} from "react-router";
import {useCallback} from "react";
import {ArrowUpDown} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "~/components/ui/select";
import {Checkbox} from "~/components/ui/checkbox";
import {Label} from "~/components/ui/label";
import {SORT_OPTIONS, DEFAULT_SORT, DEFAULT_IN_STOCK_ONLY} from "~/lib/sort-filter-helpers";

type SortFilterBarProps = {
    /** Currently active sort value (URL param) */
    currentSort: string;
    /** Whether the "In Stock Only" filter is active */
    showInStockOnly: boolean;
    /** Total number of products displayed (optional) */
    totalProducts?: number;
};

/**
 * Sort dropdown + availability filter for collection pages.
 *
 * State lives entirely in URL search params — changing a value navigates
 * to the same path with updated params (resetting pagination to page 1).
 */
export function SortFilterBar({currentSort, showInStockOnly, totalProducts}: SortFilterBarProps) {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    /**
     * Build a new search-param string that preserves non-pagination params
     * while resetting pagination back to page 1.
     */
    const buildUrl = useCallback(
        (overrides: Record<string, string | null>) => {
            const params = new URLSearchParams(searchParams);

            // Reset pagination when sort/filter changes
            params.delete("page");
            params.delete("cursor");
            params.delete("direction");

            for (const [key, value] of Object.entries(overrides)) {
                if (value === null) {
                    params.delete(key);
                } else {
                    params.set(key, value);
                }
            }

            // Remove defaults to keep URLs clean
            if (params.get("sort") === DEFAULT_SORT) {
                params.delete("sort");
            }
            if (params.get("available") === String(DEFAULT_IN_STOCK_ONLY)) {
                params.delete("available");
            }

            const qs = params.toString();
            return qs ? `?${qs}` : "";
        },
        [searchParams]
    );

    const handleSortChange = useCallback(
        (value: string) => {
            void navigate(buildUrl({sort: value}));
        },
        [navigate, buildUrl]
    );

    const handleAvailabilityChange = useCallback(
        (checked: boolean | "indeterminate") => {
            const isChecked = checked === true;
            void navigate(buildUrl({available: String(isChecked)}));
        },
        [navigate, buildUrl]
    );

    return (
        <div className="mx-auto max-w-[2000px] px-2 md:px-4">
            <div className="flex flex-wrap items-center justify-between gap-3 py-3">
                {/* Left: product count */}
                <div className="flex items-center gap-3">
                    {totalProducts !== undefined && (
                        <p className="text-muted-foreground text-sm">
                            {totalProducts} {totalProducts === 1 ? "product" : "products"}
                        </p>
                    )}
                </div>

                {/* Right: sort + filter controls */}
                <div className="flex flex-wrap items-center gap-4">
                    {/* In Stock Only toggle */}
                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="in-stock-filter"
                            checked={showInStockOnly}
                            onCheckedChange={handleAvailabilityChange}
                            aria-label="Show in-stock products only"
                        />
                        <Label
                            htmlFor="in-stock-filter"
                            className="cursor-pointer select-none text-sm font-normal text-foreground"
                        >
                            In Stock Only
                        </Label>
                    </div>

                    {/* Sort dropdown */}
                    <div className="flex items-center gap-2">
                        <ArrowUpDown className="text-muted-foreground hidden size-4 sm:block" aria-hidden="true" />
                        <Select value={currentSort} onValueChange={handleSortChange}>
                            <SelectTrigger
                                size="sm"
                                className="w-[180px] text-sm"
                                aria-label="Sort products"
                            >
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                                {SORT_OPTIONS.map(option => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>
        </div>
    );
}
