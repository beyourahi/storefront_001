import type {ReactNode} from "react";
import {Drawer, DrawerContent} from "~/components/ui/drawer";

type MobileMenuWrapperProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    children: ReactNode;
};

export const MobileMenuWrapper = ({open, onOpenChange, children}: MobileMenuWrapperProps) => {
    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="flex h-[70vh] flex-col" overlayClassName="cart-overlay" id="mobile-menu">
                <h2 className="sr-only">Menu</h2>
                {children}
            </DrawerContent>
        </Drawer>
    );
};
