import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import {CheckIcon} from "lucide-react";
import {cn} from "~/lib/utils";

const Checkbox = ({className, ...props}: React.ComponentProps<typeof CheckboxPrimitive.Root>) => {
    return (
        <CheckboxPrimitive.Root
            data-slot="checkbox"
            className={cn(
                "peer border-input shrink-0 rounded-[0.25rem] border shadow-xs transition-shadow outline-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
                "size-5 sm:size-4",
                "data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=checked]:border-primary",
                "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[0.1875rem]",
                "aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
                "relative before:absolute before:-inset-2 before:content-[''] sm:before:hidden",
                className
            )}
            {...props}
        >
            <CheckboxPrimitive.Indicator
                data-slot="checkbox-indicator"
                className="grid place-content-center text-current transition-none"
            >
                <CheckIcon className="size-4 sm:size-3.5" />
            </CheckboxPrimitive.Indicator>
        </CheckboxPrimitive.Root>
    );
};

export {Checkbox};
