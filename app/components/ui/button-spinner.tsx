import {Loader2Icon} from "lucide-react";
import {cn} from "~/lib/utils";

function ButtonSpinner({className}: {className?: string}) {
    return (
        <Loader2Icon
            role="status"
            aria-label="Loading"
            className={cn("animate-spin", className)}
            style={{width: "1em", height: "1em"}}
        />
    );
}

export {ButtonSpinner};
