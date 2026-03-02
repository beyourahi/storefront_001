export type CollectionSeoData = {
    title: string | null;
    description: string | null;
};

export type CollectionImageData = {
    url: string;
    altText?: string | null;
} | null;

export type CollectionCardData = {
    id: string;
    title: string;
    handle: string;
    description?: string;
    image?: CollectionImageData;
    productCount?: number;
    seo?: CollectionSeoData;
};
