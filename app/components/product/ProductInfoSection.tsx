import {Ban} from "lucide-react";
import {ProductPageTitle} from "~/components/common/ProductPageTitle";
import {ProductDescriptionAccordion} from "~/components/product/ProductDescriptionAccordion";
import {ProductPageDiscountIndicator} from "~/components/product/ProductPageDiscountIndicator";
import {ProductBadgeStack} from "~/components/product/ProductBadge";
import {ProductTagBadges} from "~/components/product/ProductTagBadges";
import {WishlistButton} from "~/components/WishlistButton";
import {Badge} from "~/components/ui/badge";
import {Skeleton} from "~/components/ui/skeleton";
import {getSpecialTags} from "~/lib/product-tags";
import {OUT_OF_STOCK_LABEL} from "~/lib/product/product-card-utils";

type ProductInfoSectionProps = {
    isLoading?: boolean;
    product: {
        title: string;
        productType?: string;
        description?: string;
        descriptionHtml?: string;
        tags?: string[];
    };
    discountPercentage?: number;
    productId?: string;
    availableForSale?: boolean;
};

export const ProductInfoSection = ({isLoading = false, product, discountPercentage, productId, availableForSale = true}: ProductInfoSectionProps) => {
    const {badgeTypes} = getSpecialTags(product.tags);
    const isOutOfStock = !availableForSale;

    return (
        <div className="space-y-2 lg:col-span-4 lg:space-y-4">
            <div className="hidden items-center gap-2 lg:flex">
                {isLoading ? (
                    <>
                        <Skeleton className="h-6 w-24" />
                        <Skeleton className="h-6 w-16" />
                    </>
                ) : (
                    <>
                        {product.productType && (
                            <Badge variant="secondary" className="rounded-[var(--radius-xl)] whitespace-nowrap">
                                {product.productType}
                            </Badge>
                        )}
                        <ProductPageDiscountIndicator discountPercentage={discountPercentage} />
                        <ProductBadgeStack types={badgeTypes} />
                        {isOutOfStock && (
                            <Badge className="bg-destructive hover:bg-destructive rounded-[var(--radius-xl)] px-0.5 pr-1.5 py-0 text-xs">
                                <span className="text-destructive-foreground flex items-center gap-1.5 font-medium">
                                    <span className="bg-destructive/80 flex items-center justify-center rounded-[var(--radius-xl)] p-0.5">
                                        <Ban size={12} className="pointer-events-none" aria-hidden="true" />
                                    </span>
                                    <span className="font-medium uppercase">{OUT_OF_STOCK_LABEL}</span>
                                </span>
                            </Badge>
                        )}
                    </>
                )}
            </div>

            {!isLoading && <ProductTagBadges tags={product.tags} className="hidden lg:flex" />}

            <div className="mb-8 hidden items-start justify-between lg:flex">
                {isLoading ? (
                    <Skeleton className="h-9 w-3/4" />
                ) : product ? (
                    <ProductPageTitle title={product.title} />
                ) : null}
                {!isLoading && productId && (
                    <WishlistButton
                        productId={productId}
                        size="lg"
                        className="ml-3 shrink-0"
                    />
                )}
            </div>

            <div>
                {isLoading ? (
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                    </div>
                ) : product ? (
                    <ProductDescriptionAccordion product={product} />
                ) : null}
            </div>
        </div>
    );
};
