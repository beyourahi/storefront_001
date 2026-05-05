/** SEO title/description pair sourced from a Shopify collection's `seo` field. */
export type CollectionSeoData = {
    title: string | null;
    description: string | null;
};

/** Minimal image shape used by collection cards. Null when the collection has no image. */
export type CollectionImageData = {
    url: string;
    altText?: string | null;
} | null;

/** Normalized collection data consumed by `CollectionCard` and related display components. */
export type CollectionCardData = {
    id: string;
    title: string;
    handle: string;
    description?: string;
    image?: CollectionImageData;
    productCount?: number;
    seo?: CollectionSeoData;
};
