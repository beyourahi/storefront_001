import {useMemo, type ComponentType} from "react";
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

type CollectionRef = {
    handle: string;
    title?: string;
} | null;

type ProductSectionProps = {
    products: ProductData[];
    collection: CollectionRef;
    loading?: boolean;
    title: string;
    subheading: string;
    icon?: ComponentType<{className?: string}>;
    buttonText?: string;
    sectionNumber?: string;
};

/**
 * Reusable homepage product carousel section.
 * `collection === null` means the deferred data hasn't resolved yet — the
 * skeleton stays visible. `collection` with no products (length 0) hides the
 * section. At most 4 products are shown; all cards pass `insideCarousel` to
 * prevent nested Embla conflicts.
 */
export const ProductSection = ({
    products,
    collection,
    loading = false,
    title,
    subheading,
    icon: Icon,
    buttonText,
    sectionNumber
}: ProductSectionProps) => {
    const finalButtonText = buttonText || `View All ${title}`;

    const shouldShowSection = useMemo(() => {
        if (loading || collection === null) return true;
        return collection && products && products.length > 0;
    }, [loading, collection, products]);

    const isLoadingState = loading || collection === null;

    if (!shouldShowSection) return null;

    return (
        <section className="bg-background py-16">
            <div className="mx-auto max-w-[2000px] px-2 md:px-4">
                <div className="mb-8 md:mb-12">
                    <div className="flex items-center gap-4 md:gap-6">
                        <div className="flex flex-col items-start gap-1">
                            <h2 className="text-foreground font-serif text-xl font-bold uppercase md:text-3xl lg:text-4xl">
                                {title}
                            </h2>
                            <p className="text-primary text-left font-serif text-xl font-bold uppercase md:text-3xl lg:text-4xl">
                                {subheading}
                            </p>
                        </div>
                        <div className="bg-primary relative h-px flex-1 overflow-hidden">
                            <div className="bg-primary animate-in slide-in-from-left absolute top-0 left-0 h-full w-full origin-left duration-1000" />
                        </div>
                        {sectionNumber ? (
                            <div className="group relative flex items-center">
                                <span className="text-primary font-serif text-4xl leading-none font-bold transition-all duration-500 group-hover:scale-105 md:text-6xl lg:text-7xl">
                                    {sectionNumber}
                                </span>
                                <div className="from-primary to-primary absolute right-0 -bottom-1 left-0 mx-auto h-0.5 w-0 bg-gradient-to-r transition-all duration-500 group-hover:w-full" />
                            </div>
                        ) : Icon ? (
                            <Icon className="text-primary h-8 w-8 shrink-0 md:h-10 md:w-10" />
                        ) : null}
                    </div>
                </div>

                {isLoadingState ? (
                    <div className="mb-12">
                        <SkeletonGrid layout="product-section" count={4} />
                    </div>
                ) : (
                    <div className="mb-12">
                        <Carousel opts={{align: "start", loop: false, dragFree: true}} plugins={[WheelGesturesPlugin()]}>
                            <CarouselContent className="-ml-2 md:-ml-4">
                                {products.slice(0, 4).map(product => (
                                    <CarouselItem
                                        key={product.id}
                                        className="basis-3/5 pl-2 md:basis-2/5 md:pl-4 lg:basis-1/3 xl:basis-1/4"
                                    >
                                        <ProductCard product={product} insideCarousel />
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                            {products && products.length > 1 && (
                                <>
                                    <CarouselPrevious className="left-2" />
                                    <CarouselNext className="right-2" />
                                </>
                            )}
                        </Carousel>
                    </div>
                )}

                {collection?.handle && (
                    <div className="flex justify-center">
                        <Button size="lg" asChild className="w-[80vw] sm:w-auto">
                            <Link
                                to={`/collections/${collection.handle}`}
                                className="flex items-center gap-2 px-10 leading-none"
                            >
                                {finalButtonText}
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                )}
            </div>
        </section>
    );
};
