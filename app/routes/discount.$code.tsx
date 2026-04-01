import {redirect} from "react-router";
import type {Route} from "./+types/discount.$code";

export const meta: Route.MetaFunction = () => [
    {title: "Redirecting..."},
    {name: "robots", content: "noindex"}
];

export const loader = async ({request, context, params}: Route.LoaderArgs) => {
    const {cart} = context;
    const {code} = params;

    const url = new URL(request.url);
    const searchParams = new URLSearchParams(url.search);
    let redirectParam = searchParams.get("redirect") || searchParams.get("return_to") || "/";

    try {
        const parsed = new URL(redirectParam, request.url);
        const requestOrigin = new URL(request.url).origin;
        if (parsed.origin !== requestOrigin) {
            redirectParam = "/";
        }
    } catch {
        redirectParam = "/";
    }

    searchParams.delete("redirect");
    searchParams.delete("return_to");

    const redirectUrl = `${redirectParam}?${searchParams}`;

    if (!code) {
        return redirect(redirectUrl);
    }

    const result = await cart.updateDiscountCodes([code]);
    const headers = cart.setCartId(result.cart.id);

    // Append feedback param so the destination page can show a notification
    const finalUrl = new URL(redirectUrl, request.url);
    const appliedCodes = result.cart.discountCodes?.filter((d: {applicable: boolean}) => d.applicable);
    if (appliedCodes && appliedCodes.length > 0) {
        finalUrl.searchParams.set("discount_applied", code);
    } else {
        finalUrl.searchParams.set("discount_error", "invalid");
    }

    return redirect(finalUrl.pathname + finalUrl.search, {
        status: 303,
        headers
    });
};

export {RouteErrorBoundary as ErrorBoundary} from "~/components/RouteErrorBoundary";
