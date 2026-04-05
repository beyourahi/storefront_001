import {WheelGesturesPlugin} from "embla-carousel-wheel-gestures";
import {ProductCard} from "~/components/display/ProductCard";
import {SkeletonGrid} from "~/components/common/SkeletonGrid";
import {Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious} from "~/components/ui/carousel";
import {fromStorefrontNode} from "~/lib/product/product-card-normalizers";

type ProductRelatedSectionProps = {
    isLoading?: boolean;
    relatedProducts: any[];
    title?: string;
    subtitle?: string;
};

export const ProductRelatedSection = ({
    isLoading = false,
    relatedProducts,
    title = "You're absolutely going to",
    subtitle = "love these too"
}: ProductRelatedSectionProps) => {
    if (!isLoading && (!relatedProducts || relatedProducts.length === 0)) return null;

    return (
        <section className="py-12 lg:py-24">
            <div className="mx-auto max-w-[2000px] px-2 md:px-4">
                <div className="mb-8 md:mb-12">
                    <div className="flex flex-col items-start gap-1">
                        <h2 className="text-foreground font-serif text-xl font-bold whitespace-nowrap uppercase md:text-3xl lg:text-4xl">
                            {title}
                        </h2>
                        <p className="text-primary text-left font-serif text-xl font-bold whitespace-nowrap uppercase md:text-3xl lg:text-4xl">
                            {subtitle}
                        </p>
                    </div>
                </div>

                {isLoading ? (
                    <SkeletonGrid layout="product-grid" count={4} />
                ) : (
                    <Carousel opts={{align: "start", loop: false, dragFree: true}} plugins={[WheelGesturesPlugin()]}>
                        <CarouselContent className="-ml-2 md:-ml-3">
                            {relatedProducts.map(relatedProduct => (
                                <CarouselItem
                                    key={relatedProduct.id}
                                    className="basis-3/5 pl-2 sm:basis-1/2 md:basis-1/3 md:pl-3 lg:basis-1/3 xl:basis-1/4 2xl:basis-1/5"
                                >
                                    <ProductCard product={fromStorefrontNode(relatedProduct)} />
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        <CarouselPrevious className="left-2" />
                        <CarouselNext className="right-2" />
                    </Carousel>
                )}
            </div>
        </section>
    );
};
