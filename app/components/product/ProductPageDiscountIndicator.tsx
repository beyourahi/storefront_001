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
            className={`rounded-[var(--radius-xl)] bg-emerald-950/80 px-1 pr-1.5 text-xs hover:bg-emerald-950/80 ${className || ""}`}
        >
            <span className="flex items-center gap-1.5 font-medium text-emerald-300">
                <span className="flex items-center justify-center rounded-[var(--radius-xl)] bg-emerald-900 p-0.5 text-sm">
                    <BadgePercent size={12} className="pointer-events-none" />
                </span>
                <span className="animate-shimmer bg-gradient-to-r from-emerald-400 via-emerald-100 to-emerald-400 bg-[length:200%_100%] bg-clip-text font-medium text-transparent uppercase">
                    {discountText}
                </span>
            </span>
        </Badge>
    );
};
