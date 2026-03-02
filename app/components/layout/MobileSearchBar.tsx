import {Search} from "lucide-react";
import {useIsMobile} from "~/hooks/useIsMobile";
import {useSearchController} from "~/hooks/useSearchController";

type MobileSearchBarProps = {
    shopName: string;
};

export const MobileSearchBar = ({shopName}: MobileSearchBarProps) => {
    const isMobile = useIsMobile();
    const {openSearch} = useSearchController();

    if (!isMobile) return null;

    return (
        <div className="mobile-search-bar px-2 py-2">
            <button
                type="button"
                className="border-border bg-accent/20 hover:bg-accent hover:text-accent-foreground text-foreground hover:border-primary focus-visible:ring-primary/50 sleek relative flex h-12 w-full items-center justify-start gap-3 rounded-lg border-2 px-4 py-3 text-sm font-medium shadow-sm backdrop-blur-sm focus-visible:ring-[3px] focus-visible:ring-offset-1"
                onClick={event => openSearch(event.currentTarget)}
            >
                <Search className="text-primary h-5 w-5 shrink-0" />
                <span className="flex-1 truncate text-left">{shopName ? `Search ${shopName}` : "Search"}</span>
                <kbd className="bg-primary/10 text-primary/70 pointer-events-none hidden h-6 items-center gap-1 rounded border px-2 font-mono text-xs font-medium opacity-100 sm:flex">
                    <span className="text-xs">{"\u2318"}</span>K
                </kbd>
            </button>
        </div>
    );
};
