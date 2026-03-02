import {Fragment, useMemo} from "react";
import {SkeletonGrid} from "~/components/common/SkeletonGrid";
import type {CollectionCardData} from "~/lib/types/collections";

type CollectionGridLayoutProps = {
    collections: CollectionCardData[];
    isLoading?: boolean;
    showSkeleton?: boolean;
    renderCollection: (collection: CollectionCardData) => React.ReactNode;
};

export const CollectionGridLayout = ({
    collections,
    isLoading = false,
    showSkeleton = true,
    renderCollection
}: CollectionGridLayoutProps) => {
    const collectionsWithProducts = useMemo(
        () => (collections ? collections.filter(collection => (collection.productCount ?? 0) > 0) : []),
        [collections]
    );

    if (isLoading && showSkeleton) {
        return <SkeletonGrid layout="product-grid" count={8} itemType="collection" />;
    }

    if (collectionsWithProducts.length === 0) {
        return (
            <div className="py-12 text-center">
                <div className="pointer-events-none mb-4 text-6xl">&#128193;</div>
                <h3 className="mb-2 text-xl font-semibold">No collections found</h3>
                <p className="text-muted-foreground">Collections will appear here once they&apos;re available.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
            {collectionsWithProducts.map(collection => (
                <Fragment key={collection.id}>{renderCollection(collection)}</Fragment>
            ))}
        </div>
    );
};
