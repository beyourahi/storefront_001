import {useMemo} from "react";
import {Link} from "react-router";
import {Image} from "@shopify/hydrogen";
import {Plus} from "lucide-react";
import {ProductCardTitle} from "~/components/common/ProductCardTitle";
import {ProductVariantDialog} from "~/components/ProductVariantDialog";
import {ProductPageDiscountIndicator} from "~/components/product/ProductPageDiscountIndicator";
import {PreorderBadge} from "~/components/product/PreorderBadge";
import {WishlistButton} from "~/components/WishlistButton";
import {usePointerCapabilities} from "~/hooks/usePointerCapabilities";
import {getProductDataForCard, OUT_OF_STOCK_LABEL} from "~/lib/product/product-card-utils";
import {isPreorderProduct} from "~/lib/product/preorder-utils";
import {parseProductTitle} from "~/lib/product";
import {cn} from "~/lib/utils";
import type {UnifiedProductCardProps} from "~/lib/types/product-card";
const FALLBACK_THEME_PRODUCT_IMAGE_ASPECT_RATIO: "portrait" | "landscape" | "square" = "portrait";

export const ProductCard = ({product, viewMode = "grid3"}: UnifiedProductCardProps) => {
    const {canHover} = usePointerCapabilities();
    const productData = useMemo(() => getProductDataForCard(product, {showPriceRange: true}), [product]);
    const {price, compareAtPrice, discountPercentage, image: productImage, priceRange} = productData;
    const isPreorder = useMemo(() => isPreorderProduct(product), [product]);
    const isOutOfStock = !product.availableForSale;

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
                canHover ? "group" : "motion-press"
            )}
        >
            <div className={`relative ${aspectRatioClass} overflow-hidden rounded-b-lg`}>
                {discountPercentage && (
                    <div className="absolute top-1 left-1 z-10 sm:top-1.5 sm:left-1.5">
                        <ProductPageDiscountIndicator
                            discountPercentage={discountPercentage}
                            hasMultipleDiscounts={priceRange?.hasMultipleDiscounts}
                        />
                    </div>
                )}

                {/* OOS badge takes priority over preorder — a product can't be preordered if it's OOS */}
                {isOutOfStock ? (
                    <div className="absolute top-1 right-1 z-10 sm:top-1.5 sm:right-1.5">
                        <div className="bg-muted text-muted-foreground border-border rounded-[var(--radius-xl)] border px-1 pr-1.5 text-xs">
                            {OUT_OF_STOCK_LABEL}
                        </div>
                    </div>
                ) : isPreorder ? (
                    <div className="absolute top-1 right-1 z-10 sm:top-1.5 sm:right-1.5">
                        <PreorderBadge />
                    </div>
                ) : null}

                <Link to={`/products/${product.handle}`} prefetch="intent">
                    {productImage ? (
                        <Image
                            data={{url: productImage.url, altText: productImage.altText || product.title}}
                            className={cn(
                                "sleek product-image h-full w-full rounded-lg object-cover",
                                isOutOfStock
                                    ? "opacity-60"
                                    : canHover
                                      ? "group-hover:scale-[1.03]"
                                      : "group-active:scale-[1.02]"
                            )}
                            sizes="(min-width: 1280px) 320px, (min-width: 1024px) 350px, (min-width: 768px) 280px, 200px"
                            width={400}
                        />
                    ) : (
                        <div className="bg-background flex h-full w-full items-center justify-center rounded-lg">
                            <div className="text-muted-foreground text-center">
                                <div className="mb-1 text-2xl sm:mb-2 sm:text-4xl">📦</div>
                                <p className="text-xs sm:text-sm">Product Image</p>
                            </div>
                        </div>
                    )}
                </Link>

                {/* Wishlist button — always visible for both in-stock and OOS products */}
                <div className="absolute left-1 bottom-1 z-20">
                    <WishlistButton productId={product.id} size="sm" />
                </div>

                <div className="absolute right-1 bottom-1 z-20">
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
                        className={cn("motion-link", canHover && "group-hover:text-primary")}
                        prefetch="intent"
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
