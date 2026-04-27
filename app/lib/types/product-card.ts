export type ShopifyMoney = {
    amount: string;
    currencyCode: string;
};

export type ShopifyImage = {
    id?: string;
    url: string;
    altText: string | null;
    width?: number;
    height?: number;
};

export type ShopifySelectedOption = {
    name: string;
    value: string;
};

export type ShopifyProductVariant = {
    id: string;
    title: string;
    price: ShopifyMoney;
    compareAtPrice: ShopifyMoney | null;
    selectedOptions: ShopifySelectedOption[];
    availableForSale: boolean;
    quantityAvailable: number | null;
    image: ShopifyImage | null;
};

export type ShopifyProductOption = {
    id: string;
    name: string;
    values: string[];
};

export type ShopifyPriceRange = {
    minVariantPrice: ShopifyMoney;
    maxVariantPrice: ShopifyMoney;
};

export type ShopifyProductSeo = {
    title: string | null;
    description: string | null;
};

export type ShopifyVideoSource = {
    url: string;
    mimeType: string;
    width?: number;
    height?: number;
};

export type ShopifyMediaImageNode = {
    __typename: "MediaImage";
    id?: string;
    alt?: string | null;
    image: ShopifyImage | null;
};

export type ShopifyVideoNode = {
    __typename: "Video";
    id?: string;
    alt?: string | null;
    sources: ShopifyVideoSource[];
    previewImage: ShopifyImage | null;
};

export type ShopifyMediaNode = ShopifyMediaImageNode | ShopifyVideoNode;

/**
 * Normalized representation of a product card's primary media.
 * Either a playable video (with a preview image as poster) or a static image.
 */
export type ProductCardMedia =
    | {
          type: "video";
          sources: ShopifyVideoSource[];
          previewImage: {url: string; altText: string | null} | null;
          altText: string | null;
      }
    | {
          type: "image";
          url: string;
          altText: string | null;
      };

export type ShopifyProduct = {
    id: string;
    title: string;
    handle: string;
    description: string;
    tags: string[];
    vendor: string;
    productType: string;
    availableForSale: boolean;
    options: ShopifyProductOption[];
    variants: {edges: Array<{node: ShopifyProductVariant}>};
    images: {edges: Array<{node: ShopifyImage}>};
    priceRange: ShopifyPriceRange;
    seo: ShopifyProductSeo;
    /** Media nodes — present when the query selected `media(first: N)`. Powers video-first product cards. */
    media?: {edges: Array<{node: ShopifyMediaNode}>};
    /** Normalized carousel-ready media (images + videos) extracted from `media` or `images`. */
    cardMedia?: ProductCardMedia[];
};

export type ProductCardVariant = {
    id: string;
    price: ShopifyMoney;
    compareAtPrice: ShopifyMoney | null;
    availableForSale: boolean;
    image: {url: string; altText: string | null} | null;
};

export type ProductCardData = {
    id: string;
    handle: string;
    title: string;
    productType: string;
    availableForSale: boolean;
    primaryVariant: ProductCardVariant | null;
    primaryImage: {url: string; altText: string | null} | null;
    /** First media asset when available — lets cards render video in place of the still image. */
    firstMedia?: ProductCardMedia | null;
    minPrice: ShopifyMoney;
    hasDiscountedVariant: boolean;
    maxDiscountPercentage: number;
    maxDiscountSavings: number;
};

export type ProductCardViewMode = "grid1" | "grid2" | "grid3" | "grid4";

export type UnifiedProductCardProps = {
    product: ShopifyProduct | ProductCardData;
    viewMode?: ProductCardViewMode | string;
    /** When true, disables internal media scrolling and shows only the first media asset.
     *  Use whenever the card is rendered inside a horizontal carousel to prevent
     *  nested Embla instances from conflicting on the same drag axis. */
    insideCarousel?: boolean;
};

export type CompactProductCardProps = {
    product: ShopifyProduct | ProductCardData;
    className?: string;
    onCartAdd?: () => void;
    onProductClick?: () => void;
    isMutating?: boolean;
};
