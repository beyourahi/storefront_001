import {useMemo} from "react";
import {Plus} from "lucide-react";
import {Image} from "@shopify/hydrogen";
import {Badge} from "~/components/ui/badge";
import {ProductVariantDialog} from "~/components/display/ProductVariantDialog";
import {PreorderBadge} from "~/components/product/PreorderBadge";
import {cn} from "~/lib/utils";
import {getProductDataForCard} from "~/lib/product/product-card-utils";
import {isPreorderProduct} from "~/lib/product/preorder-utils";
import type {CompactProductCardProps} from "~/lib/types/product-card";

export function CompactProductCard({product, className = "", onCartAdd, onProductClick}: CompactProductCardProps) {
    const productData = useMemo(() => getProductDataForCard(product), [product]);
    const {price, compareAtPrice, discountPercentage, image: productImage} = productData;
    const isPreorder = useMemo(() => isPreorderProduct(product), [product]);

    const titleParts = useMemo(() => product.title.trim().split(" + "), [product.title]);
    const truncatedFirstPart = useMemo(() => {
        const firstPart = titleParts[0] ?? "";
        if (firstPart.length > 20) return `${firstPart.substring(0, 20)}...`;
        return firstPart;
    }, [titleParts]);

    const handleProductClick = () => {
        onProductClick?.();
        window.location.href = `/products/${product.handle}`;
    };

    return (
        <div className={cn("sleek group w-[180px] flex-shrink-0 overflow-hidden rounded-lg sm:w-[180px]", className)}>
            <div className="flex gap-3 p-3">
                <div className="relative size-16 flex-shrink-0 overflow-hidden rounded-sm">
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
                            className="absolute top-0 left-0 z-30 rounded-bl-none border-[var(--cart-discount-border)] bg-[var(--cart-discount-bg)] px-1 py-0 text-[10px] font-semibold text-[var(--cart-discount-fg)]"
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
                            {titleParts[1] && (
                                <div className="opacity-50 font-serif text-[10px] leading-tight font-normal truncate mt-0.5">
                                    {titleParts[1]}
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
                <ProductVariantDialog productHandle={product.handle} autoAddSingleVariant={true} onSuccess={onCartAdd}>
                    <div className="flex w-full items-center justify-center gap-1.5">
                        <Plus className="h-3 w-3" />
                        <span>{isPreorder ? "PRE ORDER" : "ADD TO CART"}</span>
                    </div>
                </ProductVariantDialog>
            </div>
        </div>
    );
}
