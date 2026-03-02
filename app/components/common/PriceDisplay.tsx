import {useMemo} from "react";
import {formatPrice, calculateDiscount} from "~/lib/currency-formatter";

type PriceDisplayProps = {
    price: string;
    compareAtPrice?: string;
    currency?: string;
    size?: "sm" | "md" | "lg";
    showDiscount?: boolean;
};

const sizeClasses = {
    sm: {price: "text-sm", compare: "text-xs", discount: "text-xs px-1 py-0.5"},
    md: {price: "text-base", compare: "text-sm", discount: "text-xs px-2 py-1"},
    lg: {price: "text-base font-bold", compare: "text-base", discount: "text-sm px-2 py-1"}
};

export const PriceDisplay = ({
    price,
    compareAtPrice,
    currency = "USD",
    size = "md",
    showDiscount = true
}: PriceDisplayProps) => {
    const isOnSale = useMemo(
        () => compareAtPrice !== undefined && parseFloat(compareAtPrice) > parseFloat(price),
        [compareAtPrice, price]
    );

    const discountPercentage = useMemo(
        () => (isOnSale ? calculateDiscount(parseFloat(compareAtPrice!), parseFloat(price)).percentage : 0),
        [isOnSale, compareAtPrice, price]
    );

    const formatPriceValue = (priceValue: string): string => {
        const amount = parseFloat(priceValue);
        return formatPrice(amount, currency);
    };

    const classes = sizeClasses[size];

    return (
        <div className="flex flex-wrap items-center gap-2">
            <span className={`font-mono font-semibold ${classes.price}`}>{formatPriceValue(price)}</span>

            {isOnSale && (
                <>
                    <span className={`text-muted-foreground font-mono line-through ${classes.compare}`}>
                        {formatPriceValue(compareAtPrice!)}
                    </span>

                    {showDiscount && discountPercentage > 0 && (
                        <span
                            className={`bg-destructive text-destructive-foreground rounded-md font-mono font-medium ${classes.discount} pointer-events-none`}
                        >
                            -{discountPercentage}%
                        </span>
                    )}
                </>
            )}
        </div>
    );
};
