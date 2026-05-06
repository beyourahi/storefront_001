import {useState, useEffect, useCallback, useMemo} from "react";

export interface RecentlyViewedProduct {
    id: string;
    handle: string;
    timestamp: number;
    title: string;
    imageUrl: string | null;
    imageAlt: string | null;
    price: string;
    compareAtPrice?: string;
}

/** Legacy format from before data enrichment — only had id, handle, timestamp */
interface LegacyRecentlyViewedProduct {
    id: string;
    handle: string;
    timestamp: number;
}

export interface AddProductParams {
    id: string;
    handle: string;
    title: string;
    imageUrl: string | null;
    imageAlt: string | null;
    price: string;
    compareAtPrice?: string;
}

interface RecentlyViewedConfig {
    storageKey: string;
    maxProducts: number;
    expiryDays: number;
}

const DEFAULT_CONFIG: RecentlyViewedConfig = {
    storageKey: "shopify-recently-viewed",
    maxProducts: 16,
    expiryDays: 30
};

const isBrowser = typeof window !== "undefined";

function isLegacyProduct(product: unknown): product is LegacyRecentlyViewedProduct {
    if (!product || typeof product !== "object") return false;
    const p = product as Record<string, unknown>;
    return typeof p.id === "string" && !("title" in p);
}

function isFullProduct(product: unknown): product is RecentlyViewedProduct {
    if (!product || typeof product !== "object") return false;
    const p = product as Record<string, unknown>;
    return (
        typeof p.id === "string" &&
        p.id.length > 0 &&
        typeof p.handle === "string" &&
        p.handle.length > 0 &&
        typeof p.timestamp === "number" &&
        typeof p.title === "string" &&
        typeof p.price === "string"
    );
}

function loadFromStorage(config: RecentlyViewedConfig): RecentlyViewedProduct[] {
    if (!isBrowser) return [];

    try {
        const stored = localStorage.getItem(config.storageKey);
        if (stored) {
            const parsed = JSON.parse(stored) as unknown[];
            if (Array.isArray(parsed)) {
                const expiryTime = config.expiryDays * 24 * 60 * 60 * 1000;
                const now = Date.now();

                // Filter out legacy entries (old format without title/price)
                // and expired entries
                return parsed.filter(
                    (product): product is RecentlyViewedProduct =>
                        !isLegacyProduct(product) && isFullProduct(product) && now - product.timestamp <= expiryTime
                );
            }
        }
    } catch {
        // Silent fail
    }
    return [];
}

function persistToStorage(items: RecentlyViewedProduct[], config: RecentlyViewedConfig) {
    if (!isBrowser) return;

    try {
        const dataToSave = JSON.stringify(items);
        localStorage.setItem(config.storageKey, dataToSave);

        const maxCookieSize = 3500;
        const cookieData = dataToSave.length <= maxCookieSize ? dataToSave : JSON.stringify(items.slice(0, 6));

        document.cookie = `${config.storageKey}=${encodeURIComponent(cookieData)}; path=/; max-age=${60 * 60 * 24 * config.expiryDays}; SameSite=Lax`;
    } catch {
        // Silent fail
    }
}

/**
 * Manage the recently-viewed product list persisted in `localStorage`.
 *
 * Also writes a cookie mirror (max 3.5 KB ≈ 6 products) so server-side loaders
 * can read the list without waiting for client hydration. Legacy entries that
 * predate the title/price enrichment are silently dropped on first load.
 *
 * @param config - Storage key, max product count, and expiry window (defaults fine for most uses)
 */
export function useRecentlyViewed(config: RecentlyViewedConfig = DEFAULT_CONFIG) {
    const [products, setProducts] = useState<RecentlyViewedProduct[]>([]);
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        const stored = loadFromStorage(config);
        setProducts(stored);
        setIsHydrated(true);
    }, [config]);

    const addProduct = useCallback(
        (params: AddProductParams) => {
            if (!isBrowser || !params.id || !params.handle) return;

            const currentProducts = loadFromStorage(config);
            const now = Date.now();
            const existingIndex = currentProducts.findIndex(p => p.id === params.id);

            const productData: RecentlyViewedProduct = {
                id: params.id,
                handle: params.handle,
                timestamp: now,
                title: params.title,
                imageUrl: params.imageUrl,
                imageAlt: params.imageAlt,
                price: params.price,
                compareAtPrice: params.compareAtPrice
            };

            let newProducts: RecentlyViewedProduct[];

            if (existingIndex !== -1) {
                const updated = [...currentProducts];
                updated.splice(existingIndex, 1);
                newProducts = [productData, ...updated];
            } else {
                newProducts = [productData, ...currentProducts];

                if (newProducts.length > config.maxProducts) {
                    newProducts = newProducts.slice(0, config.maxProducts);
                }
            }

            persistToStorage(newProducts, config);
            setProducts(newProducts);
        },
        [config]
    );

    const removeProduct = useCallback(
        (id: string) => {
            if (!isBrowser) return;

            const currentProducts = loadFromStorage(config);
            const newProducts = currentProducts.filter(p => p.id !== id);
            persistToStorage(newProducts, config);
            setProducts(newProducts);
        },
        [config]
    );

    const clear = useCallback(() => {
        if (!isBrowser) return;

        setProducts([]);
        persistToStorage([], config);
        document.cookie = `${config.storageKey}=; path=/; max-age=0`;
    }, [config]);

    const hasProduct = useCallback((id: string) => products.some(p => p.id === id), [products]);

    const productIds = useMemo(() => products.map(p => p.id), [products]);
    const productHandles = useMemo(() => products.map(p => p.handle), [products]);

    return useMemo(
        () => ({
            products,
            productIds,
            productHandles,
            count: products.length,
            hasProducts: products.length > 0,
            isHydrated,
            addProduct,
            removeProduct,
            clear,
            hasProduct
        }),
        [products, productIds, productHandles, isHydrated, addProduct, removeProduct, clear, hasProduct]
    );
}

/**
 * Parse the recently-viewed product list from a raw `Cookie` request header.
 * Used in server-side loaders (e.g., the affinity tool bridge) to access the
 * list before client hydration. Returns at most 10 products (cookie budget).
 */
export function parseRecentlyViewedFromCookie(
    cookieHeader: string | null,
    config: RecentlyViewedConfig = DEFAULT_CONFIG
): RecentlyViewedProduct[] {
    if (!cookieHeader) return [];

    try {
        const cookies = cookieHeader.split(";").reduce(
            (acc, cookie) => {
                const [key, value] = cookie.trim().split("=");
                if (key && value) {
                    acc[key] = decodeURIComponent(value);
                }
                return acc;
            },
            {} as Record<string, string>
        );

        const recentlyViewedData = cookies[config.storageKey];
        if (!recentlyViewedData) return [];

        const parsed = JSON.parse(recentlyViewedData) as unknown[];
        if (!Array.isArray(parsed)) return [];

        const now = Date.now();
        const expiryTime = config.expiryDays * 24 * 60 * 60 * 1000;

        return parsed
            .filter(
                (item): item is RecentlyViewedProduct =>
                    item != null &&
                    typeof item === "object" &&
                    !isLegacyProduct(item) &&
                    isFullProduct(item) &&
                    now - item.timestamp < expiryTime
            )
            .slice(0, 10);
    } catch {
        return [];
    }
}

/**
 * Convenience wrapper: extract just the product GIDs from the cookie.
 * Used by the `lookup_catalog` agent tool to resolve recently-viewed products.
 */
export function getRecentlyViewedIds(
    cookieHeader: string | null,
    config: RecentlyViewedConfig = DEFAULT_CONFIG
): string[] {
    const products = parseRecentlyViewedFromCookie(cookieHeader, config);
    return products.map(p => p.id);
}
