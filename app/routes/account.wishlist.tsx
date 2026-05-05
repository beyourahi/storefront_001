import {useState, useEffect, useMemo, useRef} from "react";
import {Link, useFetcher} from "react-router";
import type {MetaFunction} from "react-router";
import {useWishlist} from "~/lib/wishlist-context";
import {reconstructGid, generateShareableWishlistUrl} from "~/lib/wishlist-utils";
import {WishlistButton} from "~/components/WishlistButton";
import {CartForm} from "@shopify/hydrogen";
import type {CurrencyCode} from "@shopify/hydrogen/storefront-api-types";
import {ArrowUpDown, LayoutGrid, List, Trash2, Share2, ShoppingCart} from "lucide-react";
import {ButtonSpinner} from "~/components/ui/button-spinner";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "~/components/ui/select";
import {ShareDialog} from "~/components/ShareDialog";
import {ProductCard} from "~/components/display/ProductCard";
import {fromWishlistProduct} from "~/lib/product/product-card-normalizers";

export const meta: MetaFunction = ({matches}) => {
    const rootData = matches.find(m => m.id === "root")?.data as {
        siteContent?: {siteSettings?: {brandName?: string}};
    } | undefined;
    const shopName = rootData?.siteContent?.siteSettings?.brandName?.trim() || "Store";
    return [{title: `Wishlist | ${shopName}`}, {name: "robots", content: "noindex,nofollow"}];
};

interface WishlistProduct {
    id: string;
    title: string;
    handle: string;
    availableForSale: boolean;
    featuredImage: {
        url: string;
        altText: string | null;
        width: number;
        height: number;
    } | null;
    priceRange: {
        minVariantPrice: {
            amount: string;
            currencyCode: CurrencyCode;
        };
    };
    compareAtPriceRange?: {
        minVariantPrice: {
            amount: string;
            currencyCode: CurrencyCode;
        };
    } | null;
    variants: {
        nodes: Array<{
            id: string;
            availableForSale: boolean;
        }>;
    };
}

type ViewMode = "grid" | "list";
type SortOption = "date-added" | "price-low" | "price-high";

const ConfirmDialog = ({
    title,
    message,
    confirmLabel,
    onConfirm,
    onCancel
}: {
    title: string;
    message: string;
    confirmLabel: string;
    onConfirm: () => void;
    onCancel: () => void;
}) => {
    return (
        <div className="bg-overlay-dark fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md">
            <div className="bg-card text-card-foreground border-border w-full max-w-md rounded-lg border p-6 shadow-2xl">
                <h2 className="mb-4 text-xl font-bold">{title}</h2>
                <p className="text-muted-foreground mb-6">{message}</p>
                <div className="flex justify-end gap-3">
                    <button
                        onClick={onCancel}
                        className="border-border bg-background text-foreground hover:bg-muted rounded-lg border px-4 py-2 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-lg px-4 py-2 transition-colors"
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

const AccountWishlist = () => {
    const {ids, count, clear} = useWishlist();
    const fetcher = useFetcher<{products: WishlistProduct[]}>();
    // Tracks the last-submitted wishlist key (sorted IDs joined) to prevent
    // duplicate API requests when the component re-renders without an IDs change.
    const requestedWishlistKeyRef = useRef<string | null>(null);

    const [viewMode, setViewMode] = useState<ViewMode>("grid");
    const [columns, setColumns] = useState<2 | 3 | 4>(3);
    const [sortBy, setSortBy] = useState<SortOption>("date-added");
    const [showClearDialog, setShowClearDialog] = useState(false);
    const [showShareDialog, setShowShareDialog] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") return;

        try {
            const savedView = localStorage.getItem("wishlist-view-mode");
            const savedColumns = localStorage.getItem("wishlist-columns");
            const savedSort = localStorage.getItem("wishlist-sort");

            if (savedView === "grid" || savedView === "list") {
                setViewMode(savedView);
            }

            const cols = Number(savedColumns);
            if (cols === 2 || cols === 3 || cols === 4) {
                setColumns(cols);
            }

            if (savedSort === "date-added" || savedSort === "price-low" || savedSort === "price-high") {
                setSortBy(savedSort);
            }
        } catch {
            // localStorage unavailable
        }
    }, []);

    useEffect(() => {
        if (typeof window === "undefined") return;
        try {
            localStorage.setItem("wishlist-view-mode", viewMode);
        } catch {
            // localStorage unavailable
        }
    }, [viewMode]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        try {
            localStorage.setItem("wishlist-columns", String(columns));
        } catch {
            // localStorage unavailable
        }
    }, [columns]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        try {
            localStorage.setItem("wishlist-sort", sortBy);
        } catch {
            // localStorage unavailable
        }
    }, [sortBy]);

    useEffect(() => {
        if (ids.length === 0) {
            requestedWishlistKeyRef.current = null;
            return;
        }

        const wishlistKey = ids.join(",");
        if (requestedWishlistKeyRef.current === wishlistKey) {
            return;
        }

        requestedWishlistKeyRef.current = wishlistKey;
        const gids = ids.map(id => reconstructGid(id));

        void fetcher.submit(
            {ids: gids},
            {
                method: "POST",
                action: "/api/wishlist-products",
                encType: "application/json"
            }
        );
    }, [ids, fetcher]);

    const products = useMemo(() => {
        if (!fetcher.data?.products) return [];

        const productList = [...fetcher.data.products];

        if (sortBy === "date-added") {
            return productList.sort((a, b) => {
                const aIndex = ids.indexOf(parseInt(a.id.split("/").pop() || "0", 10));
                const bIndex = ids.indexOf(parseInt(b.id.split("/").pop() || "0", 10));
                return aIndex - bIndex;
            });
        }

        if (sortBy === "price-low") {
            return productList.sort(
                (a, b) =>
                    parseFloat(a.priceRange.minVariantPrice.amount) - parseFloat(b.priceRange.minVariantPrice.amount)
            );
        }

        if (sortBy === "price-high") {
            return productList.sort(
                (a, b) =>
                    parseFloat(b.priceRange.minVariantPrice.amount) - parseFloat(a.priceRange.minVariantPrice.amount)
            );
        }

        return productList;
    }, [fetcher, sortBy, ids]);

    const handleClearAll = () => {
        clear();
        setShowClearDialog(false);
    };

    const shareUrl =
        typeof window !== "undefined" ? generateShareableWishlistUrl(window.location.origin, ids) : "";

    const isLoading = fetcher.state === "loading" || fetcher.state === "submitting";

    const cartLines = useMemo(() => {
        return products
            .filter(product => product.availableForSale)
            .map(product => ({
                merchandiseId: product.variants.nodes[0]?.id || "",
                quantity: 1
            }))
            .filter(line => line.merchandiseId);
    }, [products]);

    const gridClass =
        viewMode === "grid"
            ? `grid gap-6 ${columns === 2 ? "grid-cols-1 md:grid-cols-2" : columns === 3 ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"}`
            : "grid grid-cols-1 gap-6";

    const normalizedProducts = useMemo(() => {
        return products.map(product => fromWishlistProduct(product));
    }, [products]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-8 md:mb-10">
                <div>
                    <h1 className="font-serif text-xl font-medium text-foreground md:text-2xl lg:text-3xl">My Wishlist</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {count} {count === 1 ? "item" : "items"} saved
                    </p>
                </div>
            </div>

            {count === 0 ? (
                <div className="rounded-2xl bg-gradient-to-br from-muted/40 via-card to-muted/20 px-6 py-12 text-center sm:px-12">
                    <Share2 className="mx-auto mb-4 size-10 text-muted-foreground" />
                    <h3 className="font-serif text-xl font-medium text-foreground">Your wishlist is empty</h3>
                    <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">Start adding products you love</p>
                    <Link
                        to="/collections/all-products"
                        className="bg-primary text-primary-foreground hover:bg-primary/90 mt-6 inline-block rounded-lg px-6 py-3 transition-colors"
                    >
                        Start Browsing
                    </Link>
                </div>
            ) : (
                <>
                    {!isLoading && products.length > 0 && (
                        <div className="mb-6 flex flex-wrap gap-3">
                            <CartForm route="/cart" action={CartForm.ACTIONS.LinesAdd} inputs={{lines: cartLines}}>
                                {fetcher => (
                                    <button
                                        type="submit"
                                        disabled={cartLines.length === 0 || fetcher.state !== "idle"}
                                        className="bg-primary text-primary-foreground hover:bg-primary/90 relative flex items-center gap-2 rounded-lg px-6 py-3 font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <span className={fetcher.state !== "idle" ? "flex items-center gap-2 opacity-0" : "flex items-center gap-2"}>
                                            <ShoppingCart className="h-5 w-5" />
                                            Add All to Cart
                                        </span>
                                        {fetcher.state !== "idle" && (
                                            <span className="absolute inset-0 flex items-center justify-center">
                                                <ButtonSpinner />
                                            </span>
                                        )}
                                    </button>
                                )}
                            </CartForm>
                        </div>
                    )}

                    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 py-3">
                        <div className="flex items-center gap-3">
                            <p className="text-muted-foreground text-sm">
                                {products.length} {products.length === 1 ? "product" : "products"}
                            </p>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setViewMode("grid")}
                                    className={`rounded-lg p-2 transition-colors ${
                                        viewMode === "grid"
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                    }`}
                                    aria-label="Grid view"
                                >
                                    <LayoutGrid className="size-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode("list")}
                                    className={`rounded-lg p-2 transition-colors ${
                                        viewMode === "list"
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                    }`}
                                    aria-label="List view"
                                >
                                    <List className="size-4" />
                                </button>
                                {viewMode === "grid" && (
                                    <div className="ml-2 flex items-center gap-1">
                                        {([2, 3, 4] as const).map(col => (
                                            <button
                                                key={col}
                                                onClick={() => setColumns(col)}
                                                className={`h-8 w-8 rounded-lg text-sm font-medium transition-colors ${
                                                    columns === col
                                                        ? "bg-primary text-primary-foreground"
                                                        : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                                }`}
                                                aria-label={`${col} columns`}
                                            >
                                                {col}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-2">
                                <ArrowUpDown className="text-muted-foreground hidden size-4 sm:block" aria-hidden="true" />
                                <Select value={sortBy} onValueChange={value => setSortBy(value as SortOption)}>
                                    <SelectTrigger size="sm" className="w-[180px] text-sm" aria-label="Sort wishlist">
                                        <SelectValue placeholder="Sort by" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="date-added">Date Added</SelectItem>
                                        <SelectItem value="price-low">Price: Low to High</SelectItem>
                                        <SelectItem value="price-high">Price: High to Low</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <button
                                onClick={() => setShowShareDialog(true)}
                                className="bg-muted text-foreground hover:bg-accent hover:text-accent-foreground flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                            >
                                <Share2 className="h-4 w-4" />
                                Share
                            </button>

                            <button
                                onClick={() => setShowClearDialog(true)}
                                className="bg-destructive/10 text-destructive hover:bg-destructive/15 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                            >
                                <Trash2 className="h-4 w-4" />
                                Clear All
                            </button>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className={gridClass}>
                            {Array.from({length: count}).map((_, i) => (
                                <div
                                    key={ids[i] ?? `wishlist-loading-${i}`}
                                    className="bg-muted aspect-square animate-pulse rounded-lg"
                                />
                            ))}
                        </div>
                    ) : (
                        <div className={gridClass}>
                            {normalizedProducts.map(product => (
                                <div key={product.id} className={`${viewMode === "list" ? "max-w-xl " : ""}relative`}>
                                    <div className="absolute top-2 right-2 z-30">
                                        <WishlistButton productId={product.id} size="sm" />
                                    </div>
                                    <ProductCard product={product} />
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {showClearDialog && (
                <ConfirmDialog
                    title="Clear Wishlist"
                    message="Are you sure you want to remove all items from your wishlist? This cannot be undone."
                    confirmLabel="Clear All"
                    onConfirm={handleClearAll}
                    onCancel={() => setShowClearDialog(false)}
                />
            )}

            {showShareDialog && (
                <ShareDialog url={shareUrl} title="My Wishlist" onClose={() => setShowShareDialog(false)} />
            )}
        </div>
    );
};

export default AccountWishlist;

export {RouteErrorBoundary as ErrorBoundary} from "~/components/RouteErrorBoundary";
