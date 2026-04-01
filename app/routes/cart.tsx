import {data, type HeadersFunction, useLoaderData, Await, Link} from "react-router";
import {Suspense} from "react";
import type {Route} from "./+types/cart";
import type {CartQueryDataReturn, OptimisticCart} from "@shopify/hydrogen";
import {CartForm, useOptimisticCart} from "@shopify/hydrogen";
import type {CartApiQueryFragment} from "storefrontapi.generated";
import {ShoppingCart} from "lucide-react";
import {Button} from "~/components/ui/button";
import {Skeleton} from "~/components/ui/skeleton";
import {CartLineItem} from "~/components/cart/CartLineItem";
import {CartSuggestions} from "~/components/cart/CartSuggestions";
import {CartSummary} from "~/components/cart/CartSummary";

export const meta: Route.MetaFunction = () => [
    {title: "Cart"},
    {name: "robots", content: "noindex"}
];

export const headers: HeadersFunction = ({actionHeaders}) => actionHeaders;

export const action = async ({request, context}: Route.ActionArgs) => {
    const {cart} = context;

    const formData = await request.formData();

    const {action, inputs} = CartForm.getFormInput(formData);

    if (!action) {
        throw new Error("No action provided");
    }

    let status = 200;
    let result: CartQueryDataReturn;

    switch (action) {
        case CartForm.ACTIONS.LinesAdd:
            result = await cart.addLines(inputs.lines);
            break;
        case CartForm.ACTIONS.LinesUpdate:
            result = await cart.updateLines(inputs.lines);
            break;
        case CartForm.ACTIONS.LinesRemove:
            result = await cart.removeLines(inputs.lineIds);
            break;
        case CartForm.ACTIONS.BuyerIdentityUpdate: {
            result = await cart.updateBuyerIdentity({
                ...inputs.buyerIdentity
            });
            break;
        }
        case CartForm.ACTIONS.NoteUpdate: {
            const note = String(formData.get("note") || "");
            result = await cart.updateNote(note);
            break;
        }
        case CartForm.ACTIONS.DiscountCodesUpdate: {
            const formDiscountCode = inputs.discountCode;

            const discountCodes = (formDiscountCode ? [formDiscountCode] : []) as string[];

            discountCodes.push(...inputs.discountCodes);

            result = await cart.updateDiscountCodes(discountCodes);
            break;
        }
        case CartForm.ACTIONS.GiftCardCodesUpdate: {
            const formGiftCardCode = inputs.giftCardCode;

            const giftCardCodes = (formGiftCardCode ? [formGiftCardCode] : []) as string[];

            giftCardCodes.push(...inputs.giftCardCodes);

            result = await cart.updateGiftCardCodes(giftCardCodes);
            break;
        }
        case CartForm.ACTIONS.GiftCardCodesAdd: {
            const giftCardCodes = inputs.giftCardCodes as string[];
            result = await cart.addGiftCardCodes(giftCardCodes);
            break;
        }
        case CartForm.ACTIONS.GiftCardCodesRemove: {
            const appliedGiftCardIds = inputs.giftCardCodes as string[];
            result = await cart.removeGiftCardCodes(appliedGiftCardIds);
            break;
        }
        default:
            throw new Error(`${action} cart action is not defined`);
    }

    const cartId = result?.cart?.id;
    const headers = cartId ? cart.setCartId(result.cart.id) : new Headers();
    const {cart: cartResult, errors, warnings} = result;

    // Validate redirectTo to prevent open redirect attacks.
    // Only allow: the special "__checkout_url__" token, or relative paths starting with "/"
    // (but not "//" which is a protocol-relative URL). Reject external URLs, javascript:, data:, etc.
    const redirectTo = formData.get("redirectTo") ?? null;
    if (typeof redirectTo === "string") {
        let destination: string | null = null;

        if (redirectTo === "__checkout_url__") {
            destination = cartResult?.checkoutUrl ?? null;
        } else if (redirectTo.startsWith("/") && !redirectTo.startsWith("//")) {
            destination = redirectTo;
        }
        // All other values (external URLs, javascript:, data:, etc.) are silently ignored

        if (destination) {
            status = 303;
            headers.set("Location", destination);
        }
    }

    return data(
        {
            cart: cartResult,
            errors,
            warnings,
            analytics: {
                cartId
            }
        },
        {status, headers}
    );
};

export const loader = async ({context}: Route.LoaderArgs) => {
    const {cart} = context;
    return await cart.get();
};

export default function Cart() {
    const cartPromise = useLoaderData<typeof loader>();

    return (
        <div className="min-h-[70dvh] bg-background">
            <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">
                <h1 className="mb-8 font-serif text-3xl font-medium tracking-tight text-foreground md:text-4xl">
                    Shopping Cart
                </h1>

                <Suspense fallback={<CartPageLoadingSkeleton />}>
                    <Await resolve={cartPromise}>{cart => <CartPageContent cart={cart} />}</Await>
                </Suspense>
            </div>
        </div>
    );
}

function CartPageContent({cart}: {cart: Awaited<ReturnType<typeof loader>>}) {
    const optimisticCart = useOptimisticCart(cart);
    const linesCount = optimisticCart?.lines?.nodes?.length ?? 0;
    const isEmpty = linesCount === 0;

    if (isEmpty) {
        return <EmptyCartPage />;
    }

    return (
        <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
            {/* Cart Items */}
            <div className="space-y-4">
                {(optimisticCart?.lines?.nodes ?? []).map(line => (
                    <CartLineItem key={line.id} line={line} />
                ))}
            </div>

            {/* Cart Summary Sidebar */}
            <div className="lg:sticky lg:top-[calc(var(--total-header-height)+2rem)] lg:self-start">
                <div className="rounded-lg border bg-card overflow-hidden">
                    <div className="px-6 py-4 border-b">
                        <h3 className="text-lg font-semibold">Order Summary</h3>
                        <p className="text-muted-foreground text-sm mt-1">
                            {optimisticCart.totalQuantity ?? 0} {optimisticCart.totalQuantity === 1 ? "item" : "items"}
                        </p>
                    </div>
                    <CartSummary cart={optimisticCart as OptimisticCart<CartApiQueryFragment>} />
                </div>

                <div className="mt-6">
                    <CartSuggestions cartLines={optimisticCart?.lines?.nodes ?? []} />
                </div>
            </div>
        </div>
    );
}

function EmptyCartPage() {
    return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center px-6 py-12 text-center">
            <div className="bg-primary/10 mb-4 rounded-full p-4 shadow-sm backdrop-blur-sm">
                <ShoppingCart className="text-primary h-8 w-8" />
            </div>
            <h2 className="mb-3 text-xl font-semibold lg:text-2xl">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6 max-w-md text-sm">
                Looks like you haven&apos;t added anything yet.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                <Button asChild size="lg">
                    <Link to="/collections/all-products">Browse All Products</Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                    <Link to="/">Back to Home</Link>
                </Button>
            </div>
        </div>
    );
}

function CartPageLoadingSkeleton() {
    return (
        <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
            <div className="space-y-4">
                {[0, 1, 2].map(i => (
                    <div key={i} className="rounded-lg border bg-card p-4">
                        <div className="flex gap-4">
                            <Skeleton className="aspect-square w-24" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-5 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                                <div className="flex items-center justify-between pt-2">
                                    <Skeleton className="h-9 w-28" />
                                    <Skeleton className="h-9 w-9" />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="rounded-lg border bg-card p-6">
                <Skeleton className="mb-6 h-6 w-32" />
                <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            </div>
        </div>
    );
}

export {RouteErrorBoundary as ErrorBoundary} from "~/components/RouteErrorBoundary";
