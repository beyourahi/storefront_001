import {useMemo} from "react";
import {Link} from "react-router";
import {Plus, Ban} from "lucide-react";
import {Badge} from "~/components/ui/badge";
import {ProductCardTitle} from "~/components/common/ProductCardTitle";
import {ProductVariantDialog} from "~/components/ProductVariantDialog";
import {ProductPageDiscountIndicator} from "~/components/product/ProductPageDiscountIndicator";
import {PreorderBadge} from "~/components/product/PreorderBadge";
import {LowStockBadge} from "~/components/product/LowStockBadge";
import {WishlistButton} from "~/components/WishlistButton";
import {usePointerCapabilities} from "~/hooks/usePointerCapabilities";
import {useIntentPress} from "~/hooks/useIntentPress";
import {getProductCardMedia, getProductDataForCard, OUT_OF_STOCK_LABEL, isProductLowStock} from "~/lib/product/product-card-utils";
import {isPreorderProduct} from "~/lib/product/preorder-utils";
import {parseProductTitle} from "~/lib/product";
import {cn} from "~/lib/utils";
import {ProductCardMediaCarousel} from "~/components/display/ProductCardMediaCarousel";
import type {UnifiedProductCardProps} from "~/lib/types/product-card";
const FALLBACK_THEME_PRODUCT_IMAGE_ASPECT_RATIO: "portrait" | "landscape" | "square" = "portrait";

/**
 * Grid product card with inline quick-add and wishlist controls.
 * `insideCarousel` suppresses `ProductCardMediaCarousel`'s internal Embla instance
 * so it does not conflict with a parent horizontal carousel on the same drag axis.
 * The quick-add area stops pointer and click propagation to prevent the parent
 * `<Link>` from navigating when the add-to-cart button is tapped.
 */
export const ProductCard = ({product, viewMode = "grid3", insideCarousel = false}: UnifiedProductCardProps) => {
    const {canHover} = usePointerCapabilities();
    const {isPressing, handlers: pressHandlers} = useIntentPress(canHover);
    const productData = useMemo(() => getProductDataForCard(product, {showPriceRange: true}), [product]);
    const {price, compareAtPrice, discountPercentage, priceRange} = productData;
    const cardMedia = useMemo(() => getProductCardMedia(product), [product]);
    const isPreorder = useMemo(() => isPreorderProduct(product), [product]);
    const isOutOfStock = !product.availableForSale;
    const isLowStock = useMemo(() => !isOutOfStock && isProductLowStock(product), [product, isOutOfStock]);

    const {secondary} = useMemo(() => parseProductTitle(product.title), [product.title]);
    const hasSecondPart = !!secondary;

    const aspectRatioClass = useMemo(() => {
        switch (FALLBACK_THEME_PRODUCT_IMAGE_ASPECT_RATIO as string) {
            case "portrait":
                return "aspect-[4/5]";
            case "landscape":
                return "aspect-[16/9]";
            case "square":
            default:
                return "aspect-square";
        }
    }, []);

    const priceFontSize = useMemo(() => {
        switch (viewMode) {
            case "grid1":
                return "text-sm sm:text-base";
            case "grid2":
                return "text-sm sm:text-base";
            case "grid3":
                return "text-sm md:text-base";
            case "grid4":
                return "text-sm md:text-base";
            default:
                return "text-sm md:text-base";
        }
    }, [viewMode]);

    const priceStyles = "font-mono font-bold tabular-nums tracking-tight antialiased";

    return (
        <div
            className={cn(
                "motion-surface product-card overflow-hidden rounded-lg",
                canHover ? "group" : "intent-press"
            )}
            data-pressing={isPressing ? "true" : undefined}
            {...pressHandlers}
        >
            <div className={`relative ${aspectRatioClass} overflow-hidden rounded-b-lg`}>
                {/* Single badge container spanning the full card width.
                    flex-wrap lets badges try to sit on one row first; when the
                    card is too narrow for both sides they wrap to a second row
                    instead of overlapping. ml-auto on the right-slot pushes the
                    status badge to the trailing edge whether it is alone or
                    wrapped below the discount badge. */}
                {(discountPercentage || isOutOfStock || isPreorder || isLowStock) && (
                    <div className="absolute inset-x-1 top-1 z-10 sm:inset-x-1.5 sm:top-1.5 flex flex-wrap justify-start items-start gap-x-1.5 gap-y-1">
                        {discountPercentage && (
                            <ProductPageDiscountIndicator
                                discountPercentage={discountPercentage}
                                hasMultipleDiscounts={priceRange?.hasMultipleDiscounts}
                            />
                        )}
                        {/* OOS > preorder > low stock — exclusive status slot */}
                        {(isOutOfStock || isPreorder || isLowStock) && (
                            <div className="flex-shrink-0">
                                {isOutOfStock ? (
                                    <Badge className="bg-destructive hover:bg-destructive rounded-[var(--radius-xl)] px-0.5 pr-1 py-0 text-xs">
                                        <span className="text-destructive-foreground flex items-center gap-1 sm:gap-1.5 font-medium">
                                            <span className="bg-destructive/80 flex items-center justify-center rounded-[var(--radius-xl)] p-0.5 text-sm">
                                                <Ban size={12} className="pointer-events-none" aria-hidden="true" />
                                            </span>
                                            <span className="font-medium uppercase">{OUT_OF_STOCK_LABEL}</span>
                                        </span>
                                    </Badge>
                                ) : isPreorder ? (
                                    <PreorderBadge />
                                ) : isLowStock ? (
                                    <LowStockBadge />
                                ) : null}
                            </div>
                        )}
                    </div>
                )}

                <ProductCardMediaCarousel
                    media={cardMedia}
                    productTitle={product.title}
                    productHandle={product.handle}
                    isOutOfStock={isOutOfStock}
                    canHover={canHover}
                    insideCarousel={insideCarousel}
                />
                {!insideCarousel && cardMedia.length > 1 && (
                    <span className="sr-only">
                        {cardMedia.length} media items. Use arrow buttons to browse.
                    </span>
                )}

                {/* Wishlist button — bottom-left, frosted glass so it reads over any image */}
                <div className="absolute left-1 bottom-1 z-20">
                    <WishlistButton
                        productId={product.id}
                        size="sm"
                        className="bg-background/75 shadow-sm backdrop-blur-md hover:bg-background/95 hover:shadow-md"
                    />
                </div>

                <div
                    role="presentation"
                    className="absolute right-1 bottom-1 z-20"
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                >
                    {isOutOfStock ? (
                        <button
                            disabled
                            aria-disabled="true"
                            className="sleek border-foreground/20 bg-card text-card-foreground inline-flex h-10 shrink-0 items-center justify-center rounded-md border-2 px-4 text-sm font-medium whitespace-nowrap opacity-50 cursor-not-allowed shadow-xs"
                        >
                            <span>{OUT_OF_STOCK_LABEL}</span>
                        </button>
                    ) : (
                        <ProductVariantDialog productHandle={product.handle} autoAddSingleVariant={true}>
                            <div className="flex items-center justify-center gap-1.5">
                                <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                                {isPreorder ? (
                                    <>
                                        <span className="sm:hidden">PRE ORDER</span>
                                        <span className="hidden sm:inline">PRE ORDER</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="sm:hidden">ADD</span>
                                        <span className="hidden sm:inline">ADD TO CART</span>
                                    </>
                                )}
                            </div>
                        </ProductVariantDialog>
                    )}
                </div>
            </div>

            <div className={cn(`${hasSecondPart ? "space-y-2 sm:space-y-3" : "space-y-0.5 sm:space-y-1"} py-3 sm:py-4`, isOutOfStock && "opacity-70")}>
                <div>
                    <Link
                        to={`/products/${product.handle}`}
                        className={cn("motion-link focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:rounded-sm", canHover && "group-hover:text-primary")}
                        prefetch="intent"
                        viewTransition
                    >
                        <ProductCardTitle productTitle={product.title} viewMode={viewMode} />
                    </Link>
                </div>

                {priceRange?.hasRange ? (
                    <div className="flex items-baseline gap-1.5">
                        <span className={`text-foreground ${priceStyles} ${priceFontSize}`} aria-label="Price range">
                            {priceRange.displayPrice}
                        </span>
                    </div>
                ) : (
                    <div className="flex items-baseline gap-2 sm:gap-2.5">
                        <span className={`text-foreground ${priceStyles} ${priceFontSize}`} aria-label="Current price">
                            {priceRange?.displayPrice || price}
                        </span>
                        {compareAtPrice && discountPercentage && discountPercentage > 0 && (
                            <span
                                className={`text-muted-foreground ${priceStyles} line-through opacity-75 ${priceFontSize}`}
                                aria-label="Original price"
                            >
                                {compareAtPrice}
                            </span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
