import {useState, useEffect, useRef, useCallback} from "react";
import {useNavigate} from "react-router";
import {cn} from "~/lib/utils";
import {parseProductTitle} from "~/lib/product";
import {createResponsiveSizes, getGridImageConfig} from "~/lib/performance";
import type {GalleryImageData} from "~/lib/gallery";

type MasonryImageGridProps = {
    images: GalleryImageData[];
    onImageClick?: (image: GalleryImageData) => void;
    onImagesLoaded?: () => void;
};

export const MasonryImageGrid = ({images, onImageClick, onImagesLoaded}: MasonryImageGridProps) => {
    const navigate = useNavigate();
    const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());
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
    }, [images]);

    useEffect(() => {
        if (typeof window === "undefined" || !("IntersectionObserver" in window)) return;

        observerRef.current = new IntersectionObserver(
            entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target as HTMLImageElement;
                        img.classList.add("opacity-100");
                        img.classList.remove("opacity-0");
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
                        className="group sleek bg-muted/20 hover:ring-primary/20 focus:ring-primary/40 relative block w-full overflow-hidden rounded-lg hover:shadow-xl hover:ring-2 focus:ring-2 focus:outline-none"
                        aria-label={`View ${image.productTitle || "product"} - ${image.collectionTitle || "collection"}`}
                    >
                        <div className="relative w-full" style={{aspectRatio: image.aspectRatio || 1}}>
                            <img
                                ref={el => {
                                    imageRefs.current[index] = el;
                                }}
                                src={`${image.url}?format=avif&width=800&quality=85`}
                                srcSet={`${image.url}?format=avif&width=400&quality=85 400w, ${image.url}?format=avif&width=600&quality=85 600w, ${image.url}?format=avif&width=800&quality=85 800w, ${image.url}?format=avif&width=1200&quality=85 1200w`}
                                sizes={imageSizes}
                                alt={image.altText || image.productTitle || `Gallery image ${index + 1}`}
                                width={image.width}
                                height={image.height}
                                className={cn(
                                    "sleek absolute inset-0 h-full w-full object-cover xl:group-hover:scale-110",
                                    config.priority ? "opacity-100" : "opacity-0"
                                )}
                                loading={config.loading}
                                fetchPriority={config.fetchPriority}
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
