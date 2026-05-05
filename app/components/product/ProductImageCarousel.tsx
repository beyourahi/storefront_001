import {useState, useEffect, useCallback, useMemo} from "react";
import {ChevronLeft, ChevronRight, Maximize2} from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import {WheelGesturesPlugin} from "embla-carousel-wheel-gestures";
import {Image} from "@shopify/hydrogen";
import {Badge} from "~/components/ui/badge";
import {Button} from "~/components/ui/button";
import {cn} from "~/lib/utils";
const FALLBACK_THEME_PRODUCT_IMAGE_ASPECT_RATIO: "portrait" | "landscape" | "square" = "portrait";
import {ProductImageGalleryDialog} from "~/components/product/ProductImageGalleryDialog";
import {ProductLightbox} from "~/components/ProductLightbox";

// =============================================================================
// TYPES
// =============================================================================

type ProductImage = {
    id: string;
    url: string;
    altText?: string | null;
};

/**
 * All four Shopify media types as a discriminated union.
 * Kept local to this file to avoid coupling to storefront_002's types.d.ts.
 */
type ProductMediaItem =
    | {
          __typename: "MediaImage";
          id: string;
          alt: string | null;
          image: {id: string; url: string; altText: string | null; width: number; height: number} | null;
      }
    | {
          __typename: "Video";
          id: string;
          alt: string | null;
          sources: Array<{url: string; mimeType: string}>;
          previewImage?: {url: string; altText?: string | null; width?: number; height?: number} | null;
      }
    | {
          __typename: "ExternalVideo";
          id: string;
          alt: string | null;
          embedUrl: string;
          previewImage?: {url: string; altText?: string | null; width?: number; height?: number} | null;
      }
    | {
          __typename: "Model3d";
          id: string;
          alt: string | null;
          previewImage?: {url: string; altText?: string | null; width?: number; height?: number} | null;
      };

type ProductImageCarouselProps = {
    images: ProductImage[];
    productTitle: string;
    productHandle: string;
    onSale?: boolean;
    availableForSale?: boolean;
    className?: string;
    /** Raw Shopify media nodes (all four types). When provided, renders from these. */
    media?: unknown[];
};

// =============================================================================
// HELPERS
// =============================================================================

function isKnownMediaItem(item: unknown): item is ProductMediaItem {
    if (typeof item !== "object" || item === null) return false;
    const t = (item as Record<string, unknown>).__typename;
    return t === "MediaImage" || t === "Video" || t === "ExternalVideo" || t === "Model3d";
}

function normaliseMediaItem(raw: ProductMediaItem): ProductMediaItem {
    if (raw.__typename === "MediaImage") {
        return {
            __typename: "MediaImage",
            id: raw.id,
            alt: raw.alt ?? null,
            image: raw.image
                ? {
                      id: raw.image.id,
                      url: raw.image.url,
                      altText: raw.image.altText ?? null,
                      width: raw.image.width ?? 0,
                      height: raw.image.height ?? 0
                  }
                : null
        };
    }
    if (raw.__typename === "Video") {
        return {__typename: "Video", id: raw.id, alt: raw.alt ?? null, sources: raw.sources ?? [], previewImage: raw.previewImage ?? null};
    }
    if (raw.__typename === "ExternalVideo") {
        return {__typename: "ExternalVideo", id: raw.id, alt: raw.alt ?? null, embedUrl: raw.embedUrl, previewImage: raw.previewImage ?? null};
    }
    return {__typename: "Model3d", id: raw.id, alt: raw.alt ?? null, previewImage: raw.previewImage ?? null};
}

/** Thumbnail URL for all media types — falls back to previewImage for non-image types */
function getThumbnailUrl(item: ProductMediaItem): string | null {
    if (item.__typename === "MediaImage") return item.image?.url ?? null;
    return item.previewImage?.url ?? null;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * PDP image carousel with thumbnail strip, lightbox, and all four Shopify media types.
 * When `media` is provided, it takes precedence over the `images` array — media nodes
 * are filtered through `isKnownMediaItem` and normalized to a consistent shape. The
 * fallback converts the `images` array to `MediaImage` media items so the same render
 * path handles both inputs.
 * Clicking any slide opens `ProductLightbox` (fullscreen) with the same `galleryMedia`
 * array so indices always match between the carousel and the lightbox.
 */
export const ProductImageCarousel = ({
    images,
    productTitle,
    productHandle: _productHandle,
    onSale: _onSale = false,
    availableForSale = true,
    className = "",
    media
}: ProductImageCarouselProps) => {
    // -------------------------------------------------------------------------
    // Gallery media — single source of truth for rendering AND lightbox indices
    // -------------------------------------------------------------------------

    const galleryMedia: ProductMediaItem[] = useMemo(() => {
        if (media && media.length > 0) {
            return (media as unknown[]).filter(isKnownMediaItem).map(normaliseMediaItem);
        }
        // Fallback: images array → MediaImage shape
        return images.map(img => ({
            __typename: "MediaImage" as const,
            id: img.id,
            alt: img.altText ?? null,
            image: {id: img.id, url: img.url, altText: img.altText ?? null, width: 0, height: 0}
        }));
    }, [media, images]);

    // -------------------------------------------------------------------------
    // State
    // -------------------------------------------------------------------------

    const [activeIndex, setActiveIndex] = useState(0);
    const [galleryDialogOpen, setGalleryDialogOpen] = useState(false);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [canScrollPrev, setCanScrollPrev] = useState(false);
    const [canScrollNext, setCanScrollNext] = useState(false);

    // (Hover-autoplay removed — videos use autoPlay + loop)

    // -------------------------------------------------------------------------
    // Aspect ratio (images only; videos use natural dimensions)
    // -------------------------------------------------------------------------

    const aspectRatioClass = useMemo(() => {
        switch (FALLBACK_THEME_PRODUCT_IMAGE_ASPECT_RATIO as string) {
            case "portrait":
                return "aspect-[4/5]";
            case "landscape":
                return "aspect-[16/9]";
            case "square":
            default:
                return "aspect-square";
        }
    }, []);

    // -------------------------------------------------------------------------
    // Embla carousel
    // -------------------------------------------------------------------------

    const [mainRef, mainApi] = useEmblaCarousel({loop: true, align: "center", dragFree: false, skipSnaps: false}, [
        WheelGesturesPlugin({forceWheelAxis: "x"})
    ]);

    const [thumbRef, thumbApi] = useEmblaCarousel({containScroll: "keepSnaps", slidesToScroll: 1, dragFree: false, skipSnaps: false}, [
        WheelGesturesPlugin({forceWheelAxis: "x"})
    ]);

    const onMainSelect = useCallback(() => {
        if (!mainApi || !thumbApi) return;
        const selected = mainApi.selectedScrollSnap();
        setActiveIndex(selected);
        thumbApi.scrollTo(selected);
        setCanScrollPrev(galleryMedia.length > 1);
        setCanScrollNext(galleryMedia.length > 1);
    }, [mainApi, thumbApi, galleryMedia.length]);

    useEffect(() => {
        if (!mainApi) return;
        setCanScrollPrev(true);
        setCanScrollNext(true);
        onMainSelect();
        mainApi.on("select", onMainSelect);
        mainApi.on("reInit", onMainSelect);
        return () => {
            mainApi.off("select", onMainSelect);
            mainApi.off("reInit", onMainSelect);
        };
    }, [mainApi, onMainSelect]);

    const onThumbClick = useCallback(
        (index: number) => {
            if (mainApi && thumbApi) mainApi.scrollTo(index);
        },
        [mainApi, thumbApi]
    );

    // -------------------------------------------------------------------------
    // Lightbox / gallery dialog
    // -------------------------------------------------------------------------

    const openGallery = useCallback(
        (index: number = activeIndex) => {
            if (typeof window !== "undefined" && window.innerWidth < 1024) return;
            setActiveIndex(index);
            setGalleryDialogOpen(true);
        },
        [activeIndex]
    );

    const openLightbox = useCallback((index: number) => {
        setLightboxIndex(index);
        setLightboxOpen(true);
    }, []);

    const closeLightbox = useCallback(() => setLightboxOpen(false), []);

    const shouldCenterThumbnails = galleryMedia.length < 4;

    // =========================================================================
    // RENDERERS — main carousel slides
    // =========================================================================

    const renderMediaImage = (item: ProductMediaItem & {__typename: "MediaImage"}, index: number) => (
        <div key={item.id} className="min-w-0 shrink-0 grow-0 basis-full">
            <button
                type="button"
                className={cn(
                    `focus-visible:ring-primary h-full w-full select-none focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset ${aspectRatioClass}`,
                    availableForSale ? "cursor-zoom-in lg:cursor-zoom-in" : "cursor-default"
                )}
                onClick={() => openLightbox(index)}
                aria-label="Open image in lightbox"
            >
                {item.image && (
                    <Image
                        data={{url: item.image.url, altText: item.alt || item.image.altText || `${productTitle} image ${index + 1}`}}
                        className={cn("sleek h-full w-full object-cover", availableForSale && "hover:scale-105")}
                        sizes="(min-width: 1024px) 40vw, 100vw"
                    />
                )}
            </button>
        </div>
    );

    const renderVideo = (item: ProductMediaItem & {__typename: "Video"}, index: number) => {
        const source = item.sources.find(s => s.mimeType === "video/mp4") ?? item.sources[0];
        return (
            <div key={item.id} className="min-w-0 shrink-0 grow-0 basis-full">
                <div className="relative w-full group">
                    {/*
                     * Natural video dimensions — no fixed aspect ratio.
                     * `w-full h-auto` lets the video element size to its uploaded aspect ratio.
                     * autoPlay + loop + muted: plays immediately, repeats, no controls shown.
                     */}
                    {source ? (
                        <video
                            src={source.url}
                            poster={item.previewImage?.url}
                            className="w-full h-auto block"
                            autoPlay
                            loop
                            muted
                            playsInline
                            aria-label={item.alt || `Product video ${index + 1}`}
                        >
                            <source src={source.url} type={source.mimeType} />
                        </video>
                    ) : (
                        <div className={cn("w-full bg-muted flex items-center justify-center", aspectRatioClass)}>
                            <span className="text-muted-foreground text-sm">Video unavailable</span>
                        </div>
                    )}

                    {/* VIDEO badge */}
                    <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 rounded-full px-2.5 py-1 bg-dark/75 text-light text-xs font-medium pointer-events-none select-none">
                        <svg width="8" height="9" viewBox="0 0 8 9" aria-hidden="true" fill="currentColor">
                            <path d="M0 0L8 4.5L0 9V0Z" />
                        </svg>
                        VIDEO
                    </div>

                    {/* Expand to lightbox */}
                    <button
                        type="button"
                        className="absolute top-2 right-2 z-10 size-8 flex items-center justify-center rounded-full bg-dark/60 hover:bg-dark/80 text-light opacity-0 group-hover:opacity-100 sleek focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-light"
                        onClick={() => openLightbox(index)}
                        aria-label="Open video in fullscreen"
                    >
                        <Maximize2 className="size-4" aria-hidden="true" />
                    </button>
                </div>
            </div>
        );
    };

    const renderExternalVideo = (item: ProductMediaItem & {__typename: "ExternalVideo"}, index: number) => (
        <div key={item.id} className="min-w-0 shrink-0 grow-0 basis-full">
            <button
                type="button"
                className={cn(
                    `relative focus-visible:ring-primary h-full w-full select-none focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset group ${aspectRatioClass}`,
                    availableForSale ? "cursor-pointer" : "cursor-default"
                )}
                onClick={() => openLightbox(index)}
                aria-label={`Play ${item.alt || "external video"}`}
            >
                {item.previewImage ? (
                    <Image
                        data={item.previewImage}
                        alt={item.alt || `Video thumbnail ${index + 1}`}
                        className={cn("sleek h-full w-full object-cover", availableForSale && "hover:scale-105")}
                        loading="lazy"
                        sizes="(min-width: 1024px) 50vw, 100vw"
                    />
                ) : (
                    <div className="h-full w-full bg-muted" />
                )}
                {/* Centred play circle */}
                <div className="absolute inset-0 flex items-center justify-center bg-dark/20 group-hover:bg-dark/35 sleek pointer-events-none">
                    <div className="size-16 rounded-full bg-dark/70 flex items-center justify-center">
                        <svg width="20" height="24" viewBox="0 0 20 24" aria-hidden="true" className="text-light ml-1.5">
                            <path d="M0 0L20 12L0 24V0Z" fill="currentColor" />
                        </svg>
                    </div>
                </div>
                {/* VIDEO badge */}
                <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 rounded-full px-2.5 py-1 bg-dark/75 text-light text-xs font-medium pointer-events-none select-none">
                    <svg width="8" height="9" viewBox="0 0 8 9" aria-hidden="true" fill="currentColor">
                        <path d="M0 0L8 4.5L0 9V0Z" />
                    </svg>
                    VIDEO
                </div>
            </button>
        </div>
    );

    const renderModel3d = (item: ProductMediaItem & {__typename: "Model3d"}, index: number) => (
        <div key={item.id} className="min-w-0 shrink-0 grow-0 basis-full">
            <button
                type="button"
                className={cn(
                    `relative focus-visible:ring-primary h-full w-full select-none focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset group ${aspectRatioClass}`,
                    availableForSale ? "cursor-pointer" : "cursor-default"
                )}
                onClick={() => openLightbox(index)}
                aria-label={`View 3D model ${index + 1}`}
            >
                {item.previewImage ? (
                    <Image
                        data={item.previewImage}
                        alt={item.alt || `3D model ${index + 1}`}
                        className={cn("sleek h-full w-full object-cover", availableForSale && "hover:scale-105")}
                        loading="lazy"
                        sizes="(min-width: 1024px) 50vw, 100vw"
                    />
                ) : (
                    <div className="h-full w-full bg-muted" />
                )}
                {/* 3D badge */}
                <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 rounded-full px-2.5 py-1 bg-dark/75 text-light text-xs font-medium pointer-events-none select-none">
                    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1">
                        <path d="M6 0.5L11 3.25V8.75L6 11.5L1 8.75V3.25L6 0.5Z" />
                        <path d="M6 0.5V6M6 6L11 3.25M6 6L1 3.25M6 6V11.5" strokeWidth="0.75" />
                    </svg>
                    3D
                </div>
            </button>
        </div>
    );

    const renderSlide = (item: ProductMediaItem, index: number) => {
        switch (item.__typename) {
            case "MediaImage":
                return renderMediaImage(item, index);
            case "Video":
                return renderVideo(item, index);
            case "ExternalVideo":
                return renderExternalVideo(item, index);
            case "Model3d":
                return renderModel3d(item, index);
        }
    };

    // =========================================================================
    // RENDERERS — thumbnail strip
    // =========================================================================

    const renderThumbnail = (item: ProductMediaItem, index: number) => {
        const thumbUrl = getThumbnailUrl(item);
        const isVideo = item.__typename === "Video" || item.__typename === "ExternalVideo";
        const is3d = item.__typename === "Model3d";

        return (
            <div key={item.id} className="min-w-0 shrink-0 grow-0 basis-1/4">
                <button
                    type="button"
                    className={cn(
                        `bg-muted sleek w-full select-none overflow-hidden rounded-md border-2 ${
                            activeIndex === index ? "border-primary" : "border-transparent"
                        }`,
                        availableForSale && "hover:border-primary/50"
                    )}
                    onClick={() => onThumbClick(index)}
                    onContextMenu={e => {
                        e.preventDefault();
                        openLightbox(index);
                    }}
                    onDoubleClick={() => openLightbox(index)}
                    aria-label={`Go to ${is3d ? "3D model" : isVideo ? "video" : "image"} ${index + 1}. Right-click or double-click to open lightbox.`}
                >
                    <div
                        className={cn(
                            `relative h-full w-full ${aspectRatioClass} sleek`,
                            activeIndex !== index ? "opacity-60" : "opacity-100",
                            availableForSale && "hover:opacity-100"
                        )}
                    >
                        {thumbUrl ? (
                            <Image
                                src={thumbUrl}
                                alt=""
                                width={128}
                                height={160}
                                className={cn("sleek h-full w-full", availableForSale && "hover:scale-110", "object-cover")}
                                loading="lazy"
                                sizes="128px"
                            />
                        ) : (
                            <div className="h-full w-full bg-muted flex items-center justify-center">
                                <span className="text-sm text-muted-foreground">{index + 1}</span>
                            </div>
                        )}

                        {/* Video indicator */}
                        {isVideo && (
                            <div className="absolute inset-0 flex items-center justify-center bg-dark/40">
                                <svg width="12" height="14" viewBox="0 0 8 9" aria-hidden="true" className="text-light" fill="currentColor">
                                    <path d="M0 0L8 4.5L0 9V0Z" />
                                </svg>
                            </div>
                        )}

                        {/* 3D model indicator */}
                        {is3d && (
                            <div className="absolute inset-0 flex items-center justify-center bg-dark/40">
                                <svg width="16" height="16" viewBox="0 0 12 12" aria-hidden="true" fill="none" stroke="white" strokeWidth="1">
                                    <path d="M6 0.5L11 3.25V8.75L6 11.5L1 8.75V3.25L6 0.5Z" />
                                    <path d="M6 0.5V6M6 6L11 3.25M6 6L1 3.25M6 6V11.5" strokeWidth="0.75" />
                                </svg>
                            </div>
                        )}
                    </div>
                </button>
            </div>
        );
    };

    // =========================================================================
    // RENDER
    // =========================================================================

    return (
        <>
            <div className={cn("space-y-4", className)} role="region" aria-label="Product images">
                <div className="bg-muted group relative overflow-hidden rounded-lg">
                    <div ref={mainRef} className="overflow-hidden" data-embla-carousel="main">
                        <div className="flex">{galleryMedia.map(renderSlide)}</div>
                    </div>

                    {galleryMedia.length > 1 && (
                        <>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                    "bg-background/80 hover:bg-background sleek absolute top-1/2 left-3 z-10 h-10 w-10 -translate-y-1/2 transform rounded-full opacity-0",
                                    availableForSale && "group-hover:opacity-100"
                                )}
                                onClick={() => mainApi?.scrollPrev()}
                                disabled={!canScrollPrev}
                                aria-label="Previous image"
                            >
                                <ChevronLeft className="h-6 w-6" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                    "bg-background/80 hover:bg-background sleek absolute top-1/2 right-3 z-10 h-10 w-10 -translate-y-1/2 transform rounded-full opacity-0",
                                    availableForSale && "group-hover:opacity-100"
                                )}
                                onClick={() => mainApi?.scrollNext()}
                                disabled={!canScrollNext}
                                aria-label="Next image"
                            >
                                <ChevronRight className="h-6 w-6" />
                            </Button>
                        </>
                    )}

                    {galleryMedia.length > 1 && (
                        <div className="absolute right-4 bottom-4 z-10">
                            <Badge variant="secondary" className="bg-background/80 text-foreground">
                                {activeIndex + 1} / {galleryMedia.length}
                            </Badge>
                        </div>
                    )}
                </div>

                {galleryMedia.length > 1 && (
                    <div className="overflow-hidden">
                        <div ref={thumbRef} className="">
                            <div className={`flex gap-2 xl:gap-4 ${shouldCenterThumbnails ? "justify-center" : ""}`}>
                                {galleryMedia.map(renderThumbnail)}
                            </div>
                        </div>
                    </div>
                )}

                {galleryMedia.length > 1 && (
                    <div className="flex justify-center gap-2 sm:hidden">
                        {galleryMedia.map((item, index) => (
                            <button
                                key={item.id}
                                type="button"
                                className={`sleek h-2 w-2 select-none rounded-full ${
                                    activeIndex === index ? "bg-primary" : "bg-primary/30"
                                }`}
                                onClick={() => onThumbClick(index)}
                                aria-label={`Go to slide ${index + 1}`}
                            />
                        ))}
                    </div>
                )}
            </div>

            <ProductImageGalleryDialog
                open={galleryDialogOpen}
                onOpenChange={setGalleryDialogOpen}
                images={images}
                initialIndex={activeIndex}
                productTitle={productTitle}
                availableForSale={availableForSale}
            />

            {/* Lightbox uses galleryMedia so indices always align with the carousel */}
            <ProductLightbox
                media={galleryMedia}
                initialIndex={lightboxIndex}
                isOpen={lightboxOpen}
                onClose={closeLightbox}
                availableForSale={availableForSale}
            />
        </>
    );
};
