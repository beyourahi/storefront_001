import {Ban} from "lucide-react";
import {ProductPageTitle} from "~/components/common/ProductPageTitle";
import {ProductPageDiscountIndicator} from "~/components/product/ProductPageDiscountIndicator";
import {ProductTagBadges} from "~/components/product/ProductTagBadges";
import {WishlistButton} from "~/components/WishlistButton";
import {Badge} from "~/components/ui/badge";
import {Skeleton} from "~/components/ui/skeleton";
import {OUT_OF_STOCK_LABEL} from "~/lib/product/product-card-utils";

type ProductMobileTitlePriceProps = {
    isLoading?: boolean;
    product: {
        title: string;
        productType?: string;
        tags?: string[];
    };
    discountPercentage?: number;
    productId?: string;
    availableForSale?: boolean;
};

export const ProductMobileTitlePrice = ({
    isLoading = false,
    product,
    discountPercentage,
    productId,
    availableForSale = true
}: ProductMobileTitlePriceProps) => {
    const isOutOfStock = !availableForSale;

    return (
        <div className="lg:hidden">
            <div className="mb-3 flex items-center gap-2">
                {isLoading ? (
                    <>
                        <Skeleton className="h-6 w-24" />
                        <Skeleton className="h-6 w-16" />
                    </>
                ) : (
                    <>
                        {product.productType && (
                            <Badge variant="secondary" className="rounded-full whitespace-nowrap">
                                {product.productType}
                            </Badge>
                        )}
                        <ProductPageDiscountIndicator discountPercentage={discountPercentage} />
                        {isOutOfStock && (
                            <Badge
                                className="bg-destructive hover:bg-destructive px-0.5 pr-1 py-0 text-xs"
                                style={{borderRadius: "9999px"}}
                            >
                                <span className="text-destructive-foreground flex items-center gap-1.5 font-medium">
                                    <span
                                        className="bg-destructive/80 flex items-center justify-center p-0.5"
                                        style={{borderRadius: "9999px"}}
                                    >
                                        <Ban size={12} className="pointer-events-none" aria-hidden="true" />
                                    </span>
                                    <span className="font-medium uppercase">{OUT_OF_STOCK_LABEL}</span>
                                </span>
                            </Badge>
                        )}
                    </>
                )}
            </div>

            {!isLoading && <ProductTagBadges tags={product.tags} className="mb-2" />}

            <div className="mb-2 flex items-start justify-between">
                {isLoading ? (
                    <Skeleton className="h-9 w-3/4" />
                ) : product ? (
                    <ProductPageTitle title={product.title} as="p" aria-hidden={true} />
                ) : null}
                {!isLoading && productId && (
                    <WishlistButton productId={productId} size="lg" className="ml-3 shrink-0" />
                )}
            </div>
        </div>
    );
};
