import {useState, lazy, Suspense} from "react";
import {Ruler} from "lucide-react";
import {cn} from "~/lib/utils";
import type {SizeChartData} from "~/lib/size-chart";

const SizeChartDialog = lazy(() =>
    import("~/components/product/SizeChartDialog").then(mod => ({default: mod.SizeChartDialog}))
);

interface SizeChartButtonProps {
    sizeChart: SizeChartData;
    variant?: "link" | "outline" | "ghost" | "mobile";
    className?: string;
}

export function SizeChartButton({sizeChart, variant = "link", className}: SizeChartButtonProps) {
    const [isOpen, setIsOpen] = useState(false);

    const variantStyles = {
        link: cn(
            "inline-flex items-center gap-1.5 text-sm font-medium",
            "text-primary underline underline-offset-4",
            "hover:text-primary/80 transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        ),
        outline: cn(
            "inline-flex items-center justify-center gap-2",
            "min-h-10 px-3 sm:px-4 py-2 rounded-full",
            "border-2 border-primary text-primary",
            "font-medium text-sm",
            "hover:bg-primary hover:text-primary-foreground",
            "active:scale-95 transition-all duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        ),
        ghost: cn(
            "inline-flex items-center gap-1.5",
            "min-h-10 px-3 sm:px-4 py-2 rounded-md",
            "text-muted-foreground text-sm",
            "hover:text-primary hover:bg-muted/50",
            "transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        ),
        mobile: cn(
            "inline-flex items-center gap-1.5 text-sm font-medium",
            "text-primary-foreground underline underline-offset-4",
            "hover:text-primary-foreground/80 transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
        )
    };

    return (
        <>
            <button type="button" onClick={() => setIsOpen(true)} className={cn(variantStyles[variant], className)}>
                <Ruler className="size-4" />
                <span>Size Guide</span>
            </button>

            <Suspense fallback={null}>
                {isOpen && <SizeChartDialog sizeChart={sizeChart} open={isOpen} onOpenChange={setIsOpen} />}
            </Suspense>
        </>
    );
}

export function SizeChartButtonCompact({sizeChart, className}: {sizeChart: SizeChartData; className?: string}) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className={cn(
                    "inline-flex items-center gap-1.5",
                    "min-h-10 min-w-10 px-2 sm:px-3 py-2 rounded-md",
                    "text-muted-foreground text-sm",
                    "hover:text-primary hover:bg-muted/50",
                    "transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    className
                )}
                aria-label="Size Guide"
            >
                <Ruler className="size-4" />
                <span className="hidden sm:inline">Size Guide</span>
            </button>

            <Suspense fallback={null}>
                {isOpen && <SizeChartDialog sizeChart={sizeChart} open={isOpen} onOpenChange={setIsOpen} />}
            </Suspense>
        </>
    );
}
