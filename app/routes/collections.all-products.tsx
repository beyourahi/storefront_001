import {redirect, useLoaderData} from "react-router";
import type {Route} from "./+types/collections.all-products";
import {getSeoMeta} from "@shopify/hydrogen";
import {buildCanonicalUrl, getBrandNameFromMatches, getRequiredSocialMeta, getSiteUrlFromMatches, generateBreadcrumbListSchema} from "~/lib/seo";
import {ShopAllHero} from "~/components/sections/ShopAllHero";
import {ProductsGridSection} from "~/components/sections/ProductsGridSection";
import {CollectionPagination} from "~/components/custom/CollectionPagination";
import {MobileSearchBar} from "~/components/layout/MobileSearchBar";
import {PageBreadcrumbs} from "~/components/common/PageBreadcrumbs";
import {SortFilterBar} from "~/components/collection/SortFilterBar";
import {fromStorefrontNode} from "~/lib/product/product-card-normalizers";
import {
    parsePaginationParams,
    buildPaginationVariables,
    buildPaginationData,
    getCanonicalRedirect
} from "~/lib/collection-route-helpers";
import {parseSortFilterParams} from "~/lib/sort-filter-helpers";
import {sortWithPinnedFirst} from "~/lib/product-tags";

export const meta: Route.MetaFunction = ({data, matches}) => {
    const productCount = data?.totalProductCount ?? 0;
    const siteUrl = getSiteUrlFromMatches(matches);
    const brandName = getBrandNameFromMatches(matches);

    return [
        ...(getSeoMeta({
            title: `All Products | ${brandName}`,
            description:
                productCount > 0
                    ? `Browse our complete collection of ${productCount} products.`
                    : "Browse our complete collection of products.",
            url: buildCanonicalUrl("/collections/all-products", siteUrl)
        }) ?? []),
        {"script:ld+json": generateBreadcrumbListSchema([
            {name: "Home", url: "/"},
            {name: "All Products", url: "/collections/all-products"}
        ], siteUrl) as any},
        ...getRequiredSocialMeta("website", brandName)
    ];
};

export const loader = async ({context, request}: Route.LoaderArgs) => {
    const {dataAdapter} = context;
    const url = new URL(request.url);

    // Parse pagination params
    const {cursor, page, direction} = parsePaginationParams(url);
    const pageParam = url.searchParams.get("page");

    // Parse sort and filter params from URL
    const {sort, sortKey, reverse, sortLabel} = parseSortFilterParams(url);

    // Build GraphQL variables for cursor-based pagination
    // Note: QueryRoot.products doesn't support filters/sortKey like Collection.products,
    // so we sort client-side.
    const variables = {
        ...buildPaginationVariables(cursor, direction, 48)
    };

    // Query all products with pagination
    const {products} = await dataAdapter.query(CATALOG_QUERY, {
        variables,
        cache: dataAdapter.CacheShort()
    });

    // Client-side sorting based on sort param
    const productsToSort = [...products.nodes];
    productsToSort.sort((a: any, b: any) => {
        let cmp = 0;
        switch (sortKey) {
            case "PRICE": {
                const aPrice = parseFloat(a.priceRange.minVariantPrice.amount);
                const bPrice = parseFloat(b.priceRange.minVariantPrice.amount);
                cmp = aPrice - bPrice;
                break;
            }
            case "CREATED": {
                const aDate = new Date(a.publishedAt).getTime();
                const bDate = new Date(b.publishedAt).getTime();
                cmp = aDate - bDate;
                break;
            }
            case "TITLE": {
                cmp = a.title.localeCompare(b.title);
                break;
            }
            case "BEST_SELLING":
            default:
                // QueryRoot.products doesn't expose sales data; preserve API order
                cmp = 0;
                break;
        }
        return reverse ? -cmp : cmp;
    });

    // Apply pin sorting on top of the chosen sort
    const sortedProducts = sortWithPinnedFirst(productsToSort);

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
        pagination,
        sort,
        sortLabel
    };
};

export default function AllProductsPage() {
    const {products, totalProductCount, pagination, sort, sortLabel} =
        useLoaderData<typeof loader>();

    // Normalize products for display
    const normalizedProducts = products.map(fromStorefrontNode);

    const showPagination = pagination.hasNextPage || pagination.hasPreviousPage;

    return (
        <div className="min-h-screen bg-background text-foreground">
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

            {/* Sort and Filter Controls */}
            <SortFilterBar
                currentSort={sort}
                totalProducts={totalProductCount}
            />

            {/* Mobile Pagination (Above Grid) */}
            {showPagination && (
                <div className="mx-auto max-w-[2000px] px-2 md:px-4 lg:hidden">
                    <CollectionPagination {...pagination} />
                </div>
            )}

            {/* Products Grid */}
            <ProductsGridSection
                products={normalizedProducts}
                pagination={pagination}
                preserveOrder={true}
                sortLabel={sortLabel}
            />

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
        media(first: 5) {
          nodes {
            __typename
            ... on MediaImage {
              id
              image {
                url
                altText
                width
                height
              }
            }
            ... on Video {
              id
              sources {
                url
                mimeType
              }
              previewImage {
                url
                altText
                width
                height
              }
            }
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

export {RouteErrorBoundary as ErrorBoundary} from "~/components/RouteErrorBoundary";
