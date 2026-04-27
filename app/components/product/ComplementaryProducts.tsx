import {WheelGesturesPlugin} from "embla-carousel-wheel-gestures";
import {ProductCard} from "~/components/display/ProductCard";
import {Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious} from "~/components/ui/carousel";
import {SkeletonGrid} from "~/components/common/SkeletonGrid";
import {fromStorefrontNode} from "~/lib/product/product-card-normalizers";

type ComplementaryProductsProps = {
    isLoading?: boolean;
    products: any[];
};

export const ComplementaryProducts = ({isLoading = false, products}: ComplementaryProductsProps) => {
    if (!isLoading && (!products || products.length === 0)) return null;

    return (
        <section
            className="py-10 lg:py-16"
            style={{background: "var(--surface-muted)"}}
            aria-label="Complete the look"
        >
            <div className="mx-auto max-w-[2000px] px-2 md:px-4">
                {/* Header — compact label style, visually distinct from RelatedSection's bold split-serif */}
                <div className="mb-6 md:mb-10">
                    <div className="flex items-center gap-3">
                        {/* Left decorative line */}
                        <div
                            className="h-px flex-none w-6 md:w-10"
                            style={{background: "var(--brand-primary)"}}
                            aria-hidden="true"
                        />

                        {/* Plus connector icon — evokes pairing/bundling */}
                        <span
                            className="flex-none text-base font-light select-none"
                            style={{color: "var(--brand-primary)", lineHeight: 1}}
                            aria-hidden="true"
                        >
                            +
                        </span>

                        {/* Section label */}
                        <div className="flex flex-col gap-0.5">
                            <p
                                className="text-[0.6rem] font-semibold tracking-[0.2em] uppercase"
                                style={{color: "var(--text-subtle)"}}
                            >
                                Curated pairings
                            </p>
                            <h2
                                className="text-base font-semibold tracking-tight md:text-lg"
                                style={{color: "var(--text-primary)"}}
                            >
                                Complete the look
                            </h2>
                        </div>
                    </div>
                </div>

                {/* Content — skeleton or carousel */}
                {isLoading ? (
                    <SkeletonGrid layout="product-grid" count={4} />
                ) : (
                    <Carousel
                        opts={{align: "start", loop: false, dragFree: true}}
                        plugins={[WheelGesturesPlugin()]}
                    >
                        <CarouselContent className="-ml-2 md:-ml-3">
                            {products.map(product => (
                                <CarouselItem
                                    key={product.id}
                                    className="basis-3/5 pl-2 sm:basis-1/2 md:basis-1/3 md:pl-3 lg:basis-1/3 xl:basis-1/4 2xl:basis-1/5"
                                >
                                    <ProductCard product={fromStorefrontNode(product)} insideCarousel />
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
