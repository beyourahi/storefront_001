import {useState, useEffect, useCallback, useMemo} from "react";
import {ChevronLeft, ChevronRight} from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import {WheelGesturesPlugin} from "embla-carousel-wheel-gestures";
import {Image} from "@shopify/hydrogen";
import {Badge} from "~/components/ui/badge";
import {Button} from "~/components/ui/button";
import {cn} from "~/lib/utils";
const FALLBACK_THEME_PRODUCT_IMAGE_ASPECT_RATIO: "portrait" | "landscape" | "square" = "portrait";
import {ProductImageGalleryDialog} from "~/components/product/ProductImageGalleryDialog";
import {ProductLightbox} from "~/components/ProductLightbox";

type ProductImage = {
    id: string;
    url: string;
    altText?: string | null;
};

type ProductMediaItem = {
    __typename: "MediaImage" | "Video";
    id: string;
    alt: string | null;
    image?: {
        id: string;
        url: string;
        altText: string | null;
        width: number;
        height: number;
    } | null;
};

type ProductImageCarouselProps = {
    images: ProductImage[];
    productTitle: string;
    productHandle: string;
    onSale?: boolean;
    className?: string;
};

export const ProductImageCarousel = ({
    images,
    productTitle,
    productHandle: _productHandle,
    onSale: _onSale = false,
    className = ""
}: ProductImageCarouselProps) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [galleryDialogOpen, setGalleryDialogOpen] = useState(false);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [canScrollPrev, setCanScrollPrev] = useState(false);
    const [canScrollNext, setCanScrollNext] = useState(false);

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

    const lightboxMedia: ProductMediaItem[] = useMemo(() => {
        return images.map(img => ({
            __typename: "MediaImage" as const,
            id: img.id,
            alt: img.altText ?? null,
            image: {
                id: img.id,
                url: img.url,
                altText: img.altText ?? null,
                width: 0,
                height: 0
            }
        }));
    }, [images]);

    const [mainRef, mainApi] = useEmblaCarousel({loop: true, align: "center"}, [
        WheelGesturesPlugin({forceWheelAxis: "x"})
    ]);

    const [thumbRef, thumbApi] = useEmblaCarousel({containScroll: "keepSnaps", slidesToScroll: 1}, [
        WheelGesturesPlugin({forceWheelAxis: "x"})
    ]);

    const onMainSelect = useCallback(() => {
        if (!mainApi || !thumbApi) return;
        const selected = mainApi.selectedScrollSnap();
        setActiveIndex(selected);
        thumbApi.scrollTo(selected);
        setCanScrollPrev(images.length > 1);
        setCanScrollNext(images.length > 1);
    }, [mainApi, thumbApi, images.length]);

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
            if (mainApi && thumbApi) {
                mainApi.scrollTo(index);
            }
        },
        [mainApi, thumbApi]
    );

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

    const closeLightbox = useCallback(() => {
        setLightboxOpen(false);
    }, []);

    const shouldCenterThumbnails = images.length < 4;

    return (
        <>
            <div className={cn("space-y-4", className)} role="region" aria-label="Product images">
                <div className="bg-muted group relative overflow-hidden rounded-lg">
                    <div ref={mainRef} className="overflow-hidden" data-embla-carousel="main">
                        <div className="flex">
                            {images.map((image, index) => (
                                <div key={image.id} className="min-w-0 shrink-0 grow-0 basis-full">
                                    <button
                                        type="button"
                                        className={`focus-visible:ring-primary h-full w-full cursor-zoom-in select-none focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset lg:cursor-zoom-in ${aspectRatioClass}`}
                                        onClick={() => openLightbox(index)}
                                        aria-label="Open image in lightbox"
                                    >
                                        <Image
                                            data={{
                                                url: image.url,
                                                altText: image.altText || `${productTitle} image ${index + 1}`
                                            }}
                                            className="sleek h-full w-full object-cover hover:scale-105"
                                            sizes="(min-width: 1024px) 40vw, 100vw"
                                        />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {images.length > 1 && (
                        <>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="bg-background/80 hover:bg-background sleek absolute top-1/2 left-3 z-10 h-10 w-10 -translate-y-1/2 transform rounded-full opacity-0 group-hover:opacity-100"
                                onClick={() => mainApi?.scrollPrev()}
                                disabled={!canScrollPrev}
                                aria-label="Previous image"
                            >
                                <ChevronLeft className="h-6 w-6" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="bg-background/80 hover:bg-background sleek absolute top-1/2 right-3 z-10 h-10 w-10 -translate-y-1/2 transform rounded-full opacity-0 group-hover:opacity-100"
                                onClick={() => mainApi?.scrollNext()}
                                disabled={!canScrollNext}
                                aria-label="Next image"
                            >
                                <ChevronRight className="h-6 w-6" />
                            </Button>
                        </>
                    )}

                    {images.length > 1 && (
                        <div className="absolute right-4 bottom-4 z-10">
                            <Badge variant="secondary" className="bg-background/80 text-foreground">
                                {activeIndex + 1} / {images.length}
                            </Badge>
                        </div>
                    )}
                </div>

                {images.length > 1 && (
                    <div className="overflow-hidden">
                        <div ref={thumbRef} className="">
                            <div className={`flex gap-2 xl:gap-4 ${shouldCenterThumbnails ? "justify-center" : ""}`}>
                                {images.map((image, index) => (
                                    <div key={image.id} className="min-w-0 shrink-0 grow-0 basis-1/4">
                                        <button
                                            type="button"
                                            className={`bg-muted sleek w-full select-none overflow-hidden rounded-md border-2 ${
                                                activeIndex === index ? "border-primary" : "border-transparent"
                                            } hover:border-primary/50`}
                                            onClick={() => onThumbClick(index)}
                                            onContextMenu={e => {
                                                e.preventDefault();
                                                openLightbox(index);
                                            }}
                                            onDoubleClick={() => openLightbox(index)}
                                            aria-label={`Go to image ${index + 1}. Right-click or double-click to open lightbox.`}
                                        >
                                            <div
                                                className={`relative h-full w-full ${aspectRatioClass} ${
                                                    activeIndex !== index ? "opacity-60" : "opacity-100"
                                                } sleek hover:opacity-100`}
                                            >
                                                <Image
                                                    data={{
                                                        url: image.url,
                                                        altText:
                                                            image.altText || `${productTitle} thumbnail ${index + 1}`
                                                    }}
                                                    className="sleek h-full w-full hover:scale-110"
                                                    sizes="150px"
                                                />
                                            </div>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {images.length > 1 && (
                    <div className="flex justify-center gap-2 sm:hidden">
                        {images.map((image, index) => (
                            <button
                                key={image.id}
                                type="button"
                                className={`sleek h-2 w-2 select-none rounded-full ${
                                    activeIndex === index ? "bg-primary" : "bg-primary/30"
                                }`}
                                onClick={() => onThumbClick(index)}
                                aria-label={`Go to image ${index + 1}`}
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
            />

            <ProductLightbox
                media={lightboxMedia}
                initialIndex={lightboxIndex}
                isOpen={lightboxOpen}
                onClose={closeLightbox}
            />
        </>
    );
};
