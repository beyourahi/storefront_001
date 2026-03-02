import {Clock} from "lucide-react";
import {calculateReadingTime} from "~/lib/blog-utils";
import {cn} from "~/lib/utils";

interface ReadingTimeProps {
    content: string;
    wordsPerMinute?: number;
    showIcon?: boolean;
    className?: string;
}

export const ReadingTime = ({content, wordsPerMinute = 200, showIcon = false, className}: ReadingTimeProps) => {
    const minutes = calculateReadingTime(content, wordsPerMinute);

    return (
        <span className={cn("text-sm sm:text-sm text-muted-foreground whitespace-nowrap", className)}>
            {showIcon && <Clock className="inline-block size-3 sm:size-3.5 mr-0.5 sm:mr-1 -mt-0.5" />}
            {minutes} min read
        </span>
    );
};
