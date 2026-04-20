import {CartForm} from "@shopify/hydrogen";
import {useFetchers} from "react-router";

export const CART_FETCHER_KEY = "cart-mutation";

export function getCartLineKey(lineIds: string[]): string {
    return [CartForm.ACTIONS.LinesUpdate, ...lineIds].join("-");
}

export function useCartMutationPending(): boolean {
    const fetchers = useFetchers();
    return fetchers.some(fetcher => fetcher.state !== "idle" && fetcher.formAction === "/cart");
}

export function useCartLineMutating(lineId: string): boolean {
    const fetchers = useFetchers();
    const key = getCartLineKey([lineId]);
    return fetchers.some(f => f.state !== "idle" && f.key === key);
}
