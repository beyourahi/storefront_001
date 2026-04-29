import {Suspense} from "react";
import {useLoaderData, useRouteLoaderData, Await} from "react-router";
import type {Route} from "./+types/_index";
import type {RootLoader} from "~/root";
import {getSeoMeta} from "@shopify/hydrogen";
import {buildCanonicalUrl, generateFAQPageSchema, getBrandNameFromMatches, getRequiredSocialMeta, getSiteUrlFromMatches} from "~/lib/seo";
const FALLBACK_SPECIAL_COLLECTIONS = {
    featured: "featured",
    bestSellers: "best-sellers",
    newArrivals: "new-arrivals",
    trending: "trending"
} as const;

import {VideoHero} from "~/components/homepage/VideoHero";
import {DiscountedProductsSection} from "~/components/homepage/DiscountedProductsSection";
import {CollectionsSection} from "~/components/homepage/CollectionsSection";
import {FeaturedProductSpotlight} from "~/components/homepage/FeaturedProductSpotlight";
import {RecentlyViewedSection} from "~/components/homepage/RecentlyViewedSection";
import {HomepageWishlistSection} from "~/components/HomepageWishlistSection";
import {ProductSection} from "~/components/homepage/ProductSection";
import {TestimonialsSection} from "~/components/homepage/TestimonialsSection";
import {FAQSection} from "~/components/homepage/FAQSection";
import {ShopLocation} from "~/components/homepage/ShopLocation";
import {OrderHistorySection} from "~/components/account/OrderHistorySection";
import {HomepageBlogSection} from "~/components/homepage/HomepageBlogSection";
import {AnimatedSection} from "~/components/sections/AnimatedSection";
import {NewsletterSignup} from "~/components/common/NewsletterSignup";
import {useTrafficSourceBanners, useHomepageVariants} from "~/lib/site-content-context";
import {useAgentSurface} from "~/lib/agent-surface-context";
import {
    CUSTOMER_ORDER_HISTORY_QUERY,
    extractOrderHistoryProducts,
    type OrderHistoryProduct
} from "~/graphql/customer-account/CustomerOrderHistoryQuery";

export const meta: Route.MetaFunction = ({matches}) => {
    const rootMatch = matches.find((m): m is (typeof matches)[number] & {id: "root"} => m?.id === "root");
    const rootData = rootMatch?.data as {siteContent?: {siteSettings?: {brandName?: string; missionStatement?: string; siteUrl?: string; brandLogo?: {url: string; width?: number; height?: number}}; socialLinks?: Array<{url: string}>}} | undefined;
    const siteSettings = rootData?.siteContent?.siteSettings;
    const shopName = siteSettings?.brandName ?? "Store";
    const description = siteSettings?.missionStatement ?? "";
    const socialLinks = rootData?.siteContent?.socialLinks;
    const siteUrl = getSiteUrlFromMatches(matches);
    const brandName = getBrandNameFromMatches(matches);
    const logoUrl = siteSettings?.brandLogo?.url;
    const faqItems = (siteSettings as {faqItems?: Array<{question: string; answer: string}>} | undefined)?.faqItems;

    const enrichedOrgSchema = {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: shopName,
        url: siteUrl || undefined,
        logo: logoUrl,
        description: description || undefined,
        sameAs: socialLinks?.map(l => l.url).filter(Boolean) ?? []
    };
    return [
        ...(getSeoMeta({
            title: shopName,
            titleTemplate: null,
            description,
            url: buildCanonicalUrl("/", siteUrl),
            media: logoUrl ? {url: logoUrl, type: "image" as const} : undefined
        }) ?? []),
        ...getRequiredSocialMeta("website", brandName, logoUrl),
        {"script:ld+json": enrichedOrgSchema as any},
        ...(faqItems && faqItems.length > 0 ? [{"script:ld+json": generateFAQPageSchema(faqItems) as any}] : [])
    ];
};

export function links(args?: { data: Awaited<ReturnType<typeof loader>> | null }) {
    const data = args?.data;
    // Preload first product image for LCP — hero is video-based, first image below fold
    const firstProduct = (data?.allProducts as any[] | undefined)?.[0];
    const firstMediaImage = firstProduct?.media?.nodes?.find(
        (n: any) => n.__typename === "MediaImage"
    );
    const href = firstMediaImage?.image?.url;
    if (!href) return [];
    return [{ rel: "preload", as: "image", href }] as const;
}

export const loader = async ({context}: Route.LoaderArgs) => {
    const {dataAdapter} = context;

    const specialCollections = FALLBACK_SPECIAL_COLLECTIONS;

    // Helper to filter out empty/unavailable collections — defined before use below
    const filterCollectionProducts = (response: any) => {
        if (!response?.collection || response.collection.products.nodes.length === 0) return null;
        return response;
    };

    // START ALL DEFERRED QUERIES FIRST — they fire concurrently with the critical await below
    const bestSellers = dataAdapter
        .query(COLLECTION_WITH_PRODUCTS_QUERY, {variables: {handle: specialCollections.bestSellers}, cache: dataAdapter.CacheShort()})
        .then(filterCollectionProducts)
        .catch((error: unknown) => { console.error("Failed to load best sellers:", error); return null; });

    const newArrivals = dataAdapter
        .query(COLLECTION_WITH_PRODUCTS_QUERY, {variables: {handle: specialCollections.newArrivals}, cache: dataAdapter.CacheShort()})
        .then(filterCollectionProducts)
        .catch((error: unknown) => { console.error("Failed to load new arrivals:", error); return null; });

    const trending = dataAdapter
        .query(COLLECTION_WITH_PRODUCTS_QUERY, {variables: {handle: specialCollections.trending}, cache: dataAdapter.CacheShort()})
        .then(filterCollectionProducts)
        .catch((error: unknown) => { console.error("Failed to load trending products:", error); return null; });

    const recentArticles = dataAdapter
        .query(HOMEPAGE_BLOG_ARTICLES_QUERY, {variables: {first: 6}, cache: dataAdapter.CacheLong()})
        .then((data: any) => data?.articles?.nodes ?? [])
        .catch((error: unknown) => {
            console.error("Failed to load blog articles:", error);
            return null;
        });

    const orderHistory = loadOrderHistory(context);

    // THEN await critical data — deferred queries above are already in flight
    const [exploreCollectionsResponse, allProductsResponse] = await Promise.all([
        dataAdapter.query(EXPLORE_COLLECTIONS_QUERY, {cache: dataAdapter.CacheLong()})
            .catch((error: unknown) => { console.error("Failed to load explore collections:", error); return null; }),
        dataAdapter.query(ALL_PRODUCTS_QUERY, {cache: dataAdapter.CacheShort()})
            .catch((error: unknown) => { console.error("Failed to load all products:", error); return null; })
    ]);

    const allProducts = allProductsResponse?.products?.nodes ?? [];

    // products(first:1, filters:[{available:true}]) — any returned node confirms non-empty collection
    const exploreCollections = (exploreCollectionsResponse?.collections?.nodes ?? [])
        .filter((col: any) => col.products?.nodes?.length > 0)
        .slice(0, 5)
        .map((col: any) => ({
            ...col,
            productCount: col.products?.nodes?.length ?? 0
        }));

    return {
        exploreCollections,
        bestSellers,
        newArrivals,
        trending,
        recentArticles,
        allProducts,
        orderHistory
    };
};

async function loadOrderHistory(context: Route.LoaderArgs["context"]): Promise<{products: OrderHistoryProduct[]; isLoggedIn: boolean}> {
    let orderHistoryProducts: OrderHistoryProduct[] = [];
    let isLoggedIn = false;

    try {
        isLoggedIn = await context.customerAccount.isLoggedIn();

        if (isLoggedIn) {
            const {data} = await context.customerAccount.query(CUSTOMER_ORDER_HISTORY_QUERY, {
                variables: {
                    first: 10,
                    language: context.customerAccount.i18n.language
                }
            });

            if (data?.customer?.orders?.nodes) {
                orderHistoryProducts = extractOrderHistoryProducts(data.customer.orders.nodes, 16);

                if (orderHistoryProducts.length > 0) {
                    const productIds = orderHistoryProducts
                        .map(p => p.productId)
                        .filter((id): id is string => id !== null);

                    if (productIds.length > 0) {
                        try {
                            const handlesResponse = await context.dataAdapter.query(PRODUCT_HANDLES_QUERY, {
                                variables: {ids: productIds}
                            });

                            if (handlesResponse?.nodes) {
                                const handleMap = new Map<string, string>();
                                for (const node of handlesResponse.nodes) {
                                    if (node && node.__typename === "Product") {
                                        handleMap.set(node.id, node.handle);
                                    }
                                }

                                orderHistoryProducts = orderHistoryProducts.map(product => ({
                                    ...product,
                                    handle: product.productId ? handleMap.get(product.productId) || null : null
                                }));
                            }
                        } catch (error) {
                            console.error("Failed to fetch product handles:", error);
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.error("Failed to load order history:", error);
    }

    return {products: orderHistoryProducts, isLoggedIn};
}

export default function Homepage() {
    const data = useLoaderData<typeof loader>();
    const rootData = useRouteLoaderData<RootLoader>("root");
    const shopName = rootData?.siteContent?.siteSettings?.brandName ?? "Store";
    const featuredProduct = rootData?.siteContent?.siteSettings?.featuredProductSection ?? null;
    const sectionNumbers = featuredProduct
        ? {bestSellers: "04", newArrivals: "05", trending: "06"}
        : {bestSellers: "03", newArrivals: "04", trending: "05"};
    const trafficSourceBanners = useTrafficSourceBanners();
    const homepageVariants = useHomepageVariants();
    const {isAgent} = useAgentSurface();
    const agentVariant = homepageVariants?.find(v => v.segment === "agent") ?? null;
    void trafficSourceBanners; // consumed by server-rendered banner components when configured

    return (
        <div className="-mt-[var(--total-header-height)] min-h-screen bg-background text-foreground">
            {isAgent ? (
                <section className="px-6 py-16 max-w-3xl mx-auto">
                    <h1 className="text-3xl font-bold mb-4">{agentVariant?.heroHeading ?? "Explore our catalog"}</h1>
                    <p className="text-muted-foreground mb-8">{agentVariant?.heroDescription ?? "Browse products, collections, and policies below."}</p>
                    {agentVariant?.ctaUrl ? (
                        <a href={agentVariant.ctaUrl} className="text-primary underline underline-offset-4">
                            {agentVariant.ctaLabel ?? "Browse catalog"}
                        </a>
                    ) : null}
                </section>
            ) : (
                <VideoHero shopName={shopName} />
            )}

            <AnimatedSection animation="slide-up" threshold={0.1}>
                <Suspense fallback={<DiscountedProductsSection products={[]} loading />}>
                    <Await resolve={data.allProducts}>
                        {(resolvedProducts: any) => <DiscountedProductsSection products={resolvedProducts ?? []} />}
                    </Await>
                </Suspense>
            </AnimatedSection>

            <AnimatedSection animation="slide-up" threshold={0.12} delay={40}>
                <CollectionsSection collections={data.exploreCollections} />
            </AnimatedSection>

            <AnimatedSection animation="fade" threshold={0.12} delay={80}>
                <RecentlyViewedSection allProducts={data.allProducts} />
            </AnimatedSection>

            <AnimatedSection animation="slide-up" threshold={0.12} delay={120}>
                <HomepageWishlistSection />
            </AnimatedSection>

            <Suspense fallback={null}>
                <Await resolve={data.orderHistory}>
                    {(orderHistory: {products: OrderHistoryProduct[]; isLoggedIn: boolean}) =>
                        orderHistory?.isLoggedIn && orderHistory.products.length > 0 ? (
                            <AnimatedSection animation="slide-up" threshold={0.14}>
                                <OrderHistorySection products={orderHistory.products} />
                            </AnimatedSection>
                        ) : null
                    }
                </Await>
            </Suspense>

            {featuredProduct ? (
                <AnimatedSection animation="fade" threshold={0.14}>
                    <FeaturedProductSpotlight product={featuredProduct} sectionNumber="03" />
                </AnimatedSection>
            ) : null}

            <AnimatedSection animation="slide-up" threshold={0.12}>
                <Suspense
                    fallback={
                        <ProductSection
                            products={[]}
                            collection={null}
                            title="Best Sellers"
                            subheading="Most loved by our customers"
                            loading
                            sectionNumber={sectionNumbers.bestSellers}
                        />
                    }
                >
                    <Await resolve={data.bestSellers}>
                        {(resolved: any) => {
                            if (!resolved?.collection) return null;
                            return (
                                <ProductSection
                                    products={resolved.collection.products.nodes}
                                    collection={{handle: resolved.collection.handle, title: resolved.collection.title}}
                                    title="Best Sellers"
                                    subheading="Most loved by our customers"
                                    sectionNumber={sectionNumbers.bestSellers}
                                />
                            );
                        }}
                    </Await>
                </Suspense>
            </AnimatedSection>

            <AnimatedSection animation="slide-up" threshold={0.12}>
                <Suspense
                    fallback={
                        <ProductSection
                            products={[]}
                            collection={null}
                            title="New Arrivals"
                            subheading="Fresh drops just landed"
                            loading
                            sectionNumber={sectionNumbers.newArrivals}
                        />
                    }
                >
                    <Await resolve={data.newArrivals}>
                        {(resolved: any) => {
                            if (!resolved?.collection) return null;
                            return (
                                <ProductSection
                                    products={resolved.collection.products.nodes}
                                    collection={{handle: resolved.collection.handle, title: resolved.collection.title}}
                                    title="New Arrivals"
                                    subheading="Fresh drops just landed"
                                    sectionNumber={sectionNumbers.newArrivals}
                                />
                            );
                        }}
                    </Await>
                </Suspense>
            </AnimatedSection>

            <AnimatedSection animation="slide-up" threshold={0.12}>
                <Suspense
                    fallback={
                        <ProductSection
                            products={[]}
                            collection={null}
                            title="Trending"
                            subheading="What everyone is talking about"
                            loading
                            sectionNumber={sectionNumbers.trending}
                        />
                    }
                >
                    <Await resolve={data.trending}>
                        {(resolved: any) => {
                            if (!resolved?.collection) return null;
                            return (
                                <ProductSection
                                    products={resolved.collection.products.nodes}
                                    collection={{handle: resolved.collection.handle, title: resolved.collection.title}}
                                    title="Trending"
                                    subheading="What everyone is talking about"
                                    sectionNumber={sectionNumbers.trending}
                                />
                            );
                        }}
                    </Await>
                </Suspense>
            </AnimatedSection>

            <AnimatedSection animation="fade" threshold={0.1}>
                <Suspense fallback={<HomepageBlogSection articles={[]} loading />}>
                    <Await resolve={data.recentArticles}>
                        {(resolved: any) => {
                            if (!resolved || resolved.length === 0) return null;
                            return <HomepageBlogSection articles={resolved} />;
                        }}
                    </Await>
                </Suspense>
            </AnimatedSection>

            <AnimatedSection animation="slide-up" threshold={0.1}>
                <TestimonialsSection />
            </AnimatedSection>

            <AnimatedSection animation="slide-up" threshold={0.1}>
                <section className="mx-auto max-w-2xl px-4 py-16 text-center md:py-20">
                    <NewsletterSignup variant="expanded" />
                </section>
            </AnimatedSection>

            <AnimatedSection animation="fade" threshold={0.08}>
                <FAQSection />
            </AnimatedSection>

            <AnimatedSection animation="fade" threshold={0.08}>
                <ShopLocation />
            </AnimatedSection>
        </div>
    );
}

const EXPLORE_COLLECTIONS_QUERY = `#graphql
  query ExploreCollections(
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    collections(first: 20) {
      nodes {
        id
        handle
        title
        description
        image {
          id
          url
          altText
          width
          height
        }
        products(first: 1, filters: [{available: true}]) {
          nodes {
            id
          }
        }
      }
    }
  }
` as const;

const COLLECTION_WITH_PRODUCTS_QUERY = `#graphql
  query CollectionWithProducts(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      id
      title
      handle
      description
      products(first: 20) {
        nodes {
          id
          title
          handle
          tags
          description
          availableForSale
          options { id name values }
          variants(first: 10) {
            edges {
              node {
                id
                title
                availableForSale
                selectedOptions { name value }
                price { amount currencyCode }
                compareAtPrice { amount currencyCode }
                image { url altText }
              }
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
            minVariantPrice { amount currencyCode }
            maxVariantPrice { amount currencyCode }
          }
        }
      }
    }
  }
` as const;

const ALL_PRODUCTS_QUERY = `#graphql
  query AllProducts(
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    products(first: 50) {
      nodes {
        id
        title
        handle
        tags
        description
        availableForSale
        options { id name values }
        variants(first: 3) {
          edges {
            node {
              id
              title
              availableForSale
              selectedOptions { name value }
              price { amount currencyCode }
              compareAtPrice { amount currencyCode }
              image { url altText }
            }
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
          minVariantPrice { amount currencyCode }
          maxVariantPrice { amount currencyCode }
        }
      }
    }
  }
` as const;

const HOMEPAGE_BLOG_ARTICLES_QUERY = `#graphql
  query HomepageBlogArticles(
    $first: Int
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    articles(first: $first, sortKey: PUBLISHED_AT, reverse: true) {
      nodes {
        handle
        title
        excerpt
        publishedAt
        tags
        image { url altText width height }
        blog { handle title }
        author: authorV2 { name }
      }
    }
  }
` as const;

const PRODUCT_HANDLES_QUERY = `#graphql
  query ProductHandles(
    $ids: [ID!]!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    nodes(ids: $ids) {
      ... on Product {
        __typename
        id
        handle
      }
    }
  }
` as const;

export {RouteErrorBoundary as ErrorBoundary} from "~/components/RouteErrorBoundary";
