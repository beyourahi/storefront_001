import {Suspense} from "react";
import {useLoaderData, useRouteLoaderData, Await} from "react-router";
import type {Route} from "./+types/_index";
import type {RootLoader} from "~/root";
import {getSeoMeta} from "@shopify/hydrogen";
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
import {SocialMediaSection} from "~/components/homepage/SocialMediaSection";
import {TestimonialsSection} from "~/components/homepage/TestimonialsSection";
import {FAQSection} from "~/components/homepage/FAQSection";
import {OrderHistorySection} from "~/components/account/OrderHistorySection";
import {HomepageBlogSection} from "~/components/homepage/HomepageBlogSection";
import {AnimatedSection} from "~/components/sections/AnimatedSection";
import {
    CUSTOMER_ORDER_HISTORY_QUERY,
    extractOrderHistoryProducts,
    type OrderHistoryProduct
} from "~/graphql/customer-account/CustomerOrderHistoryQuery";

export const meta: Route.MetaFunction = ({matches}) => {
    const rootMatch = matches.find((m): m is (typeof matches)[number] & {id: "root"} => m?.id === "root");
    const rootData = rootMatch?.data as {siteContent?: {siteSettings?: {brandName?: string; missionStatement?: string}}} | undefined;
    const shopName = rootData?.siteContent?.siteSettings?.brandName ?? "Store";
    const description = rootData?.siteContent?.siteSettings?.missionStatement ?? "";

    // JSON-LD intentionally omitted from homepage to prevent React hydration
    // mismatch. Structured data is provided on product, collection, and article pages.
    return getSeoMeta({title: shopName, titleTemplate: null, description}) ?? [];
};

export const loader = async ({context}: Route.LoaderArgs) => {
    const {dataAdapter} = context;

    const specialCollections = FALLBACK_SPECIAL_COLLECTIONS;

    const [exploreCollectionsResponse, allProductsResponse] = await Promise.all([
        dataAdapter.query(EXPLORE_COLLECTIONS_QUERY)
            .catch((error: unknown) => { console.error("Failed to load explore collections:", error); return null; }),
        dataAdapter.query(ALL_PRODUCTS_QUERY)
            .catch((error: unknown) => { console.error("Failed to load all products:", error); return null; })
    ]);

    const allProducts = allProductsResponse?.products?.nodes ?? [];

    const filterCollectionProducts = (response: any) => {
        if (!response?.collection) return null;
        const availableProducts = response.collection.products.nodes.filter((p: any) => p.availableForSale);
        if (availableProducts.length === 0) return null;
        return {collection: {...response.collection, products: {nodes: availableProducts}}};
    };

    const bestSellers = dataAdapter
        .query(COLLECTION_WITH_PRODUCTS_QUERY, {variables: {handle: specialCollections.bestSellers}})
        .then(filterCollectionProducts)
        .catch((error: unknown) => { console.error("Failed to load best sellers:", error); return null; });

    const newArrivals = dataAdapter
        .query(COLLECTION_WITH_PRODUCTS_QUERY, {variables: {handle: specialCollections.newArrivals}})
        .then(filterCollectionProducts)
        .catch((error: unknown) => { console.error("Failed to load new arrivals:", error); return null; });

    const trending = dataAdapter
        .query(COLLECTION_WITH_PRODUCTS_QUERY, {variables: {handle: specialCollections.trending}})
        .then(filterCollectionProducts)
        .catch((error: unknown) => { console.error("Failed to load trending products:", error); return null; });

    const recentArticles = dataAdapter
        .query(HOMEPAGE_BLOG_ARTICLES_QUERY, {variables: {first: 6}})
        .then((data: any) => data?.articles?.nodes ?? [])
        .catch((error: unknown) => {
            console.error("Failed to load blog articles:", error);
            return null;
        });

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

    const exploreCollections = (exploreCollectionsResponse?.collections?.nodes ?? [])
        .filter((col: any) => col.products?.nodes?.some((p: any) => p.availableForSale))
        .slice(0, 5);

    return {
        exploreCollections,
        bestSellers,
        newArrivals,
        trending,
        recentArticles,
        allProducts,
        orderHistory: {
            products: orderHistoryProducts,
            isLoggedIn
        }
    };
};

export default function Homepage() {
    const data = useLoaderData<typeof loader>();
    const rootData = useRouteLoaderData<RootLoader>("root");
    const shopName = rootData?.siteContent?.siteSettings?.brandName ?? "Store";
    const featuredProduct = rootData?.siteContent?.siteSettings?.featuredProductSection ?? null;
    const sectionNumbers = featuredProduct
        ? {bestSellers: "04", newArrivals: "05", trending: "06"}
        : {bestSellers: "03", newArrivals: "04", trending: "05"};

    return (
        <div className="-mt-[var(--total-header-height)] min-h-dvh bg-background text-foreground">
            <VideoHero shopName={shopName} />

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

            {data.orderHistory?.isLoggedIn && data.orderHistory.products.length > 0 && (
                <AnimatedSection animation="slide-up" threshold={0.14}>
                    <OrderHistorySection products={data.orderHistory.products} />
                </AnimatedSection>
            )}

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
                <SocialMediaSection />
            </AnimatedSection>

            <AnimatedSection animation="slide-up" threshold={0.1}>
                <TestimonialsSection />
            </AnimatedSection>

            <AnimatedSection animation="fade" threshold={0.08}>
                <FAQSection />
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
        products(first: 1) {
          nodes {
            id
            availableForSale
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
          description
          tags
          vendor
          productType
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
          images(first: 5) {
            edges {
              node { id url altText width height }
            }
          }
          priceRange {
            minVariantPrice { amount currencyCode }
            maxVariantPrice { amount currencyCode }
          }
          seo { title description }
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
    products(first: 250, query: "available_for_sale:true") {
      nodes {
        id
        title
        handle
        description
        tags
        vendor
        productType
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
        images(first: 5) {
          edges {
            node { id url altText width height }
          }
        }
        priceRange {
          minVariantPrice { amount currencyCode }
          maxVariantPrice { amount currencyCode }
        }
        seo { title description }
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
