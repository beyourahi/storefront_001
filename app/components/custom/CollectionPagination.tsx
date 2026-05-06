import {useNavigate, useLocation} from "react-router";
import {ChevronLeft, ChevronRight} from "lucide-react";
import {Button} from "~/components/ui/button";
import {cn} from "~/lib/utils";
import {useCallback} from "react";

type CollectionPaginationProps = {
    currentPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    nextCursor: string | null;
    previousCursor: string | null;
    inline?: boolean;
};

/**
 * Cursor-based paginator for collection routes. Encodes `cursor` and `direction`
 * as URL search params so the loader can resume from the correct Shopify page-info
 * cursor. Page 1 removes all cursor params to reset to a clean URL.
 * Scrolls to the top of the page on every navigation.
 */
export const CollectionPagination = ({
    currentPage,
    hasNextPage,
    hasPreviousPage,
    nextCursor,
    previousCursor,
    inline = false
}: CollectionPaginationProps) => {
    const navigate = useNavigate();
    const location = useLocation();

    const handlePageChange = useCallback(
        (direction: "forward" | "backward") => {
            const params = new URLSearchParams(location.search);
            const newPage = direction === "forward" ? currentPage + 1 : currentPage - 1;

            // For page 1, remove cursor and direction params
            if (newPage <= 1) {
                params.delete("page");
                params.delete("cursor");
                params.delete("direction");
            } else {
                // Set page number
                params.set("page", String(newPage));

                // Set cursor and direction for pagination
                const cursor = direction === "forward" ? nextCursor : previousCursor;
                if (cursor) {
                    params.set("cursor", cursor);
                    params.set("direction", direction);
                } else {
                    params.delete("cursor");
                    params.delete("direction");
                }
            }

            void navigate(`?${params.toString()}`);
            window.scrollTo({top: 0, behavior: "smooth"});
        },
        [currentPage, nextCursor, previousCursor, navigate, location.search]
    );

    return (
        <nav
            aria-label="Collection pagination"
            className={cn("flex items-center justify-center gap-4", !inline && "py-4")}
        >
            <Button
                variant="ghost"
                size="default"
                disabled={!hasPreviousPage}
                onClick={() => handlePageChange("backward")}
                aria-label="Previous page"
                className="gap-2 rounded-full px-5 shadow-md transition-all duration-200 hover:shadow-lg disabled:opacity-40 disabled:hover:shadow-md"
            >
                <ChevronLeft className="size-4" />
                <span className="text-sm font-medium">Previous</span>
            </Button>

            <div className="flex size-12 items-center justify-center rounded-full border border-neutral-200 bg-neutral-50/50 shadow-sm">
                <span className="text-base font-semibold tracking-wide text-neutral-700">{currentPage}</span>
            </div>

            <Button
                variant="ghost"
                size="default"
                disabled={!hasNextPage}
                onClick={() => handlePageChange("forward")}
                aria-label="Next page"
                className="gap-2 rounded-full px-5 shadow-md transition-all duration-200 hover:shadow-lg disabled:opacity-40 disabled:hover:shadow-md"
            >
                <span className="text-sm font-medium">Next</span>
                <ChevronRight className="size-4" />
            </Button>
        </nav>
    );
};
