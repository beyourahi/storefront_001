import * as React from "react";
import {useFetcher, useSearchParams} from "react-router";
import {Spinner} from "~/components/ui/spinner";
import {Skeleton} from "~/components/ui/skeleton";
import {Button} from "~/components/ui/button";
import {cn} from "~/lib/utils";

interface PageInfo {
    hasNextPage: boolean;
    endCursor: string | null;
}

interface InfiniteScrollGridProps<T> {
    initialProducts: T[];
    pageInfo: PageInfo;
    resourcesClassName?: string;
    children: (props: {node: T; index: number; isNew: boolean}) => React.ReactNode;
    fetcherKey: string;
    showSkeletons?: boolean;
    skeletonCount?: number;
    renderSkeleton?: () => React.ReactNode;
    endMessage?: string;
    fetchType?: string;
}

export function InfiniteScrollGrid<T extends {id: string}>({
    initialProducts,
    pageInfo,
    resourcesClassName,
    children,
    fetcherKey,
    showSkeletons = false,
    skeletonCount = 4,
    renderSkeleton,
    endMessage,
    fetchType
}: InfiniteScrollGridProps<T>) {
    const fetcher = useFetcher<{products: T[]; pageInfo: PageInfo}>({key: fetcherKey});
    const [products, setProducts] = React.useState<T[]>(initialProducts);
    const [cursor, setCursor] = React.useState<string | null>(pageInfo.endCursor);
    const [hasMore, setHasMore] = React.useState(pageInfo.hasNextPage);
    const [error, setError] = React.useState<string | null>(null);
    const sentinelRef = React.useRef<HTMLDivElement>(null);
    const [searchParams] = useSearchParams();

    const [initialCount, setInitialCount] = React.useState(initialProducts.length);
    const [newProductsStartIndex, setNewProductsStartIndex] = React.useState<number | null>(null);

    React.useEffect(() => {
        setProducts(initialProducts);
        setCursor(pageInfo.endCursor);
        setHasMore(pageInfo.hasNextPage);
        setError(null);
        setInitialCount(initialProducts.length);
        setNewProductsStartIndex(null);
    }, [initialProducts, pageInfo.endCursor, pageInfo.hasNextPage]);

    React.useEffect(() => {
        if (fetcher.state === "idle" && fetcher.data === undefined && cursor !== null) {
            return;
        }

        if (fetcher.state === "idle" && fetcher.data) {
            if (!fetcher.data.products || !fetcher.data.pageInfo) {
                setError("Failed to load more products");
                return;
            }

            const newProducts = fetcher.data.products;
            const existingIds = new Set(products.map(p => p.id));
            const uniqueNew = newProducts.filter(p => !existingIds.has(p.id));

            if (uniqueNew.length > 0) {
                setNewProductsStartIndex(products.length);

                setTimeout(() => {
                    setNewProductsStartIndex(null);
                }, 1000);

                setProducts(prev => [...prev, ...uniqueNew]);
            }

            setCursor(fetcher.data.pageInfo.endCursor);
            setHasMore(fetcher.data.pageInfo.hasNextPage);
            setError(null);
        }
    }, [fetcher.state, fetcher.data, products, cursor]);

    React.useEffect(() => {
        if (!sentinelRef.current || !hasMore || error || fetcher.state !== "idle") return;

        const observer = new IntersectionObserver(
            entries => {
                if (entries[0]?.isIntersecting && hasMore && cursor && fetcher.state === "idle") {
                    const params = new URLSearchParams(searchParams);
                    params.set("cursor", cursor);
                    params.set("index", "");
                    if (fetchType) {
                        params.set("fetchType", fetchType);
                    }
                    void fetcher.load(`?${params.toString()}`);
                }
            },
            {rootMargin: "200px"}
        );

        observer.observe(sentinelRef.current);

        return () => observer.disconnect();
    }, [hasMore, cursor, error, fetcher, fetchType, searchParams]);

    const handleRetry = () => {
        if (cursor && fetcher.state === "idle") {
            setError(null);
            const params = new URLSearchParams(searchParams);
            params.set("cursor", cursor);
            params.set("index", "");
            if (fetchType) {
                params.set("fetchType", fetchType);
            }
            void fetcher.load(`?${params.toString()}`);
        }
    };

    const defaultSkeleton = () => (
        <div className="flex flex-col gap-3">
            <Skeleton className="aspect-square w-full rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
        </div>
    );

    const SkeletonComponent = renderSkeleton || defaultSkeleton;

    const isLoading = fetcher.state !== "idle";

    return (
        <div className="flex flex-col gap-6">
            {resourcesClassName ? (
                <div className={resourcesClassName}>
                    {products.map((node, index) => {
                        const isNew = newProductsStartIndex !== null && index >= newProductsStartIndex;
                        const staggerIndex = isNew ? index - newProductsStartIndex! : 0;
                        const staggerDelay = Math.min(staggerIndex, 7) * 50;

                        return (
                            <div
                                key={node.id}
                                className={cn(isNew && "animate-product-fade-in")}
                                style={isNew ? {animationDelay: `${staggerDelay}ms`} : undefined}
                            >
                                {children({node, index, isNew})}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <>
                    {products.map((node, index) => {
                        const isNew = newProductsStartIndex !== null && index >= newProductsStartIndex;
                        return <div key={node.id}>{children({node, index, isNew})}</div>;
                    })}
                </>
            )}

            {isLoading && showSkeletons && resourcesClassName && (
                <div className={resourcesClassName}>
                    {Array.from({length: skeletonCount}).map((_, skeletonIndex) => {
                        const uniqueKey = `skeleton-${fetcherKey}-${skeletonIndex}`;
                        return (
                            <div
                                key={uniqueKey}
                                className="animate-product-fade-in"
                                style={{animationDelay: `${skeletonIndex * 50}ms`}}
                            >
                                <SkeletonComponent />
                            </div>
                        );
                    })}
                </div>
            )}

            <div ref={sentinelRef} className="flex flex-col items-center justify-center py-6 min-h-20 md:min-h-25">
                {isLoading && !showSkeletons && (
                    <div className="flex flex-col items-center gap-2">
                        <Spinner className="size-6 md:size-7" />
                        <span className="text-sm text-muted-foreground">Loading more products...</span>
                    </div>
                )}

                {error && (
                    <div className="flex flex-col items-center gap-3">
                        <p className="text-sm text-destructive">{error}</p>
                        <Button onClick={handleRetry} variant="outline" size="sm">
                            Try again
                        </Button>
                    </div>
                )}

                {!hasMore && !isLoading && !error && products.length > initialCount && endMessage && (
                    <div className="flex flex-col items-center gap-2 py-4">
                        <div className="w-12 h-px bg-border" />
                        <span className="text-sm text-muted-foreground">{endMessage}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
