import {Suspense} from "react";
import {Await, useRouteLoaderData} from "react-router";
import {Drawer, DrawerContent, DrawerTitle, DrawerDescription} from "~/components/ui/drawer";
import {Sheet, SheetContent, SheetTitle, SheetDescription} from "~/components/ui/sheet";
import {useCartDrawer} from "~/hooks/useCartDrawer";
import {useIsMobile} from "~/hooks/useIsMobile";
import {CartMain, CartLoadingSkeleton} from "~/components/cart/CartMain";
import type {RootLoader} from "~/root";

/**
 * Responsive cart overlay: renders a bottom `Drawer` on mobile and a side `Sheet`
 * on desktop. Resolves the deferred `rootData.cart` promise with `<Await>` so the
 * cart contents stream in without blocking the page. Shows `CartLoadingSkeleton`
 * during the resolve.
 */
export function CartAside() {
    const {isOpen, close} = useCartDrawer();
    const isMobile = useIsMobile();
    const rootData = useRouteLoaderData<RootLoader>("root");

    if (!rootData) return null;

    if (isMobile) {
        return (
            <Drawer open={isOpen} onOpenChange={(open: boolean) => !open && close()}>
                <DrawerContent
                    className="cart-drawer border-0 shadow-none"
                    overlayClassName="bg-overlay-dark backdrop-blur-md"
                >
                    <DrawerTitle className="sr-only">Shopping Cart</DrawerTitle>
                    <DrawerDescription className="sr-only">Review and manage items in your cart</DrawerDescription>
                    <div className="flex h-[80dvh] flex-col overflow-hidden">
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
                overlayClassName="bg-overlay-dark backdrop-blur-md"
                className="cart-drawer m-4 mr-0 flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col rounded-l-2xl shadow-none border-0 lg:max-w-lg xl:max-w-xl 2xl:max-w-2xl [&>button]:hidden"
            >
                <SheetTitle className="sr-only">Shopping Cart</SheetTitle>
                <SheetDescription className="sr-only">Review and manage items in your cart</SheetDescription>
                <div className="flex flex-1 flex-col overflow-hidden">
                    <Suspense fallback={<CartLoadingSkeleton />}>
                        <Await resolve={rootData.cart}>{cartData => <CartMain cart={cartData} layout="aside" />}</Await>
                    </Suspense>
                </div>
            </SheetContent>
        </Sheet>
    );
}
