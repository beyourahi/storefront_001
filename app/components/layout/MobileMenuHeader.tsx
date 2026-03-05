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
                className="border-border bg-accent/20 hover:bg-accent hover:text-accent-foreground text-foreground hover:border-primary focus-visible:ring-primary/50 sleek relative flex h-12 w-full select-none items-center justify-start gap-3 rounded-lg border-2 px-4 py-3 text-sm font-medium shadow-sm backdrop-blur-sm focus-visible:ring-[3px] focus-visible:ring-offset-1"
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
