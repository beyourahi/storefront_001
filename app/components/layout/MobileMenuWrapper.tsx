import type {ReactNode} from "react";
import {Drawer, DrawerContent, DrawerTitle} from "~/components/ui/drawer";

type MobileMenuWrapperProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    children: ReactNode;
};

export const MobileMenuWrapper = ({open, onOpenChange, children}: MobileMenuWrapperProps) => {
    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent
                className="flex max-h-[70vh] flex-col"
                overlayClassName="bg-overlay-dark backdrop-blur-md"
                id="mobile-menu"
            >
                <DrawerTitle className="sr-only">Menu</DrawerTitle>
                {children}
            </DrawerContent>
        </Drawer>
    );
};
