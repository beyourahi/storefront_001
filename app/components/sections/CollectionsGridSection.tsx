import {Skeleton} from "~/components/ui/skeleton";
import {CollectionGridLayout} from "~/components/layout/CollectionGridLayout";
import {CollectionCard} from "~/components/display/CollectionCard";
import type {CollectionCardData} from "~/lib/types/collections";

type CollectionsGridSectionProps = {
    collections: CollectionCardData[];
    isLoading?: boolean;
};

export const CollectionsGridSection = ({collections, isLoading}: CollectionsGridSectionProps) => {
    return (
        <>
            <section className="bg-background mb-4 py-3">
                <div className="mx-auto max-w-[2000px] px-2 md:px-4">
                    <div className="flex items-center justify-between">
                        <div>
                            {isLoading ? (
                                <Skeleton className="h-4 w-32" />
                            ) : collections?.length !== undefined ? (
                                <span className="text-muted-foreground text-sm">
                                    Showing {collections.length}{" "}
                                    {collections.length === 1 ? "collection" : "collections"}
                                </span>
                            ) : null}
                        </div>
                    </div>
                </div>
            </section>

            <section className="bg-background pb-16">
                <div className="mx-auto max-w-[2000px] px-2 md:px-4">
                    <CollectionGridLayout
                        collections={collections}
                        isLoading={isLoading}
                        renderCollection={collection => <CollectionCard collection={collection} />}
                    />
                </div>
            </section>
        </>
    );
};
