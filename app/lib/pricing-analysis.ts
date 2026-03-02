import type {MoneyV2} from "@shopify/hydrogen/storefront-api-types";
import {calculateDiscountPercentage} from "~/lib/discounts";

export type PriceDisplayStrategy =
    | "single-price"
    | "single-price-sale"
    | "price-range"
    | "price-range-sale"
    | "partial-sale";

export interface PricingAnalysis {
    variantCount: number;
    hasSingleVariant: boolean;
    hasMultipleVariants: boolean;
    allVariantsSamePrice: boolean;
    minPrice: MoneyV2;
    maxPrice: MoneyV2;
    hasAnyCompareAtPrice: boolean;
    allVariantsHaveCompareAt: boolean;
    someVariantsHaveCompareAt: boolean;
    minCompareAtPrice: MoneyV2 | null;
    maxCompareAtPrice: MoneyV2 | null;
    hasAnyDiscount: boolean;
    allVariantsDiscounted: boolean;
    partiallyDiscounted: boolean;
    maxDiscountPercentage: number;
    minDiscountPercentage: number;
    displayStrategy: PriceDisplayStrategy;
}

interface PricingVariant {
    availableForSale: boolean;
    price: MoneyV2;
    compareAtPrice?: MoneyV2 | null;
}

export interface ProductForPricing {
    priceRange: {
        minVariantPrice: MoneyV2;
        maxVariantPrice: MoneyV2;
    };
    compareAtPriceRange?: {
        minVariantPrice?: MoneyV2 | null;
        maxVariantPrice?: MoneyV2 | null;
    } | null;
    variants?: {
        nodes: PricingVariant[];
    };
}

export const analyzeProductPricing = (product: ProductForPricing): PricingAnalysis => {
    const variants = product.variants?.nodes.filter(v => v.availableForSale) || [];
    const variantCount = variants.length;

    const minPrice = product.priceRange.minVariantPrice;
    const maxPrice = product.priceRange.maxVariantPrice;
    const minCompareAtPrice = product.compareAtPriceRange?.minVariantPrice || null;
    const maxCompareAtPrice = product.compareAtPriceRange?.maxVariantPrice || null;

    const allVariantsSamePrice = parseFloat(minPrice.amount) === parseFloat(maxPrice.amount);

    let hasAnyCompareAtPrice = false;
    let allVariantsHaveCompareAt = false;
    let someVariantsHaveCompareAt = false;
    let maxDiscountPercentage = 0;
    let minDiscountPercentage = 0;
    let discountedVariantCount = 0;

    if (variants.length > 0) {
        const discounts: number[] = [];

        for (const variant of variants) {
            const hasCompareAt = variant.compareAtPrice && parseFloat(variant.compareAtPrice.amount) > 0;

            if (hasCompareAt) {
                hasAnyCompareAtPrice = true;

                const compareAt = parseFloat(variant.compareAtPrice!.amount);
                const current = parseFloat(variant.price.amount);

                if (compareAt > current) {
                    const discount = calculateDiscountPercentage(compareAt, current);
                    if (discount > 0) {
                        discounts.push(discount);
                        discountedVariantCount++;
                    }
                }
            }
        }

        if (discounts.length > 0) {
            maxDiscountPercentage = Math.max(...discounts);
            minDiscountPercentage = Math.min(...discounts);
        }

        allVariantsHaveCompareAt = discountedVariantCount === variantCount && variantCount > 0;
        someVariantsHaveCompareAt = discountedVariantCount > 0 && discountedVariantCount < variantCount;
    } else {
        hasAnyCompareAtPrice = !!minCompareAtPrice && parseFloat(minCompareAtPrice.amount) > 0;

        if (hasAnyCompareAtPrice) {
            const compareAt = parseFloat(minCompareAtPrice!.amount);
            const current = parseFloat(minPrice.amount);

            if (compareAt > current) {
                maxDiscountPercentage = calculateDiscountPercentage(compareAt, current);
                minDiscountPercentage = maxDiscountPercentage;
                allVariantsHaveCompareAt = true;
            }
        }
    }

    const displayStrategy = determineDisplayStrategy({
        variantCount,
        allVariantsSamePrice,
        allVariantsDiscounted: allVariantsHaveCompareAt,
        partiallyDiscounted: someVariantsHaveCompareAt,
        hasAnyDiscount: maxDiscountPercentage > 0
    });

    return {
        variantCount,
        hasSingleVariant: variantCount === 1,
        hasMultipleVariants: variantCount > 1,
        allVariantsSamePrice,
        minPrice,
        maxPrice,
        hasAnyCompareAtPrice,
        allVariantsHaveCompareAt,
        someVariantsHaveCompareAt,
        minCompareAtPrice,
        maxCompareAtPrice,
        hasAnyDiscount: maxDiscountPercentage > 0,
        allVariantsDiscounted: allVariantsHaveCompareAt,
        partiallyDiscounted: someVariantsHaveCompareAt,
        maxDiscountPercentage,
        minDiscountPercentage,
        displayStrategy
    };
};

const determineDisplayStrategy = (params: {
    variantCount: number;
    allVariantsSamePrice: boolean;
    allVariantsDiscounted: boolean;
    partiallyDiscounted: boolean;
    hasAnyDiscount: boolean;
}): PriceDisplayStrategy => {
    const {variantCount, allVariantsSamePrice, allVariantsDiscounted, partiallyDiscounted, hasAnyDiscount} = params;

    if (variantCount === 1) {
        return hasAnyDiscount ? "single-price-sale" : "single-price";
    }

    if (allVariantsSamePrice) {
        return allVariantsDiscounted ? "single-price-sale" : "single-price";
    }

    if (allVariantsDiscounted) {
        return "price-range-sale";
    }

    if (partiallyDiscounted) {
        return "partial-sale";
    }

    return "price-range";
};

export const pricesEqual = (price1: MoneyV2 | null | undefined, price2: MoneyV2 | null | undefined): boolean => {
    if (!price1 || !price2) return false;
    return parseFloat(price1.amount) === parseFloat(price2.amount);
};

export const hasPriceRange = (minPrice: MoneyV2, maxPrice: MoneyV2): boolean => {
    return parseFloat(minPrice.amount) !== parseFloat(maxPrice.amount);
};

export const isPriceValid = (price: MoneyV2 | null | undefined): boolean => {
    if (!price) return false;
    const amount = parseFloat(price.amount);
    return amount > 0 && !isNaN(amount);
};
