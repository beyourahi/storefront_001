import {CartForm} from "@shopify/hydrogen";
import {useFetchers} from "react-router";

/** Fetcher key used to scope cart mutation fetchers for state tracking. */
export const CART_FETCHER_KEY = "cart-mutation";

/**
 * Build a stable fetcher key for a set of cart line update mutations.
 * The key is scoped to the LinesUpdate action + line IDs so concurrent
 * mutations on different lines remain distinct.
 */
export function getCartLineKey(lineIds: string[]): string {
    return [CartForm.ACTIONS.LinesUpdate, ...lineIds].join("-");
}

/**
 * Returns true while any cart mutation fetcher is in flight.
 * Use to disable global cart UI (checkout button, total display, etc.)
 * during any in-progress add/update/remove operation.
 */
export function useCartMutationPending(): boolean {
    const fetchers = useFetchers();
    return fetchers.some(fetcher => fetcher.state !== "idle" && fetcher.formAction === "/cart");
}

/**
 * Returns true while the update mutation for a specific cart line is in flight.
 * Use to disable per-line controls (quantity selector, remove button) while that
 * line is being mutated, without blocking unrelated lines.
 */
export function useCartLineMutating(lineId: string): boolean {
    const fetchers = useFetchers();
    const key = getCartLineKey([lineId]);
    return fetchers.some(f => f.state !== "idle" && f.key === key);
}
