import {redirect} from "react-router";
import type {Route} from "./+types/cart.$lines";

export const meta: Route.MetaFunction = () => [
    {title: "Redirecting..."},
    {name: "robots", content: "noindex"}
];

export const loader = async ({request, context, params}: Route.LoaderArgs) => {
    const {cart} = context;
    const {lines} = params;

    if (!lines) return redirect("/");

    // Validate and filter cart line entries — only allow numeric variant IDs and positive integer quantities
    const linesMap = lines
        .split(",")
        .map(line => {
            const lineDetails = line.split(":");
            const variantId = lineDetails[0];
            const quantity = parseInt(lineDetails[1], 10);

            // Variant ID must be numeric only, quantity must be a positive integer
            if (!/^\d+$/.test(variantId) || !Number.isInteger(quantity) || quantity < 1) {
                return null;
            }

            return {
                merchandiseId: `gid://shopify/ProductVariant/${variantId}`,
                quantity
            };
        })
        .filter((line): line is NonNullable<typeof line> => line !== null);

    // If all lines were invalid, redirect to homepage
    if (linesMap.length === 0) return redirect("/");

    const url = new URL(request.url);
    const searchParams = new URLSearchParams(url.search);

    const discount = searchParams.get("discount");
    const discountArray = discount ? [discount] : [];

    const result = await cart.create({
        lines: linesMap,
        discountCodes: discountArray
    });

    const cartResult = result.cart;

    if (result.errors?.length || !cartResult) {
        throw new Response("Link may be expired. Try checking the URL.", {
            status: 410
        });
    }

    const headers = cart.setCartId(cartResult.id);

    if (cartResult.checkoutUrl) {
        return redirect(cartResult.checkoutUrl, {headers});
    } else {
        throw new Error("No checkout URL found");
    }
};

export default function Component() {
    return null;
}

export {RouteErrorBoundary as ErrorBoundary} from "~/components/RouteErrorBoundary";
