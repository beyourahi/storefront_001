import {BadgePercent} from "lucide-react";
import {cn} from "~/lib/utils";
import {
    calculateVariantDiscountPercentage,
    analyzeProductDiscount,
    type ProductWithVariants,
    type VariantWithPrice
} from "~/lib/discounts";

interface ProductDiscountBadgeProps {
    selectedVariant: VariantWithPrice | null | undefined;
    product?: ProductWithVariants;
    className?: string;
}

export const ProductDiscountBadge = ({selectedVariant, product, className}: ProductDiscountBadgeProps) => {
    const variantDiscount = calculateVariantDiscountPercentage(selectedVariant);

    let label: string | null = null;

    if (variantDiscount > 0) {
        label = `${variantDiscount}% off`;
    } else if (product) {
        const productDiscount = analyzeProductDiscount(product);

        if (productDiscount.type !== "none" && productDiscount.percentage > 0) {
            label =
                productDiscount.type === "exact"
                    ? `${productDiscount.percentage}% off`
                    : `upto ${productDiscount.percentage}% off`;
        }
    }

    if (!label) {
        return null;
    }

    return (
        <div
            className={cn(
                "inline-flex items-center gap-1.5 rounded-full",
                "bg-discount-bg text-discount-text border-discount-icon-bg border",
                "px-2 pr-3 py-1.5",
                "shadow-md",
                className
            )}
        >
            <span className="bg-discount-icon-bg flex items-center justify-center rounded-full p-1">
                <BadgePercent size={12} className="pointer-events-none text-discount-text" aria-hidden="true" />
            </span>
            <span
                className={cn(
                    "text-[12px] font-medium uppercase tracking-wide sm:text-sm",
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
