import {useState, useEffect, useRef} from "react";
import {useFetcher} from "react-router";
import {CartForm, type OptimisticCartLineInput} from "@shopify/hydrogen";
import {ShoppingCart, Check, CalendarClock} from "lucide-react";
import {toast} from "sonner";
import {cn} from "~/lib/utils";
import {Button} from "~/components/ui/button";
import {ButtonSpinner} from "~/components/ui/button-spinner";
import {useCartDrawer} from "~/hooks/useCartDrawer";

type AddToCartButtonProps = {
    lines: Array<{merchandiseId: string; quantity: number; selectedVariant?: unknown; sellingPlanId?: string}>;
    disabled?: boolean;
    isPreorder?: boolean;
    className?: string;
};

/**
 * Inner button that reads the shared `"cart-mutation"` fetcher to track state.
 * `prevFetcherStateRef` detects the transition from a non-idle state back to idle
 * (i.e. the action completed) without triggering on the initial idle render.
 * On success: shows a "ADDED!" flash for 1.5s and opens the cart drawer.
 * On error/warning: shows a sonner toast with the server-returned message.
 */
const AddToCartButtonInner = ({
    disabled = false,
    isPreorder = false,
    className
}: Omit<AddToCartButtonProps, "lines">) => {
    const [justAdded, setJustAdded] = useState(false);
    const prevFetcherStateRef = useRef<string>("idle");
    const {open} = useCartDrawer();
    const fetcher = useFetcher({key: "cart-mutation"});
    const isAdding = fetcher.state !== "idle";

    useEffect(() => {
        if (prevFetcherStateRef.current !== "idle" && fetcher.state === "idle") {
            const {errors, warnings} = fetcher.data || {};

            if (errors?.length) {
                toast.error(errors[0].message);
                return;
            }

            if (warnings?.length) {
                warnings.forEach((warning: {message: string}) => {
                    toast.warning(warning.message);
                });
            }

            setJustAdded(true);
            open();
            const timer = setTimeout(() => setJustAdded(false), 1500);
            return () => clearTimeout(timer);
        }
        prevFetcherStateRef.current = fetcher.state;
    }, [fetcher.state, fetcher.data, open]);

    const buttonClass = cn(
        "sleek cta-primary-emphasis w-full",
        justAdded && "border-success bg-success text-success-foreground hover:border-success hover:bg-success/90",
        className
    );

    const Icon = isPreorder ? CalendarClock : ShoppingCart;

    return (
        <Button type="submit" className={buttonClass} size="lg" disabled={disabled || isAdding}>
            {isAdding ? (
                <ButtonSpinner />
            ) : justAdded ? (
                <>
                    <div className="animate-pulse">
                        <Check className="mr-2 h-4 w-4" />
                    </div>
                    ADDED!
                </>
            ) : (
                <>
                    <Icon className="mr-1 h-4 w-4 font-semibold" />
                    <span className="font-semibold">{isPreorder ? "PRE ORDER" : "ADD TO CART"}</span>
                </>
            )}
        </Button>
    );
};

export const AddToCartButton = ({lines, disabled = false, isPreorder = false, className}: AddToCartButtonProps) => {
    return (
        <CartForm
            fetcherKey="cart-mutation"
            route="/cart"
            inputs={{lines: lines as OptimisticCartLineInput[]}}
            action={CartForm.ACTIONS.LinesAdd}
        >
            <AddToCartButtonInner disabled={disabled} isPreorder={isPreorder} className={className} />
        </CartForm>
    );
};
