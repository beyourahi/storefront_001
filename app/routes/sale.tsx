import type {Route} from "./+types/sale";
import {useLoaderData, redirect} from "react-router";
import {getSeoMeta} from "@shopify/hydrogen";
import {filterAndSortDiscountedProducts, type RawDiscountProduct} from "~/lib/discounts";
import {fromSaleProduct} from "~/lib/product/product-card-normalizers";
import {ProductsGridSection} from "~/components/sections/ProductsGridSection";
import {CollectionPagination} from "~/components/custom/CollectionPagination";
import {MobileSearchBar} from "~/components/layout/MobileSearchBar";
import {SaleHero} from "~/components/sections/SaleHero";
import {
    parsePaginationParams,
    buildPaginationVariables,
    buildPaginationData,
    getCanonicalRedirect
} from "~/lib/collection-route-helpers";
import {sortProductsByDiscount} from "~/lib/product-sorting";

export const meta: Route.MetaFunction = ({data}) => {
    const maxDiscount = data?.maxDiscount ?? 0;
    const totalCount = data?.totalCount ?? 0;
    const title = maxDiscount > 0 ? `Save Up to ${maxDiscount}% — Special Offers` : "Special Offers";
    const description =
        totalCount > 0
            ? `Discover ${totalCount} discounted items with savings up to ${maxDiscount}% off.`
            : "Check back soon for sale items and deals.";

    return getSeoMeta({title, description}) ?? [];
};

export const loader = async ({context, request}: Route.LoaderArgs) => {
    const {dataAdapter} = context;
    const url = new URL(request.url);

    // Parse pagination params
    const {cursor, page, direction} = parsePaginationParams(url);
    const pageParam = url.searchParams.get("page");

    // Build GraphQL variables for cursor-based pagination
    const variables = buildPaginationVariables(cursor, direction, 250);

    // Single query for products with cursor pagination
    const {products} = await dataAdapter.query(SALE_PRODUCTS_QUERY, {
        variables: {
            query: "available_for_sale:true",
            ...variables
        },
        cache: dataAdapter.CacheNone()
    });

    // Filter and sort discounted products
    const discountedProducts = filterAndSortDiscountedProducts(products.nodes as RawDiscountProduct[]);

    // Sort by discount percentage (highest first)
    const sortedProducts = sortProductsByDiscount(discountedProducts);

    // Build pagination data
    const pagination = buildPaginationData(products.pageInfo, page);

    // Calculate total count and max discount from current page
    const totalCount = sortedProducts.length;
    const maxDiscount = totalCount > 0 ? Math.max(...sortedProducts.map(p => p.maxDiscountPercentage)) : 0;

    // Check for canonical redirect
    const canonicalRedirect = getCanonicalRedirect(url, page, pagination.hasNextPage, pageParam);
    if (canonicalRedirect) {
        throw redirect(canonicalRedirect);
    }

    return {
        products: sortedProducts,
        totalCount,
        maxDiscount,
        pagination
    };
};

export default function Sale() {
    const {products, totalCount, maxDiscount, pagination} = useLoaderData<typeof loader>();

    // Normalize products for display
    const normalizedProducts = products.map(fromSaleProduct);

    const showPagination = pagination.hasNextPage || pagination.hasPreviousPage;

    return (
        <div className="min-h-dvh bg-background text-foreground">
            {/* Hero Section */}
            <div className="pt-24 sm:pt-32">
                <SaleHero totalCount={totalCount} maxDiscount={maxDiscount} products={products} />
            </div>

            {/* Mobile Search Bar */}
            <div className="mx-auto max-w-[2000px] px-4 sm:px-6 lg:hidden lg:px-8">
                <MobileSearchBar shopName="Store" />
            </div>

            {totalCount > 0 && (
                <>
                    {/* Mobile Pagination (Above Grid) */}
                    {showPagination && (
                        <div className="mx-auto max-w-[2000px] px-4 sm:px-6 lg:hidden lg:px-8">
                            <CollectionPagination {...pagination} />
                        </div>
                    )}

                    {/* Products Grid */}
                    <ProductsGridSection products={normalizedProducts} pagination={pagination} preserveOrder={true} sortLabel="Highest discount first" />

                    {/* Pagination (Below Grid) */}
                    {showPagination && (
                        <div className="mx-auto max-w-[2000px] px-4 pb-16 sm:px-6 lg:px-8">
                            <CollectionPagination {...pagination} />
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

const SALE_VARIANT_FRAGMENT = `#graphql
  fragment SaleVariant on ProductVariant {
    id
    availableForSale
    price {
      amount
      currencyCode
    }
    compareAtPrice {
      amount
      currencyCode
    }
  }
` as const;

const SALE_PRODUCT_FRAGMENT = `#graphql
  fragment SaleProduct on Product {
    id
    handle
    title
    availableForSale
    featuredImage {
      id
      altText
      url
      width
      height
    }
    images(first: 5) {
      nodes {
        id
        altText
        url
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
    variants(first: 250) {
      nodes {
        ...SaleVariant
        title
        quantityAvailable
        selectedOptions {
          name
          value
        }
      }
    }
  }
  ${SALE_VARIANT_FRAGMENT}
` as const;

const SALE_PRODUCTS_QUERY = `#graphql
  query SalePageProducts(
    $country: CountryCode
    $language: LanguageCode
    $query: String
    $first: Int
    $last: Int
    $after: String
    $before: String
  ) @inContext(country: $country, language: $language) {
    products(
      first: $first
      last: $last
      after: $after
      before: $before
      query: $query
    ) {
      nodes {
        ...SaleProduct
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
  ${SALE_PRODUCT_FRAGMENT}
` as const;
