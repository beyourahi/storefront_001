import {BadgePercent} from "lucide-react";
import {cn} from "~/lib/utils";
import type {DiscountBadgeInfo} from "~/lib/discounts";

interface DiscountBadgeProps {
    discountInfo?: DiscountBadgeInfo;
    percentage?: number;
    position?: "absolute" | "inline";
    className?: string;
}

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
                "bg-emerald-950/80",
                "px-1.5 pr-2.5 py-1",
                "shadow-md",
                className
            )}
        >
            <span className="flex items-center justify-center rounded-full bg-emerald-900 p-1">
                <BadgePercent size={10} className="pointer-events-none text-emerald-300" aria-hidden="true" />
            </span>
            <span
                className={cn(
                    "text-[12px] font-medium uppercase tracking-wide sm:text-sm lg:text-xs",
                    "animate-shimmer bg-linear-to-r",
                    "from-emerald-400 via-emerald-100 to-emerald-400",
                    "bg-[length:200%_100%] bg-clip-text text-transparent"
                )}
            >
                {label}
            </span>
        </div>
    );
};
