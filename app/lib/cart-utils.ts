import {useFetchers} from "react-router";

export const CART_FETCHER_KEY = "cart-mutation";

export function useCartMutationPending(): boolean {
    const fetchers = useFetchers();
    return fetchers.some(fetcher => fetcher.state !== "idle" && fetcher.formAction === "/cart");
}
