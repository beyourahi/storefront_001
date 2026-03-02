import * as React from "react";

type SearchControllerContextValue = {
    open: boolean;
    openSearch: (trigger?: HTMLElement | null) => void;
    closeSearch: () => void;
    setOpen: (open: boolean) => void;
    restoreTriggerFocus: () => void;
};

const SearchControllerContext = React.createContext<SearchControllerContextValue | null>(null);

export function SearchControllerProvider({children}: {children: React.ReactNode}) {
    const [open, setOpen] = React.useState(false);
    const triggerRef = React.useRef<HTMLElement | null>(null);

    const openSearch = React.useCallback((trigger?: HTMLElement | null) => {
        if (trigger) {
            triggerRef.current = trigger;
        }
        setOpen(true);
    }, []);

    const closeSearch = React.useCallback(() => {
        setOpen(false);
    }, []);

    const restoreTriggerFocus = React.useCallback(() => {
        triggerRef.current?.focus();
    }, []);

    const value = React.useMemo(
        () => ({
            open,
            openSearch,
            closeSearch,
            setOpen,
            restoreTriggerFocus
        }),
        [open, openSearch, closeSearch, restoreTriggerFocus]
    );

    return <SearchControllerContext.Provider value={value}>{children}</SearchControllerContext.Provider>;
}

export function useSearchControllerContext() {
    const context = React.useContext(SearchControllerContext);
    if (!context) {
        throw new Error("useSearchControllerContext must be used within SearchControllerProvider");
    }
    return context;
}
