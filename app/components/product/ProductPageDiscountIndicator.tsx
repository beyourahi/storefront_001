import {useMemo} from "react";
import {BadgePercent} from "lucide-react";
import {Badge} from "~/components/ui/badge";

type ProductPageDiscountIndicatorProps = {
    discountPercentage?: number;
    hasMultipleDiscounts?: boolean;
    className?: string;
};

export const ProductPageDiscountIndicator = ({
    discountPercentage,
    hasMultipleDiscounts = false,
    className
}: ProductPageDiscountIndicatorProps) => {
    const hasDiscount = discountPercentage && discountPercentage > 0;

    const discountText = useMemo(
        () => (hasMultipleDiscounts ? `upto ${discountPercentage}% off` : `${discountPercentage}% off`),
        [discountPercentage, hasMultipleDiscounts]
    );

    if (!hasDiscount) return null;

    return (
        <Badge
            className={`bg-discount-bg text-discount-text border-discount-icon-bg rounded-full border px-0.5 pr-1 py-0 text-xs ${className || ""}`}
        >
            <span className="text-discount-text flex items-center gap-1 sm:gap-1.5 font-medium">
                <span className="bg-discount-icon-bg flex items-center justify-center rounded-full p-0.5 text-sm">
                    <BadgePercent size={12} className="pointer-events-none" />
                </span>
                <span className="from-discount-shimmer-start via-discount-shimmer-mid to-discount-shimmer-start animate-shimmer bg-gradient-to-r bg-[length:200%_100%] bg-clip-text font-medium text-transparent uppercase">
                    {discountText}
                </span>
            </span>
        </Badge>
    );
};
