import {useState, useEffect, Suspense, useMemo} from "react";
import {
    useLoaderData,
    useRouteError,
    isRouteErrorResponse,
    Await,
    Link,
    type ShouldRevalidateFunction
} from "react-router";
import {Button} from "~/components/ui/button";
import {Badge} from "~/components/ui/badge";
import type {Route} from "./+types/products.$handle";
import {
    getSelectedProductOptions,
    Analytics,
    useOptimisticVariant,
    getProductOptions,
    getAdjacentAndFirstAvailableVariants,
    useSelectedOptionInUrlParam
} from "@shopify/hydrogen";
import {redirectIfHandleIsLocalized} from "~/lib/redirect";
import {calculateDiscount, formatShopifyMoney} from "~/lib/currency-formatter";
import {formatProductTitleForMeta} from "~/lib/product";
import {
    generateProductSchema,
    generateBreadcrumbListSchema,
    generateBrandSchema,
    getBrandNameFromMatches,
    getSiteUrlFromMatches,
    buildMeta
} from "~/lib/seo";
import {deriveProductBreadcrumbs} from "~/lib/seo-breadcrumbs";
import {getCatalogExtensionMeta} from "~/lib/agentic/structured-data";
import {normalizeProductAttributes} from "~/lib/agentic/attribute-normalizer";
import {useRecentlyViewedContext} from "~/components/RecentlyViewedProvider";
import {ProductImageSection} from "~/components/product/ProductImageSection";
import {ProductInfoSection} from "~/components/product/ProductInfoSection";
import {ProductMobileTitlePrice} from "~/components/product/ProductMobileTitlePrice";
import {ProductPurchaseSection} from "~/components/product/ProductPurchaseSection";
import {ProductMobileStickyButtons} from "~/components/product/ProductMobileStickyButtons";
import {ProductRelatedSection} from "~/components/product/ProductRelatedSection";
import {AnimatedSection} from "~/components/sections/AnimatedSection";
import {Breadcrumbs} from "~/components/common/Breadcrumbs";
import {ProductReviews, type ReviewNode} from "~/components/product/ProductReviews";
import {CatalogExtensionDisplay} from "~/components/product/CatalogExtensionDisplay";
import {AgentProductBrief} from "~/components/product/AgentProductBrief";
import {useAgentSurface} from "~/lib/agent-surface-context";

// Revalidate this route's loader whenever the URL search params change (e.g. variant selection).
// Without this, React Router may skip re-running the loader on search-param-only navigations,
// leaving adjacentVariants stale and producing wrong variant navigation URLs.
export const shouldRevalidate: ShouldRevalidateFunction = ({currentUrl, nextUrl, defaultShouldRevalidate}) => {
    if (currentUrl.search !== nextUrl.search) return true;
    return defaultShouldRevalidate;
};

export const meta: Route.MetaFunction = ({data, matches}) => {
    const siteUrl = getSiteUrlFromMatches(matches);
    const product = data?.product;
    if (!product) return [{title: "Product Not Found"}];

    const variant = product.selectedOrFirstAvailableVariant;
    const seoTitle = product.seo?.title;
    const title = seoTitle || formatProductTitleForMeta(product.title);
    const description = data?.seoDescription || "";
    const image = variant?.image || product.images?.nodes?.[0];
    const brandName = getBrandNameFromMatches(matches);
    const rootMatch = matches.find((m): m is (typeof matches)[number] & {id: "root"} => m?.id === "root");
    const siteSettings = (rootMatch?.data as any)?.siteContent?.siteSettings;

    const extensionFields = {
        isGiftCard: product.isGiftCard,
        collections: product.collections?.nodes?.map((c: any) => ({handle: c.handle, title: c.title})),
        requiresShipping: variant?.requiresShipping,
        sellingPlans: variant?.sellingPlanAllocations?.nodes?.map((a: any) => ({
            name: a.sellingPlan?.name ?? "Subscription",
            recurringDeliveries: a.sellingPlan?.recurringDeliveries ?? false
        }))
    };
    const normalizedAttributes = normalizeProductAttributes(
        variant?.selectedOptions ?? [],
        product.metafields?.filter(Boolean) ?? undefined
    );
    const productSchema = generateProductSchema(product, variant, null, siteUrl, extensionFields, normalizedAttributes);
    const breadcrumbs = deriveProductBreadcrumbs(product);
    const breadcrumbSchema = generateBreadcrumbListSchema(breadcrumbs, siteUrl);
    const brandSchema = generateBrandSchema(siteSettings, product.vendor);
    const sceMeta = getCatalogExtensionMeta({
        isGiftCard: product.isGiftCard,
        requiresShipping: variant?.requiresShipping,
        sellingPlans: variant?.sellingPlanAllocations?.nodes?.map((a: any) => ({
            name: a.sellingPlan?.name ?? "Subscription"
        })),
        collections: product.collections?.nodes?.map((c: any) => ({handle: c.handle, title: c.title})),
        quantityAvailable: variant?.quantityAvailable,
        currentlyNotInStock: variant?.currentlyNotInStock
    });

    return [
        ...buildMeta({
            title,
            description,
            pathname: `/products/${product.handle}`,
            siteUrl,
            brandName,
            ogImage: image?.url
                ? {url: image.url, width: image.width ?? undefined, height: image.height ?? undefined, alt: image.altText || product.title}
                : undefined,
            ogType: "product",
            jsonLd: [productSchema, breadcrumbSchema, brandSchema]
        }),
        ...sceMeta
    ] as any;
};

export function links(args?: {data: Awaited<ReturnType<typeof loader>> | null}) {
    const data = args?.data;
    // Preload first product image for LCP — this is the dominant above-fold element
    const href = data?.product?.images?.nodes?.[0]?.url;
    if (!href) return [];
    return [{rel: "preload", as: "image", href}] as const;
}

export const loader = async (args: Route.LoaderArgs) => {
    const criticalData = await loadCriticalData(args);
    const deferredData = loadDeferredData(args, criticalData.product.id);
    return {...criticalData, ...deferredData};
};

/**
 * Loads the product, resolves the selected variant from URL options, and derives
 * the active collection handle for breadcrumbs. Pre-truncates the SEO description
 * server-side to prevent hydration mismatches in the meta function.
 */
const loadCriticalData = async ({context, params, request}: Route.LoaderArgs) => {
    const {handle} = params;
    const {dataAdapter} = context;

    if (!handle) {
        throw new Error("Expected product handle to be defined");
    }

    const {product} = await dataAdapter.query(PRODUCT_QUERY, {
        variables: {handle, selectedOptions: getSelectedProductOptions(request)},
        cache: dataAdapter.CacheShort()
    });

    if (!product?.id) {
        throw new Response(null, {status: 404});
    }

    redirectIfHandleIsLocalized(request, {handle, data: product});

    const productCollectionHandles = product.collections?.nodes?.map((c: any) => c.handle) ?? [];
    const activeCollectionHandle = productCollectionHandles[0] || "all-products";

    const url = new URL(request.url);
    const selectedSellingPlanId = url.searchParams.get("selling_plan");
    let selectedSellingPlan = null;

    if (selectedSellingPlanId && product.sellingPlanGroups?.nodes) {
        for (const group of product.sellingPlanGroups.nodes) {
            const plan = group.sellingPlans.nodes.find((p: any) => p.id === selectedSellingPlanId);
            if (plan) {
                selectedSellingPlan = plan;
                break;
            }
        }
    }

    // Pre-compute truncated SEO description in the loader so the serialized value
    // is identical on server and client, preventing hydration mismatches in the meta function.
    const rawSeoDescription = product.seo?.description || product.description || "";
    const seoDescription =
        rawSeoDescription.length > 155 ? rawSeoDescription.substring(0, 152).trimEnd() + "..." : rawSeoDescription;

    return {
        product,
        selectedSellingPlan,
        activeCollectionHandle,
        seoDescription
    };
};

/** Loads product recommendations and metafield-based reviews without blocking the render. */
const loadDeferredData = ({context}: Route.LoaderArgs, productId: string) => {
    const {dataAdapter} = context;

    // Fetch RELATED (similar items) and COMPLEMENTARY (items that pair with this one)
    // in a single GraphQL request via aliased fields — surfaced as two distinct PDP rails.
    const allRecommendations = dataAdapter
        .query(RECOMMENDATIONS_QUERY, {
            variables: {productId},
            cache: dataAdapter.CacheShort()
        })
        .catch((error: unknown) => {
            console.error("Failed to load product recommendations:", error);
            return null;
        });

    const recommendations = allRecommendations.then(data => data?.related ?? []);
    const complementaryRecommendations = allRecommendations.then(data => data?.complementary ?? []);

    const reviews = dataAdapter
        .query(PRODUCT_REVIEWS_QUERY, {
            variables: {id: productId},
            cache: dataAdapter.CacheShort()
        })
        .then((data: any) => (data.product?.reviews?.references?.nodes ?? []) as ReviewNode[])
        .catch(() => [] as ReviewNode[]);

    return {recommendations, complementaryRecommendations, reviews};
};

const Product = () => {
    const {product, recommendations, complementaryRecommendations, reviews, selectedSellingPlan, activeCollectionHandle} =
        useLoaderData<typeof loader>();
    const [quantity, setQuantity] = useState(1);
    const {addProduct} = useRecentlyViewedContext();

    const selectedVariant = useOptimisticVariant(
        product.selectedOrFirstAvailableVariant,
        getAdjacentAndFirstAvailableVariants(product)
    );

    useSelectedOptionInUrlParam(selectedVariant.selectedOptions);

    const productOptions = getProductOptions({
        ...product,
        selectedOrFirstAvailableVariant: selectedVariant
    });

    const agentSurface = useAgentSurface();

    const productImages = useMemo(
        () => product?.images?.nodes?.map((node: any) => ({id: node.id, url: node.url, altText: node.altText})) ?? [],
        [product]
    );

    const discountPercentage = useMemo(() => {
        if (!selectedVariant?.compareAtPrice?.amount || !selectedVariant?.price?.amount) return undefined;
        const originalPrice = parseFloat(selectedVariant.compareAtPrice.amount);
        const salePrice = parseFloat(selectedVariant.price.amount);
        if (originalPrice > salePrice) {
            return calculateDiscount(originalPrice, salePrice).percentage;
        }
        return undefined;
    }, [selectedVariant]);

    const onSale = useMemo(() => {
        if (!selectedVariant?.compareAtPrice?.amount || !selectedVariant?.price?.amount) return false;
        return parseFloat(selectedVariant.compareAtPrice.amount) > parseFloat(selectedVariant.price.amount);
    }, [selectedVariant]);

    useEffect(() => {
        if (product?.id && product?.handle && product?.title) {
            const timeoutId = setTimeout(() => {
                addProduct({
                    id: product.id,
                    handle: product.handle,
                    title: product.title,
                    imageUrl: product.images?.nodes?.[0]?.url ?? null,
                    imageAlt: product.images?.nodes?.[0]?.altText ?? null,
                    price: selectedVariant?.price ? formatShopifyMoney(selectedVariant.price) : "",
                    compareAtPrice: selectedVariant?.compareAtPrice
                        ? formatShopifyMoney(selectedVariant.compareAtPrice)
                        : undefined
                });
            }, 1000);
            return () => clearTimeout(timeoutId);
        }
    }, [
        product?.id,
        product?.handle,
        product?.title,
        product?.images,
        selectedVariant?.id,
        selectedVariant?.price,
        selectedVariant?.compareAtPrice,
        addProduct
    ]);

    const analyticsProductViewData = useMemo(
        () => ({
            products: [
                {
                    id: product.id,
                    title: product.title,
                    price: selectedVariant?.price?.amount || "0",
                    vendor: product.vendor,
                    variantId: selectedVariant?.id || "",
                    variantTitle: selectedVariant?.title || "",
                    quantity: 1
                }
            ]
        }),
        [product.id, product.title, product.vendor, selectedVariant]
    );

    // Build breadcrumb items based on the product's active collection
    const breadcrumbItems = useMemo(() => {
        const activeCollection = product.collections?.nodes?.find(
            (c: {handle: string}) => c.handle === activeCollectionHandle
        );
        const items: Array<{label: string; href?: string}> = [];
        if (activeCollection && activeCollection.handle !== "all-products") {
            items.push({label: activeCollection.title, href: `/collections/${activeCollection.handle}`});
        } else {
            items.push({label: "Products", href: "/collections/all-products"});
        }
        const breadcrumbTitle = product.title.includes("+") ? product.title.split("+")[0].trim() : product.title;
        items.push({label: breadcrumbTitle});
        return items;
    }, [product.collections?.nodes, activeCollectionHandle, product.title]);

    // Agent path: spec-first dense view — no image gallery, no carousels.
    if (agentSurface.isAgent) {
        return (
            <AgentProductBrief product={product} selectedVariant={selectedVariant} productOptions={productOptions} />
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Breadcrumbs */}
            <div className="px-2 pt-4 pb-2 md:px-4">
                <Breadcrumbs items={breadcrumbItems} className="mx-auto max-w-[2000px]" />
            </div>

            <AnimatedSection animation="fade" threshold={0.08}>
                <section className="pt-4 md:pt-6">
                    <div className="mx-auto max-w-[2000px] px-2 md:px-4">
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-12">
                            <ProductImageSection
                                productImages={productImages}
                                product={product}
                                onSale={onSale}
                                availableForSale={selectedVariant?.availableForSale ?? true}
                                media={(product as any).media?.nodes ?? []}
                            />

                            <ProductMobileTitlePrice
                                product={product}
                                discountPercentage={discountPercentage}
                                productId={product.id}
                                availableForSale={selectedVariant?.availableForSale ?? product.availableForSale}
                            />

                            <div className="lg:hidden">
                                <ProductPurchaseSection
                                    product={product}
                                    selectedVariant={selectedVariant}
                                    productOptions={productOptions}
                                    selectedSellingPlan={selectedSellingPlan}
                                    quantity={quantity}
                                    onQuantityChange={setQuantity}
                                    discountPercentage={discountPercentage}
                                />
                            </div>

                            <div className="hidden lg:col-span-4 lg:block">
                                <ProductInfoSection
                                    product={product}
                                    discountPercentage={discountPercentage}
                                    productId={product.id}
                                    availableForSale={selectedVariant?.availableForSale ?? product.availableForSale}
                                />
                                <CatalogExtensionDisplay
                                    isGiftCard={product.isGiftCard}
                                    requiresShipping={selectedVariant?.requiresShipping}
                                    sellingPlans={selectedVariant?.sellingPlanAllocations?.nodes?.map((a: any) => ({
                                        name: a.sellingPlan?.name ?? "Subscription",
                                        recurringDeliveries: a.sellingPlan?.recurringDeliveries ?? false
                                    }))}
                                    collections={product.collections?.nodes?.map((c: any) => ({
                                        handle: c.handle,
                                        title: c.title
                                    }))}
                                    className="mt-3"
                                />
                            </div>

                            <div className="lg:hidden">
                                <ProductInfoSection
                                    product={product}
                                    discountPercentage={discountPercentage}
                                    productId={product.id}
                                    availableForSale={selectedVariant?.availableForSale ?? product.availableForSale}
                                />
                                <CatalogExtensionDisplay
                                    isGiftCard={product.isGiftCard}
                                    requiresShipping={selectedVariant?.requiresShipping}
                                    sellingPlans={selectedVariant?.sellingPlanAllocations?.nodes?.map((a: any) => ({
                                        name: a.sellingPlan?.name ?? "Subscription",
                                        recurringDeliveries: a.sellingPlan?.recurringDeliveries ?? false
                                    }))}
                                    collections={product.collections?.nodes?.map((c: any) => ({
                                        handle: c.handle,
                                        title: c.title
                                    }))}
                                    className="mt-3"
                                />
                            </div>

                            <div className="hidden lg:col-span-4 lg:block">
                                <ProductPurchaseSection
                                    product={product}
                                    selectedVariant={selectedVariant}
                                    productOptions={productOptions}
                                    selectedSellingPlan={selectedSellingPlan}
                                    quantity={quantity}
                                    onQuantityChange={setQuantity}
                                    discountPercentage={discountPercentage}
                                />
                            </div>
                        </div>
                    </div>
                </section>
            </AnimatedSection>

            <AnimatedSection animation="fade" threshold={0.08}>
                <Suspense fallback={null}>
                    <Await resolve={reviews}>
                        {resolvedReviews => <ProductReviews reviews={resolvedReviews ?? []} />}
                    </Await>
                </Suspense>
            </AnimatedSection>

            <AnimatedSection animation="slide-up" threshold={0.12}>
                <Suspense fallback={null}>
                    <Await resolve={recommendations}>
                        {resolvedRecs =>
                            resolvedRecs && resolvedRecs.length > 0 ? (
                                <ProductRelatedSection relatedProducts={resolvedRecs} />
                            ) : null
                        }
                    </Await>
                </Suspense>
            </AnimatedSection>

            {/* Complementary rail — items that pair with this product (Shopify intent: COMPLEMENTARY).
                Often empty when the merchant hasn't seeded complementary data; we render nothing in that case. */}
            <AnimatedSection animation="slide-up" threshold={0.12}>
                <Suspense fallback={null}>
                    <Await resolve={complementaryRecommendations}>
                        {resolvedRecs =>
                            resolvedRecs && resolvedRecs.length > 0 ? (
                                <ProductRelatedSection
                                    relatedProducts={resolvedRecs}
                                    title="These pair"
                                    subtitle="beautifully together"
                                />
                            ) : null
                        }
                    </Await>
                </Suspense>
            </AnimatedSection>

            <ProductMobileStickyButtons
                product={product}
                selectedVariant={selectedVariant}
                selectedSellingPlan={selectedSellingPlan}
                quantity={quantity}
                onQuantityChange={setQuantity}
            />

            <Analytics.ProductView data={analyticsProductViewData} />
        </div>
    );
};

export default Product;

export const ErrorBoundary = () => {
    const error = useRouteError();
    let status = 500;
    let message = "An unexpected error occurred";

    if (isRouteErrorResponse(error)) {
        status = error.status;
        message = error.data?.message ?? error.data;
    } else if (error instanceof Error) {
        message = error.message;
    }

    const title = status === 404 ? "Product Not Found" : "An Error Occurred";

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
                        <p className="mx-auto max-w-lg text-lg leading-relaxed text-muted-foreground">{message}</p>
                        <p className="text-sm font-medium text-primary/80">Let&apos;s get you back on track</p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4">
                        <Button asChild>
                            <Link to="/collections/all-products">Browse All Products</Link>
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
};

const PRODUCT_VARIANT_FRAGMENT = `#graphql
  fragment ProductVariant on ProductVariant {
    availableForSale
    quantityAvailable
    compareAtPrice {
      amount
      currencyCode
    }
    id
    image {
      __typename
      id
      url
      altText
      width
      height
    }
    price {
      amount
      currencyCode
    }
    product {
      title
      handle
    }
    selectedOptions {
      name
      value
    }
    sku
    barcode
    currentlyNotInStock
    requiresShipping
    title
    unitPrice {
      amount
      currencyCode
    }
    sellingPlanAllocations(first: 250) {
      nodes {
        sellingPlan {
          id
          name
          options {
            name
            value
          }
          priceAdjustments {
            adjustmentValue {
              __typename
              ... on SellingPlanPercentagePriceAdjustment {
                adjustmentPercentage
              }
              ... on SellingPlanFixedAmountPriceAdjustment {
                adjustmentAmount {
                  amount
                  currencyCode
                }
              }
              ... on SellingPlanFixedPriceAdjustment {
                price {
                  amount
                  currencyCode
                }
              }
            }
          }
        }
        priceAdjustments {
          price {
            amount
            currencyCode
          }
          compareAtPrice {
            amount
            currencyCode
          }
          perDeliveryPrice {
            amount
            currencyCode
          }
        }
      }
    }
  }
` as const;

const PRODUCT_FRAGMENT = `#graphql
  fragment Product on Product {
    id
    title
    vendor
    handle
    descriptionHtml
    description
    tags
    productType
    publishedAt
    isGiftCard
    encodedVariantExistence
    encodedVariantAvailability
    collections(first: 5) {
      nodes {
        id
        handle
        title
      }
    }
    images(first: 250) {
      nodes {
        id
        url
        altText
        width
        height
      }
    }
    media(first: 250) {
      nodes {
        __typename
        mediaContentType
        ... on MediaImage {
          id
          alt
          image {
            id
            url
            altText
            width
            height
          }
        }
        ... on Video {
          id
          alt
          sources {
            url
            mimeType
            height
            width
          }
          previewImage {
            url
            altText
            width
            height
          }
        }
        ... on ExternalVideo {
          id
          alt
          embedUrl
          previewImage {
            url
            altText
            width
            height
          }
        }
        ... on Model3d {
          id
          alt
          previewImage {
            url
            altText
            width
            height
          }
        }
      }
    }
    variants(first: 250) {
      nodes {
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
    }
    options {
      name
      optionValues {
        name
        firstSelectableVariant {
          ...ProductVariant
        }
        swatch {
          color
          image {
            previewImage {
              url
            }
          }
        }
      }
    }
    selectedOrFirstAvailableVariant(selectedOptions: $selectedOptions, ignoreUnknownOptions: true, caseInsensitiveMatch: true) {
      ...ProductVariant
    }
    adjacentVariants(selectedOptions: $selectedOptions) {
      ...ProductVariant
    }
    seo {
      description
      title
    }
    requiresSellingPlan
    sellingPlanGroups(first: 250) {
      nodes {
        name
        appName
        options {
          name
          values
        }
        sellingPlans(first: 250) {
          nodes {
            id
            name
            description
            recurringDeliveries
            options {
              name
              value
            }
            priceAdjustments {
              adjustmentValue {
                __typename
                ... on SellingPlanPercentagePriceAdjustment {
                  adjustmentPercentage
                }
                ... on SellingPlanFixedAmountPriceAdjustment {
                  adjustmentAmount {
                    amount
                    currencyCode
                  }
                }
                ... on SellingPlanFixedPriceAdjustment {
                  price {
                    amount
                    currencyCode
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  ${PRODUCT_VARIANT_FRAGMENT}
` as const;

const PRODUCT_QUERY = `#graphql
  query Product(
    $country: CountryCode
    $handle: String!
    $language: LanguageCode
    $selectedOptions: [SelectedOptionInput!]!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      ...Product
    }
  }
  ${PRODUCT_FRAGMENT}
` as const;

const RECOMMENDED_PRODUCT_FRAGMENT = `#graphql
  fragment RecommendedProduct on Product {
    id
    handle
    title
    availableForSale
    tags
    featuredImage {
      id
      altText
      url
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
    variants(first: 3) {
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
      }
    }
  }
` as const;

const PRODUCT_REVIEWS_QUERY = `#graphql
  query ProductReviews($id: ID!) {
    product(id: $id) {
      reviews: metafield(namespace: "custom", key: "reviews") {
        references(first: 250) {
          nodes {
            ... on Metaobject {
              reviewerName: field(key: "reviewer_name") { value }
              rating: field(key: "rating") { value }
              reviewTitle: field(key: "review_title") { value }
              body: field(key: "body") { value }
              date: field(key: "date") { value }
            }
          }
        }
      }
    }
  }
` as const;

const RECOMMENDATIONS_QUERY = `#graphql
  query ProductPageRecommendations(
    $productId: ID!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    productRecommendations(productId: $productId) {
      ...RecommendedProduct
    }
  }
  ${RECOMMENDED_PRODUCT_FRAGMENT}
` as const;
