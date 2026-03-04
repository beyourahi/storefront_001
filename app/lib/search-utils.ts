const FALLBACK_SPECIAL_COLLECTIONS = {
    featured: "featured",
    bestSellers: "best-sellers",
    newArrivals: "new-arrivals",
    trending: "trending"
} as const;

type ShopifyMoney = {
    amount: string;
    currencyCode: string;
};

type ShopifyImage = {
    id: string;
    url: string;
    altText: string | null;
    width: number;
    height: number;
};

type ShopifyProductSeo = {
    title: string | null;
    description: string | null;
};

type ShopifyProductOption = {
    id: string;
    name: string;
    values: string[];
};

type ShopifySelectedOption = {
    name: string;
    value: string;
};

type ShopifyProductVariant = {
    id: string;
    title: string;
    price: ShopifyMoney;
    compareAtPrice: ShopifyMoney | null;
    selectedOptions: ShopifySelectedOption[];
    availableForSale: boolean;
    quantityAvailable: number | null;
    image: ShopifyImage | null;
};

type ShopifyPriceRange = {
    minVariantPrice: ShopifyMoney;
    maxVariantPrice: ShopifyMoney;
};

type ProductCardVariant = {
    id: string;
    price: ShopifyMoney;
    compareAtPrice: ShopifyMoney | null;
    availableForSale: boolean;
    image: {url: string; altText: string | null} | null;
};

type ShopifyProduct = {
    id: string;
    title: string;
    handle: string;
    description: string;
    descriptionHtml?: string;
    tags: string[];
    vendor: string;
    productType: string;
    availableForSale: boolean;
    totalInventory?: number;
    options: ShopifyProductOption[];
    variants: {edges: {node: ShopifyProductVariant}[]};
    images: {edges: {node: ShopifyImage}[]};
    priceRange: ShopifyPriceRange;
    seo: ShopifyProductSeo;
};

type ProductCardData = {
    id: string;
    handle: string;
    title: string;
    productType: string;
    availableForSale: boolean;
    primaryVariant: ProductCardVariant | null;
    primaryImage: {url: string; altText: string | null} | null;
    minPrice: ShopifyMoney;
    hasDiscountedVariant: boolean;
    maxDiscountPercentage: number;
    maxDiscountSavings: number;
};

type CollectionCardData = {
    id: string;
    title: string;
    handle: string;
    description: string;
    image: ShopifyImage | null;
    productCount: number;
    seo: ShopifyProductSeo;
};

const sortProducts = <T extends ShopifyProduct | ProductCardData>(products: T[]): T[] => {
    const getMinPrice = (product: T): number => {
        if ("primaryVariant" in product && product.primaryVariant) {
            return parseFloat(product.primaryVariant.price.amount);
        } else if ("priceRange" in product) {
            return parseFloat((product as ShopifyProduct).priceRange.minVariantPrice.amount);
        }
        return 0;
    };

    const sortedProducts = [...products];

    return sortedProducts.sort((a, b) => {
        const aPrice = getMinPrice(a);
        const bPrice = getMinPrice(b);
        return aPrice - bPrice;
    });
};

export const policyPages = [
    {
        id: "privacy-policy",
        title: "Privacy Policy",
        description: "How we collect, use, and protect your personal information",
        href: "/privacy-policy"
    },
    {
        id: "terms-of-service",
        title: "Terms of Service",
        description: "Terms and conditions for using our services",
        href: "/terms-of-service"
    },
    {
        id: "shipping-policy",
        title: "Shipping Policy",
        description: "Information about shipping, delivery, and returns",
        href: "/shipping-policy"
    },
    {
        id: "refund-policy",
        title: "Refund Policy",
        description: "Our refund and return policy information",
        href: "/refund-policy"
    }
];

export const filterProducts = (products: ShopifyProduct[], query: string): ShopifyProduct[] => {
    if (query === "") return [];
    const matchingProducts = products.filter(
        product => product.title.toLowerCase().includes(query.toLowerCase()) && product.availableForSale
    );
    return sortProducts(matchingProducts).slice(0, 5);
};

export const filterCollections = (collections: CollectionCardData[], query: string): CollectionCardData[] => {
    if (query === "") return [];
    return collections.filter(collection => collection.title.toLowerCase().includes(query.toLowerCase())).slice(0, 5);
};

export const filterPolicies = (query: string) => {
    if (query === "") return [];
    return policyPages.filter(
        policy =>
            policy.title.toLowerCase().includes(query.toLowerCase()) ||
            policy.description.toLowerCase().includes(query.toLowerCase())
    );
};

export const getAvailableProducts = (products: ShopifyProduct[]): ShopifyProduct[] => {
    return sortProducts(products.filter(product => product.availableForSale));
};

export const getFeaturedCollections = (collections: CollectionCardData[]): CollectionCardData[] => {
    const specialCollectionHandles: string[] = Object.values(FALLBACK_SPECIAL_COLLECTIONS);

    const realCollections = collections.filter(collection => !specialCollectionHandles.includes(collection.handle));

    const specialCollections = collections.filter(collection => specialCollectionHandles.includes(collection.handle));

    const realCount = realCollections.length;
    if (realCount >= 5) {
        return realCollections.slice(0, 5);
    } else {
        const spotsRemaining = 5 - realCount;
        return [...realCollections, ...specialCollections.slice(0, spotsRemaining)];
    }
};
