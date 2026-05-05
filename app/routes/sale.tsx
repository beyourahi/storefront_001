import type {Route} from "./+types/sale";
import {useLoaderData, redirect} from "react-router";
import {getSeoMeta} from "@shopify/hydrogen";
import {buildCanonicalUrl, getBrandNameFromMatches, getRequiredSocialMeta, getSiteUrlFromMatches, generateBreadcrumbListSchema} from "~/lib/seo";
import {filterAndSortDiscountedProducts, type RawDiscountProduct} from "~/lib/discounts";
import {fromSaleProduct} from "~/lib/product/product-card-normalizers";
import {ProductsGridSection} from "~/components/sections/ProductsGridSection";
import {CollectionPagination} from "~/components/custom/CollectionPagination";
import {MobileSearchBar} from "~/components/layout/MobileSearchBar";
import {SaleHero} from "~/components/sections/SaleHero";
import {AnimatedSection} from "~/components/sections/AnimatedSection";
import {
    parsePaginationParams,
    buildPaginationVariables,
    buildPaginationData,
    getCanonicalRedirect
} from "~/lib/collection-route-helpers";
import {parseSortFilterParams} from "~/lib/sort-filter-helpers";
import {SortFilterBar} from "~/components/collection/SortFilterBar";
import {PageBreadcrumbs} from "~/components/common/PageBreadcrumbs";

export const meta: Route.MetaFunction = ({data, matches}) => {
    const siteUrl = getSiteUrlFromMatches(matches);
    const brandName = getBrandNameFromMatches(matches);
    const maxDiscount = data?.maxDiscount ?? 0;
    const totalCount = data?.totalCount ?? 0;
    const title = maxDiscount > 0 ? `Save Up to ${maxDiscount}% — Special Offers` : "Special Offers";
    const description =
        totalCount > 0
            ? `Discover ${totalCount} discounted ${totalCount === 1 ? "item" : "items"} with savings up to ${maxDiscount}% off.`
            : "Check back soon for sale items and deals.";

    return [
        ...(getSeoMeta({title, description, url: buildCanonicalUrl("/sale", siteUrl)}) ?? []),
        {"script:ld+json": generateBreadcrumbListSchema([
            {name: "Home", url: "/"},
            {name: "Sale", url: "/sale"}
        ], siteUrl) as any},
        ...getRequiredSocialMeta("website", brandName)
    ];
};

export const loader = async ({context, request}: Route.LoaderArgs) => {
    const {dataAdapter} = context;
    const url = new URL(request.url);

    const {cursor, page, direction} = parsePaginationParams(url);
    const pageParam = url.searchParams.get("page");

    // Map CREATED → CREATED_AT: this route uses ProductSortKeys, not ProductCollectionSortKeys.
    const {sort, sortKey, reverse, sortLabel} = parseSortFilterParams(url);
    const productSortKey = sortKey === "CREATED" ? "CREATED_AT" : sortKey;

    const variables = buildPaginationVariables(cursor, direction, 48);

    const {products} = await dataAdapter.query(SALE_PRODUCTS_QUERY, {
        variables: {
            sortKey: productSortKey,
            reverse,
            ...variables
        },
        cache: dataAdapter.CacheShort()
    });

    const discountedProducts = filterAndSortDiscountedProducts(products.nodes as RawDiscountProduct[]);
    const sortedProducts = discountedProducts;

    const pagination = buildPaginationData(products.pageInfo, page);

    const totalCount = sortedProducts.length;
    const maxDiscount = totalCount > 0 ? Math.max(...sortedProducts.map(p => p.maxDiscountPercentage)) : 0;

    const canonicalRedirect = getCanonicalRedirect(url, page, pagination.hasNextPage, pageParam);
    if (canonicalRedirect) {
        throw redirect(canonicalRedirect);
    }

    return {
        products: sortedProducts,
        totalCount,
        maxDiscount,
        pagination,
        sort,
        sortLabel
    };
};

export default function Sale() {
    const {products, totalCount, maxDiscount, pagination, sort, sortLabel} = useLoaderData<typeof loader>();

    const normalizedProducts = products.map(fromSaleProduct);

    const showPagination = pagination.hasNextPage || pagination.hasPreviousPage;

    return (
        <div className="min-h-screen bg-background text-foreground">
            <PageBreadcrumbs customTitle="Special Offers" />
            <AnimatedSection animation="fade" threshold={0.08}>
                <SaleHero totalCount={totalCount} maxDiscount={maxDiscount} products={products} />
            </AnimatedSection>

            <AnimatedSection animation="slide-up" threshold={0.1}>
                <div className="mx-auto max-w-[2000px] px-4 sm:px-6 lg:hidden lg:px-8">
                    <MobileSearchBar shopName="Store" />
                </div>
            </AnimatedSection>

            {totalCount > 0 && (
                <>
                    {/* Sort filter bar intentionally outside AnimatedSection so it renders immediately */}
                    <SortFilterBar currentSort={sort} totalProducts={totalCount} />

                    {showPagination && (
                        <AnimatedSection animation="fade" threshold={0.12}>
                            <div className="mx-auto max-w-[2000px] px-4 sm:px-6 lg:hidden lg:px-8">
                                <CollectionPagination {...pagination} />
                            </div>
                        </AnimatedSection>
                    )}

                    <AnimatedSection animation="slide-up" threshold={0.12}>
                        <ProductsGridSection
                            products={normalizedProducts}
                            pagination={pagination}
                            preserveOrder={true}
                            sortLabel={sortLabel}
                        />
                    </AnimatedSection>

                    {showPagination && (
                        <AnimatedSection animation="fade" threshold={0.08}>
                            <div className="mx-auto max-w-[2000px] px-4 pb-16 sm:px-6 lg:px-8">
                                <CollectionPagination {...pagination} />
                            </div>
                        </AnimatedSection>
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
    variants(first: 20) {
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
    $sortKey: ProductSortKeys
    $reverse: Boolean
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
      sortKey: $sortKey
      reverse: $reverse
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

export {RouteErrorBoundary as ErrorBoundary} from "~/components/RouteErrorBoundary";
