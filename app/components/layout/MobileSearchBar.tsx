import {Search} from "lucide-react";
import {useIsMobile} from "~/hooks/useIsMobile";
import {usePointerCapabilities} from "~/hooks/usePointerCapabilities";
import {cn} from "~/lib/utils";
import {useSearchController} from "~/hooks/useSearchController";

type MobileSearchBarProps = {
    shopName: string;
};

export const MobileSearchBar = ({shopName}: MobileSearchBarProps) => {
    const isMobile = useIsMobile();
    const {canHover} = usePointerCapabilities();
    const {openSearch} = useSearchController();

    if (!isMobile) return null;

    return (
        <div className="mobile-search-bar px-2 py-2">
            <button
                type="button"
                className={cn(
                    "border-[var(--border-subtle)] bg-[var(--surface-interactive)] text-foreground focus-visible:ring-[var(--focus-ring)] motion-press sleek relative flex h-12 w-full select-none items-center justify-start gap-3 rounded-lg border-2 px-4 py-3 text-sm font-medium shadow-sm backdrop-blur-sm focus-visible:ring-[3px] focus-visible:ring-offset-1 active:scale-[var(--motion-press-scale)]",
                    canHover
                        ? "hover:bg-[var(--brand-accent-subtle)] hover:border-[var(--border-strong)]"
                        : "active:bg-[var(--brand-accent-subtle)] active:border-[var(--border-strong)]"
                )}
                onClick={event => openSearch(event.currentTarget)}
            >
                <Search className="text-primary h-5 w-5 shrink-0" />
                <span className="flex-1 truncate text-left">{shopName ? `Search ${shopName}` : "Search"}</span>
                <kbd className="bg-[var(--brand-primary-subtle)] text-[var(--text-secondary)] pointer-events-none hidden h-6 items-center gap-1 rounded border border-[var(--border-subtle)] px-2 font-mono text-xs font-medium opacity-100 sm:flex">
                    <span className="text-xs">{"\u2318"}</span>K
                </kbd>
            </button>
        </div>
    );
};
