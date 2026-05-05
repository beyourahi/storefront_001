import {BadgePercent} from "lucide-react";
import {cn} from "~/lib/utils";
import type {DiscountBadgeInfo} from "~/lib/discounts";

interface DiscountBadgeProps {
    discountInfo?: DiscountBadgeInfo;
    percentage?: number;
    position?: "absolute" | "inline";
    className?: string;
}

/**
 * Animated discount badge with a shimmer label.
 * Accepts either a `DiscountBadgeInfo` object (from `analyzeProductPricing`) or a raw
 * `percentage` number. Renders nothing when there is no discount to show.
 * Use `position="inline"` to suppress the absolute positioning (e.g. inside flex rows).
 */
export const DiscountBadge = ({discountInfo, percentage, position = "absolute", className}: DiscountBadgeProps) => {
    let label: string | null = null;

    if (discountInfo) {
        if (discountInfo.type === "none" || discountInfo.percentage <= 0) {
            return null;
        }
        label =
            discountInfo.type === "exact" ? `${discountInfo.percentage}% off` : `upto ${discountInfo.percentage}% off`;
    } else if (percentage && percentage > 0) {
        label = `upto ${percentage}% off`;
    }

    if (!label) {
        return null;
    }

    return (
        <div
            className={cn(
                position === "absolute" && "absolute top-2 left-2 z-10",
                "inline-flex items-center gap-1.5 rounded-full",
                "bg-discount-bg text-discount-text border-discount-icon-bg border",
                "px-1.5 pr-2.5 py-1",
                "shadow-md",
                className
            )}
        >
            <span className="bg-discount-icon-bg flex items-center justify-center rounded-full p-1">
                <BadgePercent size={10} className="pointer-events-none text-discount-text" aria-hidden="true" />
            </span>
            <span
                className={cn(
                    "text-[12px] font-medium uppercase tracking-wide sm:text-sm lg:text-xs",
                    "animate-shimmer bg-linear-to-r",
                    "from-discount-shimmer-start via-discount-shimmer-mid to-discount-shimmer-start",
                    "bg-[length:200%_100%] bg-clip-text text-transparent"
                )}
            >
                {label}
            </span>
        </div>
    );
};
