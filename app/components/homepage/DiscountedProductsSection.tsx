import {useMemo} from "react";
import {Link} from "react-router";
import {ArrowRight} from "lucide-react";
import {WheelGesturesPlugin} from "embla-carousel-wheel-gestures";
import {ProductCard} from "~/components/display/ProductCard";
import {SkeletonGrid} from "~/components/common/SkeletonGrid";
import {Button} from "~/components/ui/button";
import {Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious} from "~/components/ui/carousel";

type ProductData = {
    id: string;
    title: string;
    handle: string;
    description: string;
    tags: string[];
    vendor: string;
    productType: string;
    availableForSale: boolean;
    options: Array<{id: string; name: string; values: string[]}>;
    variants: {edges: Array<{node: any}>};
    images: {edges: Array<{node: {id: string; url: string; altText: string | null; width: number; height: number}}>};
    priceRange: {
        minVariantPrice: {amount: string; currencyCode: string};
        maxVariantPrice: {amount: string; currencyCode: string};
    };
    seo: {title: string | null; description: string | null};
};

type DiscountedProductsSectionProps = {
    products: ProductData[];
    loading?: boolean;
};

/**
 * Carousel of up to 8 on-sale products derived entirely on the client.
 * Filters variants with `compareAtPrice > price`, computes the discount
 * percentage from the first discounted variant of each product, sorts by
 * discount percentage desc (then by absolute savings as tiebreaker), and
 * slices the top 8. The subtitle shows the highest discount across all
 * filtered products.
 */
export const DiscountedProductsSection = ({products, loading = false}: DiscountedProductsSectionProps) => {
    const discountedProducts = useMemo(() => {
        if (!products || products.length === 0) return [];

        return products
            .filter(product => {
                return product.variants.edges.some(
                    ({node: variant}) =>
                        variant.compareAtPrice &&
                        parseFloat(variant.compareAtPrice.amount) > parseFloat(variant.price.amount)
                );
            })
            .map(product => {
                let discountPercentage = 0;
                let savings = 0;

                const firstDiscountedVariant = product.variants.edges.find(
                    ({node: variant}) =>
                        variant.compareAtPrice &&
                        parseFloat(variant.compareAtPrice.amount) > parseFloat(variant.price.amount)
                );

                if (firstDiscountedVariant) {
                    const variant = firstDiscountedVariant.node;
                    const originalPrice = parseFloat(variant.compareAtPrice.amount);
                    const currentPrice = parseFloat(variant.price.amount);
                    discountPercentage = Math.round((1 - currentPrice / originalPrice) * 100);
                    savings = originalPrice - currentPrice;
                }

                return {
                    ...product,
                    discountPercentage,
                    savings
                };
            })
            .sort((a, b) => {
                const diff = (b.discountPercentage || 0) - (a.discountPercentage || 0);
                if (diff !== 0) return diff;
                return (b.savings || 0) - (a.savings || 0);
            })
            .slice(0, 8);
    }, [products]);

    const shouldShowSection = useMemo(() => {
        if (loading) return true;
        return discountedProducts.length >= 1;
    }, [loading, discountedProducts]);

    const isLoadingState = loading;

    const maxDiscount = useMemo(() => {
        if (discountedProducts.length === 0) return 0;
        return Math.max(...discountedProducts.map(p => p.discountPercentage || 0));
    }, [discountedProducts]);

    if (!shouldShowSection) return null;

    return (
        <section className="bg-background py-16">
            <div className="mx-auto max-w-[2000px] px-2 md:px-4">
                <div className="mb-8 md:mb-12">
                    <div className="flex items-center gap-4 md:gap-6">
                        <div className="flex flex-col items-start gap-1">
                            <h2 className="text-foreground font-serif text-xl font-bold whitespace-nowrap uppercase md:text-3xl lg:text-4xl">
                                Hot Discounts
                            </h2>
                            {maxDiscount > 0 && !isLoadingState ? (
                                <p className="text-primary text-left font-serif text-xl font-bold whitespace-nowrap uppercase md:text-3xl lg:text-4xl">
                                    Up to {maxDiscount}% off
                                </p>
                            ) : !isLoadingState ? (
                                <p className="text-primary text-left font-serif text-xl font-bold whitespace-nowrap uppercase md:text-3xl lg:text-4xl">
                                    Exceptional value, carefully curated
                                </p>
                            ) : null}
                        </div>
                        <div className="bg-primary relative h-px flex-1 overflow-hidden">
                            <div className="bg-primary animate-in slide-in-from-left absolute top-0 left-0 h-full w-full origin-left duration-1000" />
                        </div>
                        <div className="group relative flex items-center">
                            <span className="text-primary font-serif text-4xl leading-none font-bold transition-all duration-500 group-hover:scale-105 md:text-6xl lg:text-7xl">
                                00
                            </span>
                            <div className="from-primary to-primary absolute right-0 -bottom-1 left-0 mx-auto h-0.5 w-0 bg-gradient-to-r transition-all duration-500 group-hover:w-full" />
                        </div>
                    </div>
                </div>

                {isLoadingState ? (
                    <div className="mb-12">
                        <Carousel
                            opts={{align: "start", loop: false, dragFree: true}}
                            plugins={[WheelGesturesPlugin()]}
                        >
                            <CarouselContent className="-ml-2 md:-ml-4">
                                {Array.from({length: 8}, (_, i) => i).map(i => (
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
                    <div className="mb-12">
                        <Carousel
                            opts={{align: "start", loop: false, dragFree: true}}
                            plugins={[WheelGesturesPlugin()]}
                        >
                            <CarouselContent className="-ml-2 md:-ml-4">
                                {discountedProducts.map(product => (
                                    <CarouselItem
                                        key={product.id}
                                        className="basis-3/5 pl-2 md:basis-2/5 md:pl-4 lg:basis-1/3 xl:basis-1/4"
                                    >
                                        <ProductCard product={product} insideCarousel />
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                            {discountedProducts.length > 1 && (
                                <>
                                    <CarouselPrevious className="left-2" />
                                    <CarouselNext className="right-2" />
                                </>
                            )}
                        </Carousel>
                    </div>
                )}

                {!isLoadingState && discountedProducts.length > 0 && (
                    <div className="text-center">
                        <Button size="lg" asChild className="w-[80vw] sm:w-auto">
                            <Link to="/sale" className="flex items-center gap-2">
                                View All Discounts
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                )}
            </div>
        </section>
    );
};
