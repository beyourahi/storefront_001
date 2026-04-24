import {Image} from "@shopify/hydrogen";
import {cn} from "~/lib/utils";

interface PwaAppIconProps {
    src: string | null;
    alt: string | null;
    className?: string;
    size?: "sm" | "md" | "lg";
}

const sizeClasses = {
    sm: "size-12",
    md: "size-16",
    lg: "size-20"
};

export const PwaAppIcon = ({src, alt, className, size = "md"}: PwaAppIconProps) => {
    const sizeClass = sizeClasses[size];

    if (!src) {
        return (
            <div
                className={cn(
                    sizeClass,
                    "rounded-2xl bg-primary/10 flex items-center justify-center",
                    "shadow-sm border border-border/50",
                    className
                )}
                aria-hidden="true"
            >
                <span className="text-2xl font-bold text-primary">{alt?.[0]?.toUpperCase() || "A"}</span>
            </div>
        );
    }

    return (
        <Image
            src={src}
            alt={alt || "App icon"}
            className={cn(sizeClass, "rounded-2xl shadow-md object-cover", className)}
        />
    );
};
