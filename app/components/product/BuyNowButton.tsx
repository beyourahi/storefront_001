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
    return (
        <CartForm
            fetcherKey="buy-now"
            route="/cart"
            inputs={{lines: lines as OptimisticCartLineInput[]}}
            action={CartForm.ACTIONS.LinesAdd}
        >
            {(fetcher: FetcherWithComponents<any>) => (
                <>
                    <input type="hidden" name="redirectTo" value="/checkout" />
                    <Button
                        type="submit"
                        variant="secondary"
                        className={cn("sleek cta-enhanced w-full", className)}
                        size="lg"
                        disabled={disabled || fetcher.state !== "idle"}
                    >
                        {fetcher.state !== "idle" ? (
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
            )}
        </CartForm>
    );
};
