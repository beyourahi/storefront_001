import {ProductPageTitle} from "~/components/common/ProductPageTitle";
import {ProductPageDiscountIndicator} from "~/components/product/ProductPageDiscountIndicator";
import {Badge} from "~/components/ui/badge";
import {Skeleton} from "~/components/ui/skeleton";

type ProductMobileTitlePriceProps = {
    isLoading?: boolean;
    product: {
        title: string;
        productType?: string;
    };
    discountPercentage?: number;
};

export const ProductMobileTitlePrice = ({
    isLoading = false,
    product,
    discountPercentage
}: ProductMobileTitlePriceProps) => {
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
                            <Badge variant="secondary" className="rounded-[var(--radius-xl)] whitespace-nowrap">
                                {product.productType}
                            </Badge>
                        )}
                        <ProductPageDiscountIndicator discountPercentage={discountPercentage} />
                    </>
                )}
            </div>

            <div className="mb-2 flex items-start justify-between">
                {isLoading ? (
                    <Skeleton className="h-9 w-3/4" />
                ) : product ? (
                    <ProductPageTitle title={product.title} />
                ) : null}
            </div>
        </div>
    );
};
