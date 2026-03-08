import {useOptimisticCart} from "@shopify/hydrogen";
import type {CartApiQueryFragment} from "storefrontapi.generated";
import {Link} from "react-router";
import {ShoppingCart} from "lucide-react";
import {Button} from "~/components/ui/button";
import {Skeleton} from "~/components/ui/skeleton";
import {useCartDrawer} from "~/hooks/useCartDrawer";
import {CartLineItem} from "~/components/cart/CartLineItem";
import {CartSummary} from "~/components/cart/CartSummary";
import {CartSuggestions} from "~/components/cart/CartSuggestions";

export function CartMain({
    cart: originalCart,
    layout: _layout
}: {
    cart: CartApiQueryFragment | null;
    layout: "aside" | "page";
}) {
    const cart = useOptimisticCart(originalCart as CartApiQueryFragment);
    const linesCount = cart?.lines?.nodes?.length ?? 0;
    const isEmpty = linesCount === 0;

    if (isEmpty) {
        return (
            <div className="flex h-full flex-col">
                <CartAsideHeader itemCount={0} />
                <CartEmpty />
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col">
            <CartAsideHeader itemCount={cart?.totalQuantity ?? 0} />

            <div className="flex-1 overflow-y-auto px-4 md:px-6" data-lenis-prevent>
                <div className="space-y-4 py-4">
                    {(cart?.lines?.nodes ?? []).map(line => (
                        <CartLineItem key={line.id} line={line} />
                    ))}
                </div>
            </div>

            <div className="px-4 md:px-6">
                <CartSuggestions cartLines={cart?.lines?.nodes ?? []} />
            </div>

            <CartSummary cart={cart} />
        </div>
    );
}

function CartAsideHeader({itemCount}: {itemCount: number}) {
    return (
        <div className="border-b px-4 py-2 md:px-6">
            <div className="flex items-center justify-between">
                <h2 className="text-foreground text-lg font-semibold">Cart</h2>
                <p className="text-muted-foreground text-sm">
                    {itemCount} {itemCount === 1 ? "item" : "items"}
                </p>
            </div>
        </div>
    );
}

function CartEmpty() {
    const {close} = useCartDrawer();

    return (
        <div className="flex-1 overflow-y-auto">
            <div className="flex h-full flex-col items-center justify-center px-6 py-12 text-center">
                <div className="bg-primary/10 mb-4 rounded-full p-4 shadow-sm backdrop-blur-sm">
                    <ShoppingCart className="text-primary h-8 w-8" />
                </div>
                <h3 className="mb-2 text-lg font-semibold md:text-lg lg:text-xl">Nothing here yet</h3>
                <p className="text-muted-foreground mb-6 text-sm">Add some of our awesome products!</p>
                <Link viewTransition to="/collections/all-products" prefetch="viewport" onClick={close}>
                    <Button className="gap-2 leading-none">Keep Shopping</Button>
                </Link>
            </div>

            <div className="px-4 md:px-6">
                <CartSuggestions cartLines={[]} />
            </div>
        </div>
    );
}

export function CartLoadingSkeleton() {
    return (
        <div className="h-full overflow-y-auto">
            <div className="px-6 py-4">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-4 w-16" />
                    </div>
                    {[0, 1, 2].map(i => (
                        <div key={i} className="bg-card rounded-lg border p-4">
                            <div className="flex gap-3">
                                <Skeleton className="aspect-square w-16" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-3 w-1/2" />
                                    <div className="flex items-center justify-between">
                                        <Skeleton className="h-8 w-24" />
                                        <Skeleton className="h-8 w-8" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    <div className="border-t pt-6">
                        <Skeleton className="mb-4 h-6 w-32" />
                        <Skeleton className="mb-2 h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                </div>
            </div>
        </div>
    );
}
