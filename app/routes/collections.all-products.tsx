import {redirect, useLoaderData} from "react-router";
import type {Route} from "./+types/collections.all-products";
import {getSeoMeta} from "@shopify/hydrogen";
import {ShopAllHero} from "~/components/sections/ShopAllHero";
import {ProductsGridSection} from "~/components/sections/ProductsGridSection";
import {CollectionPagination} from "~/components/custom/CollectionPagination";
import {MobileSearchBar} from "~/components/layout/MobileSearchBar";
import {PageBreadcrumbs} from "~/components/common/PageBreadcrumbs";
import {fromStorefrontNode} from "~/lib/product/product-card-normalizers";
import {
    parsePaginationParams,
    buildPaginationVariables,
    buildPaginationData,
    getCanonicalRedirect
} from "~/lib/collection-route-helpers";
import {sortWithPinnedFirst} from "~/lib/product-tags";

export const meta: Route.MetaFunction = ({data}) => {
    const productCount = data?.totalProductCount ?? 0;

    return (
        getSeoMeta({
            title: "All Products",
            description:
                productCount > 0
                    ? `Browse our complete collection of ${productCount} products.`
                    : "Browse our complete collection of products."
        }) ?? []
    );
};

export const loader = async ({context, request}: Route.LoaderArgs) => {
    const {dataAdapter} = context;
    const url = new URL(request.url);

    // Parse pagination params
    const {cursor, page, direction} = parsePaginationParams(url);
    const pageParam = url.searchParams.get("page");

    // Build GraphQL variables for cursor-based pagination
    const variables = buildPaginationVariables(cursor, direction, 48);

    // Query all products with pagination
    // Note: QueryRoot.products doesn't support filters/sortKey like Collection.products,
    // so we filter and sort client-side
    const {products} = await dataAdapter.query(CATALOG_QUERY, {
        variables,
        cache: dataAdapter.CacheShort()
    });

    // Filter in-stock products client-side
    const inStockProducts = products.nodes.filter(
        (product: any) =>
            product.availableForSale && product.variants.nodes.some((v: any) => v.availableForSale)
    );

    // Sort by price (low to high), then apply pin sorting on top
    const priceSorted = [...inStockProducts].sort((a: any, b: any) => {
        const aPrice = parseFloat(a.priceRange.minVariantPrice.amount);
        const bPrice = parseFloat(b.priceRange.minVariantPrice.amount);
        return aPrice - bPrice;
    });
    const sortedProducts = sortWithPinnedFirst(priceSorted);

    // Build pagination data
    const pagination = buildPaginationData(products.pageInfo, page);

    // Check for canonical redirect
    const canonicalRedirect = getCanonicalRedirect(url, page, pagination.hasNextPage, pageParam);
    if (canonicalRedirect) {
        throw redirect(canonicalRedirect);
    }

    return {
        products: sortedProducts,
        totalProductCount: sortedProducts.length,
        pagination
    };
};

export default function AllProductsPage() {
    const {products, totalProductCount, pagination} = useLoaderData<typeof loader>();

    // Normalize products for display
    const normalizedProducts = products.map(fromStorefrontNode);

    const showPagination = pagination.hasNextPage || pagination.hasPreviousPage;

    return (
        <div className="min-h-dvh bg-background text-foreground">
            {/* Breadcrumbs */}
            <PageBreadcrumbs customTitle="All Products" />

            {/* Shop All Hero */}
            <ShopAllHero
                title="All Products"
                subtitle={
                    totalProductCount > 0
                        ? `Discover our complete collection of ${totalProductCount} products`
                        : undefined
                }
            />

            {/* Mobile Search Bar */}
            <div className="mx-auto max-w-[2000px] px-2 md:px-4 lg:hidden">
                <MobileSearchBar shopName="Store" />
            </div>

            {/* Mobile Pagination (Above Grid) */}
            {showPagination && (
                <div className="mx-auto max-w-[2000px] px-2 md:px-4 lg:hidden">
                    <CollectionPagination {...pagination} />
                </div>
            )}

            {/* Products Grid */}
            <ProductsGridSection products={normalizedProducts} pagination={pagination} preserveOrder={true} />

            {/* Pagination (Below Grid) */}
            {showPagination && (
                <div className="mx-auto max-w-[2000px] px-2 pb-16 md:px-4">
                    <CollectionPagination {...pagination} />
                </div>
            )}
        </div>
    );
}

const CATALOG_QUERY = `#graphql
  query Catalog(
    $country: CountryCode
    $language: LanguageCode
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
    ) {
      nodes {
        id
        title
        handle
        availableForSale
        tags
        productType
        vendor
        description
        publishedAt
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
        featuredImage {
          id
          url
          altText
          width
          height
        }
        images(first: 2) {
          nodes {
            id
            url
            altText
            width
            height
          }
        }
        variants(first: 10) {
          nodes {
            id
            title
            availableForSale
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
            image {
              url
              altText
            }
          }
        }
        seo {
          title
          description
        }
        options {
          id
          name
          values
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
` as const;
