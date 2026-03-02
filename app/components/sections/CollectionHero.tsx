import {GiantText} from "~/components/common/GiantText";
import {Skeleton} from "~/components/ui/skeleton";
import {cn} from "~/lib/utils";

type CollectionHeroProps = {
    collection?: {
        title: string;
        description?: string | null;
    } | null;
    isLoading?: boolean;
};

export const CollectionHero = ({collection, isLoading}: CollectionHeroProps) => {
    const title = collection?.title || "Collection";

    return (
        <section className="relative overflow-hidden py-8">
            <div className="bg-background absolute inset-0 z-0" />

            <div className="relative z-10 mx-auto max-w-[2000px] px-2 md:px-4">
                {isLoading ? (
                    <div className="flex w-full flex-col items-center justify-center gap-2 text-center xl:gap-4">
                        <Skeleton className="mx-auto h-12 w-64" />
                        <Skeleton className="mx-auto h-6 w-96" />
                    </div>
                ) : (
                    <div className="flex w-full flex-col items-center justify-center gap-2 text-center xl:gap-4">
                        <GiantText
                            text={title}
                            className={cn("w-full font-black", title.length <= 7 ? "lg:w-[30%]" : "lg:w-[60%]")}
                        />

                        {collection?.description && (
                            <p className="text-muted-foreground w-full text-xs lg:w-[60%] lg:text-sm 2xl:text-base">
                                {collection.description}
                            </p>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
};
