import * as React from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import {XIcon} from "lucide-react";

import {cn} from "~/lib/utils";

function Sheet({...props}: React.ComponentProps<typeof SheetPrimitive.Root>) {
    return <SheetPrimitive.Root data-slot="sheet" {...props} />;
}

function SheetTrigger({...props}: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
    return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetClose({...props}: React.ComponentProps<typeof SheetPrimitive.Close>) {
    return <SheetPrimitive.Close data-slot="sheet-close" {...props} />;
}

function SheetPortal({...props}: React.ComponentProps<typeof SheetPrimitive.Portal>) {
    return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />;
}

function SheetOverlay({className, ...props}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
    return (
        <SheetPrimitive.Overlay
            data-slot="sheet-overlay"
            className={cn(
                "motion-overlay data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-[var(--z-overlay)] bg-overlay-dark backdrop-blur-md",
                className
            )}
            {...props}
        />
    );
}

function SheetContent({
    className,
    children,
    side = "right",
    hideCloseButton = false,
    overlayClassName,
    ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
    side?: "top" | "right" | "bottom" | "left";
    hideCloseButton?: boolean;
    overlayClassName?: string;
}) {
    return (
        <SheetPortal>
            <SheetPrimitive.Close asChild>
                <SheetOverlay className={overlayClassName} />
            </SheetPrimitive.Close>
            <SheetPrimitive.Content
                data-slot="sheet-content"
                className={cn(
                    "bg-background fixed z-[var(--z-modal)] flex flex-col shadow-lg",
                    "motion-overlay data-[state=open]:animate-in data-[state=closed]:animate-out",
                    "transition-[transform,opacity] data-[state=closed]:duration-[var(--motion-duration-overlay)] data-[state=open]:duration-[var(--motion-duration-overlay)]",
                    side === "right" && [
                        "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
                        "top-3 sm:top-4 bottom-[max(0.75rem,env(safe-area-inset-bottom))] sm:bottom-[max(1rem,env(safe-area-inset-bottom))]",
                        "right-0 h-auto border-l rounded-l-2xl sm:rounded-l-3xl shadow-xl",
                        "w-[85%] xs:w-[80%] sm:w-[75%] sm:max-w-sm md:max-w-md lg:max-w-lg"
                    ],
                    side === "left" && [
                        "data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left",
                        "top-3 sm:top-4 bottom-[max(0.75rem,env(safe-area-inset-bottom))] sm:bottom-[max(1rem,env(safe-area-inset-bottom))]",
                        "left-0 h-auto border-r rounded-r-2xl sm:rounded-r-3xl shadow-xl",
                        "w-[85%] xs:w-[80%] sm:w-[75%] sm:max-w-sm md:max-w-md lg:max-w-lg"
                    ],
                    side === "top" && [
                        "data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
                        "inset-x-0 top-0 h-auto max-h-[80dvh] border-b rounded-b-2xl sm:rounded-b-3xl"
                    ],
                    side === "bottom" && [
                        "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
                        "inset-x-0 bottom-0 h-auto max-h-[85dvh] border-t rounded-t-2xl sm:rounded-t-3xl",
                        "pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-[max(1rem,env(safe-area-inset-bottom))]"
                    ],
                    className
                )}
                {...props}
            >
                {children}
                {!hideCloseButton && (
                    <SheetPrimitive.Close
                        className={cn(
                            "absolute top-2 right-2 sm:top-3 sm:right-3",
                            "flex select-none items-center justify-center size-10 sm:size-11",
                            "motion-interactive motion-press rounded-full bg-muted/50 hover:bg-muted cursor-pointer",
                            "opacity-70 hover:opacity-100 active:scale-[var(--motion-press-scale)]",
                            "ring-offset-background focus:ring-ring focus:ring-2 focus:ring-offset-2 focus:outline-hidden",
                            "disabled:pointer-events-none disabled:cursor-not-allowed",
                            "[&_svg]:pointer-events-none [&_svg]:shrink-0"
                        )}
                    >
                        <XIcon className="size-4 sm:size-5" />
                        <span className="sr-only">Close</span>
                    </SheetPrimitive.Close>
                )}
            </SheetPrimitive.Content>
        </SheetPortal>
    );
}

function SheetHeader({className, ...props}: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="sheet-header"
            className={cn("flex flex-col gap-1 sm:gap-1.5 p-3 sm:p-4", "pr-14 sm:pr-16", className)}
            {...props}
        />
    );
}

function SheetBody({className, ...props}: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="sheet-body"
            className={cn("flex-1 overflow-y-auto px-3 sm:px-4", "py-1", className)}
            {...props}
        />
    );
}

function SheetFooter({className, ...props}: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="sheet-footer"
            className={cn("mt-auto flex flex-col gap-2 p-3 sm:p-4", "border-t border-border/50", className)}
            {...props}
        />
    );
}

function SheetTitle({className, ...props}: React.ComponentProps<typeof SheetPrimitive.Title>) {
    return (
        <SheetPrimitive.Title
            data-slot="sheet-title"
            className={cn("text-foreground font-semibold", className)}
            {...props}
        />
    );
}

function SheetDescription({className, ...props}: React.ComponentProps<typeof SheetPrimitive.Description>) {
    return (
        <SheetPrimitive.Description
            data-slot="sheet-description"
            className={cn("text-muted-foreground text-sm", className)}
            {...props}
        />
    );
}

export {
    Sheet,
    SheetBody,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger
};
