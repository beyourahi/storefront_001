"use client";

import * as React from "react";
import {useState, useCallback} from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";

import {cn} from "~/lib/utils";
import {buttonVariants} from "~/components/ui/button";
import {useLockBodyScroll} from "~/lib/LenisProvider";

// Scroll-lock: AlertDialog is a modal confirmation overlay that blocks interaction.
// Lock is baked in so consumers never need manual useLockBodyScroll calls.
function AlertDialog({
    open: controlledOpen,
    onOpenChange,
    defaultOpen,
    ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Root>) {
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

    return (
        <AlertDialogPrimitive.Root data-slot="alert-dialog" open={isOpen} onOpenChange={handleOpenChange} {...props} />
    );
}

function AlertDialogTrigger({...props}: React.ComponentProps<typeof AlertDialogPrimitive.Trigger>) {
    return <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />;
}

function AlertDialogPortal({...props}: React.ComponentProps<typeof AlertDialogPrimitive.Portal>) {
    return <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />;
}

function AlertDialogOverlay({className, ...props}: React.ComponentProps<typeof AlertDialogPrimitive.Overlay>) {
    return (
        <AlertDialogPrimitive.Overlay
            data-slot="alert-dialog-overlay"
            className={cn(
                "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-[var(--z-alert)] bg-overlay-dark backdrop-blur-md",
                className
            )}
            {...props}
        />
    );
}

function AlertDialogContent({
    className,
    overlayClassName,
    ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Content> & {overlayClassName?: string}) {
    return (
        <AlertDialogPortal>
            <AlertDialogOverlay className={overlayClassName} />
            <AlertDialogPrimitive.Content
                data-slot="alert-dialog-content"
                data-lenis-prevent
                className={cn(
                    "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-[var(--z-alert)] grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg",
                    className
                )}
                {...props}
            />
        </AlertDialogPortal>
    );
}

function AlertDialogHeader({className, ...props}: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="alert-dialog-header"
            className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
            {...props}
        />
    );
}

function AlertDialogFooter({className, ...props}: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="alert-dialog-footer"
            className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
            {...props}
        />
    );
}

function AlertDialogTitle({className, ...props}: React.ComponentProps<typeof AlertDialogPrimitive.Title>) {
    return (
        <AlertDialogPrimitive.Title
            data-slot="alert-dialog-title"
            className={cn("text-lg font-semibold", className)}
            {...props}
        />
    );
}

function AlertDialogDescription({className, ...props}: React.ComponentProps<typeof AlertDialogPrimitive.Description>) {
    return (
        <AlertDialogPrimitive.Description
            data-slot="alert-dialog-description"
            className={cn("text-muted-foreground text-sm", className)}
            {...props}
        />
    );
}

function AlertDialogAction({className, ...props}: React.ComponentProps<typeof AlertDialogPrimitive.Action>) {
    return <AlertDialogPrimitive.Action className={cn(buttonVariants(), className)} {...props} />;
}

function AlertDialogCancel({className, ...props}: React.ComponentProps<typeof AlertDialogPrimitive.Cancel>) {
    return <AlertDialogPrimitive.Cancel className={cn(buttonVariants({variant: "outline"}), className)} {...props} />;
}

export {
    AlertDialog,
    AlertDialogPortal,
    AlertDialogOverlay,
    AlertDialogTrigger,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogFooter,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogAction,
    AlertDialogCancel
};
