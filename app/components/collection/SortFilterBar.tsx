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
import {SORT_OPTIONS, DEFAULT_SORT, type SortOption} from "~/lib/sort-filter-helpers";

type SortFilterBarProps = {
    /** Currently active sort value (URL param) */
    currentSort: string;
    /** Total number of products displayed (optional) */
    totalProducts?: number;
    /** Override sort options (defaults to SORT_OPTIONS for collections) */
    options?: SortOption[];
    /** Override the default sort value for URL-cleaning logic */
    defaultSortValue?: string;
};

/**
 * Sort dropdown for collection pages.
 *
 * State lives entirely in URL search params — changing a value navigates
 * to the same path with updated params (resetting pagination to page 1).
 */
export function SortFilterBar({currentSort, totalProducts, options = SORT_OPTIONS, defaultSortValue = DEFAULT_SORT}: SortFilterBarProps) {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    /**
     * Build a new search-param string that preserves non-pagination params
     * while resetting pagination back to page 1.
     */
    const buildUrl = useCallback(
        (overrides: Record<string, string | null>) => {
            const params = new URLSearchParams(searchParams);

            // Reset pagination when sort changes
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

            // Remove default to keep URLs clean
            if (params.get("sort") === defaultSortValue) {
                params.delete("sort");
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

                {/* Right: sort control */}
                <div className="flex flex-wrap items-center gap-4">
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
                                {options.map(option => (
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
