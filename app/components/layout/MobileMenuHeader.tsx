import {Search} from "lucide-react";
import {useSearchController} from "~/hooks/useSearchController";

type MobileMenuHeaderProps = {
    shopName: string;
    onClose?: () => void;
};

export const MobileMenuHeader = ({shopName, onClose}: MobileMenuHeaderProps) => {
    const {openSearch} = useSearchController();

    return (
        <div className="mb-6">
            <button
                type="button"
                className="border-[var(--border-subtle)] bg-[var(--surface-interactive)] hover:bg-[var(--brand-accent-subtle)] text-foreground hover:border-[var(--border-strong)] focus-visible:ring-[var(--focus-ring)] sleek relative flex h-12 w-full select-none items-center justify-start gap-3 rounded-lg border-2 px-4 py-3 text-sm font-medium shadow-sm backdrop-blur-sm focus-visible:ring-[3px] focus-visible:ring-offset-1"
                onClick={event => {
                    openSearch(event.currentTarget);
                    onClose?.();
                }}
            >
                <Search className="text-primary h-5 w-5 shrink-0" />
                <span className="flex-1 truncate text-left">{shopName ? `Search ${shopName}` : "Search"}</span>
            </button>
        </div>
    );
};
