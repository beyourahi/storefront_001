import type {MoneyV2} from "@shopify/hydrogen/storefront-api-types";

export interface DiscountBadgeInfo {
    type: "exact" | "upto" | "none";
    percentage: number;
}

export interface VariantPricing {
    id: string;
    availableForSale: boolean;
    price: {amount: string};
    compareAtPrice?: {amount: string} | null | undefined;
}

export interface ProductWithVariants {
    variants?: {
        nodes: VariantPricing[];
    };
    priceRange?: {
        minVariantPrice: {amount: string};
    };
    compareAtPriceRange?: {
        minVariantPrice: {amount: string};
    };
}

export const analyzeProductDiscount = (product: ProductWithVariants): DiscountBadgeInfo => {
    const variants = product.variants?.nodes;

    if (!variants || variants.length === 0) {
        return analyzeFromPriceRange(product);
    }

    const discountPercentages: number[] = [];

    for (const variant of variants) {
        if (!variant.compareAtPrice) {
            continue;
        }

        const compareAt = parseFloat(variant.compareAtPrice.amount);
        const current = parseFloat(variant.price.amount);

        if (compareAt > current && compareAt > 0) {
            const percentage = calculateDiscountPercentage(compareAt, current);
            if (percentage > 0) {
                discountPercentages.push(percentage);
            }
        }
    }

    if (discountPercentages.length === 0) {
        return {type: "none", percentage: 0};
    }

    const maxPercentage = Math.max(...discountPercentages);
    const minPercentage = Math.min(...discountPercentages);

    if (maxPercentage === minPercentage) {
        return {type: "exact", percentage: maxPercentage};
    }

    return {type: "upto", percentage: maxPercentage};
};

const analyzeFromPriceRange = (product: ProductWithVariants): DiscountBadgeInfo => {
    const compareAtPrice = product.compareAtPriceRange?.minVariantPrice?.amount;
    const currentPrice = product.priceRange?.minVariantPrice?.amount;

    if (!compareAtPrice || !currentPrice) {
        return {type: "none", percentage: 0};
    }

    const compareAt = parseFloat(compareAtPrice);
    const current = parseFloat(currentPrice);

    if (compareAt <= current || compareAt <= 0) {
        return {type: "none", percentage: 0};
    }

    const percentage = calculateDiscountPercentage(compareAt, current);
    return {type: "upto", percentage};
};

export interface RawDiscountProduct {
    id: string;
    handle: string;
    title: string;
    availableForSale: boolean;
    featuredImage: {
        id: string;
        url: string;
        altText: string | null;
        width: number;
        height: number;
    } | null;
    priceRange: {
        minVariantPrice: MoneyV2;
        maxVariantPrice: MoneyV2;
    };
    compareAtPriceRange: {
        minVariantPrice: MoneyV2;
    };
    variants: {
        nodes: Array<{
            id: string;
            availableForSale: boolean;
            price: MoneyV2;
            compareAtPrice: MoneyV2 | null;
        }>;
    };
}

export interface DiscountedProduct {
    id: string;
    handle: string;
    title: string;
    availableForSale: boolean;
    featuredImage: {
        id: string;
        url: string;
        altText: string | null;
        width: number;
        height: number;
    } | null;
    priceRange: {
        minVariantPrice: MoneyV2;
        maxVariantPrice: MoneyV2;
    };
    compareAtPriceRange: {
        minVariantPrice: MoneyV2;
    };
    variants: {
        nodes: Array<{
            id: string;
            availableForSale: boolean;
            price: MoneyV2;
            compareAtPrice: MoneyV2 | null;
        }>;
    };
    maxDiscountPercentage: number;
    maxDiscountSavings: number;
}

export const calculateDiscountPercentage = (compareAtPrice: number, currentPrice: number): number => {
    if (compareAtPrice <= currentPrice || compareAtPrice <= 0) {
        return 0;
    }
    const percentage = ((compareAtPrice - currentPrice) / compareAtPrice) * 100;
    return Math.round(percentage);
};

export const calculateSavings = (compareAtPrice: number, currentPrice: number): number => {
    if (compareAtPrice <= currentPrice) {
        return 0;
    }
    return compareAtPrice - currentPrice;
};

export const transformProductForDiscount = (product: RawDiscountProduct): DiscountedProduct | null => {
    let maxDiscountPercentage = 0;
    let maxDiscountSavings = 0;
    let hasDiscountedVariant = false;

    for (const variant of product.variants.nodes) {
        if (!variant.availableForSale || !variant.compareAtPrice) {
            continue;
        }

        const compareAt = parseFloat(variant.compareAtPrice.amount);
        const current = parseFloat(variant.price.amount);

        if (compareAt > current) {
            hasDiscountedVariant = true;
            const percentage = calculateDiscountPercentage(compareAt, current);
            const savings = calculateSavings(compareAt, current);

            if (percentage > maxDiscountPercentage) {
                maxDiscountPercentage = percentage;
                maxDiscountSavings = savings;
            }
        }
    }

    if (!hasDiscountedVariant) {
        return null;
    }

    return {
        id: product.id,
        handle: product.handle,
        title: product.title,
        availableForSale: product.availableForSale,
        featuredImage: product.featuredImage,
        priceRange: product.priceRange,
        compareAtPriceRange: product.compareAtPriceRange,
        variants: product.variants,
        maxDiscountPercentage,
        maxDiscountSavings
    };
};

export const filterAndSortDiscountedProducts = (products: RawDiscountProduct[]): DiscountedProduct[] => {
    const discountedProducts: DiscountedProduct[] = [];

    for (const product of products) {
        if (!product.availableForSale) {
            continue;
        }

        const transformed = transformProductForDiscount(product);
        if (transformed) {
            discountedProducts.push(transformed);
        }
    }

    return discountedProducts.sort((a, b) => {
        const percentageDiff = b.maxDiscountPercentage - a.maxDiscountPercentage;
        if (percentageDiff !== 0) {
            return percentageDiff;
        }
        return b.maxDiscountSavings - a.maxDiscountSavings;
    });
};

export interface LightweightVariant {
    availableForSale: boolean;
    price: {amount: string};
    compareAtPrice: {amount: string} | null;
}

export interface LightweightProduct {
    availableForSale: boolean;
    variants: {
        nodes: LightweightVariant[];
    };
}

export interface VariantWithPrice {
    price: {amount: string};
    compareAtPrice?: {amount: string} | null;
}

export const calculateVariantDiscountPercentage = (variant: VariantWithPrice | null | undefined): number => {
    if (!variant?.compareAtPrice) {
        return 0;
    }

    const compareAt = parseFloat(variant.compareAtPrice.amount);
    const current = parseFloat(variant.price.amount);

    if (compareAt <= current || compareAt <= 0) {
        return 0;
    }

    return calculateDiscountPercentage(compareAt, current);
};

export const countDiscountedProducts = (products: LightweightProduct[]): number => {
    let count = 0;

    for (const product of products) {
        if (!product.availableForSale) {
            continue;
        }

        const hasDiscount = product.variants.nodes.some(variant => {
            if (!variant.availableForSale || !variant.compareAtPrice) {
                return false;
            }
            const compareAt = parseFloat(variant.compareAtPrice.amount);
            const current = parseFloat(variant.price.amount);
            return compareAt > current;
        });

        if (hasDiscount) {
            count++;
        }
    }

    return count;
};
