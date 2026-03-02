import {useEffect, useMemo} from "react";
import {Link, useFetcher} from "react-router";
import {useWishlist} from "~/lib/wishlist-context";
import {reconstructGid} from "~/lib/wishlist-utils";
import {ProductCard} from "~/components/display/ProductCard";
import {SkeletonGrid} from "~/components/common/SkeletonGrid";
import {Button} from "~/components/ui/button";
import {Heart, ArrowRight} from "lucide-react";
import {Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious} from "~/components/ui/carousel";
import {fromWishlistProduct} from "~/lib/product/product-card-normalizers";

interface WishlistProduct {
    id: string;
    title: string;
    handle: string;
    description: string;
    tags: string[];
    vendor: string;
    productType: string;
    availableForSale: boolean;
    options: Array<{id: string; name: string; values: string[]}>;
    variants: {
        edges: Array<{
            node: {
                id: string;
                availableForSale: boolean;
            };
        }>;
    };
    images: {
        edges: Array<{
            node: {
                id: string;
                url: string;
                altText: string | null;
                width: number;
                height: number;
            };
        }>;
    };
    priceRange: {
        minVariantPrice: {amount: string; currencyCode: string};
        maxVariantPrice: {amount: string; currencyCode: string};
    };
    compareAtPriceRange?: {
        minVariantPrice: {amount: string; currencyCode: string};
    } | null;
    seo: {title: string | null; description: string | null};
}

export const HomepageWishlistSection = () => {
    const {wishlistIds, count} = useWishlist();
    const fetcher = useFetcher<{products: WishlistProduct[]}>();
    const normalizedProducts = useMemo(
        () => (fetcher.data?.products || []).map(product => fromWishlistProduct(product)),
        [fetcher.data?.products]
    );
    const isLoading = fetcher.state === "loading" || fetcher.state === "submitting";

    useEffect(() => {
        if (wishlistIds.length === 0) {
            return;
        }

        const gids = wishlistIds.map(id => reconstructGid(id));

        void fetcher.submit(
            {ids: gids},
            {
                method: "POST",
                action: "/api/wishlist-products",
                encType: "application/json"
            }
        );
    }, [wishlistIds, fetcher]);

    if (count === 0) {
        return null;
    }

    return (
        <section className="bg-background py-16">
            <div className="mx-auto max-w-[2000px] px-2 md:px-4">
                <div className="mb-8 md:mb-12">
                    <div className="flex items-center gap-4 md:gap-6">
                        <div className="flex flex-col items-start gap-1">
                            <h2 className="text-foreground font-serif text-xl font-bold whitespace-nowrap uppercase md:text-3xl lg:text-4xl">
                                Your Wishlist
                            </h2>
                            <p className="text-muted-foreground text-left font-serif text-xl font-bold whitespace-nowrap uppercase md:text-3xl lg:text-4xl">
                                {count} {count === 1 ? "item" : "items"} saved
                            </p>
                        </div>
                        <div className="bg-primary/10 relative h-px flex-1 overflow-hidden">
                            <div className="bg-primary/40 animate-in slide-in-from-left absolute top-0 left-0 h-full w-full origin-left duration-1000" />
                        </div>
                        <Heart className="text-primary/35 h-8 w-8 shrink-0 md:h-10 md:w-10" />
                    </div>
                </div>

                {isLoading ? (
                    <div className="mb-12">
                        <Carousel opts={{align: "start", loop: false, dragFree: true}}>
                            <CarouselContent className="-ml-2 md:-ml-4">
                                {Array.from({length: Math.min(count, 8)}).map((_, i) => (
                                    <CarouselItem
                                        key={wishlistIds[i] ?? `wishlist-skeleton-${i}`}
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
                    <div className="mb-12">
                        <Carousel opts={{align: "start", loop: false, dragFree: true}}>
                            <CarouselContent className="-ml-2 md:-ml-4">
                                {normalizedProducts.slice(0, 8).map(product => (
                                    <CarouselItem
                                        key={product.id}
                                        className="basis-3/5 pl-2 md:basis-2/5 md:pl-4 lg:basis-1/3 xl:basis-1/4"
                                    >
                                        <ProductCard product={product} />
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                            {normalizedProducts.length > 1 && (
                                <>
                                    <CarouselPrevious className="left-2" />
                                    <CarouselNext className="right-2" />
                                </>
                            )}
                        </Carousel>
                    </div>
                )}

                <div className="flex justify-center">
                    <Button size="lg" asChild className="w-[80vw] sm:w-auto">
                        <Link to="/account/wishlist" className="flex items-center gap-2 px-10 leading-none">
                            View Full Wishlist
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </div>
        </section>
    );
};
