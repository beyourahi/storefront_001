import {useMemo} from "react";
import {Plus} from "lucide-react";
import {Badge} from "~/components/ui/badge";
import {ProductVariantDialog} from "~/components/ProductVariantDialog";
import {PreorderBadge} from "~/components/product/PreorderBadge";
import {PrimaryProductMedia} from "~/components/common/PrimaryProductMedia";
import {cn} from "~/lib/utils";
import {getProductCardMedia, getProductDataForCard, OUT_OF_STOCK_LABEL} from "~/lib/product/product-card-utils";
import {isPreorderProduct} from "~/lib/product/preorder-utils";
import {parseProductTitle} from "~/lib/product";
import type {CompactProductCardProps} from "~/lib/types/product-card";

export function CompactProductCard({product, className = "", onCartAdd, onProductClick, isMutating = false}: CompactProductCardProps) {
    const productData = useMemo(() => getProductDataForCard(product), [product]);
    const {price, compareAtPrice, discountPercentage} = productData;
    const isPreorder = useMemo(() => isPreorderProduct(product), [product]);
    const isOutOfStock = !product.availableForSale;
    // Primary media (video-first) — parity with ProductCard grid rendering.
    const primaryMedia = useMemo(() => getProductCardMedia(product)[0] ?? null, [product]);

    const {primary, secondary} = useMemo(() => parseProductTitle(product.title), [product.title]);
    const truncatedFirstPart = useMemo(() => {
        if (primary.length > 20) return `${primary.substring(0, 20)}...`;
        return primary;
    }, [primary]);

    const handleProductClick = () => {
        onProductClick?.();
        window.location.href = `/products/${product.handle}`;
    };

    return (
        <div className={cn("sleek group w-[180px] shrink-0 overflow-hidden rounded-lg sm:w-[180px]", isMutating && "opacity-50 cursor-not-allowed pointer-events-none", className)}>
            <div className="flex gap-3 p-3">
                <div className="relative size-16 shrink-0 overflow-hidden rounded-sm">
                    <button className="block h-full w-full text-left" onClick={handleProductClick}>
                        <PrimaryProductMedia
                            media={primaryMedia}
                            productTitle={product.title}
                            className={cn(
                                "sleek h-full w-full",
                                isOutOfStock ? "opacity-60" : "xl:group-hover:scale-105"
                            )}
                            placeholderCompact
                            width={64}
                            height={64}
                            /* Tight 64px tile — suppress the video badge
                               since cards already group in a strip and the
                               motion itself signals "video". */
                            showVideoIndicator={false}
                            ariaLabel={product.title}
                        />
                    </button>

                    {discountPercentage && (
                        <Badge
                            variant="outline"
                            className="bg-discount-bg text-discount-text border-discount-icon-bg absolute top-0 left-0 z-30 rounded-bl-none px-1 py-0 text-[10px] font-semibold"
                        >
                            -{Math.round(discountPercentage)}%
                        </Badge>
                    )}

                    {/* OOS badge takes priority over preorder */}
                    {isOutOfStock ? (
                        <div className="absolute top-0 right-0 z-30">
                            <div className="bg-muted text-muted-foreground border-border rounded-bl-sm rounded-tr-sm border px-1 text-[9px]">
                                OOS
                            </div>
                        </div>
                    ) : isPreorder ? (
                        <div className="absolute top-0 right-0 z-30">
                            <PreorderBadge className="rounded-tr-sm rounded-bl-none text-[9px]" />
                        </div>
                    ) : null}
                </div>

                <div className={cn("flex-1 space-y-1.5", isOutOfStock && "opacity-70")}>
                    <div>
                        <button
                            className="sleek group-hover:text-primary block w-full text-left"
                            title={product.title}
                            onClick={handleProductClick}
                        >
                            <div className="text-foreground font-serif text-xs leading-tight font-semibold">
                                {truncatedFirstPart}
                            </div>
                            {secondary && (
                                <div className="opacity-50 font-serif text-[10px] leading-tight font-normal truncate mt-0.5">
                                    {secondary}
                                </div>
                            )}
                        </button>
                    </div>

                    <div className="flex items-baseline gap-1.5">
                        <span className="text-foreground font-mono text-xs font-bold">{price}</span>
                        {compareAtPrice && (
                            <span className="text-muted-foreground font-mono text-[10px] line-through">
                                {compareAtPrice}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="px-3 pb-3">
                {isOutOfStock ? (
                    <button
                        disabled
                        aria-disabled="true"
                        className="sleek border-foreground/20 bg-card text-card-foreground inline-flex h-10 w-full shrink-0 items-center justify-center rounded-md border-2 px-4 text-sm font-medium whitespace-nowrap opacity-50 cursor-not-allowed shadow-xs"
                    >
                        {OUT_OF_STOCK_LABEL}
                    </button>
                ) : (
                    <ProductVariantDialog
                        productHandle={product.handle}
                        autoAddSingleVariant={true}
                        onSuccess={onCartAdd}
                    >
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
    );
}
