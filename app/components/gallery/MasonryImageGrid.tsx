import {useState, useEffect, useRef, useCallback} from "react";
import {useNavigate} from "react-router";
import {cn} from "~/lib/utils";
import {parseProductTitle} from "~/lib/product";
import {buildShopifyImageUrl, createResponsiveSizes, getGridImageConfig} from "~/lib/performance";
import type {GalleryImageData} from "~/lib/gallery";

type MasonryImageGridProps = {
    images: GalleryImageData[];
    onImageClick?: (image: GalleryImageData) => void;
    onImagesLoaded?: () => void;
};

export const MasonryImageGrid = ({images, onImageClick, onImagesLoaded}: MasonryImageGridProps) => {
    const navigate = useNavigate();
    const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());
    const [visibleImages, setVisibleImages] = useState<Set<number>>(new Set());
    const imageRefs = useRef<(HTMLImageElement | null)[]>([]);
    const observerRef = useRef<IntersectionObserver | null>(null);

    const handleImageClick = useCallback(
        (image: GalleryImageData) => {
            if (onImageClick) {
                onImageClick(image);
            } else if (image.productHandle) {
                const path = image.collectionHandle
                    ? `/collections/${image.collectionHandle}/products/${image.productHandle}`
                    : `/products/${image.productHandle}`;
                void navigate(path);
            }
        },
        [onImageClick, navigate]
    );

    const handleImageLoad = useCallback(
        (index: number) => {
            setLoadedImages(prev => {
                const next = new Set(prev);
                next.add(index);
                if (onImagesLoaded && next.size === images.length && images.length > 0) {
                    onImagesLoaded();
                }
                return next;
            });
        },
        [images.length, onImagesLoaded]
    );

    useEffect(() => {
        setLoadedImages(new Set());
        setVisibleImages(new Set());
        // Images cached in the browser fire onLoad before React attaches the handler.
        // Check img.complete after reset to catch these already-loaded images.
        imageRefs.current.forEach((img, index) => {
            if (img?.complete && img.naturalWidth > 0) {
                setLoadedImages(prev => {
                    const next = new Set(prev);
                    next.add(index);
                    return next;
                });
            }
        });
    }, [images]);

    useEffect(() => {
        if (typeof window === "undefined" || !("IntersectionObserver" in window)) return;

        observerRef.current = new IntersectionObserver(
            entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target as HTMLImageElement;
                        const index = parseInt(img.dataset.index ?? "0", 10);
                        setVisibleImages(prev => {
                            const next = new Set(prev);
                            next.add(index);
                            return next;
                        });
                        observerRef.current?.unobserve(img);
                    }
                });
            },
            {
                rootMargin: "50px",
                threshold: 0.01
            }
        );

        imageRefs.current.forEach((img, index) => {
            if (img && !getGridImageConfig(index, 5).priority) {
                observerRef.current?.observe(img);
            }
        });

        return () => {
            observerRef.current?.disconnect();
        };
    }, [images]);

    const imageSizes = createResponsiveSizes(2, 3, 5);

    return (
        <div className="masonry-grid grid grid-cols-2 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {images.map((image, index) => {
                const config = getGridImageConfig(index, 5);

                return (
                    <button
                        key={`${image.productHandle}-${image.url}`}
                        type="button"
                        onClick={() => handleImageClick(image)}
                        className="group sleek bg-muted/20 hover:ring-primary/20 focus-visible:ring-primary/40 relative block w-full overflow-hidden rounded-lg hover:shadow-xl hover:ring-2 focus-visible:ring-2 focus-visible:outline-none"
                        aria-label={`View ${image.productTitle || "product"} - ${image.collectionTitle || "collection"}`}
                    >
                        <div className="relative w-full" style={{aspectRatio: image.aspectRatio || 1}}>
                            <img
                                ref={el => {
                                    imageRefs.current[index] = el;
                                }}
                                src={buildShopifyImageUrl(image.url, {format: "avif", width: 800, quality: 85})}
                                srcSet={[400, 600, 800, 1200]
                                    .map(w => `${buildShopifyImageUrl(image.url, {format: "avif", width: w, quality: 85})} ${w}w`)
                                    .join(", ")}
                                sizes={imageSizes}
                                alt={image.altText || image.productTitle || `Gallery image ${index + 1}`}
                                width={image.width}
                                height={image.height}
                                className={cn(
                                    "sleek absolute inset-0 h-full w-full object-cover xl:group-hover:scale-110",
                                    config.priority || visibleImages.has(index) ? "opacity-100" : "opacity-0"
                                )}
                                loading={config.loading}
                                {...(config.fetchPriority ? {fetchpriority: config.fetchPriority} : {})}
                                onLoad={() => handleImageLoad(index)}
                                data-index={index}
                            />

                            {!loadedImages.has(index) && (
                                <div className="animate-shimmer from-muted/0 via-muted/60 to-muted/0 absolute inset-0 bg-gradient-to-r" />
                            )}
                        </div>

                        <div className="sleek absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 backdrop-blur-[1px] group-hover:translate-y-0">
                            {(() => {
                                const {primary, secondary} = parseProductTitle(image.productTitle ?? "");
                                return (
                                    <>
                                        <p className="line-clamp-1 text-sm font-bold tracking-wide text-white drop-shadow-sm">
                                            {primary}
                                        </p>
                                        {secondary && (
                                            <p className="line-clamp-1 text-xs font-medium tracking-wide text-white/90 drop-shadow-sm">
                                                {secondary}
                                            </p>
                                        )}
                                    </>
                                );
                            })()}
                            {image.collectionTitle && (
                                <p className="mt-0.5 line-clamp-1 text-xs font-medium text-white/75">
                                    {image.collectionTitle}
                                </p>
                            )}
                        </div>
                    </button>
                );
            })}
        </div>
    );
};
