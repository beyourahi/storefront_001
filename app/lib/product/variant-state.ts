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

type ShopifyProductOption = {
    id: string;
    name: string;
    values: string[];
};

type ShopifyPriceRange = {
    minVariantPrice: ShopifyMoney;
    maxVariantPrice: ShopifyMoney;
};

type ShopifyProductSeo = {
    title: string | null;
    description: string | null;
};

type ShopifyProduct = {
    id: string;
    title: string;
    handle: string;
    description: string;
    tags: string[];
    vendor: string;
    productType: string;
    availableForSale: boolean;
    options: ShopifyProductOption[];
    variants: {edges: {node: ShopifyProductVariant}[]};
    images: {edges: {node: ShopifyImage}[]};
    priceRange: ShopifyPriceRange;
    seo: ShopifyProductSeo;
};

export interface VariantSelection {
    [optionName: string]: string;
}

/**
 * Find the variant whose `selectedOptions` exactly match the given selection map.
 * Returns `null` when no variant matches (e.g., an unavailable combination).
 */
export const findVariantByOptions = (
    variants: ShopifyProductVariant[],
    selectedOptions: VariantSelection
): ShopifyProductVariant | null => {
    return (
        variants.find(variant => {
            return variant.selectedOptions.every(option => selectedOptions[option.name] === option.value);
        }) || null
    );
};

/**
 * Extract pricing information from a variant.
 * Returns `null` when no variant is provided. The `hasDiscount` flag is true
 * only when `compareAtPrice` exceeds the current `price`.
 */
export const getVariantPrice = (variant: ShopifyProductVariant | null) => {
    if (!variant) return null;

    return {
        price: variant.price,
        compareAtPrice: variant.compareAtPrice,
        hasDiscount: Boolean(
            variant.compareAtPrice && parseFloat(variant.compareAtPrice.amount) > parseFloat(variant.price.amount)
        )
    };
};

/**
 * Extract availability and quantity from a variant.
 * Defaults to `{available: false, quantity: 0}` when `variant` is null.
 */
export const getVariantInventory = (variant: ShopifyProductVariant | null) => {
    if (!variant) return {available: false, quantity: 0};

    return {
        available: variant.availableForSale,
        quantity: variant.quantityAvailable || 0
    };
};

/** Return the option list for a product, normalised into plain objects. */
export const getProductOptions = (product: ShopifyProduct): ShopifyProductOption[] => {
    return (
        product.options?.map(option => ({
            id: option.id,
            name: option.name,
            values: option.values
        })) || []
    );
};

/**
 * Build the initial option selection by picking the first value of each option.
 * Used to pre-select options on page load before the user interacts.
 */
export const getDefaultSelection = (product: ShopifyProduct): VariantSelection => {
    const options = getProductOptions(product);
    const selection: VariantSelection = {};

    options.forEach(option => {
        if (option.values && option.values.length > 0) {
            selection[option.name] = option.values[0];
        }
    });

    return selection;
};

/**
 * Validate that every product option has a selected value that exists in the
 * option's allowed values list. Returns `false` if any option is missing or invalid.
 */
export const isValidSelection = (product: ShopifyProduct, selectedOptions: VariantSelection): boolean => {
    const productOptions = getProductOptions(product);

    return productOptions.every(
        option => selectedOptions[option.name] && option.values && option.values.includes(selectedOptions[option.name])
    );
};

/**
 * Return the option values that are still purchasable given the current selection.
 * A value is considered available when at least one in-stock variant matches that
 * value AND all other options in `currentSelection`. Used to grey-out
 * incompatible option buttons in the variant selector UI.
 */
export const getAvailableValues = (
    product: ShopifyProduct,
    optionName: string,
    currentSelection: VariantSelection
): string[] => {
    const variants = product.variants?.edges?.map(edge => edge.node) || [];
    const availableValues = new Set<string>();

    variants.forEach(variant => {
        if (!variant.availableForSale) return;

        const variantMatches = variant.selectedOptions.every(
            option => option.name === optionName || currentSelection[option.name] === option.value
        );

        if (variantMatches) {
            const targetOption = variant.selectedOptions.find(opt => opt.name === optionName);
            if (targetOption) {
                availableValues.add(targetOption.value);
            }
        }
    });

    return Array.from(availableValues);
};
