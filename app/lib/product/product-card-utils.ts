import {formatShopifyMoney, formatMinimalisticRange, calculateDiscount} from "~/lib/currency-formatter";
import {parseNumber} from "~/lib/number-utils";
import type {
    ProductCardData,
    ProductCardMedia,
    ShopifyMediaNode,
    ShopifyProduct,
    ShopifyProductVariant
} from "~/lib/types/product-card";

export const OUT_OF_STOCK_LABEL = "Out of Stock" as const;

/**
 * Normalize a single Shopify media node into the product card media shape.
 * Returns null when the node lacks the data required to render (no image url / no video sources).
 */
const mediaNodeToCardMedia = (node: ShopifyMediaNode): ProductCardMedia | null => {
    if (node.__typename === "Video") {
        if (!node.sources || node.sources.length === 0) return null;
        return {
            type: "video",
            sources: node.sources,
            previewImage: node.previewImage
                ? {url: node.previewImage.url, altText: node.previewImage.altText ?? null}
                : null,
            altText: node.alt ?? null
        };
    }
    if (node.__typename === "MediaImage" && node.image?.url) {
        return {
            type: "image",
            url: node.image.url,
            altText: node.image.altText ?? node.alt ?? null
        };
    }
    return null;
};

/**
 * Extract carousel-ready media from a product: prefer the Storefront `media` field
 * (which carries videos), fall back to `images` when only stills are available.
 *
 * Ensures callers always get a usable array — never throws on missing data.
 */
export const getProductCardMedia = (product: ShopifyProduct | ProductCardData): ProductCardMedia[] => {
    // Duck-type check avoids a forward reference to `isProductCardData` (declared later in this module).
    const isCardData = "primaryVariant" in product && "primaryImage" in product && "minPrice" in product;
    if (isCardData) {
        const cardData = product as ProductCardData;
        if (cardData.firstMedia) {
            return [cardData.firstMedia];
        }
        if (cardData.primaryImage?.url) {
            return [
                {
                    type: "image",
                    url: cardData.primaryImage.url,
                    altText: cardData.primaryImage.altText ?? null
                }
            ];
        }
        return [];
    }

    const shopifyProduct = product as ShopifyProduct;

    // Support both connection (.edges) and shorthand (.nodes) formats —
    // homepage queries return `media { nodes { ... } }` while PDP and collection
    // queries return `media { edges { node { ... } } }`.
    const media = shopifyProduct.media as any;
    const mediaItems: ShopifyMediaNode[] =
        media?.edges?.length > 0
            ? (media.edges as Array<{node: ShopifyMediaNode}>).map(e => e.node)
            : ((media?.nodes as ShopifyMediaNode[]) ?? []);

    if (mediaItems.length > 0) {
        const normalized = mediaItems
            .map(node => mediaNodeToCardMedia(node))
            .filter((item): item is ProductCardMedia => item !== null);
        if (normalized.length > 0) return normalized;
    }

    const images = shopifyProduct.images as any;
    const imageItems: Array<{url: string; altText?: string | null}> =
        images?.edges?.length > 0
            ? (images.edges as Array<{node: {url: string; altText?: string | null}}>).map(e => e.node)
            : ((images?.nodes as Array<{url: string; altText?: string | null}>) ?? []);

    return imageItems
        .filter(img => img?.url)
        .map(img => ({
            type: "image" as const,
            url: img.url,
            altText: img.altText ?? null
        }));
};

/** Computed price display data for a collection card or search result. */
export interface PriceRangeDisplay {
    displayPrice: string;
    hasRange: boolean;
    minPrice: string;
    maxPrice: string;
    compareAtMin?: string;
    compareAtMax?: string;
    onSale: boolean;
    discountPercentage?: number;
    hasMultipleDiscounts?: boolean;
}

/**
 * Compute the full `PriceRangeDisplay` for a collection card, scanning all available variants
 * to find the real min/max prices and the highest discount percentage among on-sale variants.
 */
export const getPriceRangeForCard = (product: ShopifyProduct): PriceRangeDisplay => {
    const allVariants = product.variants?.edges?.map(edge => edge.node) || [];
    const availableVariants = allVariants.filter(v => v.availableForSale && Boolean(v.price.amount));

    if (availableVariants.length === 0) {
        return {
            displayPrice: formatShopifyMoney(product.priceRange.minVariantPrice),
            hasRange: false,
            minPrice: formatShopifyMoney(product.priceRange.minVariantPrice),
            maxPrice: formatShopifyMoney(product.priceRange.maxVariantPrice),
            onSale: false
        };
    }

    const prices = availableVariants
        .map(v => parseFloat(v.price.amount))
        .filter(value => Number.isFinite(value) && value >= 0);

    if (prices.length === 0) {
        return {
            displayPrice: formatShopifyMoney(product.priceRange.minVariantPrice),
            hasRange: false,
            minPrice: formatShopifyMoney(product.priceRange.minVariantPrice),
            maxPrice: formatShopifyMoney(product.priceRange.maxVariantPrice),
            onSale: false
        };
    }
    const uniquePrices = [...new Set(prices)];
    const minPriceValue = Math.min(...prices);
    const maxPriceValue = Math.max(...prices);
    const hasRange = uniquePrices.length > 1;

    const currencyCode = product.priceRange.minVariantPrice.currencyCode;

    const minPrice = formatShopifyMoney({
        amount: minPriceValue.toString(),
        currencyCode
    });

    const maxPrice = formatShopifyMoney({
        amount: maxPriceValue.toString(),
        currencyCode
    });

    let maxDiscountPercentage = 0;
    let compareAtMin: string | undefined;
    let compareAtMax: string | undefined;
    const discountPercentages = new Set<number>();

    for (const variant of availableVariants) {
        if (
            variant.compareAtPrice?.amount &&
            parseFloat(variant.compareAtPrice.amount) > parseFloat(variant.price.amount)
        ) {
            const discount = calculateDiscount(
                parseFloat(variant.compareAtPrice.amount),
                parseFloat(variant.price.amount)
            );
            maxDiscountPercentage = Math.max(maxDiscountPercentage, discount.percentage);
            discountPercentages.add(discount.percentage);

            if (!compareAtMin || parseFloat(variant.compareAtPrice.amount) < parseFloat(compareAtMin)) {
                compareAtMin = variant.compareAtPrice.amount;
            }
            if (!compareAtMax || parseFloat(variant.compareAtPrice.amount) > parseFloat(compareAtMax)) {
                compareAtMax = variant.compareAtPrice.amount;
            }
        }
    }

    const hasMultipleDiscounts = hasRange && discountPercentages.size >= 1;

    const displayPrice = hasRange ? formatMinimalisticRange(minPriceValue, maxPriceValue, currencyCode) : minPrice;

    return {
        displayPrice,
        hasRange,
        minPrice,
        maxPrice,
        compareAtMin: compareAtMin
            ? formatShopifyMoney({
                  amount: compareAtMin,
                  currencyCode: product.priceRange.minVariantPrice.currencyCode
              })
            : undefined,
        compareAtMax: compareAtMax
            ? formatShopifyMoney({
                  amount: compareAtMax,
                  currencyCode: product.priceRange.maxVariantPrice.currencyCode
              })
            : undefined,
        onSale: maxDiscountPercentage > 0,
        discountPercentage: maxDiscountPercentage > 0 ? maxDiscountPercentage : undefined,
        hasMultipleDiscounts
    };
};

/**
 * Convert a raw `ShopifyProduct` into the leaner `ProductCardData` shape.
 * Selects the variant with the highest discount percentage as the primary variant
 * so price badges and images reflect the best deal, falling back to the first
 * available variant and then the first variant regardless of availability.
 */
export const transformProductToCardData = (product: ShopifyProduct): ProductCardData => {
    const allVariants = product.variants?.edges?.map(edge => edge.node) || [];
    const availableVariants = allVariants.filter(v => v.availableForSale && Boolean(v.price.amount));

    let maxDiscountPercentage = 0;
    let maxDiscountSavings = 0;
    let hasDiscountedVariant = false;
    let bestDiscountedVariant: ShopifyProductVariant | null = null;

    for (const variant of availableVariants) {
        if (
            variant.compareAtPrice?.amount &&
            parseFloat(variant.compareAtPrice.amount) > parseFloat(variant.price.amount)
        ) {
            hasDiscountedVariant = true;
            const originalPrice = parseFloat(variant.compareAtPrice.amount);
            const currentPrice = parseFloat(variant.price.amount);
            const discountPercentage = Math.round((1 - currentPrice / originalPrice) * 100);
            const savings = originalPrice - currentPrice;

            if (discountPercentage > maxDiscountPercentage) {
                maxDiscountPercentage = discountPercentage;
                maxDiscountSavings = savings;
                bestDiscountedVariant = variant;
            }
        }
    }

    const primaryVariant = bestDiscountedVariant || availableVariants[0] || allVariants[0];
    const firstImage = product.images?.edges?.[0]?.node;

    return {
        id: product.id,
        handle: product.handle,
        title: product.title,
        productType: product.productType,
        availableForSale: product.availableForSale,
        primaryVariant: primaryVariant
            ? {
                  id: primaryVariant.id,
                  price: primaryVariant.price ?? product.priceRange.minVariantPrice,
                  compareAtPrice: primaryVariant.compareAtPrice ?? null,
                  availableForSale: primaryVariant.availableForSale,
                  image: primaryVariant.image
                      ? {
                            url: primaryVariant.image.url,
                            altText: primaryVariant.image.altText
                        }
                      : null
              }
            : null,
        primaryImage: firstImage
            ? {
                  url: firstImage.url,
                  altText: firstImage.altText
              }
            : null,
        minPrice: product.priceRange.minVariantPrice,
        hasDiscountedVariant,
        maxDiscountPercentage,
        maxDiscountSavings
    };
};

const hasVariantDiscount = (variant: ShopifyProductVariant): boolean => {
    return Boolean(
        variant.compareAtPrice?.amount && parseFloat(variant.compareAtPrice.amount) > parseFloat(variant.price.amount)
    );
};

/**
 * Derive the display price, optional compare-at price, and discount percentage
 * from a `ProductCardData` object. Returns the `minPrice` when there is no primary variant.
 */
export const getCardProductPrice = (
    product: ProductCardData
): {
    price: string;
    compareAtPrice?: string;
    onSale: boolean;
    discountPercentage?: number;
} => {
    const variant = product.primaryVariant;
    if (!variant) {
        return {
            price: formatShopifyMoney(product.minPrice),
            onSale: false
        };
    }

    const price = formatShopifyMoney(variant.price);

    const originalPrice = parseNumber(variant.compareAtPrice?.amount || "0");
    const salePrice = parseNumber(variant.price.amount);
    const discount = calculateDiscount(originalPrice, salePrice);

    // Only show compareAtPrice when it's genuinely higher than the current price
    const isOnSale = discount.percentage > 0 && originalPrice > salePrice;
    const compareAtPrice = isOnSale && variant.compareAtPrice ? formatShopifyMoney(variant.compareAtPrice) : undefined;

    return {
        price,
        compareAtPrice,
        onSale: isOnSale,
        discountPercentage: isOnSale ? discount.percentage : undefined
    };
};

/**
 * Derive display price and discount data directly from a `ShopifyProduct`.
 * Mirrors `getCardProductPrice` but operates on raw product data — used when
 * `ProductCardData` has not yet been derived (e.g. PDP price display).
 */
export const getProductPriceWithDiscount = (
    product: ShopifyProduct
): {
    price: string;
    compareAtPrice?: string;
    onSale: boolean;
    discountPercentage?: number;
} => {
    const allVariants = product.variants?.edges?.map(edge => edge.node) || [];
    const availableVariants = allVariants.filter(v => v.availableForSale && Boolean(v.price.amount));

    let maxDiscountPercentage = 0;
    let bestDiscountedVariant: ShopifyProductVariant | null = null;

    for (const variant of availableVariants) {
        if (hasVariantDiscount(variant)) {
            const originalPrice = parseFloat(variant.compareAtPrice!.amount);
            const currentPrice = parseFloat(variant.price.amount);
            const discountPercentage = Math.round((1 - currentPrice / originalPrice) * 100);

            if (discountPercentage > maxDiscountPercentage) {
                maxDiscountPercentage = discountPercentage;
                bestDiscountedVariant = variant;
            }
        }
    }

    const variantToUse = bestDiscountedVariant || availableVariants[0] || allVariants[0];

    if (!variantToUse) {
        return {
            price: formatShopifyMoney(product.priceRange.minVariantPrice),
            onSale: false
        };
    }

    const price = formatShopifyMoney(variantToUse.price);

    const originalPrice = parseNumber(variantToUse.compareAtPrice?.amount || "0");
    const salePrice = parseNumber(variantToUse.price.amount);
    const discount = calculateDiscount(originalPrice, salePrice);

    // Only show compareAtPrice when it's genuinely higher than the current price
    const isOnSale = discount.percentage > 0 && originalPrice > salePrice;
    const compareAtPrice =
        isOnSale && variantToUse.compareAtPrice ? formatShopifyMoney(variantToUse.compareAtPrice) : undefined;

    return {
        price,
        compareAtPrice,
        onSale: isOnSale,
        discountPercentage: isOnSale ? discount.percentage : undefined
    };
};

/**
 * Resolve the best available image for a product card.
 * Prefers the primary variant's image (e.g. a color-matched swatch image),
 * falling back to the product's first image and then null.
 */
export const getCardProductImage = (product: ProductCardData): {url: string; altText: string | null} | null => {
    const variantImage = product.primaryVariant?.image;
    if (variantImage) return variantImage;

    return product.primaryImage || null;
};

/** Returns true only when both the product and its primary variant are marked available for sale. */
export const isCardProductInStock = (product: ProductCardData): boolean => {
    return product.availableForSale && (product.primaryVariant?.availableForSale ?? false);
};

/** Type guard — returns true when `product` is a `ProductCardData` (already transformed). */
export const isProductCardData = (product: ShopifyProduct | ProductCardData): product is ProductCardData => {
    return "primaryVariant" in product && "primaryImage" in product && "minPrice" in product;
};

export const LOW_STOCK_THRESHOLD = 10 as const;

/** Returns true when any available, inventory-tracked variant has 1–10 units remaining.
 * Mirrors the PDP per-variant check. Handles both `variants.nodes` and `variants.edges` access patterns. */
export const isProductLowStock = (product: ShopifyProduct | ProductCardData): boolean => {
    if (isProductCardData(product)) return false;
    const p = product as any;
    const variantNodes: Array<{availableForSale: boolean; quantityAvailable: number | null}> =
        p.variants?.nodes ?? p.variants?.edges?.map((e: any) => e.node) ?? [];
    return variantNodes.some(
        v =>
            v.availableForSale &&
            v.quantityAvailable != null &&
            v.quantityAvailable > 0 &&
            v.quantityAvailable <= LOW_STOCK_THRESHOLD
    );
};

/**
 * Pick the single best variant to feature: highest discount percentage wins,
 * or the cheapest variant when no discounts are present. Returns null for empty arrays.
 */
export const selectBestVariant = (variants: ShopifyProductVariant[]): ShopifyProductVariant | null => {
    if (variants.length === 0) return null;

    const variantsWithDiscounts = variants
        .map(variant => {
            if (
                variant.compareAtPrice?.amount &&
                parseFloat(variant.compareAtPrice.amount) > parseFloat(variant.price.amount)
            ) {
                const originalPrice = parseFloat(variant.compareAtPrice.amount);
                const currentPrice = parseFloat(variant.price.amount);
                const discountPercentage = Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
                return {variant, discountPercentage};
            }
            return null;
        })
        .filter(item => item !== null) as Array<{
        variant: ShopifyProductVariant;
        discountPercentage: number;
    }>;

    if (variantsWithDiscounts.length > 0) {
        variantsWithDiscounts.sort((a, b) => b.discountPercentage - a.discountPercentage);
        return variantsWithDiscounts[0].variant;
    }

    const sortedByPrice = [...variants].sort((a, b) => {
        const aPrice = parseFloat(a.price.amount);
        const bPrice = parseFloat(b.price.amount);
        return aPrice - bPrice;
    });
    return sortedByPrice[0];
};

/**
 * Unified accessor for all data a product card needs to render.
 * Accepts either a raw `ShopifyProduct` or a pre-transformed `ProductCardData`
 * so callers don't need to branch. Pass `showPriceRange: true` to include the
 * full `PriceRangeDisplay` (collection cards with range labels).
 */
export const getProductDataForCard = (
    product: ShopifyProduct | ProductCardData,
    options?: {showPriceRange?: boolean}
): {
    price: string;
    compareAtPrice?: string;
    discountPercentage?: number;
    image: {url: string; altText: string | null} | null;
    inStock: boolean;
    priceRange?: PriceRangeDisplay;
} => {
    if (isProductCardData(product)) {
        return {
            ...getCardProductPrice(product),
            image: getCardProductImage(product),
            inStock: isCardProductInStock(product)
        };
    }

    const cardData = transformProductToCardData(product);
    const priceRange = options?.showPriceRange ? getPriceRangeForCard(product) : undefined;

    return {
        ...getProductPriceWithDiscount(product),
        image: getCardProductImage(cardData),
        inStock: isCardProductInStock(cardData),
        priceRange
    };
};
