/**
 * PrimaryProductMedia
 *
 * Canonical renderer for a product's "primary media" across the storefront —
 * the single media slot shown on cart lines, cart suggestions, quick add
 * dialogs/sheets, compact cards, search result thumbnails, etc.
 *
 * Why this exists:
 * Historically each surface wrote its own `<Image>` call. When Shopify
 * products use a Video as their first media asset, those surfaces fell back
 * to a still image (or the variant image) and diverged from the product
 * card grid, which already supports video. This component unifies that
 * logic so every surface renders the same media type for a given product.
 *
 * Behavior:
 * - When `media.type === "video"`: renders an autoplay/muted/looped/playsInline
 *   <video>. Sources are attached lazily once the element intersects the
 *   viewport, and playback pauses when it leaves. A poster image (from
 *   `previewImage.url`) keeps the slot stable during load.
 * - When `media.type === "image"`: renders Hydrogen's optimized `<Image>`.
 * - When `media` is null/undefined: renders `<ProductImagePlaceholder>`.
 *
 * This is deliberately a *single-media* renderer. Multi-media carousels
 * (ProductCardMediaCarousel, ProductImageCarousel) have their own
 * per-slide logic and should not route through this component.
 */

import {useEffect, useRef, useState} from "react";
import {Image} from "@shopify/hydrogen";
import {Play} from "lucide-react";
import {ProductImagePlaceholder} from "~/components/ProductImagePlaceholder";
import {cn} from "~/lib/utils";
import type {ProductCardMedia} from "~/lib/types/product-card";

export type PrimaryProductMediaProps = {
    media?: ProductCardMedia | null;
    /** Used as alt text fallback when the media node lacks one. */
    productTitle: string;
    /** Applied to the outer element so callers can size/position freely. */
    className?: string;
    /** Applied directly to the <img>/<video> — lets callers override object-fit, radius, etc. */
    mediaClassName?: string;
    /**
     * Placeholder flavour when there is no media at all. `compact` is a
     * smaller, tighter placeholder suited to thumbnails (cart lines, etc).
     */
    placeholderCompact?: boolean;
    /** Optional explicit placeholder aspect ratio. */
    placeholderAspectRatio?: "4/5" | "square";
    /** Hydrogen <Image> `sizes` attribute — optional perf tuning. */
    sizes?: string;
    /** Hydrogen <Image> `width` — affects generated srcSet sizes. */
    width?: number;
    /** Hydrogen <Image> `height`. */
    height?: number;
    /** Image loading hint. Videos always load lazily via IntersectionObserver. */
    loading?: "eager" | "lazy";
    /** When false, suppresses the small "▶ Video" indicator badge (e.g. inside dialogs). */
    showVideoIndicator?: boolean;
    /** Forwarded to aria-label when useful for interactive wrappers. */
    ariaLabel?: string;
};

/**
 * Lazily-mounted video that follows the same visibility-driven lifecycle as
 * ProductCardMediaCarousel: sources attach on first intersection, playback
 * pauses on exit, and a poster image absorbs the first-paint gap.
 */
function LazyVideo({
    media,
    productTitle,
    mediaClassName,
    showVideoIndicator
}: {
    media: Extract<ProductCardMedia, {type: "video"}>;
    productTitle: string;
    mediaClassName?: string;
    showVideoIndicator: boolean;
}) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [inView, setInView] = useState(false);
    const [sourcesLoaded, setSourcesLoaded] = useState(false);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        const node = containerRef.current;
        if (!node || typeof IntersectionObserver === "undefined") {
            // SSR/legacy fallback — assume visible so sources attach.
            setInView(true);
            return;
        }
        const observer = new IntersectionObserver(
            entries => {
                for (const entry of entries) setInView(entry.isIntersecting);
            },
            {threshold: 0.25, rootMargin: "150px 0px"}
        );
        observer.observe(node);
        return () => observer.disconnect();
    }, []);

    // Attach <source> nodes on first visibility so off-screen instances
    // (cart drawer rendered but closed, suggestion carousel scrolled off)
    // never fetch video bytes.
    useEffect(() => {
        if (inView && !sourcesLoaded) setSourcesLoaded(true);
    }, [inView, sourcesLoaded]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;
        if (inView) {
            const p: unknown = video.play();
            if (p && typeof (p as Promise<void>).catch === "function") {
                void (p as Promise<void>).catch(() => {
                    /* ignored — autoplay is sometimes blocked while tab hidden */
                });
            }
        } else {
            video.pause();
        }
    }, [inView, sourcesLoaded]);

    const posterUrl = media.previewImage?.url;

    return (
        <div ref={containerRef} className="relative h-full w-full">
            {posterUrl && !isReady && (
                <img
                    src={posterUrl}
                    alt={media.altText ?? productTitle}
                    className={cn("absolute inset-0 h-full w-full object-cover", mediaClassName)}
                    loading="lazy"
                    decoding="async"
                />
            )}
            {sourcesLoaded && (
                <video
                    ref={videoRef}
                    className={cn(
                        "h-full w-full object-cover transition-opacity duration-200",
                        mediaClassName,
                        isReady ? "opacity-100" : "opacity-0"
                    )}
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    poster={posterUrl}
                    aria-label={media.altText ?? `${productTitle} video`}
                    onCanPlay={() => setIsReady(true)}
                >
                    {media.sources.map(source => (
                        <source key={source.url} src={source.url} type={source.mimeType} />
                    ))}
                </video>
            )}
            {!sourcesLoaded && !posterUrl && (
                <div
                    aria-hidden="true"
                    className="absolute inset-0 animate-pulse rounded-[inherit] bg-gradient-to-br from-muted/70 to-muted/30"
                />
            )}
            {showVideoIndicator && (
                <div className="pointer-events-none absolute bottom-1 right-1 z-[4] flex items-center gap-0.5 rounded-full bg-background/75 px-1 py-0.5 text-[9px] font-medium text-foreground backdrop-blur-md">
                    <Play className="h-2 w-2 fill-current" aria-hidden="true" />
                    <span className="sr-only">Video</span>
                </div>
            )}
        </div>
    );
}

export function PrimaryProductMedia({
    media,
    productTitle,
    className,
    mediaClassName,
    placeholderCompact = false,
    placeholderAspectRatio,
    sizes,
    width,
    height,
    loading = "lazy",
    showVideoIndicator = true,
    ariaLabel
}: PrimaryProductMediaProps) {
    if (!media) {
        return (
            <div className={cn("relative", className)} aria-label={ariaLabel}>
                <ProductImagePlaceholder
                    compact={placeholderCompact}
                    aspectRatio={placeholderAspectRatio}
                    className={cn("h-full w-full", mediaClassName)}
                />
            </div>
        );
    }

    if (media.type === "video") {
        return (
            <div className={cn("relative overflow-hidden", className)} aria-label={ariaLabel}>
                <LazyVideo
                    media={media}
                    productTitle={productTitle}
                    mediaClassName={mediaClassName}
                    showVideoIndicator={showVideoIndicator}
                />
            </div>
        );
    }

    return (
        <div className={cn("relative overflow-hidden", className)} aria-label={ariaLabel}>
            <Image
                data={{url: media.url, altText: media.altText ?? productTitle}}
                className={cn("h-full w-full object-cover", mediaClassName)}
                sizes={sizes}
                width={width}
                height={height}
                loading={loading}
            />
        </div>
    );
}
