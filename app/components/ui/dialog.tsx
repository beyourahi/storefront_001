"use client";

import * as React from "react";
import {useState, useCallback} from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {XIcon} from "lucide-react";

import {cn} from "~/lib/utils";
import {useLockBodyScroll} from "~/lib/LenisProvider";

// Scroll-lock: Dialog is a full-screen modal that obscures the page.
// The lock is baked in here so every consumer gets it automatically
// via Lenis stop/start — no manual useLockBodyScroll calls needed at call-sites.
function Dialog({
    open: controlledOpen,
    onOpenChange,
    defaultOpen,
    ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
    const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen ?? false);
    const isControlled = controlledOpen !== undefined;
    const isOpen = isControlled ? controlledOpen : uncontrolledOpen;

    const handleOpenChange = useCallback(
        (nextOpen: boolean) => {
            if (!isControlled) setUncontrolledOpen(nextOpen);
            onOpenChange?.(nextOpen);
        },
        [isControlled, onOpenChange]
    );

    useLockBodyScroll(isOpen);

    return <DialogPrimitive.Root data-slot="dialog" open={isOpen} onOpenChange={handleOpenChange} {...props} />;
}

function DialogTrigger({...props}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
    return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({...props}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
    return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({...props}: React.ComponentProps<typeof DialogPrimitive.Close>) {
    return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({className, ...props}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
    return (
        <DialogPrimitive.Overlay
            data-slot="dialog-overlay"
            className={cn(
                "motion-overlay data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-[var(--z-overlay)] bg-overlay-dark backdrop-blur-md",
                className
            )}
            {...props}
        />
    );
}

function DialogContent({
    className,
    children,
    showCloseButton = true,
    overlayClassName,
    ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
    showCloseButton?: boolean;
    overlayClassName?: string;
}) {
    return (
        <DialogPortal data-slot="dialog-portal">
            <DialogPrimitive.Close asChild>
                <DialogOverlay className={overlayClassName} />
            </DialogPrimitive.Close>
            <DialogPrimitive.Content
                data-slot="dialog-content"
                className={cn(
                    "bg-background fixed top-[50%] left-[50%] z-[var(--z-modal)] translate-x-[-50%] translate-y-[-50%]",
                    "grid w-full gap-4 rounded-lg border p-4 sm:p-6 shadow-lg",
                    "max-w-[calc(100%-1.5rem)] sm:max-w-[calc(100%-2rem)] md:max-w-lg",
                    "max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-4rem)]",
                    "overflow-y-auto",
                    "motion-overlay data-[state=open]:animate-in data-[state=closed]:animate-out",
                    "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                    "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
                    className
                )}
                {...props}
            >
                {children}
                {showCloseButton && (
                    <DialogPrimitive.Close
                        data-slot="dialog-close"
                        className={cn(
                            "absolute top-2 right-2 sm:top-3 sm:right-3",
                            "flex select-none items-center justify-center size-10 sm:size-11",
                            "motion-interactive motion-press rounded-full bg-muted/50 hover:bg-muted cursor-pointer",
                            "opacity-70 hover:opacity-100 active:scale-[var(--motion-press-scale)]",
                            "ring-offset-background focus:ring-ring focus:ring-2 focus:ring-offset-2 focus:outline-hidden",
                            "disabled:pointer-events-none disabled:cursor-not-allowed",
                            "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-4 sm:[&_svg]:size-5"
                        )}
                    >
                        <XIcon />
                        <span className="sr-only">Close</span>
                    </DialogPrimitive.Close>
                )}
            </DialogPrimitive.Content>
        </DialogPortal>
    );
}

function DialogHeader({className, ...props}: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="dialog-header"
            className={cn("flex flex-col gap-1.5 sm:gap-2 text-center sm:text-left", "pr-12 sm:pr-14", className)}
            {...props}
        />
    );
}

function DialogBody({className, ...props}: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="dialog-body"
            className={cn("flex-1 overflow-y-auto -mx-2 px-2 sm:-mx-6 sm:px-6", "py-1", className)}
            {...props}
        />
    );
}

function DialogFooter({className, ...props}: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="dialog-footer"
            className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
            {...props}
        />
    );
}

function DialogTitle({className, ...props}: React.ComponentProps<typeof DialogPrimitive.Title>) {
    return (
        <DialogPrimitive.Title
            data-slot="dialog-title"
            className={cn("text-lg leading-none font-semibold text-foreground", className)}
            {...props}
        />
    );
}

function DialogDescription({className, ...props}: React.ComponentProps<typeof DialogPrimitive.Description>) {
    return (
        <DialogPrimitive.Description
            data-slot="dialog-description"
            className={cn("text-muted-foreground text-sm", className)}
            {...props}
        />
    );
}

export {
    Dialog,
    DialogBody,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogOverlay,
    DialogPortal,
    DialogTitle,
    DialogTrigger
};
