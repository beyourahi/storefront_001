import {calculateProductPricing, canAdjustQuantity} from "./product-calculations";
import {formatShopifyMoney} from "~/lib/currency-formatter";

type ShopifyMoney = {
    amount: string;
    currencyCode: string;
};

type ShopifySelectedOption = {
    name: string;
    value: string;
};

type ShopifyImage = {
    id: string;
    url: string;
    altText: string | null;
    width: number;
    height: number;
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

type PriceCalculation = {
    totalPrice: string;
    totalComparePrice: string | null;
    totalSavings: string | null;
    savingsPercentage: number;
    isOnSale: boolean;
    quantity: number;
    rawProductAmount: number;
    error: null;
};

type PriceCalculationError = {
    error: "price_unavailable" | "invalid_price" | "invalid_variant";
};

type PriceCalculationResult = PriceCalculation | PriceCalculationError;

/**
 * Compute the formatted total price (and compare-at / savings) for a variant + quantity pair.
 * Delegates to `calculateProductPricing` and reshapes the result into the `PriceCalculationResult`
 * discriminated union; returns a `PriceCalculationError` for null/invalid variant or price data.
 */
export const calculateTotalPrice = (
    selectedVariant: ShopifyProductVariant | null,
    quantity: number
): PriceCalculationResult => {
    const result = calculateProductPricing(selectedVariant, quantity);

    if (result.error) {
        return result as PriceCalculationError;
    }

    return {
        totalPrice: result.formattedTotalPrice,
        totalComparePrice: result.formattedTotalComparePrice || null,
        totalSavings: result.formattedTotalSavings || null,
        savingsPercentage: result.savingsPercentage,
        isOnSale: result.isOnSale,
        quantity: result.quantity,
        rawProductAmount: result.totalPrice,
        error: null
    };
};

/**
 * Estimate the new cart total after adding the current product selection.
 * Returns null when pricing data is unavailable or errored.
 * `hasExistingCart` indicates whether the user already has items in cart.
 */
export const calculateNewCartTotal = (
    totalPriceCalculation: PriceCalculationResult,
    cartTotal: {rawCartAmount: number} | null,
    selectedVariant: ShopifyProductVariant | null
) => {
    if (!totalPriceCalculation || totalPriceCalculation.error) return null;

    const currencyCode = selectedVariant?.price?.currencyCode || "USD";
    const productAmount = totalPriceCalculation.rawProductAmount || 0;
    const cartAmount = cartTotal?.rawCartAmount || 0;
    const newTotal = cartAmount + productAmount;

    return {
        newCartTotal: formatShopifyMoney({
            amount: newTotal.toFixed(2),
            currencyCode
        }),
        hasExistingCart: cartTotal !== null
    };
};

export {validateQuantityInput as validateProductQuantity, canAdjustQuantity} from "./product-calculations";

/** Returns true when the quantity can be incremented without exceeding the variant's available stock. */
export const canIncreaseQuantity = (quantity: number, selectedVariant: ShopifyProductVariant | null): boolean => {
    return canAdjustQuantity(quantity, 1, selectedVariant);
};

/** Returns true when the quantity can be decremented (minimum is 1). */
export const canDecreaseQuantity = (quantity: number): boolean => {
    return quantity > 1;
};
