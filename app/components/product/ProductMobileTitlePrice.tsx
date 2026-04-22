import {ProductPageTitle} from "~/components/common/ProductPageTitle";
import {ProductPageDiscountIndicator} from "~/components/product/ProductPageDiscountIndicator";
import {ProductTagBadges} from "~/components/product/ProductTagBadges";
import {WishlistButton} from "~/components/WishlistButton";
import {Badge} from "~/components/ui/badge";
import {Skeleton} from "~/components/ui/skeleton";

type ProductMobileTitlePriceProps = {
    isLoading?: boolean;
    product: {
        title: string;
        productType?: string;
        tags?: string[];
    };
    discountPercentage?: number;
    productId?: string;
};

export const ProductMobileTitlePrice = ({
    isLoading = false,
    product,
    discountPercentage,
    productId
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

            {!isLoading && <ProductTagBadges tags={product.tags} className="mb-2" />}

            <div className="mb-2 flex items-start justify-between">
                {isLoading ? (
                    <Skeleton className="h-9 w-3/4" />
                ) : product ? (
                    <ProductPageTitle title={product.title} as="p" aria-hidden={true} />
                ) : null}
                {!isLoading && productId && (
                    <WishlistButton
                        productId={productId}
                        size="lg"
                        className="ml-3 shrink-0"
                    />
                )}
            </div>
        </div>
    );
};
