/**
 * @fileoverview CheckoutKitEmbed — Shopify checkout button (popup mode).
 *
 * Current implementation: styled anchor that navigates to `checkoutUrl`.
 * This is the production-correct fallback per Phase 4 Open Risk #1:
 * `@shopify/checkout-kit` is NOT publicly available on npm (404 as of 2026-04,
 * limited-partner preview only). When the package ships publicly, upgrade path is:
 *   1. `npm install @shopify/checkout-kit`
 *   2. Replace the anchor body with the web-component pattern below
 *
 * Web-component upgrade pattern (do NOT enable until package is on npm):
 * ```tsx
 * import("@shopify/checkout-kit").then(({Checkout}) => {
 *     if (!customElements.get("shopify-checkout")) {
 *         customElements.define("shopify-checkout", Checkout);
 *     }
 * });
 * // Render: <shopify-checkout ref={ref} /> + click handler → ref.current.open()
 * ```
 *
 * @usage
 * ```tsx
 * <CheckoutKitEmbed checkoutUrl={taggedUrl} className="..." disabled={isMutating}>
 *     <CreditCard className="h-4 w-4" />
 *     Checkout - $49.00
 * </CheckoutKitEmbed>
 * ```
 */

import {useEffect} from "react";
import {cn} from "~/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CheckoutKitEmbedProps {
    /** Fully-qualified Shopify checkout URL (may include UTM params). */
    checkoutUrl: string;
    /** Additional CSS classes forwarded to the anchor element. */
    className?: string;
    /** Button label / icon content rendered inside the trigger. */
    children: React.ReactNode;
    /** When true the trigger is rendered in a visually-disabled state. */
    disabled?: boolean;
    /**
     * Checkout presentation mode.
     * - `"popup"` (default) — navigates to checkout (popup upgrade when package ships).
     * - `"new-tab"` — opens checkout in a new tab.
     */
    mode?: "popup" | "inline" | "new-tab";
    /**
     * When true the checkout URL is opened automatically on mount.
     * Used by the Buy Now flow where the URL resolves asynchronously.
     */
    autoOpen?: boolean;
    /** Reserved for future use when checkout:complete event integration ships. */
    onComplete?: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CheckoutKitEmbed({
    checkoutUrl,
    className,
    children,
    disabled = false,
    mode = "popup",
    autoOpen = false
}: CheckoutKitEmbedProps) {
    // Buy Now flow: navigate to checkout once the URL is available.
    useEffect(() => {
        if (!autoOpen || !checkoutUrl) return;
        window.location.href = checkoutUrl;
    }, [autoOpen, checkoutUrl]);

    return (
        <a
            href={checkoutUrl}
            target={mode === "new-tab" ? "_blank" : "_self"}
            rel={mode === "new-tab" ? "noopener noreferrer" : undefined}
            aria-disabled={disabled || undefined}
            onClick={disabled ? e => e.preventDefault() : undefined}
            className={cn(disabled && "pointer-events-none cursor-not-allowed opacity-50", className)}
        >
            {children}
        </a>
    );
}
