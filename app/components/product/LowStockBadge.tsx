import {AlertTriangle} from "lucide-react";
import {Badge} from "~/components/ui/badge";

type LowStockBadgeProps = {
    className?: string;
};

export const LowStockBadge = ({className}: LowStockBadgeProps) => {
    return (
        <Badge
            className={`bg-warning/80 hover:bg-warning/80 rounded-full px-0.5 pr-1 py-0 text-xs ${className || ""}`}
        >
            <span className="text-warning-foreground flex items-center gap-1 sm:gap-1.5 font-medium">
                <span className="bg-warning flex items-center justify-center rounded-full p-0.5 text-sm">
                    <AlertTriangle size={12} className="pointer-events-none" />
                </span>
                <span className="font-medium uppercase">Low Stock</span>
            </span>
        </Badge>
    );
};
