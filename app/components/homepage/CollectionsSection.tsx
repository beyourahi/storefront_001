import {useMemo} from "react";
import {Link} from "react-router";
import {ArrowRight} from "lucide-react";
import {WheelGesturesPlugin} from "embla-carousel-wheel-gestures";
import {CollectionCard} from "~/components/display/CollectionCard";
import {Button} from "~/components/ui/button";
import {Skeleton} from "~/components/ui/skeleton";
import {Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious} from "~/components/ui/carousel";

type CollectionData = {
    id: string;
    title: string;
    handle: string;
    description?: string;
    productCount?: number;
    image?: {
        url: string;
        altText?: string | null;
    } | null;
};

type CollectionsSectionProps = {
    collections: CollectionData[] | null;
    loading?: boolean;
};

export const CollectionsSection = ({collections, loading = false}: CollectionsSectionProps) => {
    const filteredCollections = useMemo(() => collections ?? [], [collections]);

    const shouldShowSection = useMemo(() => {
        if (loading || collections === null) return true;
        return filteredCollections.length > 0;
    }, [loading, collections, filteredCollections]);

    const isLoadingState = loading || collections === null;

    if (!shouldShowSection) return null;

    return (
        <section className="bg-background py-16">
            <div className="mx-auto max-w-[2000px] px-2 md:px-4">
                <div className="mb-8 md:mb-12">
                    <div className="flex items-center gap-4 md:gap-6">
                        <div className="flex flex-col items-start gap-1">
                            <h2 className="text-foreground font-serif text-xl font-bold whitespace-nowrap uppercase md:text-3xl lg:text-4xl">
                                Shop Collections
                            </h2>
                            <p className="text-primary text-left font-serif text-xl font-bold whitespace-nowrap uppercase md:text-3xl lg:text-4xl">
                                handpicked for you
                            </p>
                        </div>
                        <div className="bg-primary relative h-px flex-1 overflow-hidden">
                            <div className="bg-primary animate-in slide-in-from-left absolute top-0 left-0 h-full w-full origin-left duration-1000" />
                        </div>
                        <div className="group relative flex items-center">
                            <span className="text-primary font-serif text-4xl leading-none font-bold transition-all duration-500 group-hover:scale-105 md:text-6xl lg:text-7xl">
                                01
                            </span>
                            <div className="from-primary to-primary absolute right-0 -bottom-1 left-0 mx-auto h-0.5 w-0 bg-gradient-to-r transition-all duration-500 group-hover:w-full" />
                        </div>
                    </div>
                </div>

                {isLoadingState ? (
                    <div>
                        <Carousel opts={{align: "start", loop: false, dragFree: true}} plugins={[WheelGesturesPlugin()]}>
                            <CarouselContent className="-ml-2 md:-ml-4">
                                {Array.from({length: 8}, (_, i) => i).map(i => (
                                    <CarouselItem
                                        key={i}
                                        className="basis-3/5 pl-2 md:basis-1/2 md:pl-4 lg:basis-1/2 xl:basis-1/3 2xl:basis-1/4"
                                    >
                                        <div className="space-y-4">
                                            <Skeleton className="aspect-[4/3] w-full" />
                                            <div className="space-y-2">
                                                <Skeleton className="h-6 w-3/4" />
                                                <Skeleton className="h-4 w-1/2" />
                                            </div>
                                        </div>
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                            <CarouselPrevious className="left-2" />
                            <CarouselNext className="right-2" />
                        </Carousel>
                    </div>
                ) : (
                    <div>
                        <Carousel opts={{align: "start", loop: false, dragFree: true}} plugins={[WheelGesturesPlugin()]}>
                            <CarouselContent className="-ml-2 md:-ml-4">
                                {filteredCollections.map(collection => (
                                    <CarouselItem
                                        key={collection.id}
                                        className="basis-3/5 pl-2 md:basis-1/2 md:pl-4 lg:basis-1/2 xl:basis-1/3 2xl:basis-1/4"
                                    >
                                        <CollectionCard collection={collection} />
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                            {filteredCollections.length > 1 && (
                                <>
                                    <CarouselPrevious className="left-2" />
                                    <CarouselNext className="right-2" />
                                </>
                            )}
                        </Carousel>
                    </div>
                )}

                <div className="mt-12 text-center">
                    <Button size="lg" asChild className="w-[80vw] sm:w-auto">
                        <Link to="/collections" className="flex items-center gap-2">
                            View All Collections
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </div>
        </section>
    );
};
