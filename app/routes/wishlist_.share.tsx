/**
 * @fileoverview Shared Wishlist Route
 *
 * @description
 * Public-facing route for viewing shared wishlists. Renders as an independent
 * route segment (trailing underscore on "wishlist_" prevents nesting inside the
 * wishlist.tsx parent layout route). Allows visitors to browse products that
 * someone shared via a shareable link and save them to their own wishlist.
 *
 * Features:
 * - Independent route segment (NOT nested inside wishlist.tsx)
 * - Server-side product fetching from encoded URL parameter
 * - "Save All" CTA with toast feedback for visitors
 * - Social sharing via ShareDialog component
 * - SEO-friendly with dynamic meta via getSeoMeta
 * - Soft error handling — graceful empty state instead of 400 pages
 * - Limit of 50 products to prevent URL abuse
 *
 * @route /wishlist/share?ids={encodedIds}
 *
 * @routing
 * Uses "wishlist_" (trailing underscore) to match the /wishlist/share URL segment
 * WITHOUT nesting inside wishlist.tsx. If "wishlist.share" were used instead,
 * React Router 7 would attempt to render this as a child of wishlist.tsx — but
 * wishlist.tsx is a redirect-only route with no <Outlet>, so the page would be
 * unreachable.
 *
 * @architecture
 * - URL parameter `ids` contains base64url-encoded numeric product IDs
 * - Decodes IDs, reconstructs Shopify GIDs, fetches products via Storefront API
 * - Uses ProductCard + fromWishlistProduct for normalized product display
 * - Integrates with wishlist context for saving products to user's local wishlist
 * - No authentication required (public route)
 * - Gracefully handles deleted products (filters out null nodes)
 *
 * @related
 * - ~/routes/wishlist.tsx - Main wishlist redirect route
 * - ~/lib/wishlist-utils - Encoding/decoding utilities for shareable URLs
 * - ~/lib/wishlist-context - Wishlist state management context
 * - ~/components/display/ProductCard - Product card display component
 * - ~/components/ShareDialog - Social sharing dialog
 */

import {useMemo, useState} from "react";
import {Link, useLoaderData} from "react-router";
import {getSeoMeta} from "@shopify/hydrogen";
import {Heart, Share2, ShoppingBag, Plus} from "lucide-react";
import type {Route} from "./+types/wishlist_.share";
import {decodeWishlistIds, reconstructGids} from "~/lib/wishlist-utils";
import {useWishlist} from "~/lib/wishlist-context";
import {ProductCard} from "~/components/display/ProductCard";
import {fromWishlistProduct} from "~/lib/product/product-card-normalizers";
import {ShareDialog} from "~/components/ShareDialog";
import {Button} from "~/components/ui/button";
import {buildCanonicalUrl, getSiteUrlFromMatches} from "~/lib/seo";
import {toast} from "sonner";

// =============================================================================
// META & LOADER
// =============================================================================

export const meta: Route.MetaFunction = ({data, matches}) => {
    const siteUrl = getSiteUrlFromMatches(matches);
    const count = data?.products?.length ?? 0;
    return (
        getSeoMeta({
            title: `Shared Wishlist (${count} items)`,
            description: `Someone shared their wishlist with you! Browse ${count} curated product${count !== 1 ? "s" : ""}.`,
            url: buildCanonicalUrl("/wishlist/share", siteUrl)
        }) ?? []
    );
};

export async function loader({request, context}: Route.LoaderArgs) {
    const {dataAdapter} = context;
    const url = new URL(request.url);
    const encodedIds = url.searchParams.get("ids") || "";

    // Decode IDs from URL — soft-error on empty/invalid input to show graceful empty state
    const numericIds = decodeWishlistIds(encodedIds);

    if (numericIds.length === 0) {
        return {products: [], numericIds: [], shareUrl: url.toString(), error: "No products in shared wishlist"};
    }

    // Batch reconstruct GIDs and cap at 50 to prevent URL abuse
    const gids = reconstructGids(numericIds).slice(0, 50);

    try {
        const {nodes} = await dataAdapter.query(SHARED_WISHLIST_QUERY, {
            variables: {ids: gids}
        });

        // Filter out null nodes (deleted or unpublished products)
        const products = (nodes as Array<unknown>).filter(Boolean);

        return {products, numericIds, shareUrl: url.toString(), error: null};
    } catch (err) {
        console.error("[Shared Wishlist] Error fetching products:", err);
        return {products: [], numericIds, shareUrl: url.toString(), error: "Failed to load shared wishlist"};
    }
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function SharedWishlistPage() {
    const {products, numericIds, shareUrl, error} = useLoaderData<typeof loader>();
    const wishlist = useWishlist();
    const [showShareDialog, setShowShareDialog] = useState(false);

    // Normalize raw GraphQL nodes into the typed shape ProductCard expects
    const normalizedProducts = useMemo(
        () => products.map(product => fromWishlistProduct(product as object)),
        [products]
    );

    const handleSaveAll = () => {
        let addedCount = 0;
        numericIds.forEach(id => {
            const gid = `gid://shopify/Product/${id}`;
            if (!wishlist.has(gid)) {
                wishlist.add(gid);
                addedCount++;
            }
        });

        if (addedCount > 0) {
            toast.success(`Added ${addedCount} item${addedCount !== 1 ? "s" : ""} to your wishlist`, {
                description: "View your wishlist to see all saved items"
            });
        } else {
            toast.info("All items are already in your wishlist");
        }
    };

    // Error or empty state — render graceful UI instead of throwing a 400
    if (error && products.length === 0) {
        return (
            <div className="mx-auto max-w-7xl px-4">
                <SharedWishlistHeader count={0} onShare={() => setShowShareDialog(true)} />
                <SharedWishlistEmpty />
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-7xl px-4">
            <SharedWishlistHeader
                count={products.length}
                onSaveAll={handleSaveAll}
                onShare={() => setShowShareDialog(true)}
            />

            {products.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                    {normalizedProducts.map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            ) : (
                <SharedWishlistEmpty />
            )}

            {/* Bottom CTA — only shown when products are present */}
            {products.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-8 border-t border-primary/10">
                    <p className="text-muted-foreground text-center">
                        Like what you see? Save these items to your own wishlist.
                    </p>
                    <Button type="button" onClick={handleSaveAll}>
                        <Plus className="size-4" />
                        Save All to My Wishlist
                    </Button>
                </div>
            )}

            {showShareDialog && (
                <ShareDialog
                    url={shareUrl}
                    title="Check out this wishlist"
                    onClose={() => setShowShareDialog(false)}
                />
            )}
        </div>
    );
}

// =============================================================================
// HEADER
// =============================================================================

function SharedWishlistHeader({
    count,
    onSaveAll,
    onShare
}: {
    count: number;
    onSaveAll?: () => void;
    onShare: () => void;
}) {
    return (
        <header className="py-8 md:py-12">
            <div className="flex items-center justify-between">
                <div>
                    <span className="inline-block mb-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                        Shared Wishlist
                    </span>
                    <h1 className="text-3xl font-bold">Wishlist</h1>
                    <p className="text-muted-foreground mt-2">
                        {count === 0
                            ? "No items in this wishlist"
                            : `${count} ${count === 1 ? "item" : "items"} shared`}
                    </p>
                </div>

                {/* Desktop action buttons */}
                <div className="hidden sm:flex gap-3">
                    {count > 0 && onSaveAll && (
                        <Button type="button" size="lg" onClick={onSaveAll}>
                            <Heart fill="currentColor" className="size-5" />
                            Save All
                        </Button>
                    )}
                    <button
                        onClick={onShare}
                        className="border-border bg-background text-foreground hover:bg-muted flex items-center gap-2 rounded-lg border px-6 py-3 font-medium transition-colors"
                    >
                        <Share2 className="h-5 w-5" />
                        Share
                    </button>
                </div>
            </div>

            {/* Mobile action buttons */}
            <div className="mt-4 sm:hidden flex flex-wrap gap-3">
                {count > 0 && onSaveAll && (
                    <button
                        onClick={onSaveAll}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 rounded-lg px-5 py-2.5 font-medium transition-colors"
                    >
                        <Heart fill="currentColor" className="h-4 w-4" />
                        Save All
                    </button>
                )}
                <button
                    onClick={onShare}
                    className="border-border bg-background text-foreground hover:bg-muted flex items-center gap-2 rounded-lg border px-5 py-2.5 font-medium transition-colors"
                >
                    <Share2 className="h-4 w-4" />
                    Share
                </button>
            </div>
        </header>
    );
}

// =============================================================================
// EMPTY STATE
// =============================================================================

function SharedWishlistEmpty() {
    return (
        <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-center">
            <div className="mb-8">
                <Heart className="size-20 sm:size-24 text-muted-foreground/30" strokeWidth={1} />
            </div>
            <h2 className="text-xl md:text-2xl font-semibold mb-4">
                This wishlist is empty
            </h2>
            <p className="text-muted-foreground max-w-md mb-8 px-4">
                The shared wishlist does not contain any products, or the link may be invalid.
            </p>
            <Button asChild size="lg">
                <Link to="/collections/all-products">
                    <ShoppingBag className="size-5" />
                    Browse Products
                </Link>
            </Button>
        </div>
    );
}

// =============================================================================
// GRAPHQL QUERY
// =============================================================================

const SHARED_WISHLIST_QUERY = `#graphql
    fragment SharedWishlistProduct on Product {
        id
        title
        handle
        availableForSale
        tags
        productType
        vendor
        featuredImage {
            id
            url
            altText
            width
            height
        }
        images(first: 4) {
            nodes {
                id
                url
                altText
                width
                height
            }
        }
        media(first: 5) {
            nodes {
                __typename
                ... on MediaImage {
                    id
                    image { url altText width height }
                }
                ... on Video {
                    id
                    sources { url mimeType }
                    previewImage { url altText width height }
                }
            }
        }
        priceRange {
            minVariantPrice {
                amount
                currencyCode
            }
            maxVariantPrice {
                amount
                currencyCode
            }
        }
        compareAtPriceRange {
            minVariantPrice {
                amount
                currencyCode
            }
        }
        variants(first: 100) {
            nodes {
                id
                title
                availableForSale
                quantityAvailable
                selectedOptions {
                    name
                    value
                }
                price {
                    amount
                    currencyCode
                }
                compareAtPrice {
                    amount
                    currencyCode
                }
            }
        }
    }

    query SharedWishlistProducts($ids: [ID!]!) {
        nodes(ids: $ids) {
            ... on Product {
                ...SharedWishlistProduct
            }
        }
    }
` as const;

export {RouteErrorBoundary as ErrorBoundary} from "~/components/RouteErrorBoundary";
