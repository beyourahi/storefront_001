/**
 * ProductCardMediaCarousel
 *
 * Renders a product's full media list (images + Shopify videos) inside a
 * product card. Falls back to a static render when only one item exists.
 *
 * Behavior goals:
 * - Videos autoplay muted + looped, but only when the card is within the
 *   viewport (IntersectionObserver). When scrolled out, they pause to save
 *   bandwidth and battery.
 * - Video sources are only attached to the <video> element once the item
 *   becomes visible (lazy-load). A preview image acts as the poster and
 *   ensures no layout shift.
 * - Arrow navigation appears on hover for pointer devices; touch devices
 *   rely on native swipe (Embla drag) plus pagination dots.
 * - All interactive carousel controls stop propagation so that the parent
 *   <Link> (the card click target) is not triggered.
 */

import {useEffect, useRef, useState, useCallback} from "react";
import {Link} from "react-router";
import {Image} from "@shopify/hydrogen";
import {ArrowLeft, ArrowRight, Play} from "lucide-react";
import {Carousel, CarouselContent, CarouselItem, type CarouselApi} from "~/components/ui/carousel";
import {ProductImagePlaceholder} from "~/components/ProductImagePlaceholder";
import {cn} from "~/lib/utils";
import type {ProductCardMedia} from "~/lib/types/product-card";

type ProductCardMediaCarouselProps = {
    media: ProductCardMedia[];
    productTitle: string;
    /** Product handle for the per-slide link target. */
    productHandle: string;
    /** Applies opacity/saturation drop when out of stock. */
    isOutOfStock?: boolean;
    /** Applies hover scale when pointer device can hover (passed from parent). */
    canHover?: boolean;
    /** Passed to <Image> for LCP-critical cards on the homepage. */
    loading?: "eager" | "lazy";
    className?: string;
};

/**
 * Wraps each carousel slide in a Link so taps navigate to the PDP. Embla's
 * internal click-vs-drag detection suppresses the click during a swipe, so
 * swiping does not accidentally navigate.
 */
function SlideLink({
    productHandle,
    productTitle,
    children
}: {
    productHandle: string;
    productTitle: string;
    children: React.ReactNode;
}) {
    return (
        <Link
            to={`/products/${productHandle}`}
            prefetch="intent"
            aria-label={productTitle}
            className="block h-full w-full rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-inset"
        >
            {children}
        </Link>
    );
}

/**
 * A lazily-mounted video element. Loads sources and begins playback only
 * when the parent card enters the viewport; pauses when it leaves.
 */
function CardVideo({
    media,
    productTitle,
    isActive,
    cardInView,
    canHover,
    isOutOfStock
}: {
    media: Extract<ProductCardMedia, {type: "video"}>;
    productTitle: string;
    isActive: boolean;
    cardInView: boolean;
    canHover: boolean;
    isOutOfStock: boolean;
}) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [sourcesLoaded, setSourcesLoaded] = useState(false);
    const [isReady, setIsReady] = useState(false);

    // Only attach sources once we know the card is in view AND this slide is active.
    // This keeps off-screen / non-visible slides from downloading video bytes.
    const shouldLoadSources = cardInView && isActive;

    useEffect(() => {
        if (shouldLoadSources && !sourcesLoaded) {
            setSourcesLoaded(true);
        }
    }, [shouldLoadSources, sourcesLoaded]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        if (shouldLoadSources) {
            // Play muted videos silently; ignore rejection (some browsers block when tab is hidden).
            const playPromise = video.play();
            if (playPromise !== undefined && typeof (playPromise as Promise<void>).catch === "function") {
                (playPromise as Promise<void>).catch(() => {});
            }
        } else {
            video.pause();
        }
    }, [shouldLoadSources, sourcesLoaded]);

    const posterUrl = media.previewImage?.url;

    return (
        <div className="relative h-full w-full">
            {/* Poster layer: always rendered so the slot has a stable image
                even before the video can paint its first frame. */}
            {posterUrl && !isReady && (
                <img
                    src={posterUrl}
                    alt={media.altText ?? productTitle}
                    className={cn(
                        "absolute inset-0 h-full w-full rounded-lg object-cover",
                        isOutOfStock && "opacity-60"
                    )}
                    loading="lazy"
                    decoding="async"
                />
            )}
            {sourcesLoaded && (
                <video
                    ref={videoRef}
                    className={cn(
                        "sleek product-image h-full w-full rounded-lg object-cover",
                        isOutOfStock ? "opacity-60" : canHover ? "group-hover:scale-[1.03]" : "group-active:scale-[1.02]",
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
                // Shimmer placeholder for videos with no preview image yet.
                <div
                    aria-hidden="true"
                    className="absolute inset-0 animate-pulse rounded-lg bg-gradient-to-br from-muted/70 to-muted/30"
                />
            )}
            {/* Small play indicator on the first paint so users know this is video. */}
            <div className="pointer-events-none absolute bottom-1.5 right-1.5 z-[4] flex items-center gap-1 rounded-full bg-background/75 px-1.5 py-0.5 text-[10px] font-medium text-foreground backdrop-blur-md">
                <Play className="h-2.5 w-2.5 fill-current" aria-hidden="true" />
                <span className="sr-only">Video</span>
            </div>
        </div>
    );
}

/**
 * A single image slide — thin wrapper around Hydrogen's `<Image>` so the
 * carousel renders images and videos through the same CarouselItem shape.
 */
function CardImage({
    media,
    productTitle,
    loading,
    canHover,
    isOutOfStock
}: {
    media: Extract<ProductCardMedia, {type: "image"}>;
    productTitle: string;
    loading: "eager" | "lazy";
    canHover: boolean;
    isOutOfStock: boolean;
}) {
    return (
        <Image
            data={{url: media.url, altText: media.altText || productTitle}}
            className={cn(
                "sleek product-image h-full w-full rounded-lg object-cover",
                isOutOfStock ? "opacity-60" : canHover ? "group-hover:scale-[1.03]" : "group-active:scale-[1.02]"
            )}
            sizes="(min-width: 1280px) 320px, (min-width: 1024px) 350px, (min-width: 768px) 280px, 200px"
            width={400}
            loading={loading}
        />
    );
}

export function ProductCardMediaCarousel({
    media,
    productTitle,
    productHandle,
    isOutOfStock = false,
    canHover = true,
    loading = "lazy",
    className
}: ProductCardMediaCarouselProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [cardInView, setCardInView] = useState(false);
    const [api, setApi] = useState<CarouselApi>();
    const [activeIndex, setActiveIndex] = useState(0);

    // Track viewport visibility so videos only play when the card is on-screen.
    // rootMargin gives us a small lead-in so video starts near the moment the
    // user sees it (avoids the "blank then pop" flash).
    useEffect(() => {
        const node = containerRef.current;
        if (!node || typeof IntersectionObserver === "undefined") {
            setCardInView(true);
            return;
        }
        const observer = new IntersectionObserver(
            entries => {
                for (const entry of entries) {
                    setCardInView(entry.isIntersecting);
                }
            },
            {threshold: 0.25, rootMargin: "150px 0px"}
        );
        observer.observe(node);
        return () => observer.disconnect();
    }, []);

    // Wire Embla API to track active slide for video activation.
    useEffect(() => {
        if (!api) return;
        const update = () => setActiveIndex(api.selectedScrollSnap());
        update();
        api.on("select", update);
        api.on("reInit", update);
        return () => {
            api.off("select", update);
            api.off("reInit", update);
        };
    }, [api]);

    const scrollPrev = useCallback(
        (e: React.SyntheticEvent) => {
            e.preventDefault();
            e.stopPropagation();
            api?.scrollPrev();
        },
        [api]
    );

    const scrollNext = useCallback(
        (e: React.SyntheticEvent) => {
            e.preventDefault();
            e.stopPropagation();
            api?.scrollNext();
        },
        [api]
    );

    // Empty media — render the shared placeholder so layout stays stable.
    if (media.length === 0) {
        return (
            <div ref={containerRef} className={cn("relative h-full w-full", className)}>
                <SlideLink productHandle={productHandle} productTitle={productTitle}>
                    <ProductImagePlaceholder className="h-full w-full rounded-lg" />
                </SlideLink>
            </div>
        );
    }

    // Single media — skip carousel machinery for cleaner DOM + better LCP.
    if (media.length === 1) {
        const item = media[0];
        return (
            <div ref={containerRef} className={cn("relative h-full w-full", className)}>
                <SlideLink productHandle={productHandle} productTitle={productTitle}>
                    {item.type === "video" ? (
                        <CardVideo
                            media={item}
                            productTitle={productTitle}
                            isActive={true}
                            cardInView={cardInView}
                            canHover={canHover}
                            isOutOfStock={isOutOfStock}
                        />
                    ) : (
                        <CardImage
                            media={item}
                            productTitle={productTitle}
                            loading={loading}
                            canHover={canHover}
                            isOutOfStock={isOutOfStock}
                        />
                    )}
                </SlideLink>
            </div>
        );
    }

    return (
        <div ref={containerRef} className={cn("relative h-full w-full", className)}>
            <Carousel
                setApi={setApi}
                opts={{
                    align: "start",
                    loop: true,
                    skipSnaps: false,
                    containScroll: "trimSnaps"
                }}
                className="h-full w-full"
            >
                <CarouselContent className="ml-0 h-full">
                    {media.map((item, index) => (
                        <CarouselItem
                            key={item.type === "image" ? item.url : item.sources[0]?.url ?? `slide-${index}`}
                            className="h-full basis-full pl-0"
                        >
                            <SlideLink productHandle={productHandle} productTitle={productTitle}>
                                <div className="relative h-full w-full overflow-hidden rounded-lg">
                                    {item.type === "video" ? (
                                        <CardVideo
                                            media={item}
                                            productTitle={productTitle}
                                            isActive={index === activeIndex}
                                            cardInView={cardInView}
                                            canHover={canHover}
                                            isOutOfStock={isOutOfStock}
                                        />
                                    ) : (
                                        <CardImage
                                            media={item}
                                            productTitle={productTitle}
                                            loading={index === 0 ? loading : "lazy"}
                                            canHover={canHover}
                                            isOutOfStock={isOutOfStock}
                                        />
                                    )}
                                </div>
                            </SlideLink>
                        </CarouselItem>
                    ))}
                </CarouselContent>
            </Carousel>

            {/* Navigation arrows — pointer devices only. Uses div[role=button] to
                avoid nesting a <button> inside the parent <Link>. */}
            <div
                role="button"
                tabIndex={0}
                aria-label="Previous media"
                onClick={scrollPrev}
                onKeyDown={e => {
                    if (e.key === "Enter" || e.key === " ") scrollPrev(e);
                }}
                className={cn(
                    "absolute left-1.5 top-1/2 z-[15] hidden size-7 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-foreground shadow-sm backdrop-blur-md transition-opacity duration-200 hover:bg-background md:flex",
                    canHover ? "opacity-0 group-hover:opacity-100" : "opacity-90"
                )}
            >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            </div>
            <div
                role="button"
                tabIndex={0}
                aria-label="Next media"
                onClick={scrollNext}
                onKeyDown={e => {
                    if (e.key === "Enter" || e.key === " ") scrollNext(e);
                }}
                className={cn(
                    "absolute right-1.5 top-1/2 z-[15] hidden size-7 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-foreground shadow-sm backdrop-blur-md transition-opacity duration-200 hover:bg-background md:flex",
                    canHover ? "opacity-0 group-hover:opacity-100" : "opacity-90"
                )}
            >
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </div>

            {/* Pagination dots — always visible so users discover multi-media. */}
            <div
                className="pointer-events-none absolute bottom-1.5 left-1/2 z-[15] flex -translate-x-1/2 items-center gap-1 rounded-full bg-background/75 px-1.5 py-1 backdrop-blur-md"
                aria-hidden="true"
            >
                {media.map((item, index) => (
                    <span
                        key={item.type === "image" ? item.url : item.sources[0]?.url ?? `dot-${index}`}
                        className={cn(
                            "h-1 rounded-full transition-all duration-200",
                            index === activeIndex ? "w-3 bg-foreground" : "w-1 bg-foreground/40"
                        )}
                    />
                ))}
            </div>
        </div>
    );
}
