import {useState, useEffect} from "react";
import {type FetcherWithComponents} from "react-router";
import {CartForm, type OptimisticCartLineInput} from "@shopify/hydrogen";
import {Zap} from "lucide-react";
import {cn} from "~/lib/utils";
import {Button} from "~/components/ui/button";
import {ButtonSpinner} from "~/components/ui/button-spinner";

type BuyNowButtonProps = {
    lines: Array<{merchandiseId: string; quantity: number; selectedVariant?: any; sellingPlanId?: string}>;
    disabled?: boolean;
    className?: string;
};

/**
 * "Buy Now" variant of the add-to-cart form. Submits to `/cart` with a hidden
 * `redirectTo=__checkout_url__` field which the cart action interprets as a
 * signal to redirect to the Shopify checkout URL after adding the line.
 * Handles bfcache restoration: when the user navigates back from checkout,
 * the fetcher can be frozen in a non-idle state; the `pageshow` listener resets
 * `forceIdle` so the button renders as available rather than stuck in "Processing...".
 */
export const BuyNowButton = ({lines, disabled = false, className}: BuyNowButtonProps) => {
    // When the browser restores this page from bfcache (back/forward navigation from checkout),
    // the fetcher with fetcherKey="buy-now" can be frozen in a non-idle state. We override it
    // back to idle on pageshow so the button doesn't appear stuck in "Processing...".
    const [forceIdle, setForceIdle] = useState(false);

    useEffect(() => {
        const onPageShow = (e: PageTransitionEvent) => {
            if (e.persisted) setForceIdle(true);
        };
        window.addEventListener("pageshow", onPageShow);
        return () => window.removeEventListener("pageshow", onPageShow);
    }, []);

    return (
        <CartForm
            fetcherKey="buy-now"
            route="/cart"
            inputs={{lines: lines as OptimisticCartLineInput[]}}
            action={CartForm.ACTIONS.LinesAdd}
        >
            {(fetcher: FetcherWithComponents<any>) => {
                const isLoading = !forceIdle && fetcher.state !== "idle";
                return (
                    <>
                        <input type="hidden" name="redirectTo" value="__checkout_url__" />
                        <Button
                            type="submit"
                            variant="secondary"
                            className={cn("sleek cta-enhanced w-full", className)}
                            size="lg"
                            disabled={disabled || isLoading}
                            onClick={() => setForceIdle(false)}
                        >
                            {isLoading ? (
                                <ButtonSpinner />
                            ) : (
                                <>
                                    <Zap className="mr-1 h-4 w-4 font-semibold" />
                                    <span className="font-semibold">BUY NOW</span>
                                </>
                            )}
                        </Button>
                    </>
                );
            }}
        </CartForm>
    );
};
