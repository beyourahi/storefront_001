"use client";

import * as React from "react";
import {useState, useCallback} from "react";
import {Drawer as DrawerPrimitive} from "vaul";

import {cn} from "~/lib/utils";
import {useLockBodyScroll} from "~/lib/LenisProvider";

// Scroll-lock: Drawer is a bottom-sheet overlay that obscures the page.
// Lock is baked in so consumers (e.g. MobileMenuWrapper) get it automatically.
function Drawer({
    open: controlledOpen,
    onOpenChange,
    defaultOpen,
    ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) {
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

    return <DrawerPrimitive.Root data-slot="drawer" open={isOpen} onOpenChange={handleOpenChange} {...props} />;
}

function DrawerTrigger({...props}: React.ComponentProps<typeof DrawerPrimitive.Trigger>) {
    return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />;
}

function DrawerPortal({...props}: React.ComponentProps<typeof DrawerPrimitive.Portal>) {
    return <DrawerPrimitive.Portal data-slot="drawer-portal" {...props} />;
}

function DrawerClose({...props}: React.ComponentProps<typeof DrawerPrimitive.Close>) {
    return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />;
}

function DrawerOverlay({className, ...props}: React.ComponentProps<typeof DrawerPrimitive.Overlay>) {
    return (
        <DrawerPrimitive.Overlay
            data-slot="drawer-overlay"
            className={cn(
                "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                "fixed inset-0 z-[var(--z-overlay)] bg-black/50",
                className
            )}
            {...props}
        />
    );
}

function DrawerContent({
    className,
    children,
    overlayClassName,
    ...props
}: React.ComponentProps<typeof DrawerPrimitive.Content> & {overlayClassName?: string}) {
    return (
        <DrawerPortal>
            <DrawerOverlay className={overlayClassName} />
            <DrawerPrimitive.Content
                data-slot="drawer-content"
                className={cn(
                    "bg-background fixed inset-x-0 bottom-0 z-[var(--z-modal)] mt-24 flex h-auto max-h-[96dvh] flex-col rounded-t-2xl border-t shadow-lg",
                    "data-[state=open]:animate-in data-[state=closed]:animate-out",
                    "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
                    "duration-500",
                    className
                )}
                {...props}
            >
                <div className="bg-muted mx-auto mt-4 h-1.5 w-12 shrink-0 rounded-full" />
                {children}
            </DrawerPrimitive.Content>
        </DrawerPortal>
    );
}

function DrawerHeader({className, ...props}: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="drawer-header"
            className={cn("flex flex-col gap-1.5 p-4 text-center sm:text-left", className)}
            {...props}
        />
    );
}

function DrawerFooter({className, ...props}: React.ComponentProps<"div">) {
    return <div data-slot="drawer-footer" className={cn("mt-auto flex flex-col gap-2 p-4", className)} {...props} />;
}

function DrawerTitle({className, ...props}: React.ComponentProps<typeof DrawerPrimitive.Title>) {
    return (
        <DrawerPrimitive.Title
            data-slot="drawer-title"
            className={cn("text-lg leading-none font-semibold", className)}
            {...props}
        />
    );
}

function DrawerDescription({className, ...props}: React.ComponentProps<typeof DrawerPrimitive.Description>) {
    return (
        <DrawerPrimitive.Description
            data-slot="drawer-description"
            className={cn("text-muted-foreground text-sm", className)}
            {...props}
        />
    );
}

export {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerOverlay,
    DrawerPortal,
    DrawerTitle,
    DrawerTrigger
};
