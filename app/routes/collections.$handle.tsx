import {redirect, useLoaderData, useRouteError, isRouteErrorResponse} from "react-router";
import {Button} from "~/components/ui/button";
import {Badge} from "~/components/ui/badge";
import type {Route} from "./+types/collections.$handle";
import {Analytics, getSeoMeta} from "@shopify/hydrogen";
import {buildCanonicalUrl, getSiteUrlFromMatches, generateCollectionSchema} from "~/lib/seo";
import {CollectionHero} from "~/components/sections/CollectionHero";
import {ProductsGridSection} from "~/components/sections/ProductsGridSection";
import {CollectionPagination} from "~/components/custom/CollectionPagination";
import {MobileSearchBar} from "~/components/layout/MobileSearchBar";
import {PageBreadcrumbs} from "~/components/common/PageBreadcrumbs";
import {AnimatedSection} from "~/components/sections/AnimatedSection";
import {fromStorefrontNode} from "~/lib/product/product-card-normalizers";
import {
    parsePaginationParams,
    buildPaginationVariables,
    buildPaginationData,
    getCanonicalRedirect
} from "~/lib/collection-route-helpers";
import {sortWithPinnedFirst} from "~/lib/product-tags";

const redirectIfHandleIsLocalized = (
    request: Request,
    ...resources: Array<{handle: string; data: {handle: string}}>
) => {
    const url = new URL(request.url);
    let shouldRedirect = false;
    resources.forEach(({handle, data}) => {
        if (handle !== data.handle) {
            url.pathname = url.pathname.replace(handle, data.handle);
            shouldRedirect = true;
        }
    });
    if (shouldRedirect) throw redirect(url.toString());
};

export const meta: Route.MetaFunction = ({data, matches}) => {
    if (!data || !data.collection) {
        return [{title: "Collection"}];
    }

    const collection = data.collection;
    const siteUrl = getSiteUrlFromMatches(matches);
    const title = collection.seo?.title || `${collection.title} Collection`;
    const description = collection.seo?.description || collection.description || "";

    const collectionSchema = generateCollectionSchema(
        collection,
        data.products as unknown as Array<{title: string; handle: string}>
    );

    return (
        getSeoMeta({
            title,
            description,
            url: buildCanonicalUrl(`/collections/${collection.handle}`, siteUrl),
            media: collection.image?.url
                ? {
                      url: collection.image.url,
                      width: collection.image.width,
                      height: collection.image.height,
                      altText: collection.image.altText || collection.title,
                      type: "image" as const
                  }
                : undefined,
            jsonLd: collectionSchema as any
        }) ?? []
    );
};

export const loader = async ({context, params, request}: Route.LoaderArgs) => {
    const {handle} = params;
    const {dataAdapter} = context;
    const url = new URL(request.url);

    if (!handle) {
        throw redirect("/collections");
    }

    // Parse pagination params
    const {cursor, page, direction} = parsePaginationParams(url);
    const pageParam = url.searchParams.get("page");

    // Build GraphQL variables for cursor-based pagination
    const variables = buildPaginationVariables(cursor, direction, 48);

    // Server-side filtering: only fetch available products
    const filters = [{available: true}];

    // Server-side sorting: price low to high (Shopify's PRICE sort key)
    const sortKey = "PRICE";

    // Query collection with server-side filters and sorting
    const {collection} = await dataAdapter.query(COLLECTION_QUERY, {
        variables: {
            handle,
            ...variables,
            filters,
            sortKey
        },
        cache: dataAdapter.CacheShort()
    });

    if (!collection) {
        throw new Response(`Collection ${handle} not found`, {status: 404});
    }

    redirectIfHandleIsLocalized(request, {handle, data: collection});

    // Products are already filtered and sorted by GraphQL; apply pin sorting on top
    const products = sortWithPinnedFirst(collection.products.nodes);

    // Build pagination data
    const pagination = buildPaginationData(collection.products.pageInfo, page);

    // Check for canonical redirect
    const canonicalRedirect = getCanonicalRedirect(url, page, pagination.hasNextPage, pageParam);
    if (canonicalRedirect) {
        throw redirect(canonicalRedirect);
    }

    return {
        collection,
        products,
        pagination
    };
};

export default function CollectionPage() {
    const {collection, products, pagination} = useLoaderData<typeof loader>();

    // Normalize products for display
    const normalizedProducts = products.map(fromStorefrontNode);

    const showPagination = pagination.hasNextPage || pagination.hasPreviousPage;

    return (
        <div className="min-h-dvh bg-background text-foreground">
            {/* Breadcrumbs */}
            <PageBreadcrumbs customTitle={collection.title} />

            <AnimatedSection animation="fade" threshold={0.08}>
                <CollectionHero collection={collection} />
            </AnimatedSection>

            <AnimatedSection animation="slide-up" threshold={0.1}>
                <div className="mx-auto max-w-[2000px] px-2 md:px-4 lg:hidden">
                    <MobileSearchBar shopName="Store" />
                </div>
            </AnimatedSection>

            {showPagination && (
                <AnimatedSection animation="fade" threshold={0.12}>
                    <div className="mx-auto max-w-[2000px] px-2 md:px-4 lg:hidden">
                        <CollectionPagination {...pagination} />
                    </div>
                </AnimatedSection>
            )}

            <AnimatedSection animation="slide-up" threshold={0.12}>
                <ProductsGridSection products={normalizedProducts} pagination={pagination} preserveOrder={true} />
            </AnimatedSection>

            {showPagination && (
                <AnimatedSection animation="fade" threshold={0.08}>
                    <div className="mx-auto max-w-[2000px] px-2 pb-16 md:px-4">
                        <CollectionPagination {...pagination} />
                    </div>
                </AnimatedSection>
            )}

            <Analytics.CollectionView
                data={{
                    collection: {
                        id: collection.id,
                        handle: collection.handle
                    }
                }}
            />
        </div>
    );
}

export function ErrorBoundary() {
    const error = useRouteError();
    let status = 500;
    let message = "An unexpected error occurred";

    if (isRouteErrorResponse(error)) {
        status = error.status;
        message = error.data?.message ?? error.data;
    } else if (error instanceof Error) {
        message = error.message;
    }

    const title = status === 404 ? "Collection Not Found" : "Something Went Wrong";

    return (
        <section className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-4 pt-6 pb-10">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--color-primary)_0%,_transparent_50%)] opacity-[0.03]" />
            <div className="relative mx-auto w-full max-w-2xl text-center">
                <div className="space-y-6">
                    <div className="inline-flex items-center">
                        <Badge variant="outline" className="px-4 py-1.5 text-xs font-medium">
                            Error {status}
                        </Badge>
                    </div>
                    <div className="space-y-4">
                        <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-6xl">{title}</h1>
                        <p className="mx-auto max-w-lg text-lg leading-relaxed text-muted-foreground">
                            {status === 404
                                ? "The collection you're looking for doesn't exist or has been moved."
                                : message}
                        </p>
                        <p className="text-sm font-medium text-primary/80">Let&apos;s get you back on track</p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4">
                        <Button asChild>
                            <a href="/collections">Browse All Collections</a>
                        </Button>
                    </div>
                    <div className="sr-only">
                        <h3>Error {status}</h3>
                        <p>Navigate to: Collections</p>
                    </div>
                </div>
            </div>
        </section>
    );
}

const COLLECTION_QUERY = `#graphql
  query Collection(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $after: String
    $before: String
    $filters: [ProductFilter!]
    $sortKey: ProductCollectionSortKeys
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      descriptionHtml
      seo {
        title
        description
      }
      image {
        id
        url
        altText
        width
        height
      }
      products(
        first: $first
        last: $last
        after: $after
        before: $before
        filters: $filters
        sortKey: $sortKey
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
  }
` as const;
