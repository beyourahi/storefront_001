import {createContext, useContext, useState, useEffect, useMemo, useCallback, type ReactNode} from "react";
import {
    WISHLIST_STORAGE_KEY,
    getWishlistIds,
    extractNumericId,
    addToWishlist,
    removeFromWishlist,
    clearWishlist,
    toggleWishlist
} from "./wishlist-utils";

interface WishlistContextValue {
    wishlistIds: string[];
    addItem: (productGid: string) => void;
    removeItem: (productGid: string) => void;
    toggleItem: (productGid: string) => boolean;
    isWishlisted: (productGid: string) => boolean;
    clearAll: () => void;
    count: number;
}

const WishlistContext = createContext<WishlistContextValue | undefined>(undefined);

interface WishlistProviderProps {
    children: ReactNode;
}

export const WishlistProvider = ({children}: WishlistProviderProps) => {
    const [wishlistIds, setWishlistIdsState] = useState<string[]>([]);

    useEffect(() => {
        const ids = getWishlistIds();
        setWishlistIdsState(ids);
    }, []);

    useEffect(() => {
        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === WISHLIST_STORAGE_KEY) {
                try {
                    const newIds = event.newValue ? JSON.parse(event.newValue) : [];
                    if (Array.isArray(newIds)) {
                        setWishlistIdsState(newIds.filter((id): id is string => typeof id === "string"));
                    }
                } catch (error) {
                    console.error("Error parsing storage event:", error);
                }
            }
        };

        window.addEventListener("storage", handleStorageChange);
        return () => window.removeEventListener("storage", handleStorageChange);
    }, []);

    const addItem = useCallback((productGid: string) => {
        const numericId = extractNumericId(productGid);
        const updatedIds = addToWishlist(numericId);
        setWishlistIdsState(updatedIds);
    }, []);

    const removeItem = useCallback((productGid: string) => {
        const numericId = extractNumericId(productGid);
        const updatedIds = removeFromWishlist(numericId);
        setWishlistIdsState(updatedIds);
    }, []);

    const toggleItem = useCallback((productGid: string): boolean => {
        const numericId = extractNumericId(productGid);
        const {ids, added} = toggleWishlist(numericId);
        setWishlistIdsState(ids);
        return added;
    }, []);

    const isWishlisted = useCallback(
        (productGid: string): boolean => {
            const numericId = extractNumericId(productGid);
            return wishlistIds.includes(numericId);
        },
        [wishlistIds]
    );

    const clearAll = useCallback(() => {
        clearWishlist();
        setWishlistIdsState([]);
    }, []);

    const contextValue = useMemo(
        () => ({
            wishlistIds,
            addItem,
            removeItem,
            toggleItem,
            isWishlisted,
            clearAll,
            count: wishlistIds.length
        }),
        [wishlistIds, addItem, removeItem, toggleItem, isWishlisted, clearAll]
    );

    return <WishlistContext.Provider value={contextValue}>{children}</WishlistContext.Provider>;
};

export const useWishlist = (): WishlistContextValue => {
    const context = useContext(WishlistContext);

    if (context === undefined) {
        throw new Error("useWishlist must be used within WishlistProvider");
    }

    return context;
};
