export const WISHLIST_STORAGE_KEY = "storefront_001-wishlist";

export const extractNumericId = (gid: string): string => {
    const parts = gid.split("/");
    return parts[parts.length - 1];
};

export const reconstructGid = (numericId: string): string => {
    return `gid://shopify/Product/${numericId}`;
};

export const getWishlistIds = (): string[] => {
    if (typeof window === "undefined") {
        return [];
    }

    try {
        const stored = localStorage.getItem(WISHLIST_STORAGE_KEY);
        if (!stored) {
            return [];
        }

        const parsed = JSON.parse(stored);
        if (!Array.isArray(parsed)) {
            localStorage.removeItem(WISHLIST_STORAGE_KEY);
            return [];
        }

        return parsed.filter(id => typeof id === "string");
    } catch (error) {
        console.error("Error reading wishlist from localStorage:", error);
        return [];
    }
};

export const setWishlistIds = (ids: string[]): void => {
    if (typeof window === "undefined") {
        return;
    }

    try {
        localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(ids));
    } catch (error) {
        if (error instanceof DOMException && error.name === "QuotaExceededError") {
            console.warn("localStorage quota exceeded, cannot save wishlist");
        } else {
            console.error("Error saving wishlist to localStorage:", error);
        }
    }
};

export const addToWishlist = (numericId: string): string[] => {
    const currentIds = getWishlistIds();

    if (currentIds.includes(numericId)) {
        return currentIds;
    }

    const updatedIds = [...currentIds, numericId];
    setWishlistIds(updatedIds);
    return updatedIds;
};

export const removeFromWishlist = (numericId: string): string[] => {
    const currentIds = getWishlistIds();
    const updatedIds = currentIds.filter(id => id !== numericId);

    setWishlistIds(updatedIds);
    return updatedIds;
};

export const isInWishlist = (numericId: string): boolean => {
    const currentIds = getWishlistIds();
    return currentIds.includes(numericId);
};

export const clearWishlist = (): void => {
    if (typeof window === "undefined") {
        return;
    }

    try {
        localStorage.removeItem(WISHLIST_STORAGE_KEY);
    } catch (error) {
        console.error("Error clearing wishlist from localStorage:", error);
    }
};

export const getWishlistCount = (): number => {
    return getWishlistIds().length;
};

export const toggleWishlist = (
    numericId: string
): {
    ids: string[];
    added: boolean;
} => {
    const currentIds = getWishlistIds();
    const isCurrentlyInWishlist = currentIds.includes(numericId);

    let updatedIds: string[];
    if (isCurrentlyInWishlist) {
        updatedIds = currentIds.filter(id => id !== numericId);
    } else {
        updatedIds = [...currentIds, numericId];
    }

    setWishlistIds(updatedIds);

    return {
        ids: updatedIds,
        added: !isCurrentlyInWishlist
    };
};
