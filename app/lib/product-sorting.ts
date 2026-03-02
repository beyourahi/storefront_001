/**
 * Product sorting utilities
 */

/**
 * Sort products by minimum price (low to high)
 * Used for collection pages
 *
 * @param products - Array of products with priceRange
 * @returns New sorted array (does not mutate original)
 */
export function sortProductsByPrice<
    T extends {priceRange: {minVariantPrice: {amount: string}}}
>(products: T[]): T[] {
    return [...products].sort((a, b) => {
        const aPrice = parseFloat(a.priceRange.minVariantPrice.amount);
        const bPrice = parseFloat(b.priceRange.minVariantPrice.amount);
        return aPrice - bPrice;
    });
}

/**
 * Sort products by discount percentage (high to low), then by savings amount (high to low)
 * Used for sale page
 *
 * @param products - Array of products with discount metadata
 * @returns New sorted array (does not mutate original)
 */
export function sortProductsByDiscount<
    T extends {maxDiscountPercentage: number; maxDiscountSavings: number}
>(products: T[]): T[] {
    return [...products].sort((a, b) => {
        // Primary sort: discount percentage (high to low)
        const discountDiff = b.maxDiscountPercentage - a.maxDiscountPercentage;
        if (discountDiff !== 0) return discountDiff;

        // Secondary sort: savings amount (high to low)
        return b.maxDiscountSavings - a.maxDiscountSavings;
    });
}
