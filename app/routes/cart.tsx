import {data, type HeadersFunction} from "react-router";
import type {Route} from "./+types/cart";
import type {CartQueryDataReturn} from "@shopify/hydrogen";
import {CartForm} from "@shopify/hydrogen";
import {RouteErrorBoundary} from "~/components/RouteErrorBoundary";

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

    // TODO: Checkout MCP integration — implement when GA
    // Docs: https://shopify.dev/docs/agents/checkout/mcp
    // Gate: Shopify limited-partner preview as of 2026-04.
    //       No logic changes required here — Checkout MCP operates via a separate MCP
    //       server endpoint, not via CartForm. Cart permalinks (checkout URLs) are the
    //       current bridge between AI agents and Shopify checkout.
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

export async function loader({context, request}: Route.LoaderArgs) {
    const {cart} = context;
    if (request.headers.get("Accept")?.includes("text/html")) {
        return new Response(null, {status: 302, headers: {Location: "/"}});
    }
    return await cart.get();
}

export {RouteErrorBoundary as ErrorBoundary};
