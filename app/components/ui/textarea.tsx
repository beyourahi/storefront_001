import * as React from "react";

import {cn} from "~/lib/utils";

function Textarea({className, ...props}: React.ComponentProps<"textarea">) {
    return (
        <textarea
            data-slot="textarea"
            className={cn(
                "border-input placeholder:text-muted-foreground flex field-sizing-content w-full rounded-xl border bg-transparent shadow-xs transition-[color,box-shadow] outline-none disabled:cursor-not-allowed disabled:opacity-50",
                "min-h-[120px] px-3 py-3 text-base sm:min-h-[100px] sm:py-2.5 md:min-h-16 md:py-2 md:text-sm",
                "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[0.1875rem]",
                "aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
                className
            )}
            {...props}
        />
    );
}

export {Textarea};
