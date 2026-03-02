import {Suspense} from "react";
import {Await, useRouteLoaderData} from "react-router";
import {Drawer, DrawerContent} from "~/components/ui/drawer";
import {Sheet, SheetContent} from "~/components/ui/sheet";
import {useCartDrawer} from "~/hooks/useCartDrawer";
import {useIsMobile} from "~/hooks/useIsMobile";
import {CartMain, CartLoadingSkeleton} from "~/components/cart/CartMain";
import type {RootLoader} from "~/root";

export function CartAside() {
    const {isOpen, close} = useCartDrawer();
    const isMobile = useIsMobile();
    const rootData = useRouteLoaderData<RootLoader>("root");

    if (!rootData) return null;

    if (isMobile) {
        return (
            <Drawer open={isOpen} onOpenChange={(open: boolean) => !open && close()}>
                <DrawerContent className="cart-drawer cart-contrast-scope" overlayClassName="cart-overlay">
                    <div className="flex max-h-[80vh] flex-col overflow-hidden">
                        <Suspense fallback={<CartLoadingSkeleton />}>
                            <Await resolve={rootData.cart}>
                                {cartData => <CartMain cart={cartData} layout="aside" />}
                            </Await>
                        </Suspense>
                    </div>
                </DrawerContent>
            </Drawer>
        );
    }

    return (
        <Sheet open={isOpen} onOpenChange={open => !open && close()}>
            <SheetContent
                side="right"
                hideCloseButton
                overlayClassName="cart-overlay"
                className="cart-drawer cart-contrast-scope m-4 mr-0 flex max-h-[calc(100vh-2rem)] w-full max-w-md flex-col rounded-l-2xl shadow-2xl lg:max-w-lg xl:max-w-xl 2xl:max-w-2xl [&>button]:hidden"
            >
                <div className="flex flex-1 flex-col overflow-hidden">
                    <Suspense fallback={<CartLoadingSkeleton />}>
                        <Await resolve={rootData.cart}>{cartData => <CartMain cart={cartData} layout="aside" />}</Await>
                    </Suspense>
                </div>
            </SheetContent>
        </Sheet>
    );
}
