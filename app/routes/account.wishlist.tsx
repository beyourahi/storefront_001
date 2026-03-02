import {useState, useEffect, useMemo} from "react";
import {Link, useFetcher} from "react-router";
import type {MetaFunction} from "react-router";
import {useWishlist} from "~/lib/wishlist-context";
import {reconstructGid} from "~/lib/wishlist-utils";
import {WishlistButton} from "~/components/WishlistButton";
import {CartForm} from "@shopify/hydrogen";
import type {CurrencyCode} from "@shopify/hydrogen/storefront-api-types";
import {HiViewGrid, HiViewList, HiTrash, HiShare, HiShoppingCart} from "react-icons/hi";
import {ShareDialog} from "~/lib/social-share";
import {ProductCard} from "~/components/display/ProductCard";
import {fromWishlistProduct} from "~/lib/product/product-card-normalizers";

export const meta: MetaFunction = () => {
    return [{title: "Wishlist | Your Store"}];
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-lg bg-white p-6">
                <h2 className="mb-4 text-xl font-bold">{title}</h2>
                <p className="mb-6 text-gray-600">{message}</p>
                <div className="flex justify-end gap-3">
                    <button
                        onClick={onCancel}
                        className="rounded-lg border border-gray-300 px-4 py-2 transition-colors hover:bg-gray-100"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

const AccountWishlist = () => {
    const {wishlistIds, count, clearAll} = useWishlist();
    const fetcher = useFetcher<{products: WishlistProduct[]}>();

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

            if (savedView === "grid" || savedView === "list") {
                setViewMode(savedView);
            }

            const cols = Number(savedColumns);
            if (cols === 2 || cols === 3 || cols === 4) {
                setColumns(cols);
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
        if (wishlistIds.length === 0) {
            return;
        }

        const gids = wishlistIds.map(id => reconstructGid(id));

        void fetcher.submit(
            {ids: gids},
            {
                method: "POST",
                action: "/api/wishlist-products",
                encType: "application/json"
            }
        );
    }, [wishlistIds, fetcher]);

    const products = useMemo(() => {
        if (!fetcher.data?.products) return [];

        const productList = [...fetcher.data.products];

        if (sortBy === "date-added") {
            return productList.sort((a, b) => {
                const aIndex = wishlistIds.indexOf(a.id.split("/").pop() || "");
                const bIndex = wishlistIds.indexOf(b.id.split("/").pop() || "");
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
    }, [fetcher, sortBy, wishlistIds]);

    const handleClearAll = () => {
        clearAll();
        setShowClearDialog(false);
    };

    const shareUrl =
        typeof window !== "undefined" ? `${window.location.origin}/wishlist/share?ids=${wishlistIds.join(",")}` : "";

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
        <div className="mx-auto max-w-7xl px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">My Wishlist</h1>
                <p className="mt-2 text-gray-600">
                    {count} {count === 1 ? "item" : "items"} saved
                </p>
            </div>

            {count === 0 ? (
                <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300">
                    <HiShare className="mb-4 h-16 w-16 text-gray-400" />
                    <h3 className="mb-2 text-xl font-semibold">Your wishlist is empty</h3>
                    <p className="mb-6 text-gray-600">Start adding products you love</p>
                    <Link
                        to="/products"
                        className="rounded-lg bg-black px-6 py-3 text-white transition-colors hover:bg-gray-800"
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
                                        className="flex items-center gap-2 rounded-lg bg-black px-6 py-3 font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <HiShoppingCart className="h-5 w-5" />
                                        {fetcher.state !== "idle" ? "Adding..." : "Add All to Cart"}
                                    </button>
                                )}
                            </CartForm>
                        </div>
                    )}

                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setViewMode("grid")}
                                className={`rounded-lg p-2 transition-colors ${
                                    viewMode === "grid"
                                        ? "bg-black text-white"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                                aria-label="Grid view"
                            >
                                <HiViewGrid className="h-5 w-5" />
                            </button>
                            <button
                                onClick={() => setViewMode("list")}
                                className={`rounded-lg p-2 transition-colors ${
                                    viewMode === "list"
                                        ? "bg-black text-white"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                                aria-label="List view"
                            >
                                <HiViewList className="h-5 w-5" />
                            </button>

                            {viewMode === "grid" && (
                                <div className="ml-4 flex items-center gap-2">
                                    <span className="text-sm text-gray-600">Columns:</span>
                                    {[2, 3, 4].map(col => (
                                        <button
                                            key={col}
                                            onClick={() => setColumns(col as 2 | 3 | 4)}
                                            className={`h-8 w-8 rounded-lg text-sm font-medium transition-colors ${
                                                columns === col
                                                    ? "bg-black text-white"
                                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                            }`}
                                        >
                                            {col}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <select
                                value={sortBy}
                                onChange={e => setSortBy(e.target.value as SortOption)}
                                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm"
                            >
                                <option value="date-added">Date Added</option>
                                <option value="price-low">Price: Low to High</option>
                                <option value="price-high">Price: High to Low</option>
                            </select>

                            <button
                                onClick={() => setShowShareDialog(true)}
                                className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-200"
                            >
                                <HiShare className="h-4 w-4" />
                                Share
                            </button>

                            <button
                                onClick={() => setShowClearDialog(true)}
                                className="flex items-center gap-2 rounded-lg bg-red-100 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-200"
                            >
                                <HiTrash className="h-4 w-4" />
                                Clear All
                            </button>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className={gridClass}>
                            {Array.from({length: count}).map((_, i) => (
                                <div
                                    key={wishlistIds[i] ?? `wishlist-loading-${i}`}
                                    className="aspect-square animate-pulse rounded-lg bg-gray-200"
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
