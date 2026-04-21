import {CalendarClock} from "lucide-react";
import {Badge} from "~/components/ui/badge";

type PreorderBadgeProps = {
    className?: string;
};

export const PreorderBadge = ({className}: PreorderBadgeProps) => {
    return (
        <Badge
            className={`bg-primary/80 hover:bg-primary/80 rounded-[var(--radius-xl)] px-0.5 pr-1 py-0 text-xs ${className || ""}`}
        >
            <span className="text-primary-foreground flex items-center gap-1.5 font-medium">
                <span className="bg-primary flex items-center justify-center rounded-[var(--radius-xl)] p-0.5 text-sm">
                    <CalendarClock size={12} className="pointer-events-none" />
                </span>
                <span className="font-medium uppercase">PRE ORDER</span>
            </span>
        </Badge>
    );
};
