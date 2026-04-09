import {useMemo, useEffect, useRef} from "react";
import {useIsMobile} from "~/hooks/useIsMobile";
import {Badge} from "~/components/ui/badge";
import {AddToCartButton} from "~/components/product/AddToCartButton";
import {BuyNowButton} from "~/components/product/BuyNowButton";
import type {SellingPlanFragment} from "~/components/product/SellingPlanSelector";
import {formatPrice} from "~/lib/currency-formatter";

type ProductMobileStickyButtonsProps = {
    product: any;
    selectedVariant: any;
    selectedSellingPlan?: SellingPlanFragment | null;
    quantity: number;
    onQuantityChange: (qty: number) => void;
    isVariantTransitioning?: boolean;
};

export const ProductMobileStickyButtons = ({
    product,
    selectedVariant,
    selectedSellingPlan,
    quantity,
    isVariantTransitioning = false
}: ProductMobileStickyButtonsProps) => {
    const isMobile = useIsMobile();
    const containerRef = useRef<HTMLDivElement>(null);

    // Expose the bar's rendered height as a CSS variable on :root so that
    // other fixed-position elements (e.g. NativeAppBanner) can offset above it
    // without knowing about this component directly.
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const update = () => {
            document.documentElement.style.setProperty(
                "--product-sticky-bar-height",
                `${el.offsetHeight}px`
            );
        };

        const observer = new ResizeObserver(update);
        observer.observe(el);
        update();

        return () => {
            observer.disconnect();
            document.documentElement.style.removeProperty("--product-sticky-bar-height");
        };
    }, [isMobile, selectedVariant?.price]);

    const isPreorder =
        product?.tags?.some((tag: string) => tag.toLowerCase() === "preorder" || tag.toLowerCase() === "pre-order") ??
        false;

    // Must be declared before any early return to satisfy the Rules of Hooks.
    const lines = useMemo(
        () => [
            {
                merchandiseId: selectedVariant?.id,
                quantity,
                selectedVariant,
                sellingPlanId: selectedSellingPlan?.id
            }
        ],
        [selectedVariant, quantity, selectedSellingPlan?.id]
    );

    if (!isMobile || !selectedVariant?.price) return null;

    const unitPrice = parseFloat(selectedVariant.price.amount);
    const currencyCode = selectedVariant.price.currencyCode || "USD";
    const totalPrice = unitPrice * quantity;

    const unitComparePrice = selectedVariant.compareAtPrice?.amount
        ? parseFloat(selectedVariant.compareAtPrice.amount)
        : null;
    const totalComparePrice = unitComparePrice ? unitComparePrice * quantity : null;

    const isOnSale = totalComparePrice !== null && totalComparePrice > totalPrice;
    const savingsPercentage = isOnSale ? Math.round(((totalComparePrice - totalPrice) / totalComparePrice) * 100) : 0;

    const isDisabled = !selectedVariant || isVariantTransitioning;

    return (
        <div ref={containerRef} className="fixed right-0 bottom-0 left-0 z-[45] lg:hidden" style={{transform: "translateZ(0)"}}>
            <div className="bg-background/95 border-t shadow-lg backdrop-blur-md">
                <div className="px-4 pt-2.5 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
                    <div className="mb-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-foreground font-mono text-lg font-bold">
                                {formatPrice(totalPrice, currencyCode)}
                            </span>
                            {isOnSale && totalComparePrice && (
                                <span className="text-muted-foreground font-mono text-sm line-through">
                                    {formatPrice(totalComparePrice, currencyCode)}
                                </span>
                            )}
                        </div>
                        {isOnSale && savingsPercentage > 0 && (
                            <Badge variant="secondary" className="bg-discount-bg text-discount-text border-discount-icon-bg">
                                Save {savingsPercentage}%
                            </Badge>
                        )}
                    </div>

                    <div className={`grid ${isPreorder ? "grid-cols-1" : "grid-cols-2"} gap-3`}>
                        <AddToCartButton lines={lines} disabled={isDisabled} isPreorder={isPreorder} />
                        {!isPreorder && <BuyNowButton lines={lines} disabled={isDisabled} />}
                    </div>
                </div>
            </div>
        </div>
    );
};
