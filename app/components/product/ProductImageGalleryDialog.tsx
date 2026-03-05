import {useState, useEffect, useCallback} from "react";
import {ChevronLeft, ChevronRight, X} from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import {Image} from "@shopify/hydrogen";
import {Button} from "~/components/ui/button";
import {Dialog, DialogContent} from "~/components/ui/dialog";
import {cn} from "~/lib/utils";

type ProductImage = {
    id: string;
    url: string;
    altText?: string | null;
};

type ProductImageGalleryDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    images: ProductImage[];
    initialIndex?: number;
    productTitle: string;
};

export const ProductImageGalleryDialog = ({
    open,
    onOpenChange,
    images,
    initialIndex = 0,
    productTitle
}: ProductImageGalleryDialogProps) => {
    const [activeIndex, setActiveIndex] = useState(initialIndex);
    const [canScrollPrev, setCanScrollPrev] = useState(false);
    const [canScrollNext, setCanScrollNext] = useState(false);

    const [emblaRef, emblaApi] = useEmblaCarousel({
        loop: true,
        align: "center",
        skipSnaps: false,
        containScroll: "trimSnaps"
    });

    const onSelect = useCallback(() => {
        if (!emblaApi) return;
        const selected = emblaApi.selectedScrollSnap();
        setActiveIndex(selected);
        setCanScrollPrev(emblaApi.canScrollPrev());
        setCanScrollNext(emblaApi.canScrollNext());
    }, [emblaApi]);

    useEffect(() => {
        if (!emblaApi) return;

        onSelect();
        emblaApi.on("select", onSelect);
        emblaApi.on("reInit", onSelect);

        return () => {
            emblaApi.off("select", onSelect);
            emblaApi.off("reInit", onSelect);
        };
    }, [emblaApi, onSelect]);

    useEffect(() => {
        if (open && emblaApi) {
            setTimeout(() => {
                emblaApi.scrollTo(initialIndex, true);
                emblaApi.reInit();
            }, 100);
        }
    }, [open, emblaApi, initialIndex]);

    useEffect(() => {
        if (!open) return;

        const handleKeydown = (e: KeyboardEvent) => {
            switch (e.key) {
                case "ArrowLeft":
                    e.preventDefault();
                    emblaApi?.scrollPrev();
                    break;
                case "ArrowRight":
                    e.preventDefault();
                    emblaApi?.scrollNext();
                    break;
                case "Escape":
                    e.preventDefault();
                    onOpenChange(false);
                    break;
            }
        };

        window.addEventListener("keydown", handleKeydown);
        return () => window.removeEventListener("keydown", handleKeydown);
    }, [open, emblaApi, onOpenChange]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="!bg-popover/95 !fixed !inset-0 !z-[100] !h-[100dvh] !w-screen !max-w-none !translate-x-0 !translate-y-0 !transform-none !rounded-none !border-none !p-0 !shadow-none data-[state=closed]:!animate-none data-[state=open]:!animate-none">
                <div className="relative flex h-[100dvh] w-screen items-center justify-center">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="bg-popover/50 text-popover-foreground hover:bg-popover/70 hover:text-popover-foreground absolute top-4 right-4 z-[110] h-12 w-12"
                        onClick={() => onOpenChange(false)}
                        aria-label="Close gallery"
                    >
                        <X className="h-6 w-6" />
                    </Button>

                    <div className="absolute top-4 left-4 z-[110]">
                        <div className="bg-popover/50 text-popover-foreground pointer-events-none rounded-md px-3 py-2 text-sm font-medium">
                            {activeIndex + 1} / {images.length}
                        </div>
                    </div>

                    <div className="absolute inset-0 flex items-center justify-center">
                        <div
                            ref={emblaRef}
                            className="h-full w-full cursor-grab overflow-hidden active:cursor-grabbing"
                        >
                            <div className="flex h-full w-full">
                                {images.map((image, index) => (
                                    <div
                                        key={image.id}
                                        className="flex h-full min-w-0 shrink-0 grow-0 basis-full items-center justify-center p-8"
                                    >
                                        <img
                                            src={image.url}
                                            alt={image.altText || `${productTitle} image ${index + 1}`}
                                            className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
                                            style={{
                                                width: "auto",
                                                height: "auto",
                                                maxWidth: "calc(100vw - 4rem)",
                                                maxHeight: "calc(100vh - 4rem)"
                                            }}
                                            loading={index <= 1 ? "eager" : "lazy"}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {images.length > 1 && (
                        <>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="sleek bg-popover/50 text-popover-foreground hover:bg-popover/70 hover:text-popover-foreground absolute top-1/2 left-4 z-[110] h-12 w-12 -translate-y-1/2 disabled:opacity-30"
                                onClick={() => emblaApi?.scrollPrev()}
                                disabled={!canScrollPrev}
                                aria-label="Previous image"
                            >
                                <ChevronLeft className="h-8 w-8" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="sleek bg-popover/50 text-popover-foreground hover:bg-popover/70 hover:text-popover-foreground absolute top-1/2 right-4 z-[110] h-12 w-12 -translate-y-1/2 disabled:opacity-30"
                                onClick={() => emblaApi?.scrollNext()}
                                disabled={!canScrollNext}
                                aria-label="Next image"
                            >
                                <ChevronRight className="h-8 w-8" />
                            </Button>
                        </>
                    )}

                    {images.length > 1 && (
                        <div className="absolute bottom-4 left-1/2 z-[110] -translate-x-1/2">
                            <div className="bg-popover/50 flex max-w-[80vw] gap-2 overflow-x-auto rounded-lg p-2 backdrop-blur-sm">
                                {images.map((image, index) => (
                                    <button
                                        key={image.id}
                                        type="button"
                                        className={cn(
                                            "sleek h-16 w-16 shrink-0 select-none overflow-hidden rounded-md border-2",
                                            activeIndex === index
                                                ? "border-popover-foreground scale-105 opacity-100"
                                                : "border-transparent opacity-60 hover:scale-105 hover:opacity-80"
                                        )}
                                        onClick={() => emblaApi?.scrollTo(index)}
                                        aria-label={`Go to image ${index + 1}`}
                                    >
                                        <Image
                                            data={{
                                                url: image.url,
                                                altText: image.altText || `${productTitle} thumbnail ${index + 1}`
                                            }}
                                            className="h-full w-full object-cover"
                                            sizes="64px"
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
