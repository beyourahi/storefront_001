import {redirect, useLoaderData, useRouteError, isRouteErrorResponse} from "react-router";
import {Button} from "~/components/ui/button";
import {Badge} from "~/components/ui/badge";
import type {Route} from "./+types/collections.$handle";
import {Analytics, getSeoMeta} from "@shopify/hydrogen";
import {buildCanonicalUrl, getBrandNameFromMatches, getRequiredSocialMeta, getSiteUrlFromMatches, generateCollectionSchema, generateBreadcrumbListSchema} from "~/lib/seo";
import {deriveCollectionBreadcrumbs} from "~/lib/seo-breadcrumbs";
import {CollectionHero} from "~/components/sections/CollectionHero";
import {ProductsGridSection} from "~/components/sections/ProductsGridSection";
import {CollectionPagination} from "~/components/custom/CollectionPagination";
import {MobileSearchBar} from "~/components/layout/MobileSearchBar";
import {PageBreadcrumbs} from "~/components/common/PageBreadcrumbs";
import {AnimatedSection} from "~/components/sections/AnimatedSection";
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
import {SIDEBAR_COLLECTIONS_QUERY} from "~/lib/fragments";
import {withTimeoutAndFallback, TIMEOUT_DEFAULTS} from "~/lib/promise-utils";
import {scoreProducts, extractAffinitySignals} from "~/lib/agentic/affinity";

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
        data.products as unknown as Array<{title: string; handle: string}>,
        siteUrl
    );
    const brandName = getBrandNameFromMatches(matches);

    return [
        ...(getSeoMeta({
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
        }) ?? []),
        {"script:ld+json": generateBreadcrumbListSchema(deriveCollectionBreadcrumbs(collection), siteUrl) as any},
        ...getRequiredSocialMeta("website", brandName, collection.image?.url ?? undefined)
    ];
};

export function links(args?: { data: Awaited<ReturnType<typeof loader>> | null }) {
    const data = args?.data;
    // Preload first product's featured image for LCP — first card in collection grid
    const href = (data?.products as any[] | undefined)?.[0]?.featuredImage?.url;
    if (!href) return [];
    return [{ rel: "preload", as: "image", href }] as const;
}

export async function loader(args: Route.LoaderArgs) {
    const criticalData = await loadCriticalData(args);
    const deferredData = loadDeferredData(args);
    return {...deferredData, ...criticalData};
}

/**
 * Loads collection metadata and the first page of products. Applies server-side
 * affinity re-ranking for authenticated customers on top of the GraphQL sort order.
 * Throws a redirect if the handle is localized or the page param is out of range.
 */
async function loadCriticalData({context, params, request}: Route.LoaderArgs) {
    const {handle} = params;
    const {dataAdapter} = context;
    const url = new URL(request.url);

    if (!handle) {
        throw redirect("/collections");
    }

    const {cursor, page, direction} = parsePaginationParams(url);
    const pageParam = url.searchParams.get("page");
    const {sort, sortKey, reverse, sortLabel} = parseSortFilterParams(url);
    const variables = buildPaginationVariables(cursor, direction, 48);

    const [{collection}, collectionCountData] = await Promise.all([
        // Main collection + paginated products (CacheShort for live inventory/availability)
        dataAdapter.query(COLLECTION_QUERY, {
            variables: {
                handle,
                ...variables,
                sortKey,
                reverse
            },
            cache: dataAdapter.CacheShort()
        }),
        // Lightweight count query for accurate total (CacheLong — catalog metadata changes rarely)
        dataAdapter.query(COLLECTION_COUNT_QUERY, {
            variables: {handle},
            cache: dataAdapter.CacheLong()
        })
    ]);

    if (!collection) {
        throw new Response(`Collection ${handle} not found`, {status: 404});
    }

    redirectIfHandleIsLocalized(request, {handle, data: collection});

    // Products are already filtered and sorted by GraphQL; apply pin sorting on top
    let productNodes = sortWithPinnedFirst(collection.products.nodes);
    const pagination = buildPaginationData(collection.products.pageInfo, page);

    // SmartCollections: server-side affinity re-ranking for authenticated customers.
    // Fetch the customer's recent order history and surface previously-purchased-brand
    // products first, then fall back to the original GraphQL order for anonymous users.
    try {
        const {customerAccount} = context;
        const isAuthenticated = await customerAccount.isLoggedIn();

        if (isAuthenticated) {
            const ordersResponse = await customerAccount.query(CUSTOMER_AFFINITY_ORDERS_QUERY, {
                variables: {first: 10}
            }) as any;

            const orderNodes: any[] = ordersResponse?.data?.customer?.orders?.nodes ?? [];

            // Flatten all order line items into AffinitySignal-compatible objects
            const orderLines = orderNodes.flatMap((order: any) =>
                (order.lineItems?.nodes ?? []).map((line: any) => ({
                    productId: line.variant?.product?.id ?? "",
                    quantity: line.quantity as number,
                    processedAt: order.processedAt as string
                }))
            ).filter((line: any) => line.productId !== "");

            if (orderLines.length > 0) {
                const signals = extractAffinitySignals(orderLines);
                // Cast required: ProductWithTags uses [key: string]: unknown index signature,
                // which is incompatible with {id: string} despite id being present at runtime.
                productNodes = scoreProducts(productNodes as any, signals) as typeof productNodes;
            }
        }
    } catch {
        // Graceful degradation: any auth or API failure leaves the original product order intact
    }

    const canonicalRedirect = getCanonicalRedirect(url, page, pagination.hasNextPage, pageParam);
    if (canonicalRedirect) {
        throw redirect(canonicalRedirect);
    }

    // Accurate product count from lightweight query (up to 250); main query paginates at 48
    const collectionProductCount =
        (collectionCountData as {collection?: {products?: {nodes?: {id: string}[]}}})
            ?.collection?.products?.nodes?.length ?? 0;

    return {
        collection,
        products: productNodes,
        pagination,
        sort,
        sortLabel,
        collectionProductCount
    };
}

/** Loads sidebar collection data without blocking the render. Falls back to null on timeout or error. */
function loadDeferredData({context}: Route.LoaderArgs) {
    const {dataAdapter} = context;

    const sidebarData = withTimeoutAndFallback(
        dataAdapter
            .query(SIDEBAR_COLLECTIONS_QUERY, {cache: dataAdapter.CacheLong()})
            .catch((error: unknown) => {
                console.error("Failed to load sidebar collections:", error);
                return null;
            }),
        null,
        TIMEOUT_DEFAULTS.API
    );

    return {sidebarData};
}

export default function CollectionPage() {
    const {collection, products, pagination, sort, sortLabel} =
        useLoaderData<typeof loader>();

    const normalizedProducts = products.map(fromStorefrontNode);

    const showPagination = pagination.hasNextPage || pagination.hasPreviousPage;

    return (
        <div className="min-h-screen bg-background text-foreground">
            <PageBreadcrumbs customTitle={collection.title} />

            <AnimatedSection animation="fade" threshold={0.08}>
                <CollectionHero collection={collection} />
            </AnimatedSection>

            <AnimatedSection animation="slide-up" threshold={0.1}>
                <div className="mx-auto max-w-[2000px] px-2 md:px-4 lg:hidden">
                    <MobileSearchBar shopName="Store" />
                </div>
            </AnimatedSection>

            <SortFilterBar
                currentSort={sort}
                totalProducts={normalizedProducts.length}
            />

            {showPagination && (
                <AnimatedSection animation="fade" threshold={0.12}>
                    <div className="mx-auto max-w-[2000px] px-2 md:px-4 lg:hidden">
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
    $sortKey: ProductCollectionSortKeys
    $reverse: Boolean
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
        sortKey: $sortKey
        reverse: $reverse
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
              quantityAvailable
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

// Minimal Customer Account API query for affinity signal extraction.
// Fetches only the fields needed to build AffinitySignal[]: product IDs, quantities,
// and order timestamps. Kept lightweight on purpose — 10 orders × 20 line items max.
const CUSTOMER_AFFINITY_ORDERS_QUERY = `
  query CustomerAffinityOrders($first: Int!) {
    customer {
      orders(first: $first, sortKey: PROCESSED_AT, reverse: true) {
        nodes {
          processedAt
          lineItems(first: 20) {
            nodes {
              quantity
              variant {
                product {
                  id
                }
              }
            }
          }
        }
      }
    }
  }
` as const;

// Lightweight query to get accurate product count for a collection.
// The main COLLECTION_QUERY paginates at 48, so .nodes.length would cap at page size.
const COLLECTION_COUNT_QUERY = `#graphql
  query CollectionCount(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      products(first: 250) {
        nodes { id }
        pageInfo { hasNextPage }
      }
    }
  }
` as const;
