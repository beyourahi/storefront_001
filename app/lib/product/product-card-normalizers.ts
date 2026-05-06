/**
 * Entry-point normalizers that convert raw Shopify GraphQL nodes (or partial objects from
 * order history, wish-list, sale, and cart-suggestion responses) into the canonical
 * `ShopifyProduct` shape used by product card components.
 *
 * Each `from*` export is scoped to a specific data-source context so differences in field
 * availability can be handled without polluting the shared normalization pipeline.
 */

import type {
    ShopifyImage,
    ShopifyMediaNode,
    ShopifyMoney,
    ShopifyProduct,
    ShopifyProductOption,
    ShopifyProductSeo,
    ShopifyProductVariant,
    ShopifyVideoSource
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
    const rawVariants =
        edgesSource.length > 0
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

    const rawImages =
        edgesSource.length > 0
            ? edgesSource.map((edge: Record<string, unknown>) => edge?.node as Maybe<Partial<ShopifyImage>>)
            : (nodesSource as Maybe<Partial<ShopifyImage>>[]);
    const normalized = rawImages.map(image => normalizeImage(image)).filter(Boolean) as ShopifyImage[];

    if (normalized.length > 0) {
        return normalized.map(node => ({node}));
    }

    return featured ? [{node: featured}] : [];
};

const normalizeVideoSources = (sources: unknown): ShopifyVideoSource[] => {
    if (!Array.isArray(sources)) return [];
    return (sources as Record<string, unknown>[])
        .filter(s => s?.url && s?.mimeType)
        .map(s => ({
            url: String(s.url),
            mimeType: String(s.mimeType),
            width: typeof s.width === "number" ? s.width : undefined,
            height: typeof s.height === "number" ? s.height : undefined
        }));
};

const normalizeMediaNodes = (product: RawProduct): Array<{node: ShopifyMediaNode}> => {
    const media = product?.media as Record<string, unknown> | undefined;
    const edgesSource = Array.isArray(media?.edges) ? (media.edges as Record<string, unknown>[]) : [];
    const nodesSource = Array.isArray(media?.nodes) ? (media.nodes as Record<string, unknown>[]) : [];
    const rawNodes =
        edgesSource.length > 0 ? edgesSource.map(edge => edge?.node as Record<string, unknown>) : nodesSource;

    const entries: Array<{node: ShopifyMediaNode}> = [];
    for (const node of rawNodes) {
        if (!node || typeof node !== "object") continue;
        const typename = String(node.__typename ?? "");
        if (typename === "Video") {
            const sources = normalizeVideoSources(node.sources);
            if (sources.length === 0) continue;
            const preview = normalizeImage(node.previewImage as Maybe<Partial<ShopifyImage>>);
            entries.push({
                node: {
                    __typename: "Video",
                    id: node.id ? String(node.id) : undefined,
                    alt: (node.alt as string | null) ?? null,
                    sources,
                    previewImage: preview
                }
            });
        } else if (typename === "MediaImage") {
            const image = normalizeImage(node.image as Maybe<Partial<ShopifyImage>>);
            if (!image) continue;
            entries.push({
                node: {
                    __typename: "MediaImage",
                    id: node.id ? String(node.id) : undefined,
                    alt: (node.alt as string | null) ?? null,
                    image
                }
            });
        }
    }
    return entries;
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
    const maxVariantPrice = normalizeMoney(
        priceRange?.maxVariantPrice as Maybe<Partial<ShopifyMoney>>,
        minVariantPrice
    );
    const seo = product?.seo as Record<string, unknown> | undefined;

    const mediaEdges = normalizeMediaNodes(product);
    const imageEdges = normalizeImages(product);

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
            edges: imageEdges
        },
        media: mediaEdges.length > 0 ? {edges: mediaEdges} : undefined,
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

/** Normalize a standard Storefront API product node (collection, search, etc.). */
export const fromStorefrontNode = (product: object): ShopifyProduct => {
    return normalizeProduct(product as RawProduct);
};

/**
 * Normalize a sale-route product node. Promotes `featuredImage` to the image
 * list when `images` is empty — sale GraphQL fragments often omit the images connection.
 */
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

/** Normalize a wishlist product node, keeping only variants that have a price. */
export const fromWishlistProduct = (product: object): ShopifyProduct => {
    const base = normalizeProduct(product as RawProduct);
    const variantsWithPrice = base.variants.edges.filter(edge => edge.node.price);
    base.variants.edges = variantsWithPrice;
    return base;
};

/**
 * Normalize an order-history line-item into a minimal `ShopifyProduct`.
 * Order-line data is sparse: no description, tags, or vendor. Price comes from
 * the line-item `price` field rather than a `priceRange`.
 */
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

/**
 * Normalize a cart-suggestion product. Same as `fromSaleProduct` — promotes
 * `featuredImage` when the suggestion fragment omits the images connection.
 */
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

/** Normalize a recently-viewed product node (same as a standard storefront node). */
export const fromRecentlyViewedAllProducts = (product: object): ShopifyProduct => {
    return normalizeProduct(product as RawProduct);
};
