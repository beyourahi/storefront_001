import {useLoaderData, useRouteLoaderData} from "react-router";
import type {Route} from "./+types/collections._index";
import {getSeoMeta} from "@shopify/hydrogen";
import type {RootLoader} from "~/root";
const FALLBACK_SPECIAL_COLLECTIONS = {
    featured: "featured",
    bestSellers: "best-sellers",
    newArrivals: "new-arrivals",
    trending: "trending"
} as const;
import {PageBreadcrumbs} from "~/components/common/PageBreadcrumbs";
import {MobileSearchBar} from "~/components/layout/MobileSearchBar";
import {CollectionsPageHero} from "~/components/sections/CollectionsPageHero";
import {CollectionsGridSection} from "~/components/sections/CollectionsGridSection";
import type {CollectionCardData} from "~/lib/types/collections";

type CollectionProductNode = {
    availableForSale?: boolean;
    variants?: {nodes?: Array<{availableForSale?: boolean}>};
};

type CollectionNode = {
    id: string;
    title: string;
    handle: string;
    description?: string | null;
    image?: {url: string; altText?: string | null} | null;
    seo?: {title?: string | null; description?: string | null} | null;
    products?: {nodes?: CollectionProductNode[]};
};

type CollectionsPageProductNode = {
    id: string;
    availableForSale: boolean;
    variants?: {
        edges?: Array<{
            node?: {
                availableForSale?: boolean;
                compareAtPrice?: {amount?: string} | null;
                price?: {amount?: string} | null;
            };
        }>;
    };
};

type CollectionsPageQueryResponse = {
    collections?: {nodes?: CollectionNode[]};
    allProducts?: {nodes?: CollectionsPageProductNode[]};
};

const SHOP_ALL_DESCRIPTION =
    "Discover our complete collection of premium products, carefully curated for exceptional quality and design.";
const SHOP_ALL_COLLECTION_ID = "shop-all-special-collection";

export const meta: Route.MetaFunction = () => {
    return (
        getSeoMeta({
            title: "Collections",
            description:
                "Explore our curated collections of premium products. From luxury accessories to home essentials, discover quality craftsmanship in every piece."
        }) ?? []
    );
};

const countInStockCollectionProducts = (collectionNode: CollectionNode): number => {
    return (
        collectionNode.products?.nodes?.filter(
            product =>
                product?.availableForSale &&
                (product.variants?.nodes?.some(variant => variant.availableForSale) ?? false)
        ).length ?? 0
    );
};

const mapCollectionNodeToCard = (collectionNode: CollectionNode): CollectionCardData => ({
    id: collectionNode.id,
    title: collectionNode.title,
    handle: collectionNode.handle,
    description: collectionNode.description ?? "",
    image: collectionNode.image
        ? {
              url: collectionNode.image.url,
              altText: collectionNode.image.altText ?? null
          }
        : null,
    productCount: countInStockCollectionProducts(collectionNode),
    seo: {
        title: collectionNode.seo?.title ?? null,
        description: collectionNode.seo?.description ?? null
    }
});

export const loader = async ({context}: Route.LoaderArgs) => {
    const data = (await context.dataAdapter.query(COLLECTIONS_PAGE_QUERY, {
        cache: context.dataAdapter.CacheNone()
    })) as CollectionsPageQueryResponse;

    const allCollectionNodes = data.collections?.nodes ?? [];
    const allProducts = data.allProducts?.nodes ?? [];

    const inStockProducts = allProducts.filter(
        product =>
            product?.availableForSale && (product.variants?.edges?.some(edge => edge?.node?.availableForSale) ?? false)
    );

    const discountedProducts = inStockProducts
        .filter(
            product =>
                product.variants?.edges?.some(edge => {
                    const variant = edge?.node;
                    if (!variant?.availableForSale || !variant.compareAtPrice?.amount || !variant.price?.amount) {
                        return false;
                    }
                    return parseFloat(variant.compareAtPrice.amount) > parseFloat(variant.price.amount);
                }) ?? false
        )
        .map(product => {
            let maxDiscountPercentage = 0;

            for (const edge of product.variants?.edges ?? []) {
                const variant = edge?.node;
                if (!variant?.availableForSale || !variant.compareAtPrice?.amount || !variant.price?.amount) {
                    continue;
                }

                const compareAtPrice = parseFloat(variant.compareAtPrice.amount);
                const currentPrice = parseFloat(variant.price.amount);
                if (compareAtPrice <= currentPrice) {
                    continue;
                }

                const discountPercentage = Math.round((1 - currentPrice / compareAtPrice) * 100);
                maxDiscountPercentage = Math.max(maxDiscountPercentage, discountPercentage);
            }

            return {
                product,
                maxDiscountPercentage
            };
        });

    const specialCollectionHandles = Object.values(FALLBACK_SPECIAL_COLLECTIONS) as string[];
    const specialCollectionHandleSet = new Set(specialCollectionHandles);

    const mappedCollections = allCollectionNodes.map(mapCollectionNodeToCard);
    const mappedCollectionsByHandle = new Map(mappedCollections.map(collection => [collection.handle, collection]));

    const regularCollections = mappedCollections.filter(
        collection => !specialCollectionHandleSet.has(collection.handle) && (collection.productCount ?? 0) > 0
    );

    const specialCollections = specialCollectionHandles
        .map(handle => mappedCollectionsByHandle.get(handle))
        .filter((collection): collection is CollectionCardData => collection !== undefined);

    const shopAllCollection: CollectionCardData = {
        id: SHOP_ALL_COLLECTION_ID,
        title: "Shop All",
        handle: "all",
        description: SHOP_ALL_DESCRIPTION,
        image: null,
        productCount: inStockProducts.length,
        seo: {
            title: "Shop All Products - Complete Collection",
            description: SHOP_ALL_DESCRIPTION
        }
    };

    const maxDiscountPercentage =
        discountedProducts.length > 0 ? Math.max(...discountedProducts.map(item => item.maxDiscountPercentage)) : 0;

    const specialOffersCollection: CollectionCardData | null =
        discountedProducts.length > 0
            ? {
                  id: "special-offers-collection",
                  title: "Special Offers",
                  handle: "discounts",
                  description: `Discover ${discountedProducts.length} discounted ${discountedProducts.length === 1 ? "item" : "items"} with savings up to ${maxDiscountPercentage}% off. Limited-time offers on premium products.`,
                  image: null,
                  productCount: discountedProducts.length,
                  seo: {
                      title: `Special Offers - Up to ${maxDiscountPercentage}% Off`,
                      description: `Discover ${discountedProducts.length} discounted ${discountedProducts.length === 1 ? "item" : "items"} with savings up to ${maxDiscountPercentage}% off. Limited-time offers on premium products.`
                  }
              }
            : null;

    const collections: CollectionCardData[] = [
        shopAllCollection,
        ...(specialOffersCollection ? [specialOffersCollection] : []),
        ...regularCollections,
        ...specialCollections
    ];

    return {collections};
};

export default function CollectionsIndex() {
    const data = useLoaderData<typeof loader>();
    const rootData = useRouteLoaderData<RootLoader>("root");
    const shopName = rootData?.header?.shop?.name ?? "Store";

    return (
        <div className="min-h-dvh bg-background text-foreground">
            <PageBreadcrumbs customTitle="Collections" />
            <CollectionsPageHero />
            <MobileSearchBar shopName={shopName} />
            <CollectionsGridSection collections={data.collections} isLoading={false} />
        </div>
    );
}

const COLLECTIONS_PAGE_QUERY = `#graphql
  query CollectionsPage(
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    collections(first: 250) {
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
        products(first: 250) {
          nodes {
            id
            availableForSale
            variants(first: 10) {
              nodes {
                availableForSale
              }
            }
          }
        }
        seo {
          title
          description
        }
      }
    }
    allProducts: products(first: 250) {
      nodes {
        id
        title
        handle
        availableForSale
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
        variants(first: 10) {
          edges {
            node {
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
                id
                url
                altText
                width
                height
              }
              quantityAvailable
            }
          }
        }
        images(first: 5) {
          edges {
            node {
              id
              url
              altText
              width
              height
            }
          }
        }
        seo {
          title
          description
        }
      }
    }
  }
` as const;
