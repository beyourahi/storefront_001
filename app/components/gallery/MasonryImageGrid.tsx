import {useState, useEffect, useRef, useCallback} from "react";
import {Link, useFetcher, useSearchParams} from "react-router";
import {Image} from "@shopify/hydrogen";
import {cn} from "~/lib/utils";
import {parseProductTitle} from "~/lib/product";
import {buildShopifyImageUrl, createResponsiveSizes, getGridImageConfig} from "~/lib/performance";
import {usePointerCapabilities} from "~/hooks/usePointerCapabilities";
import {Spinner} from "~/components/ui/spinner";
import type {GalleryImageData, GalleryPageInfo} from "~/lib/gallery";

type MasonryImageGridProps = {
    initialImages: GalleryImageData[];
    pageInfo: GalleryPageInfo;
};

export const MasonryImageGrid = ({initialImages, pageInfo}: MasonryImageGridProps) => {
    const {canHover} = usePointerCapabilities();
    const fetcher = useFetcher<{productImages: GalleryImageData[]; pageInfo: GalleryPageInfo}>({
        key: "gallery-infinite-scroll"
    });
    const [searchParams] = useSearchParams();

    const [images, setImages] = useState<GalleryImageData[]>(initialImages);
    const [cursor, setCursor] = useState<string | null>(pageInfo.endCursor);
    const [hasMore, setHasMore] = useState(pageInfo.hasNextPage);

    const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());
    const [visibleImages, setVisibleImages] = useState<Set<number>>(new Set());
    const imageRefs = useRef<(HTMLImageElement | null)[]>([]);
    const observerRef = useRef<IntersectionObserver | null>(null);
    const sentinelRef = useRef<HTMLDivElement>(null);

    // Reset when the initial page changes (e.g. after navigation).
    useEffect(() => {
        setImages(initialImages);
        setCursor(pageInfo.endCursor);
        setHasMore(pageInfo.hasNextPage);
    }, [initialImages, pageInfo.endCursor, pageInfo.hasNextPage]);

    // Append fetched images. Dedupe by id to guard against edge-case overlaps.
    useEffect(() => {
        if (fetcher.data?.productImages && fetcher.data.productImages.length > 0) {
            setImages(prev => {
                const existingIds = new Set(prev.map(img => img.id));
                const incoming = fetcher.data!.productImages.filter(img => !img.id || !existingIds.has(img.id));
                return [...prev, ...incoming];
            });
            setCursor(fetcher.data.pageInfo.endCursor);
            setHasMore(fetcher.data.pageInfo.hasNextPage);
        }
    }, [fetcher.data]);

    // Sentinel-driven infinite scroll. Trigger 200px before the user reaches the bottom.
    useEffect(() => {
        if (!sentinelRef.current || !hasMore) return;

        const observer = new IntersectionObserver(
            entries => {
                const [entry] = entries;
                if (entry.isIntersecting && fetcher.state === "idle" && hasMore && cursor) {
                    const params = new URLSearchParams(searchParams);
                    params.set("cursor", cursor);
                    params.set("index", ""); // fetcher-only data load
                    void fetcher.load(`?${params.toString()}`);
                }
            },
            {rootMargin: "200px"}
        );

        observer.observe(sentinelRef.current);
        return () => observer.disconnect();
        // fetcher.load is a stable reference; omit from deps to avoid re-creating the observer on every state tick.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cursor, hasMore, fetcher.state, searchParams]);

    // Images cached in the browser fire onLoad before React attaches the handler.
    // Check img.complete after mount to catch these already-loaded images.
    useEffect(() => {
        setLoadedImages(prev => {
            const next = new Set(prev);
            imageRefs.current.forEach((img, index) => {
                if (img?.complete && img.naturalWidth > 0) next.add(index);
            });
            return next;
        });
    }, [images]);

    // Reveal images as they enter the viewport (separate from native loading — the img itself is still
    // lazy-loaded; this controls the fade-in that hides the shimmer layer).
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

    const handleImageLoad = useCallback((index: number) => {
        setLoadedImages(prev => {
            const next = new Set(prev);
            next.add(index);
            return next;
        });
    }, []);

    const imageSizes = createResponsiveSizes(2, 3, 5);
    const isLoading = fetcher.state === "loading";

    return (
        <div className="flex flex-col gap-4">
            <div className="masonry-grid columns-2 gap-2 sm:columns-2 lg:columns-3 xl:columns-4">
                {images.map((image, index) => {
                    const config = getGridImageConfig(index, 5);
                    const productHandle = image.productHandle;

                    return (
                        <Link
                            key={image.id ?? `${productHandle}-${image.url}`}
                            to={productHandle ? `/products/${productHandle}` : "#"}
                            prefetch="intent"
                            aria-label={`View ${image.productTitle || "product"} - ${image.collectionTitle || "collection"}`}
                            className="group sleek bg-muted/20 hover:ring-primary/20 focus-visible:ring-primary/40 relative mb-2 block w-full break-inside-avoid overflow-hidden rounded-lg hover:shadow-xl hover:ring-2 focus-visible:ring-2 focus-visible:outline-none"
                        >
                            <div className="relative w-full" style={{aspectRatio: image.aspectRatio || 1}}>
                                <Image
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

                            <div className={cn(
                                "sleek absolute inset-0 hidden flex-col items-center justify-center bg-black/50 p-4 text-center backdrop-blur-[1px] sm:flex",
                                canHover ? "opacity-0 group-hover:opacity-100" : "opacity-100"
                            )}>
                                {(() => {
                                    const {primary, secondary} = parseProductTitle(image.productTitle ?? "");
                                    return (
                                        <>
                                            <p className="line-clamp-2 text-sm font-bold tracking-wide text-white drop-shadow-sm">
                                                {primary}
                                            </p>
                                            {secondary && (
                                                <p className="mt-0.5 line-clamp-1 text-xs font-medium tracking-wide text-white/90 drop-shadow-sm">
                                                    {secondary}
                                                </p>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>
                        </Link>
                    );
                })}
            </div>

            <div ref={sentinelRef} className="flex min-h-[60px] items-center justify-center py-4">
                {isLoading && <Spinner className="size-6" />}
                {!hasMore && !isLoading && images.length > 0 && (
                    <span className="text-muted-foreground text-sm">You&apos;ve seen it all</span>
                )}
            </div>
        </div>
    );
};
