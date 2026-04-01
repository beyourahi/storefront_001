import {useMemo, useState} from "react";
import {Link, useLoaderData, data} from "react-router";
import type {LoaderFunctionArgs, MetaFunction} from "react-router";
import {useWishlist} from "~/lib/wishlist-context";
import {reconstructGid, decodeWishlistIds} from "~/lib/wishlist-utils";
import {Heart, Share2} from "lucide-react";
import {ShareDialog} from "~/components/ShareDialog";
import {ProductCard} from "~/components/display/ProductCard";
import {fromWishlistProduct} from "~/lib/product/product-card-normalizers";

const SHARED_WISHLIST_QUERY = `#graphql
  query SharedWishlist($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on Product {
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
    }
  }
`;

interface LoaderData {
    products: Array<{
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
                currencyCode: string;
            };
        };
        variants: {
            nodes: Array<{
                id: string;
                availableForSale: boolean;
            }>;
        };
    }>;
    shareUrl: string;
    productIds: number[];
}

export const meta: MetaFunction = ({matches}) => {
    const rootData = (
        matches.find(m => m?.id === "root") as
            | {data?: {siteContent?: {siteSettings?: {brandName?: string}}}}
            | undefined
    )?.data;
    const brandName = rootData?.siteContent?.siteSettings?.brandName || "Store";
    return [{title: `Shared Wishlist | ${brandName}`}, {name: "robots", content: "noindex, nofollow"}];
};

export const loader = async ({request, context}: LoaderFunctionArgs) => {
    const url = new URL(request.url);
    const idsParam = url.searchParams.get("ids");

    if (!idsParam) {
        throw new Response("Missing wishlist IDs", {status: 400});
    }

    const numericIds = decodeWishlistIds(idsParam);

    if (numericIds.length === 0) {
        throw new Response("No valid product IDs provided", {status: 400});
    }

    if (numericIds.length > 50) {
        throw new Response("Too many products (max 50)", {status: 400});
    }

    const gids = numericIds.map(id => reconstructGid(id));

    const {dataAdapter} = context;
    const {nodes} = await dataAdapter.query(SHARED_WISHLIST_QUERY, {
        variables: {ids: gids}
    });

    const products = nodes.filter(Boolean);

    return data({
        products,
        shareUrl: url.toString(),
        productIds: numericIds
    });
};

const WishlistShare = () => {
    const {products, shareUrl} = useLoaderData<LoaderData>();
    const {add} = useWishlist();
    const [showShareDialog, setShowShareDialog] = useState(false);
    const [addedToWishlist, setAddedToWishlist] = useState(false);
    const normalizedProducts = useMemo(() => products.map(product => fromWishlistProduct(product)), [products]);

    const handleAddAllToWishlist = () => {
        products.forEach(product => {
            add(product.id);
        });
        setAddedToWishlist(true);
        setTimeout(() => setAddedToWishlist(false), 3000);
    };

    if (products.length === 0) {
        return (
            <div className="mx-auto max-w-7xl px-4 py-16">
                <div className="border-border/60 flex min-h-[400px] flex-col items-center justify-center rounded-lg border-2 border-dashed">
                    <Heart fill="currentColor" className="text-muted-foreground/60 mb-4 h-16 w-16" />
                    <h2 className="mb-2 text-xl font-semibold">No products found</h2>
                    <p className="text-muted-foreground mb-6">The products in this wishlist are no longer available</p>
                    <Link
                        to="/collections/all-products"
                        className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-6 py-3 transition-colors"
                    >
                        Browse Products
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-7xl px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Shared Wishlist</h1>
                <p className="text-muted-foreground mt-2">
                    {products.length} {products.length === 1 ? "item" : "items"}
                </p>
            </div>

            <div className="mb-6 flex flex-wrap gap-3">
                <button
                    onClick={handleAddAllToWishlist}
                    disabled={addedToWishlist}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 rounded-lg px-6 py-3 font-medium transition-colors disabled:opacity-50"
                >
                    <Heart fill="currentColor" className="h-5 w-5" />
                    {addedToWishlist ? "Added to Your Wishlist!" : "Add All to My Wishlist"}
                </button>

                <button
                    onClick={() => setShowShareDialog(true)}
                    className="border-border bg-background text-foreground hover:bg-muted flex items-center gap-2 rounded-lg border px-6 py-3 font-medium transition-colors"
                >
                    <Share2 className="h-5 w-5" />
                    Share This Wishlist
                </button>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {normalizedProducts.map(product => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>

            {showShareDialog && (
                <ShareDialog url={shareUrl} title="Check out this wishlist" onClose={() => setShowShareDialog(false)} />
            )}
        </div>
    );
};

export default WishlistShare;

export {RouteErrorBoundary as ErrorBoundary} from "~/components/RouteErrorBoundary";
