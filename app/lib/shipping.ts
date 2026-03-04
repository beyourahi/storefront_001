const FALLBACK_FREE_SHIPPING_THRESHOLD = 7500;
const FALLBACK_CURRENCY_CODE = "USD";

export interface ShippingConfig {
    freeShippingThreshold: number | null;
    currencyCode: string;
}

export const DEFAULT_FREE_SHIPPING_THRESHOLD = FALLBACK_FREE_SHIPPING_THRESHOLD;
export const DEFAULT_CURRENCY_CODE = FALLBACK_CURRENCY_CODE;

export const SHOP_SHIPPING_METAFIELD_FRAGMENT = `#graphql
  fragment ShopShippingMetafield on Shop {
    freeShippingThreshold: metafield(namespace: "custom", key: "free_shipping_threshold") {
      value
      type
    }
  }
` as const;

export const parseShippingConfig = (
    metafieldValue: string | null | undefined,
    currencyCode: string = DEFAULT_CURRENCY_CODE
): ShippingConfig => {
    let threshold: number | null = null;

    if (metafieldValue) {
        const parsed = parseFloat(metafieldValue);
        if (!isNaN(parsed) && parsed > 0) {
            threshold = parsed;
        }
    }

    return {
        freeShippingThreshold: threshold,
        currencyCode
    };
};

export const formatShippingThreshold = (amount: number, currencyCode: string = DEFAULT_CURRENCY_CODE): string => {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currencyCode,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
};

export const qualifiesForFreeShipping = (cartTotal: number, threshold: number): boolean => {
    return cartTotal >= threshold;
};

export const remainingForFreeShipping = (cartTotal: number, threshold: number): number => {
    const remaining = threshold - cartTotal;
    return remaining > 0 ? remaining : 0;
};
