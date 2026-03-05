import {Skeleton} from "~/components/ui/skeleton";
import {formatShopifyMoney} from "~/lib/currency-formatter";

type PriceDisplayProps = {
    selectedVariant: {
        price: {amount: string; currencyCode: string};
        compareAtPrice?: {amount: string; currencyCode: string} | null;
    } | null;
    discountPercentage?: number;
    isLoading?: boolean;
};

export const PriceDisplay = ({selectedVariant, discountPercentage, isLoading = false}: PriceDisplayProps) => {
    if (isLoading || !selectedVariant?.price) {
        return (
            <div className="mb-6 hidden space-y-1 lg:block">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-5 w-20" />
            </div>
        );
    }

    const hasCompareAt =
        selectedVariant.compareAtPrice &&
        parseFloat(selectedVariant.compareAtPrice.amount) > parseFloat(selectedVariant.price.amount);

    return (
        <div className="mb-6 hidden space-y-1 lg:block">
            <div className="flex items-center gap-3">
                <span className="text-foreground font-mono text-base font-bold">
                    {formatShopifyMoney(selectedVariant.price)}
                </span>
                {hasCompareAt && selectedVariant.compareAtPrice && (
                    <span className="text-muted-foreground font-mono text-base line-through">
                        {formatShopifyMoney(selectedVariant.compareAtPrice)}
                    </span>
                )}
            </div>
            {discountPercentage && discountPercentage > 0 && (
                <p className="text-sale-text text-sm font-medium">Save {discountPercentage}%</p>
            )}
        </div>
    );
};
