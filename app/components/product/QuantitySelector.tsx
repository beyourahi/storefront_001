import {Minus, Plus} from "lucide-react";
import {Button} from "~/components/ui/button";

type QuantitySelectorProps = {
    quantity: number;
    onQuantityChange: (qty: number) => void;
    min?: number;
    max?: number;
    disabled?: boolean;
};

export const QuantitySelector = ({
    quantity,
    onQuantityChange,
    min = 1,
    max = 999,
    disabled = false
}: QuantitySelectorProps) => {
    const canDecrease = !disabled && quantity > min;
    const canIncrease = !disabled && quantity < max;

    return (
        <div>
            <h3 className="text-foreground mb-3 text-sm font-semibold">Quantity</h3>
            <div className="flex w-full items-center justify-between gap-4">
                <div className="flex w-fit items-center overflow-hidden rounded-lg">
                    <Button
                        onClick={() => canDecrease && onQuantityChange(quantity - 1)}
                        disabled={!canDecrease}
                        className="rounded-r-none border-r-0"
                    >
                        <Minus className="h-4 w-4" />
                    </Button>
                    <div className="bg-background text-foreground flex h-10 w-10 items-center justify-center text-sm font-medium">
                        {quantity}
                    </div>
                    <Button
                        onClick={() => canIncrease && onQuantityChange(quantity + 1)}
                        disabled={!canIncrease}
                        className="rounded-l-none border-l-0"
                    >
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
};
