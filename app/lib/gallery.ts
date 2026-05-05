/** Normalized image record used by the gallery masonry grid. */
export interface GalleryImageData {
    id?: string;
    url: string;
    altText?: string | null;
    width?: number;
    height?: number;
    aspectRatio?: number;
    productHandle?: string;
    productTitle?: string;
    collectionHandle?: string | null;
    collectionTitle?: string | null;
}

/** Cursor-pagination metadata for the gallery route. */
export interface GalleryPageInfo {
    hasNextPage: boolean;
    endCursor: string | null;
}

/**
 * Flattens product + image pairs from the Shopify response into a consistent
 * `GalleryImageData[]` array. Associates each image with its source product
 * handle/title and first-collection handle/title for filtering.
 */
export const transformToGalleryImages = (
    products: Array<{
        handle: string;
        title: string;
        collections: {
            nodes: Array<{
                handle: string;
                title: string;
            }>;
        };
        images: {
            nodes: Array<{
                id?: string | null;
                url: string;
                altText?: string | null;
                width?: number | null;
                height?: number | null;
            }>;
        };
    }>
): GalleryImageData[] => {
    const images: GalleryImageData[] = [];

    for (const product of products) {
        const collection = product.collections.nodes[0] ?? null;

        for (let i = 0; i < product.images.nodes.length; i++) {
            const image = product.images.nodes[i];
            if (!image.url) continue;

            const width = image.width ?? 800;
            const height = image.height ?? 1000;

            images.push({
                id: `${product.handle}-${image.id ?? i}`,
                url: image.url,
                altText: image.altText ?? null,
                width,
                height,
                aspectRatio: width / height,
                productHandle: product.handle,
                productTitle: product.title,
                collectionHandle: collection?.handle ?? null,
                collectionTitle: collection?.title ?? null
            });
        }
    }

    return images;
};
