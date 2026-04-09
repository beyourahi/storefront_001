import {useState, useEffect, useCallback} from "react";
import {CartForm} from "@shopify/hydrogen";
import type {FetcherWithComponents} from "react-router";
import {Plus, Loader2} from "lucide-react";
import {cn} from "~/lib/utils";
import {useCartDrawer} from "~/hooks/useCartDrawer";
import {QuickAddSheet} from "~/components/QuickAddSheet";
import {QuickAddDialog} from "~/components/QuickAddDialog";
import {getButtonLabel} from "~/lib/product-tags";
import {Button} from "~/components/ui/button";

interface QuickAddVariant {
    id: string;
    availableForSale: boolean;
    title?: string;
    selectedOptions?: Array<{name: string; value: string}>;
    price: {amount: string; currencyCode: string};
    compareAtPrice?: {amount: string; currencyCode: string} | null;
}

interface QuickAddImage {
    id?: string | null;
    url: string;
    altText?: string | null;
    width?: number | null;
    height?: number | null;
}

interface QuickAddProduct {
    id: string;
    title: string;
    handle: string;
    availableForSale: boolean;
    tags?: string[];
    featuredImage?: QuickAddImage | null;
    images?: {nodes: QuickAddImage[]};
    priceRange: {
        minVariantPrice: {amount: string; currencyCode: string};
        maxVariantPrice: {amount: string; currencyCode: string};
    };
    variants: {nodes: QuickAddVariant[]};
}

interface QuickAddButtonProps {
    product: QuickAddProduct;
    className?: string;
    fullWidth?: boolean;
    iconOnlyMobile?: boolean;
    largeScreenOnly?: boolean;
    skipCartOpen?: boolean;
    orderHistoryContext?: boolean;
}

export function QuickAddButton({
    product,
    className,
    fullWidth = false,
    iconOnlyMobile = false,
    largeScreenOnly = false,
    skipCartOpen = true,
    orderHistoryContext = false
}: QuickAddButtonProps) {
    const {open: openCart} = useCartDrawer();
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    const buttonLabel = getButtonLabel(product.tags, orderHistoryContext ? "Buy Again" : "Get it now");

    const baseStyles = fullWidth
        ? cn(
              "flex items-center justify-between w-full h-10 sm:h-11 md:h-12 px-3 sm:px-4 rounded-full font-medium",
              largeScreenOnly ? "hidden lg:flex text-sm sm:text-base" : "text-base sm:text-lg"
          )
        : cn(
              "flex items-center justify-center gap-2 h-11 sm:h-12 px-3 sm:px-4 rounded-full font-medium",
              largeScreenOnly ? "hidden lg:flex text-xs sm:text-sm" : "text-sm sm:text-base"
          );

    // SSR-safe mobile detection — runs in effect only
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.matchMedia("(max-width: 767px)").matches);
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    const variants = product.variants.nodes;
    const availableVariants = variants.filter(v => v.availableForSale);
    const isSoldOut = availableVariants.length === 0;
    const hasMultipleVariants = hasDisplayableVariants(variants);
    const isSingleVariant = !hasMultipleVariants && availableVariants.length > 0;
    const defaultVariant = availableVariants[0];

    const handleClick = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            e.preventDefault();
            if (isSoldOut) return;
            if (!isSingleVariant) setIsSheetOpen(true);
        },
        [isSoldOut, isSingleVariant]
    );

    const iconSize = fullWidth ? "size-6" : "size-5";

    if (isSoldOut) {
        return (
            <Button
                type="button"
                variant="secondary"
                disabled
                className={cn(baseStyles, "opacity-50", className)}
                aria-label={`${product.title} is sold out`}
            >
                {fullWidth ? (
                    <>
                        <span>{buttonLabel}</span>
                        <Plus className={iconSize} />
                    </>
                ) : (
                    <>
                        <span className={iconOnlyMobile ? "hidden md:inline" : undefined}>{buttonLabel}</span>
                        <Plus className={iconSize} />
                    </>
                )}
            </Button>
        );
    }

    if (isSingleVariant && defaultVariant) {
        return (
            <CartForm
                fetcherKey="cart-mutation"
                route="/cart"
                inputs={{lines: [{merchandiseId: defaultVariant.id, quantity: 1}]}}
                action={CartForm.ACTIONS.LinesAdd}
            >
                {(fetcher: FetcherWithComponents<unknown>) => {
                    const isLoading = fetcher.state !== "idle";
                    return (
                        <Button
                            type="submit"
                            disabled={isLoading}
                            onClick={e => {
                                e.stopPropagation();
                                if (!skipCartOpen) openCart();
                            }}
                            className={cn(
                                baseStyles,
                                !fullWidth && "hover:scale-105",
                                !fullWidth && "active:scale-95",
                                "motion-interactive",
                                "hover:bg-primary",
                                isLoading && "opacity-70 cursor-wait",
                                className
                            )}
                            aria-label={`Add ${product.title} to cart`}
                            aria-busy={isLoading}
                        >
                            {fullWidth ? (
                                <>
                                    <span>{buttonLabel}</span>
                                    {isLoading ? (
                                        <Loader2 className={cn(iconSize, "animate-spin")} />
                                    ) : (
                                        <Plus className={iconSize} />
                                    )}
                                </>
                            ) : (
                                <>
                                    <span className={iconOnlyMobile ? "hidden md:inline" : undefined}>
                                        {buttonLabel}
                                    </span>
                                    {isLoading ? (
                                        <Loader2 className={cn(iconSize, "animate-spin")} />
                                    ) : (
                                        <Plus className={iconSize} />
                                    )}
                                </>
                            )}
                        </Button>
                    );
                }}
            </CartForm>
        );
    }

    return (
        <>
            <Button
                type="button"
                onClick={handleClick}
                className={cn(
                    baseStyles,
                    !fullWidth && "hover:scale-105",
                    !fullWidth && "active:scale-95",
                    "motion-interactive",
                    "hover:bg-primary",
                    className
                )}
                aria-label={`Select options for ${product.title}`}
            >
                {fullWidth ? (
                    <>
                        <span>{buttonLabel}</span>
                        <Plus className={iconSize} />
                    </>
                ) : (
                    <>
                        <span className={iconOnlyMobile ? "hidden md:inline" : undefined}>{buttonLabel}</span>
                        <Plus className={iconSize} />
                    </>
                )}
            </Button>

            {isMobile ? (
                <QuickAddSheet product={product} open={isSheetOpen} onOpenChange={setIsSheetOpen} />
            ) : (
                <QuickAddDialog product={product} open={isSheetOpen} onOpenChange={setIsSheetOpen} />
            )}
        </>
    );
}

function hasDisplayableVariants(variants: QuickAddVariant[]): boolean {
    if (variants.length <= 1) return false;

    const optionMap = new Map<string, Set<string>>();
    for (const variant of variants) {
        if (!variant.selectedOptions) continue;
        for (const option of variant.selectedOptions) {
            if (!optionMap.has(option.name)) optionMap.set(option.name, new Set());
            optionMap.get(option.name)!.add(option.value);
        }
    }

    for (const values of optionMap.values()) {
        if (values.size > 1) return true;
    }
    return false;
}
