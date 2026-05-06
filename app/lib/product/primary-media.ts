/**
 * primary-media.ts
 *
 * Single-purpose helpers for resolving a product's *primary media* — the
 * first media node Shopify returns for a product, which may be either a
 * video or an image.
 *
 * Two entry points:
 * - `pickPrimaryMedia(mediaNodes, fallbackImage?)` — accepts raw Shopify
 *   media nodes (from the Storefront API `media` connection) and optionally
 *   a fallback image. Returns a normalized `ProductCardMedia | null`.
 * - `getProductCardMedia` lives in `product-card-utils.ts` and returns a
 *   *full* array; this module provides the narrower single-slot view used
 *   by cart lines, quick-add dialogs, compact product cards, etc.
 *
 * The distinction matters because the cart GraphQL fragment selects raw
 * `media(first: 3) { nodes { ... } }` rather than going through the card
 * data transform, and we want one helper rather than duplicating the
 * discriminated-union logic inline at every call site.
 */

import type {ProductCardMedia, ShopifyMediaNode} from "~/lib/types/product-card";

type RawMediaNode = {
    __typename?: string;
    alt?: string | null;
    sources?: Array<{url: string; mimeType: string; width?: number | null; height?: number | null}> | null;
    previewImage?: {url?: string | null; altText?: string | null} | null;
    image?: {url?: string | null; altText?: string | null} | null;
};

type FallbackImage =
    | {
          url?: string | null;
          altText?: string | null;
      }
    | null
    | undefined;

/**
 * Convert a single raw Storefront media node into the normalized
 * `ProductCardMedia` shape. Returns null when the node lacks the data
 * required to render (no sources for videos, no url for images, or an
 * unsupported __typename like Model3d / ExternalVideo).
 */
const normalize = (node: RawMediaNode | ShopifyMediaNode | null | undefined): ProductCardMedia | null => {
    if (!node || typeof node !== "object") return null;
    const typename = (node as RawMediaNode).__typename;

    if (typename === "Video") {
        const sources = (node as RawMediaNode).sources ?? [];
        const validSources = sources
            .filter((s): s is {url: string; mimeType: string} => Boolean(s?.url && s?.mimeType))
            .map(s => ({url: String(s.url), mimeType: String(s.mimeType)}));
        if (validSources.length === 0) return null;
        const preview = (node as RawMediaNode).previewImage;
        return {
            type: "video",
            sources: validSources,
            previewImage: preview?.url ? {url: String(preview.url), altText: preview.altText ?? null} : null,
            altText: (node as RawMediaNode).alt ?? null
        };
    }

    if (typename === "MediaImage") {
        const image = (node as RawMediaNode).image;
        if (!image?.url) return null;
        return {
            type: "image",
            url: String(image.url),
            altText: image.altText ?? (node as RawMediaNode).alt ?? null
        };
    }

    return null;
};

/**
 * Return the first renderable media node, preferring the natural order the
 * merchant set in Shopify (first node wins, regardless of type). Falls back
 * to an image when:
 *   1. No media nodes were provided.
 *   2. Every node was unsupported (e.g. only Model3d entries).
 *   3. Callers pass a `fallbackImage` — used when product.media isn't in
 *      the query yet (e.g. variant-only paths).
 */
export const pickPrimaryMedia = (
    mediaNodes: ReadonlyArray<RawMediaNode | ShopifyMediaNode | null | undefined> | null | undefined,
    fallbackImage?: FallbackImage
): ProductCardMedia | null => {
    if (Array.isArray(mediaNodes)) {
        for (const node of mediaNodes) {
            const normalized = normalize(node);
            if (normalized) return normalized;
        }
    }

    if (fallbackImage?.url) {
        return {
            type: "image",
            url: String(fallbackImage.url),
            altText: fallbackImage.altText ?? null
        };
    }

    return null;
};

/**
 * Convenience: normalize an entire media connection (drops unsupported
 * nodes). Callers that want only the first renderable node should use
 * `pickPrimaryMedia`; this variant is for surfaces that want a full list.
 */
export const normalizeMediaNodes = (
    mediaNodes: ReadonlyArray<RawMediaNode | ShopifyMediaNode | null | undefined> | null | undefined
): ProductCardMedia[] => {
    if (!Array.isArray(mediaNodes)) return [];
    const out: ProductCardMedia[] = [];
    for (const node of mediaNodes) {
        const normalized = normalize(node);
        if (normalized) out.push(normalized);
    }
    return out;
};
