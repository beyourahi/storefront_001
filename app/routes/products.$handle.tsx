import {useState, useEffect, Suspense, useMemo} from "react";
import {useLoaderData, useRouteError, isRouteErrorResponse, Await, Link, type ShouldRevalidateFunction} from "react-router";
import {Button} from "~/components/ui/button";
import {Badge} from "~/components/ui/badge";
import type {Route} from "./+types/products.$handle";
import {
    getSelectedProductOptions,
    Analytics,
    useOptimisticVariant,
    getProductOptions,
    getAdjacentAndFirstAvailableVariants,
    useSelectedOptionInUrlParam,
    getSeoMeta
} from "@shopify/hydrogen";
import {redirectIfHandleIsLocalized} from "~/lib/redirect";
import {calculateDiscount, formatShopifyMoney} from "~/lib/currency-formatter";
import {createProductSchema} from "~/lib/structured-data";
import {parseSizeChart} from "~/lib/size-chart";
import {SizeChartButton} from "~/components/product/SizeChartButton";
import {useRecentlyViewedContext} from "~/components/RecentlyViewedProvider";
import {ProductImageSection} from "~/components/product/ProductImageSection";
import {ProductInfoSection} from "~/components/product/ProductInfoSection";
import {ProductMobileTitlePrice} from "~/components/product/ProductMobileTitlePrice";
import {ProductPurchaseSection} from "~/components/product/ProductPurchaseSection";
import {ProductMobileStickyButtons} from "~/components/product/ProductMobileStickyButtons";
import {ProductRelatedSection} from "~/components/product/ProductRelatedSection";
import {AnimatedSection} from "~/components/sections/AnimatedSection";

export const shouldRevalidate: ShouldRevalidateFunction = ({
    formMethod,
    currentUrl,
    nextUrl,
    defaultShouldRevalidate
}) => {
    if (formMethod && formMethod !== "GET") return true;
    if (currentUrl.toString() === nextUrl.toString()) return true;
    return defaultShouldRevalidate;
};

export const meta: Route.MetaFunction = ({data, matches}) => {
    const rootData = (
        matches.find(m => m?.id === "root") as
            | {data?: {siteContent?: {siteSettings?: {brandName?: string; siteUrl?: string}}}}
            | undefined
    )?.data;
    const shopName = rootData?.siteContent?.siteSettings?.brandName ?? "Store";
    const siteUrl = rootData?.siteContent?.siteSettings?.siteUrl ?? "";

    const product = data?.product;
    if (!product) return [{title: `Product Not Found | ${shopName}`}];

    const variant = product.selectedOrFirstAvailableVariant;
    const title = product.seo?.title || product.title;
    const description = product.seo?.description || product.description?.substring(0, 155) || "";
    const image = variant?.image || product.images?.nodes?.[0];

    const url = siteUrl ? `${siteUrl}/products/${product.handle}` : `/products/${product.handle}`;

    const seoMeta =
        getSeoMeta({
            title: `${title} | ${shopName}`,
            description,
            url,
            media: image?.url
                ? {
                      url: image.url,
                      width: image.width,
                      height: image.height,
                      altText: image.altText || product.title,
                      type: "image" as const
                  }
                : undefined
        }) ?? [];

    const productSchema = createProductSchema(product, url);

    return [...seoMeta, {"script:ld+json": JSON.stringify(productSchema)}];
};

export const loader = async (args: Route.LoaderArgs) => {
    const criticalData = await loadCriticalData(args);
    const deferredData = loadDeferredData(args, criticalData.product.id);
    return {...criticalData, ...deferredData};
};

const loadCriticalData = async ({context, params, request}: Route.LoaderArgs) => {
    const {handle} = params;
    const {dataAdapter} = context;

    if (!handle) {
        throw new Error("Expected product handle to be defined");
    }

    const [{product}, sidebarData] = await Promise.all([
        dataAdapter.query(PRODUCT_QUERY, {
            variables: {handle, selectedOptions: getSelectedProductOptions(request)},
            cache: dataAdapter.CacheNone()
        }),
        dataAdapter.query(SIDEBAR_COLLECTIONS_QUERY, {
            cache: dataAdapter.CacheNone()
        })
    ]);

    if (!product?.id) {
        throw new Response(null, {status: 404});
    }

    redirectIfHandleIsLocalized(request, {handle, data: product});

    const {collections, allProducts} = sidebarData;
    const collectionsWithCounts: Array<{handle: string; title: string; productsCount: number}> = collections.nodes
        .map((col: any) => ({
            handle: col.handle,
            title: col.title,
            productsCount: col.products.nodes.filter((p: any) => p.availableForSale).length
        }))
        .filter((col: any) => col.productsCount > 0);

    const totalProductCount = allProducts.nodes.filter(
        (p: any) => p.availableForSale && p.variants.nodes.some((v: any) => v.availableForSale)
    ).length;

    const discountCount = allProducts.nodes.filter((p: any) =>
        p.variants.nodes.some(
            (v: any) =>
                v.compareAtPrice &&
                v.availableForSale &&
                parseFloat(v.compareAtPrice.amount) > parseFloat(v.price.amount)
        )
    ).length;

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

    const sizeChartResult = parseSizeChart(product.sizeChart?.value);
    const sizeChartData = sizeChartResult.isValid && sizeChartResult.data ? sizeChartResult.data : null;

    return {
        product,
        selectedSellingPlan,
        collectionsWithCounts,
        totalProductCount,
        discountCount,
        activeCollectionHandle,
        sizeChartData
    };
};

const loadDeferredData = ({context}: Route.LoaderArgs, productId: string) => {
    const {dataAdapter} = context;

    const recommendations = dataAdapter
        .query(RECOMMENDATIONS_QUERY, {
            variables: {productId},
            cache: dataAdapter.CacheNone()
        })
        .then(data => data.productRecommendations ?? null)
        .catch((error: unknown) => { console.error("Failed to load product recommendations:", error); return null; });

    return {recommendations};
};

const Product = () => {
    const {product, recommendations, selectedSellingPlan, sizeChartData} = useLoaderData<typeof loader>();
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
        if (product) {
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
        }
    }, [product, selectedVariant, addProduct]);

    return (
        <div className="min-h-screen bg-background text-foreground">
            <AnimatedSection animation="fade" threshold={0.08}>
                <section className="pt-4 md:pt-6">
                    <div className="mx-auto max-w-[2000px] px-2 md:px-4">
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-12">
                            <ProductImageSection productImages={productImages} product={product} onSale={onSale} />

                            <ProductMobileTitlePrice product={product} discountPercentage={discountPercentage} />

                            <div className="lg:hidden">
                                <ProductPurchaseSection
                                    product={product}
                                    selectedVariant={selectedVariant}
                                    productOptions={productOptions}
                                    selectedSellingPlan={selectedSellingPlan}
                                    quantity={quantity}
                                    onQuantityChange={setQuantity}
                                    discountPercentage={discountPercentage}
                                    sizeChartButton={
                                        sizeChartData ? (
                                            <SizeChartButton sizeChart={sizeChartData} variant="link" />
                                        ) : undefined
                                    }
                                />
                            </div>

                            <div className="hidden lg:col-span-4 lg:block">
                                <ProductInfoSection product={product} discountPercentage={discountPercentage} />
                            </div>

                            <div className="lg:hidden">
                                <ProductInfoSection product={product} discountPercentage={discountPercentage} />
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
                                    sizeChartButton={
                                        sizeChartData ? (
                                            <SizeChartButton sizeChart={sizeChartData} variant="link" />
                                        ) : undefined
                                    }
                                />
                            </div>
                        </div>
                    </div>
                </section>
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

            <ProductMobileStickyButtons
                product={product}
                selectedVariant={selectedVariant}
                selectedSellingPlan={selectedSellingPlan}
                quantity={quantity}
                onQuantityChange={setQuantity}
            />

            <Analytics.ProductView
                data={{
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
                }}
            />
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
                            <Link viewTransition to="/collections/all-products">Browse All Products</Link>
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
    title
    unitPrice {
      amount
      currencyCode
    }
    sellingPlanAllocations(first: 10) {
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
    encodedVariantExistence
    encodedVariantAvailability
    sizeChart: metafield(namespace: "custom", key: "size_chart") {
      value
    }
    collections(first: 10) {
      nodes {
        handle
        title
      }
    }
    images(first: 20) {
      nodes {
        id
        url
        altText
        width
        height
      }
    }
    media(first: 20) {
      nodes {
        __typename
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
    variants(first: 100) {
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
    sellingPlanGroups(first: 5) {
      nodes {
        name
        appName
        options {
          name
          values
        }
        sellingPlans(first: 10) {
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

const SIDEBAR_COLLECTIONS_QUERY = `#graphql
  query SidebarCollectionsProduct(
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    collections(first: 50, sortKey: TITLE) {
      nodes {
        id
        handle
        title
        image {
          id
          url
          altText
          width
          height
        }
        products(first: 250) {
          nodes {
            id
            availableForSale
          }
        }
      }
    }
    allProducts: products(first: 250) {
      nodes {
        id
        availableForSale
        variants(first: 10) {
          nodes {
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
      }
    }
  }
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
    images(first: 10) {
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
