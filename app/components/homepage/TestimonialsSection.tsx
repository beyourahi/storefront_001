import {useMemo} from "react";
import {Star} from "lucide-react";
import Autoplay from "embla-carousel-autoplay";
import {WheelGesturesPlugin} from "embla-carousel-wheel-gestures";
import {Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious} from "~/components/ui/carousel";
import type {Testimonial} from "types";

const FALLBACK_HAPPY_CUSTOMERS_COUNT = 2500;
import {useSiteSettings} from "~/lib/site-content-context";

type TestimonialsSectionProps = {
    testimonials?: Testimonial[];
};

const getStarFill = (rating: number, position: number) => {
    const remainder = rating - position;
    if (remainder >= 1) return 100;
    if (remainder <= 0) return 0;
    return Math.round(remainder * 100);
};

const StarRating = ({rating}: {rating: number}) => (
    <div className="flex">
        {Array.from({length: 5}, (_, i) => i).map(i => (
            <div key={i} className="relative">
                <Star size={14} className="fill-muted text-muted absolute" />
                <div style={{clipPath: `inset(0 ${100 - getStarFill(Math.round(rating), i)}% 0 0)`}}>
                    <Star size={14} className="fill-primary text-primary" />
                </div>
            </div>
        ))}
    </div>
);

/**
 * Auto-scrolling testimonials carousel sourced from props or site-settings context.
 * `StarRating` renders fractional stars via CSS `clipPath` — `getStarFill` computes
 * the right-edge clip percentage for each star position so partial fills look smooth.
 * Autoplay is configured with `stopOnInteraction: false` to keep scrolling even after
 * a user swipe.
 */
export const TestimonialsSection = ({testimonials: externalTestimonials}: TestimonialsSectionProps) => {
    const {testimonials: settingsTestimonials} = useSiteSettings();
    const testimonials = externalTestimonials || settingsTestimonials;
    const happyCustomers = FALLBACK_HAPPY_CUSTOMERS_COUNT;

    const hasTestimonials = testimonials && testimonials.length > 0;
    const hasValidHappyCustomers = typeof happyCustomers === "number" && happyCustomers > 0;

    const avgRating = useMemo(() => {
        if (!testimonials || testimonials.length === 0) return "0";
        const total = testimonials.reduce((sum, item) => sum + (item.rating || 0), 0);
        const average = total / testimonials.length;
        return Number.isInteger(average) ? average.toString() : average.toFixed(1);
    }, [testimonials]);

    const autoplayPlugin = useMemo(
        () =>
            Autoplay({
                delay: 3000,
                stopOnInteraction: false,
                stopOnMouseEnter: false,
                stopOnFocusIn: false
            }),
        []
    );

    if (!hasTestimonials) return null;

    return (
        <section className="relative w-full overflow-hidden py-8 lg:py-16">
            <div className="mx-auto max-w-[2000px] px-2 md:px-4">
                <div className="mx-auto flex flex-col items-center gap-12">
                    <div className="text-center">
                        {hasValidHappyCustomers && (
                            <div className="bg-primary/10 text-primary mb-6 inline-flex items-center rounded-full px-3 py-1 text-sm">
                                <span className="">{happyCustomers}+ Happy Customers</span>
                            </div>
                        )}
                        <h2 className="mb-4 font-serif text-2xl font-bold sm:text-3xl">
                            What Our Customers Say
                        </h2>
                        <div className="text-muted-foreground flex items-center justify-center gap-2 text-sm">
                            <StarRating rating={Number(avgRating)} />
                            <span className="font-mono font-medium">{avgRating}/5</span>
                            <span>average rating</span>
                        </div>
                    </div>

                    <Carousel
                        opts={{align: "start", loop: true, dragFree: true}}
                        plugins={[autoplayPlugin, WheelGesturesPlugin()]}
                        className="w-full"
                    >
                        <div className="relative md:mx-12">
                            <CarouselContent className="-ml-2 md:-ml-4">
                                {testimonials.map(item => (
                                    <CarouselItem
                                        key={item.id}
                                        className="basis-[80%] pl-2 sm:basis-[45%] md:basis-[50%] md:pl-4 lg:basis-1/3"
                                    >
                                        <div className="border-muted/50 bg-muted cursor-grab space-y-12 rounded-xl border p-6 active:cursor-grabbing">
                                            <div className="space-y-2">
                                                <p className="font-serif text-sm leading-relaxed font-medium md:text-base">
                                                    &ldquo;{item.text}&rdquo;
                                                </p>
                                            </div>
                                            <div className="space-y-2">
                                                <StarRating rating={item.rating || 0} />
                                                <div className="text-sm font-medium">{item.customerName}</div>
                                                <div className="text-muted-foreground text-xs">
                                                    {item.location}
                                                </div>
                                            </div>
                                        </div>
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                        </div>

                        {testimonials.length > 1 && (
                            <>
                                <CarouselPrevious className="bg-primary/10 hover:bg-primary/20 absolute top-1/2 left-0 hidden h-8 w-8 -translate-y-1/2 border-none md:flex" />
                                <CarouselNext className="bg-primary/10 hover:bg-primary/20 absolute top-1/2 right-0 hidden h-8 w-8 -translate-y-1/2 border-none md:flex" />
                            </>
                        )}
                    </Carousel>
                </div>
            </div>
        </section>
    );
};
