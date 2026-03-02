import {useMemo} from "react";
import {Link} from "react-router";
import {Plus} from "lucide-react";
import {Image} from "@shopify/hydrogen";
import {ProductCardTitle} from "~/components/common/ProductCardTitle";
import {ProductVariantDialog} from "~/components/display/ProductVariantDialog";
import {ProductPageDiscountIndicator} from "~/components/product/ProductPageDiscountIndicator";
import {PreorderBadge} from "~/components/product/PreorderBadge";
import {getProductDataForCard} from "~/lib/product/product-card-utils";
import {isPreorderProduct} from "~/lib/product/preorder-utils";
import type {UnifiedProductCardProps} from "~/lib/types/product-card";
import {FALLBACK_THEME_PRODUCT_IMAGE_ASPECT_RATIO} from "~/lib/fallback-data";

export const ProductCard = ({product, viewMode = "grid3"}: UnifiedProductCardProps) => {
    const productData = useMemo(() => getProductDataForCard(product, {showPriceRange: true}), [product]);
    const {price, compareAtPrice, discountPercentage, image: productImage, priceRange} = productData;
    const isPreorder = useMemo(() => isPreorderProduct(product), [product]);

    const titleParts = useMemo(() => product.title.trim().split(" + "), [product.title]);
    const hasSecondPart = useMemo(
        () => titleParts.length > 1 && titleParts[1] && titleParts[1].trim() !== "",
        [titleParts]
    );

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
        <div className="sleek group product-card overflow-hidden rounded-lg">
            <div className={`relative ${aspectRatioClass} overflow-hidden rounded-b-lg`}>
                {discountPercentage && (
                    <div className="absolute top-1 left-1 z-10 sm:top-1.5 sm:left-1.5">
                        <ProductPageDiscountIndicator
                            discountPercentage={discountPercentage}
                            hasMultipleDiscounts={priceRange?.hasMultipleDiscounts}
                        />
                    </div>
                )}

                {isPreorder && (
                    <div className="absolute top-1 right-1 z-10 sm:top-1.5 sm:right-1.5">
                        <PreorderBadge />
                    </div>
                )}

                <Link to={`/products/${product.handle}`} prefetch="intent">
                    {productImage ? (
                        <Image
                            data={{url: productImage.url, altText: productImage.altText || product.title}}
                            className="sleek product-image h-full w-full rounded-lg object-cover"
                            sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, 50vw"
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

                <div className="absolute right-1 bottom-1 z-20">
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
                </div>
            </div>

            <div className={`${hasSecondPart ? "space-y-2 sm:space-y-3" : "space-y-0.5 sm:space-y-1"} py-3 sm:py-4`}>
                <div>
                    <Link to={`/products/${product.handle}`} className="sleek group-hover:text-primary" prefetch="intent">
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
                        {compareAtPrice && (
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
