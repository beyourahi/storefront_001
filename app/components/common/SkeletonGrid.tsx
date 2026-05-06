import {useMemo} from "react";
import {Skeleton} from "~/components/ui/skeleton";

type SkeletonGridProps = {
    layout: "masonry" | "product-section" | "product-grid";
    count?: number;
    itemType?: "product" | "collection";
    containerClass?: string;
    itemClass?: string;
};

const MASONRY_HEIGHTS = [
    "aspect-[3/4]",
    "aspect-square",
    "aspect-[4/5]",
    "aspect-[2/3]",
    "aspect-[5/6]",
    "aspect-[4/3]"
];

export const SkeletonGrid = ({
    layout,
    count = 8,
    itemType = "product",
    containerClass = "",
    itemClass = ""
}: SkeletonGridProps) => {
    const items = useMemo(() => Array.from({length: count}, (_, i) => i), [count]);

    if (layout === "masonry") {
        return (
            <div
                className={`pointer-events-none columns-2 gap-2 space-y-2 sm:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5 ${containerClass}`}
                style={{columnFill: "balance"}}
            >
                {items.map(index => {
                    const randomHeight = MASONRY_HEIGHTS[index % MASONRY_HEIGHTS.length];
                    return (
                        <div key={index} className={`mb-2 break-inside-avoid ${itemClass}`}>
                            <div className="bg-muted/20 relative overflow-hidden rounded-lg">
                                <Skeleton className={`w-full ${randomHeight}`} />
                                <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }

    if (layout === "product-section") {
        return (
            <div
                className={`pointer-events-none grid grid-cols-2 gap-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-4 ${containerClass}`}
            >
                {items.map(item => (
                    <div key={item} className={`space-y-4 ${itemClass}`}>
                        <Skeleton className="aspect-square w-full rounded-md" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className={`pointer-events-none grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4 ${containerClass}`}>
            {items.map(item => (
                <div key={item} className={`space-y-3 ${itemClass}`}>
                    {itemType === "collection" ? (
                        <Skeleton className="aspect-[4/3] w-full rounded-md" />
                    ) : (
                        <Skeleton className="aspect-square w-full rounded-md" />
                    )}
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                        {itemType === "product" ? (
                            <div className="flex items-center justify-between pt-1">
                                <Skeleton className="h-5 w-16" />
                                <Skeleton className="h-8 w-20 rounded-md" />
                            </div>
                        ) : (
                            <Skeleton className="h-4 w-1/2" />
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};
