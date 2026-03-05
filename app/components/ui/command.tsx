import * as React from "react";
import {Search} from "lucide-react";
import {cn} from "~/lib/utils";

function Command({className, ...props}: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="command"
            className={cn("bg-popover text-popover-foreground flex h-full w-full flex-col overflow-hidden", className)}
            {...props}
        />
    );
}

const CommandInput = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
    ({className, ...props}, ref) => {
        return (
            <div data-slot="command-input-wrapper" className="flex items-center gap-2 border-b px-3">
                <Search className="size-4 shrink-0 opacity-50" />
                <input
                    ref={ref}
                    data-slot="command-input"
                    className={cn(
                        "placeholder:text-muted-foreground flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50",
                        className
                    )}
                    {...props}
                />
            </div>
        );
    }
);
CommandInput.displayName = "CommandInput";

function CommandList({className, ...props}: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="command-list"
            className={cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className)}
            {...props}
        />
    );
}

function CommandEmpty({className, ...props}: React.ComponentProps<"div">) {
    return <div data-slot="command-empty" className={cn("py-6 text-center text-sm", className)} {...props} />;
}

function CommandGroup({className, ...props}: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="command-group"
            className={cn("text-foreground [&_[data-slot=command-group-heading]]:text-muted-foreground p-1", className)}
            {...props}
        />
    );
}

function CommandGroupHeading({className, ...props}: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="command-group-heading"
            className={cn("px-2 py-1.5 text-xs font-medium", className)}
            {...props}
        />
    );
}

function CommandItem({className, ...props}: React.ComponentProps<"button">) {
    return (
        <button
            type="button"
            data-slot="command-item"
            className={cn(
                "aria-selected:bg-accent aria-selected:text-accent-foreground hover:bg-accent hover:text-accent-foreground relative flex w-full select-none items-center gap-2 rounded-sm px-2 py-2 text-sm outline-hidden",
                className
            )}
            {...props}
        />
    );
}

export {Command, CommandEmpty, CommandGroup, CommandGroupHeading, CommandInput, CommandItem, CommandList};
