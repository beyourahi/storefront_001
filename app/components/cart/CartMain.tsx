import {useOptimisticCart} from "@shopify/hydrogen";
import type {CartApiQueryFragment} from "storefrontapi.generated";
import {Link} from "react-router";
import {createPortal} from "react-dom";
import {useAgentSurface} from "~/lib/agent-surface-context";
import {ShoppingCart} from "lucide-react";
import {Button} from "~/components/ui/button";
import {Skeleton} from "~/components/ui/skeleton";
import {useCartDrawer} from "~/hooks/useCartDrawer";
import {CartLineItem} from "~/components/cart/CartLineItem";
import {CartSummary} from "~/components/cart/CartSummary";
import {CartSuggestions} from "~/components/cart/CartSuggestions";
import {AgentArrivalBanner} from "~/components/cart/AgentArrivalBanner";
import {AgentCartView} from "~/components/cart/AgentCartView";
import {useCartMutationPending} from "~/lib/cart-utils";

// Renders a fixed, full-viewport overlay via portal when any cart mutation is
// in-flight. Escape-hatches the Sheet's stacking context (which has active CSS
// transitions that can trap fixed children) by appending directly to document.body.
function CartMutationOverlay() {
    const isMutating = useCartMutationPending();
    if (!isMutating || typeof document === "undefined") return null;
    return createPortal(<div className="fixed inset-0 z-[101] cursor-wait" aria-hidden="true" />, document.body);
}

/**
 * Core cart view that adapts to agent vs. human context.
 * Agent requests receive `AgentCartView` (compact monochrome with JSON-LD).
 * Human users see the full cart with line items, upsell carousel, and summary.
 * Applies `useOptimisticCart` so UI updates immediately before the server confirms.
 */
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

    // Detect agent context — covers both permalink arrivals and active MCP sessions.
    const agentSurface = useAgentSurface();
    const isAgent = agentSurface.isAgent;
    const isAgentCart = agentSurface.source === "permalink";

    if (isEmpty) {
        return (
            <div className="flex h-full min-h-0 flex-col">
                <CartAsideHeader lineCount={0} totalQuantity={0} />
                <CartEmpty />
            </div>
        );
    }

    // Agent path: compact monochrome view with JSON-LD, no upsell carousel.
    if (isAgent && cart) {
        return <AgentCartView cart={cart} />;
    }

    return (
        <div className="flex h-full min-h-0 flex-col">
            <CartMutationOverlay />
            <CartAsideHeader lineCount={cart?.lines?.nodes?.length ?? 0} totalQuantity={cart?.totalQuantity ?? 0} />

            <div className="flex min-h-0 flex-1 flex-col">
                <div className="min-h-0 overflow-y-auto px-4 md:px-6" data-lenis-prevent>
                    <div className="space-y-4 py-4">
                        {/*
                         * AgentArrivalBanner — shown when buyer arrived via an AI agent's cart link.
                         * Session-scoped, dismissible. Only shown on the human cart path (agents see AgentCartView).
                         */}
                        {isAgentCart && <AgentArrivalBanner />}

                        {(cart?.lines?.nodes ?? []).map(line => (
                            <CartLineItem key={line.id} line={line} />
                        ))}
                    </div>
                </div>

                <div className="mt-auto shrink-0 px-4 md:px-6">
                    <CartSuggestions cartLines={cart?.lines?.nodes ?? []} />
                </div>
            </div>

            <CartSummary cart={cart} />
        </div>
    );
}

function CartAsideHeader({lineCount, totalQuantity}: {lineCount: number; totalQuantity: number}) {
    const label =
        totalQuantity === lineCount
            ? `${totalQuantity} ${totalQuantity === 1 ? "item" : "items"}`
            : `${lineCount} ${lineCount === 1 ? "product" : "products"} (${totalQuantity} items)`;

    return (
        <div className="shrink-0 px-4 py-2 md:px-6">
            <div className="flex items-center justify-between">
                <h2 className="text-foreground text-lg font-semibold">Cart</h2>
                <p className="text-muted-foreground text-sm">{label}</p>
            </div>
        </div>
    );
}

function CartEmpty() {
    const {close} = useCartDrawer();

    return (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
            <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
                <div className="bg-primary/10 mb-4 rounded-full p-4 shadow-sm backdrop-blur-sm">
                    <ShoppingCart className="text-primary h-8 w-8" />
                </div>
                <h3 className="mb-2 text-lg font-semibold md:text-lg lg:text-xl">Nothing here yet</h3>
                <p className="text-muted-foreground mb-6 text-sm">Add some of our awesome products!</p>
                <Link to="/collections/all-products" prefetch="viewport" onClick={close}>
                    <Button className="gap-2 leading-none">Keep Shopping</Button>
                </Link>
            </div>

            <div className="mt-auto shrink-0 px-4 md:px-6">
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
                        <div key={i} className="bg-card rounded-lg p-4">
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
                    <div className="pt-6">
                        <Skeleton className="mb-4 h-6 w-32" />
                        <Skeleton className="mb-2 h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                </div>
            </div>
        </div>
    );
}
