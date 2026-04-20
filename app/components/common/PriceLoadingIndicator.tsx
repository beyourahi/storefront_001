import {cn} from "~/lib/utils";

export function PriceLoadingIndicator({className}: {className?: string}) {
    return (
        <span
            className={cn("inline-flex items-center gap-[3px]", className)}
            role="status"
            aria-label="Updating price"
        >
            <span className="block h-[5px] w-[5px] rounded-full bg-current animate-bounce [animation-duration:0.7s] [animation-delay:0s]" />
            <span className="block h-[5px] w-[5px] rounded-full bg-current animate-bounce [animation-duration:0.7s] [animation-delay:0.15s]" />
            <span className="block h-[5px] w-[5px] rounded-full bg-current animate-bounce [animation-duration:0.7s] [animation-delay:0.3s]" />
        </span>
    );
}
