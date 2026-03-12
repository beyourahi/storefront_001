import {Minus, Plus} from "lucide-react";
import {cn} from "~/lib/utils";

interface QuantitySelectorProps {
    quantity: number;
    onQuantityChange: (quantity: number) => void;
    min?: number;
    max?: number;
    className?: string;
}

export function QuantitySelector({quantity, onQuantityChange, min = 1, max, className}: QuantitySelectorProps) {
    const handleDecrement = () => {
        if (quantity > min) {
            onQuantityChange(quantity - 1);
        }
    };

    const handleIncrement = () => {
        if (max === undefined || quantity < max) {
            onQuantityChange(quantity + 1);
        }
    };

    const canDecrement = quantity > min;
    const canIncrement = max === undefined || quantity < max;

    return (
        <div className={cn("flex select-none items-center justify-between rounded-full border-2 border-primary", className)}>
            <button
                type="button"
                onClick={handleDecrement}
                disabled={!canDecrement}
                className={cn(
                    "flex min-h-10 items-center justify-center px-2.5 py-1.5 rounded-l-full text-primary sleek active:bg-primary/10",
                    canDecrement ? "cursor-pointer" : "opacity-40 cursor-not-allowed"
                )}
                aria-label="Decrease quantity"
            >
                <Minus className="size-5" />
            </button>
            <span className="min-w-8 px-1 text-lg font-medium text-primary text-center tabular-nums">{quantity}</span>
            <button
                type="button"
                onClick={handleIncrement}
                disabled={!canIncrement}
                className={cn(
                    "flex min-h-10 items-center justify-center px-2.5 py-1.5 rounded-r-full text-primary sleek active:bg-primary/10",
                    canIncrement ? "cursor-pointer" : "opacity-40 cursor-not-allowed"
                )}
                aria-label="Increase quantity"
            >
                <Plus className="size-5" />
            </button>
        </div>
    );
}
