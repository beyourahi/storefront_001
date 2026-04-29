import {useEffect, useRef} from "react";
import type {OptimisticCart} from "@shopify/hydrogen";
import type {CartApiQueryFragment} from "storefrontapi.generated";
import {useCartMutationPending} from "~/lib/cart-utils";
import {formatShopifyMoney} from "~/lib/currency-formatter";
import {CheckoutKitEmbed} from "~/components/checkout/CheckoutKitEmbed";
import {Bot, ArrowRight} from "lucide-react";

type Cart = OptimisticCart<CartApiQueryFragment>;
type CartLine = Cart["lines"]["nodes"][number];

// JSON-LD injected via ref.textContent to avoid dangerouslySetInnerHTML.
// type="application/ld+json" does not execute as JavaScript.
function useCartJsonLd(lines: CartLine[], checkoutUrl?: string) {
    const scriptRef = useRef<HTMLScriptElement | null>(null);

    useEffect(() => {
        const jsonLd = {
            "@context": "https://schema.org",
            "@type": "ItemList",
            "name": "Cart",
            ...(checkoutUrl ? {url: checkoutUrl} : {}),
            "numberOfItems": lines.length,
            "itemListElement": lines.map((line, i) => ({
                "@type": "ListItem",
                "position": i + 1,
                "item": {
                    "@type": "Product",
                    "name": line.merchandise.product.title,
                    "url": `/products/${line.merchandise.product.handle}`,
                    ...(line.merchandise.image?.url ? {image: line.merchandise.image.url} : {}),
                    "offers": {
                        "@type": "Offer",
                        "price": line.cost.amountPerQuantity.amount,
                        "priceCurrency": line.cost.amountPerQuantity.currencyCode,
                        "availability": line.merchandise.availableForSale
                            ? "https://schema.org/InStock"
                            : "https://schema.org/OutOfStock"
                    },
                    "additionalProperty": line.merchandise.selectedOptions.map(o => ({
                        "@type": "PropertyValue",
                        "name": o.name,
                        "value": o.value
                    }))
                },
                "quantity": line.quantity
            }))
        };

        // Remove stale script tag from previous render, then inject fresh one.
        const existing = document.getElementById("agent-cart-ld");
        if (existing) existing.remove();

        const el = document.createElement("script");
        el.id = "agent-cart-ld";
        el.type = "application/ld+json";
        el.textContent = JSON.stringify(jsonLd);
        document.head.appendChild(el);
        scriptRef.current = el;

        return () => {
            scriptRef.current?.remove();
        };
    // Stringify as stable dep — re-inject if cart contents change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lines.length, checkoutUrl]);
}

export function AgentCartView({cart}: {cart: Cart}) {
    const lines = cart.lines?.nodes ?? [];
    const subtotal = cart.cost?.subtotalAmount;
    const checkoutUrl = cart.checkoutUrl;
    const isMutating = useCartMutationPending();

    useCartJsonLd(lines, checkoutUrl);

    return (
        <div className="min-h-screen bg-background font-mono text-foreground">
            <div className="mx-auto max-w-2xl px-4 py-10">
                {/* Header */}
                <div className="mb-8 flex items-center gap-2 border-b border-border pb-4">
                    <Bot className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                        Agent Cart View
                    </span>
                    <span className="ml-auto text-[11px] text-muted-foreground">
                        {lines.length} {lines.length === 1 ? "item" : "items"}
                    </span>
                </div>

                {/* Line items — dense monochrome table */}
                <div className="border border-border">
                    <div className="grid grid-cols-12 border-b border-border bg-muted/30 px-3 py-1.5">
                        <span className="col-span-6 text-[10px] uppercase tracking-widest text-muted-foreground">Product</span>
                        <span className="col-span-2 text-center text-[10px] uppercase tracking-widest text-muted-foreground">Qty</span>
                        <span className="col-span-2 text-right text-[10px] uppercase tracking-widest text-muted-foreground">Unit</span>
                        <span className="col-span-2 text-right text-[10px] uppercase tracking-widest text-muted-foreground">Total</span>
                    </div>

                    {lines.map(line => {
                        const variantLabel =
                            line.merchandise.title !== "Default Title"
                                ? line.merchandise.title
                                : line.merchandise.selectedOptions
                                      .map(o => o.value)
                                      .join(" / ");
                        return (
                            <div
                                key={line.id}
                                className="grid grid-cols-12 items-center border-b border-border/50 px-3 py-2.5 last:border-b-0"
                            >
                                <div className="col-span-6 min-w-0 pr-3">
                                    <div className="truncate text-xs font-medium">
                                        {line.merchandise.product.title}
                                    </div>
                                    {variantLabel && (
                                        <div className="truncate text-[10px] text-muted-foreground">
                                            {variantLabel}
                                        </div>
                                    )}
                                </div>
                                <div className="col-span-2 text-center text-xs">{line.quantity}</div>
                                <div className="col-span-2 text-right text-xs">
                                    {formatShopifyMoney(line.cost.amountPerQuantity)}
                                </div>
                                <div className="col-span-2 text-right text-xs font-semibold">
                                    {formatShopifyMoney(line.cost.totalAmount)}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Subtotal */}
                <div className="border-x border-b border-border">
                    <div className="flex items-center justify-between px-3 py-2.5">
                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                            Subtotal
                        </span>
                        <span className="text-sm font-semibold tabular-nums">
                            {subtotal ? formatShopifyMoney(subtotal) : "—"}
                        </span>
                    </div>
                </div>

                {/* Checkout CTA */}
                {checkoutUrl && (
                    <div className="mt-6">
                        <CheckoutKitEmbed
                            checkoutUrl={checkoutUrl}
                            disabled={isMutating}
                            mode="popup"
                            className="flex w-full items-center justify-center gap-2 bg-foreground py-4 text-sm font-semibold tracking-wide text-background transition-opacity hover:opacity-90 disabled:opacity-40"
                        >
                            Proceed to Checkout
                            <ArrowRight className="h-4 w-4" />
                        </CheckoutKitEmbed>
                    </div>
                )}

                {/* Plaintext checkout URL for agents that parse body text */}
                {checkoutUrl && (
                    <div className="mt-3 text-center">
                        <span className="text-[10px] text-muted-foreground">checkout: </span>
                        <a
                            href={checkoutUrl}
                            className="text-[10px] text-muted-foreground underline underline-offset-2"
                        >
                            {checkoutUrl}
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}
