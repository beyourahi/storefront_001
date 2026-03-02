import {forwardRef} from "react";
import {cn} from "~/lib/utils";
import {useSmartSwatchBorderColor} from "~/lib/site-content-context";

type SwatchSize = "sm" | "md" | "lg";

interface ColorSwatchProps {
    color?: string | null;
    image?: string | null;
    name: string;
    size?: SwatchSize;
    selected?: boolean;
    onPrimaryBackground?: boolean;
    className?: string;
}

const sizeClasses: Record<SwatchSize, {swatch: string; ring: string}> = {
    sm: {
        swatch: "size-6",
        ring: "ring-offset-1"
    },
    md: {
        swatch: "size-7",
        ring: "ring-offset-2"
    },
    lg: {
        swatch: "size-9",
        ring: "ring-offset-2"
    }
};

export const ColorSwatch = forwardRef<HTMLSpanElement, ColorSwatchProps>(function ColorSwatch(
    {color, image, name, size = "md", selected = false, onPrimaryBackground = false, className},
    ref
) {
    const borderColor = useSmartSwatchBorderColor(color, selected, onPrimaryBackground);
    const sizeConfig = sizeClasses[size];

    if (!color && !image) {
        return null;
    }

    return (
        <span
            ref={ref}
            aria-label={name}
            role="img"
            className={cn(
                "flex items-center justify-center overflow-hidden rounded-full",
                sizeConfig.swatch,
                selected && [
                    "ring-2",
                    sizeConfig.ring,
                    onPrimaryBackground
                        ? "ring-primary-foreground ring-offset-primary"
                        : "ring-primary ring-offset-background"
                ],
                className
            )}
            style={{
                backgroundColor: color || "transparent",
                borderWidth: "2px",
                borderStyle: "solid",
                borderColor
            }}
        >
            {image && <img src={image} alt={name} className="size-full object-cover" />}
        </span>
    );
});
