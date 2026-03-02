import {Suspense, useMemo} from "react";
import type {CartApiQueryFragment} from "storefrontapi.generated";
import {Await, useRouteLoaderData} from "react-router";
import useEmblaCarousel from "embla-carousel-react";
import {Skeleton} from "~/components/ui/skeleton";
import {Accordion, AccordionContent, AccordionItem, AccordionTrigger} from "~/components/ui/accordion";
import {CompactProductCard} from "~/components/cart/CompactProductCard";
import {useIsMobile} from "~/hooks/useIsMobile";
import {useCartDrawer} from "~/hooks/useCartDrawer";
import {fromCartSuggestionProduct} from "~/lib/product/product-card-normalizers";
import {cn} from "~/lib/utils";
import type {RootLoader} from "~/root";

type CartLineNode = CartApiQueryFragment["lines"]["nodes"][number];

const StarIcon = () => (
    <svg
        className="text-primary h-3.5 w-3.5 opacity-70"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
        />
    </svg>
);

export function CartSuggestions({cartLines, className}: {cartLines: CartLineNode[]; className?: string}) {
    const rootData = useRouteLoaderData<RootLoader>("root");

    if (!rootData?.cartSuggestions) return null;

    return (
        <Suspense fallback={<CartSuggestionsSkeleton />}>
            <Await resolve={rootData.cartSuggestions}>
                {suggestions => {
                    if (!suggestions || !Array.isArray(suggestions) || suggestions.length === 0) return null;
                    return (
                        <CartSuggestionsContent suggestions={suggestions} cartLines={cartLines} className={className} />
                    );
                }}
            </Await>
        </Suspense>
    );
}

function CartSuggestionsContent({
    suggestions,
    cartLines,
    className
}: {
    suggestions: any[];
    cartLines: CartLineNode[];
    className?: string;
}) {
    const isMobile = useIsMobile();
    const hasCartItems = cartLines.length > 0;

    if (isMobile) {
        return (
            <div className={cn("border-t", className)}>
                <Accordion type="single" defaultValue={hasCartItems ? undefined : "suggestions"} collapsible>
                    <AccordionItem value="suggestions" className="border-0">
                        <AccordionTrigger className="px-0 py-3 text-left hover:no-underline">
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1.5">
                                    <StarIcon />
                                    <h3 className="text-foreground text-sm font-medium tracking-wide">
                                        Frequently bought with
                                    </h3>
                                </div>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-3">
                            <CartSuggestionsCarousel suggestions={suggestions} />
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>
        );
    }

    return (
        <div className={cn("space-y-3 border-t pt-4", className)}>
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                    <StarIcon />
                    <h3 className="text-foreground text-sm font-medium tracking-wide">Frequently bought with</h3>
                </div>
                <div className="from-border/50 h-px flex-1 bg-gradient-to-r to-transparent" />
            </div>
            <CartSuggestionsCarousel suggestions={suggestions} />
        </div>
    );
}

function CartSuggestionsCarousel({suggestions}: {suggestions: any[]}) {
    const {close} = useCartDrawer();
    const [emblaRef] = useEmblaCarousel({
        align: "start",
        loop: false,
        dragFree: true,
        skipSnaps: false
    });

    const normalizedSuggestions = useMemo(() => {
        return suggestions.map(product => fromCartSuggestionProduct(product));
    }, [suggestions]);

    return (
        <div className="overflow-hidden" ref={emblaRef}>
            <div className="-ml-4 flex">
                {normalizedSuggestions.map(product => (
                    <div key={product.id} className="min-w-0 flex-[0_0_180px] pl-4">
                        <CompactProductCard product={product} onProductClick={close} />
                    </div>
                ))}
            </div>
        </div>
    );
}

function CartSuggestionsSkeleton() {
    return (
        <div>
            <div className="flex gap-3 overflow-hidden">
                {[0, 1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="w-[180px] flex-shrink-0 space-y-2 sm:w-[180px]">
                        <Skeleton className="aspect-square w-full rounded-lg" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                        <Skeleton className="h-8 w-full" />
                    </div>
                ))}
            </div>
        </div>
    );
}
