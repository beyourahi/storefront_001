import {createContext, useContext, type ReactNode} from "react";
import {useRecentlyViewed, type AddProductParams, type RecentlyViewedProduct} from "~/hooks/useRecentlyViewed";

interface RecentlyViewedContextValue {
    products: RecentlyViewedProduct[];
    productIds: string[];
    productHandles: string[];
    count: number;
    hasProducts: boolean;
    isHydrated: boolean;
    addProduct: (params: AddProductParams) => void;
    removeProduct: (id: string) => void;
    clear: () => void;
    hasProduct: (id: string) => boolean;
}

const RecentlyViewedContext = createContext<RecentlyViewedContextValue | null>(null);

export function RecentlyViewedProvider({children}: {children: ReactNode}) {
    const recentlyViewed = useRecentlyViewed();

    return <RecentlyViewedContext.Provider value={recentlyViewed}>{children}</RecentlyViewedContext.Provider>;
}

export function useRecentlyViewedContext(): RecentlyViewedContextValue {
    const context = useContext(RecentlyViewedContext);
    if (!context) {
        throw new Error("useRecentlyViewedContext must be used within a RecentlyViewedProvider");
    }
    return context;
}
