import {useState, useMemo} from "react";
import {AlertTriangle, X} from "lucide-react";
import {WheelGesturesPlugin} from "embla-carousel-wheel-gestures";
import {useRecentlyViewedContext} from "~/components/RecentlyViewedProvider";
import {ProductCard} from "~/components/display/ProductCard";
import {Button} from "~/components/ui/button";
import {SkeletonGrid} from "~/components/common/SkeletonGrid";
import {Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious} from "~/components/ui/carousel";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription
} from "~/components/ui/alert-dialog";
import {fromRecentlyViewedAllProducts} from "~/lib/product/product-card-normalizers";

type RecentlyViewedSectionProps = {
    loading?: boolean;
    allProducts?: any[];
};

export const RecentlyViewedSection = ({loading = false, allProducts = []}: RecentlyViewedSectionProps) => {
    const {productIds, clear, hasProducts} = useRecentlyViewedContext();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [historyCleared, setHistoryCleared] = useState(false);

    const isLoadingState = loading;

    const recentlyViewedProducts = useMemo(() => {
        if (historyCleared) return [];
        if (!productIds.length || !allProducts.length) return [];

        return productIds
            .map(id => allProducts.find(product => product?.id === id))
            .filter(Boolean)
            .map(product => fromRecentlyViewedAllProducts(product))
            .slice(0, 8);
    }, [historyCleared, productIds, allProducts]);

    const shouldShowSection = useMemo(() => {
        if (historyCleared) return false;
        if (loading) return true;
        return hasProducts && recentlyViewedProducts.length > 0;
    }, [historyCleared, loading, hasProducts, recentlyViewedProducts]);

    const confirmClearHistory = () => {
        clear();
        setDialogOpen(false);
        setHistoryCleared(true);
    };

    if (!shouldShowSection) return null;

    return (
        <>
            <section className="bg-background py-16">
                <div className="mx-auto max-w-[2000px] px-2 md:px-4">
                    <div className="mb-8 md:mb-12">
                        <div className="flex items-center gap-4 md:gap-6">
                            <div className="flex flex-col items-start gap-1">
                                {!isLoadingState && recentlyViewedProducts.length > 0 ? (
                                    <>
                                        <h2 className="text-foreground font-serif text-xl font-bold whitespace-nowrap uppercase md:text-3xl lg:text-4xl">
                                            {recentlyViewedProducts.length} Recently Viewed
                                        </h2>
                                        <p className="text-primary text-left font-serif text-xl font-bold whitespace-nowrap uppercase md:text-3xl lg:text-4xl">
                                            Items you&apos;ve seen
                                        </p>
                                    </>
                                ) : !isLoadingState ? (
                                    <>
                                        <h2 className="text-foreground font-serif text-xl font-bold whitespace-nowrap uppercase md:text-3xl lg:text-4xl">
                                            Recently Viewed
                                        </h2>
                                        <p className="text-primary text-left font-serif text-xl font-bold whitespace-nowrap uppercase md:text-3xl lg:text-4xl">
                                            Items you&apos;ve seen
                                        </p>
                                    </>
                                ) : null}
                            </div>
                            <div className="bg-primary relative h-px flex-1 overflow-hidden">
                                <div className="bg-primary animate-in slide-in-from-left absolute top-0 left-0 h-full w-full origin-left duration-1000" />
                            </div>
                            <div className="group relative flex items-center">
                                <span className="text-primary font-serif text-4xl leading-none font-bold transition-all duration-500 group-hover:scale-105 md:text-6xl lg:text-7xl">
                                    02
                                </span>
                                <div className="from-primary to-primary absolute right-0 -bottom-1 left-0 mx-auto h-0.5 w-0 bg-gradient-to-r transition-all duration-500 group-hover:w-full" />
                            </div>
                        </div>
                    </div>

                    {isLoadingState ? (
                        <div className="mb-12">
                            <Carousel opts={{align: "start", loop: false, dragFree: true}} plugins={[WheelGesturesPlugin()]}>
                                <CarouselContent className="-ml-2 md:-ml-4">
                                    {Array.from({length: 6}, (_, i) => i).map(i => (
                                        <CarouselItem
                                            key={i}
                                            className="basis-3/5 pl-2 md:basis-2/5 md:pl-4 lg:basis-1/3 xl:basis-1/4"
                                        >
                                            <SkeletonGrid layout="product-grid" count={1} />
                                        </CarouselItem>
                                    ))}
                                </CarouselContent>
                                <CarouselPrevious className="left-2" />
                                <CarouselNext className="right-2" />
                            </Carousel>
                        </div>
                    ) : (
                        <>
                            <div>
                                <Carousel opts={{align: "start", loop: false, dragFree: true}} plugins={[WheelGesturesPlugin()]}>
                                    <CarouselContent className="-ml-2 md:-ml-4">
                                        {recentlyViewedProducts.map(product => (
                                            <CarouselItem
                                                key={product.id}
                                                className="basis-3/5 pl-2 md:basis-2/5 md:pl-4 lg:basis-1/3 xl:basis-1/4"
                                            >
                                                <ProductCard product={product} />
                                            </CarouselItem>
                                        ))}
                                    </CarouselContent>
                                    {recentlyViewedProducts.length > 1 && (
                                        <>
                                            <CarouselPrevious className="left-2" />
                                            <CarouselNext className="right-2" />
                                        </>
                                    )}
                                </Carousel>
                            </div>

                            {recentlyViewedProducts.length > 0 && (
                                <div className="mt-8 flex justify-center">
                                    <Button
                                        variant="ghost"
                                        size="lg"
                                        onClick={() => setDialogOpen(true)}
                                        className="bg-destructive/10 text-destructive hover:!bg-destructive pointer-events-auto w-[80vw] hover:!text-white sm:w-auto"
                                    >
                                        <X className="mr-2 h-4 w-4" />
                                        Clear History
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </section>

            <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <AlertDialogContent className="border-border/50 bg-background/95 border shadow-2xl backdrop-blur-sm sm:max-w-[420px]">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <div className="bg-destructive/20 flex h-10 w-10 items-center justify-center rounded-full">
                                <AlertTriangle className="text-destructive h-5 w-5" />
                            </div>
                            Clear Browsing History
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground text-sm">
                            Remove all {recentlyViewedProducts.length} recently viewed{" "}
                            {recentlyViewedProducts.length === 1 ? "product" : "products"}? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <div className="mt-4 space-y-4">
                        <div className="bg-muted/50 rounded-lg p-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Products to remove:</span>
                                <span className="font-medium">{recentlyViewedProducts.length}</span>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">
                                Cancel
                            </Button>
                            <Button variant="destructive" onClick={confirmClearHistory} className="flex-1">
                                Clear History
                            </Button>
                        </div>
                    </div>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};
