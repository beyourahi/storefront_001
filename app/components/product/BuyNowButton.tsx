import {useState, useEffect} from "react";
import {type FetcherWithComponents} from "react-router";
import {CartForm, type OptimisticCartLineInput} from "@shopify/hydrogen";
import {Zap} from "lucide-react";
import {cn} from "~/lib/utils";
import {Button} from "~/components/ui/button";
import {Spinner} from "~/components/ui/spinner";

type BuyNowButtonProps = {
    lines: Array<{merchandiseId: string; quantity: number; selectedVariant?: any; sellingPlanId?: string}>;
    disabled?: boolean;
    className?: string;
};

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
                                <>
                                    <Spinner className="mr-2 h-4 w-4" />
                                    Processing...
                                </>
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
