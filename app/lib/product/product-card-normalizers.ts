import type {
    ShopifyImage,
    ShopifyMoney,
    ShopifyProduct,
    ShopifyProductOption,
    ShopifyProductSeo,
    ShopifyProductVariant
} from "~/lib/types/product-card";

type Maybe<T> = T | null | undefined;

type Edge<T> = {node: T};

/**
 * Loose product-like input from various GraphQL fragments / data sources.
 * Internal functions use Record<string, unknown> for safe property access;
 * exported entry points accept `object` to be compatible with typed interfaces.
 */
type RawProduct = Record<string, unknown>;

const DEFAULT_MONEY: ShopifyMoney = {
    amount: "0",
    currencyCode: "USD"
};

const DEFAULT_SEO: ShopifyProductSeo = {
    title: null,
    description: null
};

const normalizeMoney = (money: Maybe<Partial<ShopifyMoney>>, fallback: ShopifyMoney = DEFAULT_MONEY): ShopifyMoney => {
    if (!money?.amount || !money.currencyCode) return fallback;
    return {
        amount: String(money.amount),
        currencyCode: String(money.currencyCode)
    };
};

const normalizeImage = (image: Maybe<Partial<ShopifyImage>>): ShopifyImage | null => {
    if (!image?.url) return null;
    return {
        id: image.id ? String(image.id) : undefined,
        url: String(image.url),
        altText: image.altText ?? null,
        width: typeof image.width === "number" ? image.width : undefined,
        height: typeof image.height === "number" ? image.height : undefined
    };
};

const normalizeVariant = (variant: Record<string, unknown>, fallbackMoney: ShopifyMoney): ShopifyProductVariant => {
    const image = normalizeImage(variant?.image as Maybe<Partial<ShopifyImage>>);
    const rawOptions = variant?.selectedOptions;
    const selectedOptions = Array.isArray(rawOptions)
        ? (rawOptions as Record<string, unknown>[])
              .filter(option => option?.name && option?.value)
              .map(option => ({
                  name: String(option.name),
                  value: String(option.value)
              }))
        : [];

    return {
        id: String(variant?.id ?? ""),
        title: variant?.title ? String(variant.title) : "",
        price: normalizeMoney(variant?.price as Maybe<Partial<ShopifyMoney>>, fallbackMoney),
        compareAtPrice: variant?.compareAtPrice
            ? normalizeMoney(variant.compareAtPrice as Maybe<Partial<ShopifyMoney>>, fallbackMoney)
            : null,
        selectedOptions,
        availableForSale: Boolean(variant?.availableForSale),
        quantityAvailable: typeof variant?.quantityAvailable === "number" ? variant.quantityAvailable : null,
        image
    };
};

const normalizeVariants = (product: RawProduct, fallbackMoney: ShopifyMoney): Array<Edge<ShopifyProductVariant>> => {
    const variants = product?.variants as Record<string, unknown> | undefined;
    const edgesSource = Array.isArray(variants?.edges) ? (variants.edges as Record<string, unknown>[]) : [];
    const nodesSource = Array.isArray(variants?.nodes) ? (variants.nodes as Record<string, unknown>[]) : [];
    const rawVariants = edgesSource.length > 0
        ? edgesSource.map((edge: Record<string, unknown>) => edge?.node as Record<string, unknown>)
        : nodesSource;

    return rawVariants
        .filter((variant: Record<string, unknown>) => variant?.id)
        .map((variant: Record<string, unknown>) => ({node: normalizeVariant(variant, fallbackMoney)}));
};

const normalizeImages = (product: RawProduct): Array<Edge<ShopifyImage>> => {
    const images = product?.images as Record<string, unknown> | undefined;
    const edgesSource = Array.isArray(images?.edges) ? (images.edges as Record<string, unknown>[]) : [];
    const nodesSource = Array.isArray(images?.nodes) ? (images.nodes as Record<string, unknown>[]) : [];
    const featured = normalizeImage(product?.featuredImage as Maybe<Partial<ShopifyImage>>);

    const rawImages = edgesSource.length > 0
        ? edgesSource.map((edge: Record<string, unknown>) => edge?.node as Maybe<Partial<ShopifyImage>>)
        : (nodesSource as Maybe<Partial<ShopifyImage>>[]);
    const normalized = rawImages.map(image => normalizeImage(image)).filter(Boolean) as ShopifyImage[];

    if (normalized.length > 0) {
        return normalized.map(node => ({node}));
    }

    return featured ? [{node: featured}] : [];
};

const normalizeOptions = (options: unknown): ShopifyProductOption[] => {
    if (!Array.isArray(options)) return [];
    return (options as Record<string, unknown>[])
        .filter(option => option?.id && option?.name)
        .map(option => ({
            id: String(option.id),
            name: String(option.name),
            values: Array.isArray(option.values) ? (option.values as unknown[]).map(value => String(value)) : []
        }));
};

const normalizeProduct = (product: RawProduct): ShopifyProduct => {
    const priceRange = product?.priceRange as Record<string, unknown> | undefined;
    const minVariantPrice = normalizeMoney(priceRange?.minVariantPrice as Maybe<Partial<ShopifyMoney>>, DEFAULT_MONEY);
    const maxVariantPrice = normalizeMoney(priceRange?.maxVariantPrice as Maybe<Partial<ShopifyMoney>>, minVariantPrice);
    const seo = product?.seo as Record<string, unknown> | undefined;

    return {
        id: String(product?.id ?? ""),
        title: String(product?.title ?? ""),
        handle: String(product?.handle ?? ""),
        description: String(product?.description ?? ""),
        tags: Array.isArray(product?.tags) ? (product.tags as unknown[]).map(tag => String(tag)) : [],
        vendor: String(product?.vendor ?? ""),
        productType: String(product?.productType ?? ""),
        availableForSale: Boolean(product?.availableForSale),
        options: normalizeOptions(product?.options),
        variants: {
            edges: normalizeVariants(product, minVariantPrice)
        },
        images: {
            edges: normalizeImages(product)
        },
        priceRange: {
            minVariantPrice,
            maxVariantPrice
        },
        seo: {
            title: (seo?.title as string) ?? DEFAULT_SEO.title,
            description: (seo?.description as string) ?? DEFAULT_SEO.description
        }
    };
};

export const fromStorefrontNode = (product: object): ShopifyProduct => {
    return normalizeProduct(product as RawProduct);
};

export const fromSaleProduct = (product: object): ShopifyProduct => {
    const raw = product as RawProduct;
    const base = normalizeProduct(raw);
    if (base.images.edges.length === 0 && raw?.featuredImage) {
        const featured = normalizeImage(raw.featuredImage as Maybe<Partial<ShopifyImage>>);
        if (featured) {
            base.images.edges = [{node: featured}];
        }
    }
    return base;
};

export const fromWishlistProduct = (product: object): ShopifyProduct => {
    const base = normalizeProduct(product as RawProduct);
    const variantsWithPrice = base.variants.edges.filter(edge => edge.node.price);
    base.variants.edges = variantsWithPrice;
    return base;
};

export const fromOrderHistoryProduct = (product: object): ShopifyProduct => {
    const raw = product as RawProduct;
    const money = normalizeMoney(raw?.price as Maybe<Partial<ShopifyMoney>>, DEFAULT_MONEY);
    const image = normalizeImage(raw?.image as Maybe<Partial<ShopifyImage>>);
    const handle = raw?.handle ? String(raw.handle) : "";

    const variantData = raw?.variant as Record<string, unknown> | undefined;
    const variant: ShopifyProductVariant | null =
        variantData?.id || raw?.variantId
            ? {
                  id: String(variantData?.id ?? raw?.variantId),
                  title: variantData?.title ? String(variantData.title) : "",
                  price: money,
                  compareAtPrice: null,
                  selectedOptions: [],
                  availableForSale: Boolean(variantData?.availableForSale ?? true),
                  quantityAvailable: null,
                  image
              }
            : null;

    return {
        id: String(raw?.id ?? ""),
        title: String(raw?.title ?? raw?.name ?? "Product"),
        handle,
        description: "",
        tags: [],
        vendor: "",
        productType: "",
        availableForSale: Boolean(variantData?.availableForSale ?? true),
        options: [],
        variants: {
            edges: variant ? [{node: variant}] : []
        },
        images: {
            edges: image ? [{node: image}] : []
        },
        priceRange: {
            minVariantPrice: money,
            maxVariantPrice: money
        },
        seo: DEFAULT_SEO
    };
};

export const fromCartSuggestionProduct = (product: object): ShopifyProduct => {
    const raw = product as RawProduct;
    const base = normalizeProduct(raw);
    if (base.images.edges.length === 0 && raw?.featuredImage) {
        const featured = normalizeImage(raw.featuredImage as Maybe<Partial<ShopifyImage>>);
        if (featured) {
            base.images.edges = [{node: featured}];
        }
    }
    return base;
};

export const fromRecentlyViewedAllProducts = (product: object): ShopifyProduct => {
    return normalizeProduct(product as RawProduct);
};
