import {useMemo, useState} from "react";
import {Link, useLoaderData, data} from "react-router";
import type {LoaderFunctionArgs, MetaFunction} from "react-router";
import {useWishlist} from "~/lib/wishlist-context";
import {reconstructGid} from "~/lib/wishlist-utils";
import {HiHeart, HiShare} from "react-icons/hi";
import {ShareDialog} from "~/lib/social-share";
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
    productIds: string[];
}

export const meta: MetaFunction = () => {
    return [{title: "Shared Wishlist | Your Store"}, {name: "robots", content: "noindex, nofollow"}];
};

export const loader = async ({request, context}: LoaderFunctionArgs) => {
    const url = new URL(request.url);
    const idsParam = url.searchParams.get("ids");

    if (!idsParam) {
        throw new Response("Missing wishlist IDs", {status: 400});
    }

    const numericIds = idsParam
        .split(",")
        .map(id => id.trim())
        .filter(id => /^\d+$/.test(id));

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
    const {addItem} = useWishlist();
    const [showShareDialog, setShowShareDialog] = useState(false);
    const [addedToWishlist, setAddedToWishlist] = useState(false);
    const normalizedProducts = useMemo(() => products.map(product => fromWishlistProduct(product)), [products]);

    const handleAddAllToWishlist = () => {
        products.forEach(product => {
            addItem(product.id);
        });
        setAddedToWishlist(true);
        setTimeout(() => setAddedToWishlist(false), 3000);
    };

    if (products.length === 0) {
        return (
            <div className="mx-auto max-w-7xl px-4 py-16">
                <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300">
                    <HiHeart className="mb-4 h-16 w-16 text-gray-400" />
                    <h2 className="mb-2 text-xl font-semibold">No products found</h2>
                    <p className="mb-6 text-gray-600">
                        The products in this wishlist are no longer available
                    </p>
                    <Link
                        to="/products"
                        className="rounded-lg bg-black px-6 py-3 text-white transition-colors hover:bg-gray-800"
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
                <p className="mt-2 text-gray-600">
                    {products.length} {products.length === 1 ? "item" : "items"}
                </p>
            </div>

            <div className="mb-6 flex flex-wrap gap-3">
                <button
                    onClick={handleAddAllToWishlist}
                    disabled={addedToWishlist}
                    className="flex items-center gap-2 rounded-lg bg-black px-6 py-3 font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
                >
                    <HiHeart className="h-5 w-5" />
                    {addedToWishlist ? "Added to Your Wishlist!" : "Add All to My Wishlist"}
                </button>

                <button
                    onClick={() => setShowShareDialog(true)}
                    className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-3 font-medium transition-colors hover:bg-gray-100"
                >
                    <HiShare className="h-5 w-5" />
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
