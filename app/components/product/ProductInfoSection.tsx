import {ProductPageTitle} from "~/components/common/ProductPageTitle";
import {ProductDescriptionAccordion} from "~/components/product/ProductDescriptionAccordion";
import {ProductPageDiscountIndicator} from "~/components/product/ProductPageDiscountIndicator";
import {ProductBadgeStack} from "~/components/product/ProductBadge";
import {WishlistButton} from "~/components/WishlistButton";
import {Badge} from "~/components/ui/badge";
import {Skeleton} from "~/components/ui/skeleton";
import {getSpecialTags} from "~/lib/product-tags";

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
};

export const ProductInfoSection = ({isLoading = false, product, discountPercentage, productId}: ProductInfoSectionProps) => {
    const {badgeTypes} = getSpecialTags(product.tags);

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
                    </>
                )}
            </div>

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
