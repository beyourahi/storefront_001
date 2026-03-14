import {useMemo} from "react";
import {Image} from "@shopify/hydrogen";
import {Plus} from "lucide-react";
import {Badge} from "~/components/ui/badge";
import {ProductVariantDialog} from "~/components/ProductVariantDialog";
import {PreorderBadge} from "~/components/product/PreorderBadge";
import {cn} from "~/lib/utils";
import {getProductDataForCard} from "~/lib/product/product-card-utils";
import {isPreorderProduct} from "~/lib/product/preorder-utils";
import {parseProductTitle} from "~/lib/product";
import type {CompactProductCardProps} from "~/lib/types/product-card";

export function CompactProductCard({product, className = "", onCartAdd, onProductClick}: CompactProductCardProps) {
    const productData = useMemo(() => getProductDataForCard(product), [product]);
    const {price, compareAtPrice, discountPercentage, image: productImage} = productData;
    const isPreorder = useMemo(() => isPreorderProduct(product), [product]);

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
        <div className={cn("sleek group w-[180px] shrink-0 overflow-hidden rounded-lg sm:w-[180px]", className)}>
            <div className="flex gap-3 p-3">
                <div className="relative size-16 shrink-0 overflow-hidden rounded-sm">
                    <button className="block w-full text-left" onClick={handleProductClick}>
                        {productImage ? (
                            <Image
                                data={{url: productImage.url, altText: productImage.altText || product.title}}
                                className="sleek h-full w-full object-cover xl:group-hover:scale-105"
                                width={64}
                                height={64}
                                loading="lazy"
                            />
                        ) : (
                            <div className="bg-muted flex h-full w-full items-center justify-center">
                                <div className="text-muted-foreground text-center">
                                    <div className="mb-1 text-lg">📦</div>
                                    <p className="text-xs">No Image</p>
                                </div>
                            </div>
                        )}
                    </button>

                    {discountPercentage && (
                        <Badge
                            variant="outline"
                            className="bg-discount-bg text-discount-text border-discount-icon-bg absolute top-0 left-0 z-30 rounded-bl-none px-1 py-0 text-[10px] font-semibold"
                        >
                            -{Math.round(discountPercentage)}%
                        </Badge>
                    )}

                    {isPreorder && (
                        <div className="absolute top-0 right-0 z-30">
                            <PreorderBadge className="rounded-tr-sm rounded-bl-none text-[9px]" />
                        </div>
                    )}
                </div>

                <div className="flex-1 space-y-1.5">
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
                <ProductVariantDialog
                    productHandle={product.handle}
                    autoAddSingleVariant={true}
                    onSuccess={onCartAdd}
                >
                    <div className="flex w-full items-center justify-center gap-1.5">
                        <Plus className="h-3 w-3" />
                        <span>{isPreorder ? "PRE ORDER" : "ADD TO CART"}</span>
                    </div>
                </ProductVariantDialog>
            </div>
        </div>
    );
}
