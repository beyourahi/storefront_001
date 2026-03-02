import {Pin} from "lucide-react";
import {cn} from "~/lib/utils";

interface PinIconProps {
    className?: string;
    size?: "sm" | "default" | "lg";
}

const SIZE_CONFIG = {
    sm: {
        container: "p-1",
        icon: 16
    },
    default: {
        container: "p-1.5",
        icon: 20
    },
    lg: {
        container: "p-2",
        icon: 24
    }
} as const;

export function PinIcon({className, size = "default"}: PinIconProps) {
    const config = SIZE_CONFIG[size];

    return (
        <div
            className={cn(
                "inline-flex items-center justify-center rounded-full",
                "bg-primary text-primary-foreground",
                config.container,
                "shadow-lg",
                "ring-1 ring-primary/20",
                className
            )}
            role="img"
            aria-label="Pinned product"
        >
            <Pin
                size={config.icon}
                fill="currentColor"
                strokeWidth={1.5}
                className="rotate-45 pointer-events-none"
                aria-hidden="true"
            />
        </div>
    );
}
