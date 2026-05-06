import type {MappedProductOptions} from "@shopify/hydrogen";
import {formatShopifyMoney} from "~/lib/currency-formatter";
import {Bot} from "lucide-react";

type MoneyV2 = {amount: string; currencyCode: string};

type AgentVariant = {
    price?: MoneyV2 | null;
    compareAtPrice?: MoneyV2 | null;
    availableForSale?: boolean | null;
};

type AgentProductBriefProps = {
    product: {
        title: string;
        vendor?: string;
        productType?: string;
        description?: string;
        handle: string;
        tags?: string[];
        collections?: {nodes: Array<{handle: string; title: string}>};
    };
    selectedVariant: AgentVariant;
    productOptions: MappedProductOptions[];
};

/**
 * Monospace data-table layout optimised for AI agent consumption. Rendered in place
 * of the normal PDP when the agentic layer detects an agent request (see
 * `agent-server.ts`). Presents product identity, pricing, variant availability, and
 * description in a scannable key/value grid. Tags are capped at 8 items. Available
 * variant values are visually distinct from selected and struck-through unavailable
 * ones so an agent can read option state at a glance.
 */
export function AgentProductBrief({product, selectedVariant, productOptions}: AgentProductBriefProps) {
    const price = selectedVariant?.price;
    const compareAtPrice = selectedVariant?.compareAtPrice;
    const isAvailable = selectedVariant?.availableForSale ?? false;

    const tags = product.tags?.filter(t => t) ?? [];
    const collections = product.collections?.nodes ?? [];

    return (
        <div className="min-h-screen bg-background font-mono text-foreground">
            <div className="mx-auto max-w-2xl px-4 py-10">
                {/* Header */}
                <div className="mb-8 flex items-center gap-2 border-b border-border pb-4">
                    <Bot className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                        Agent Product View
                    </span>
                    <span
                        className={`ml-auto text-[11px] ${isAvailable ? "text-foreground" : "text-muted-foreground"}`}
                    >
                        {isAvailable ? "In Stock" : "Out of Stock"}
                    </span>
                </div>

                {/* Identity block */}
                <div className="mb-6 border border-border">
                    <Row label="Title" value={product.title} />
                    {product.vendor && <Row label="Vendor" value={product.vendor} />}
                    {product.productType && <Row label="Type" value={product.productType} />}
                    <div className="grid grid-cols-12 border-b border-border/50 px-3 py-2.5 last:border-b-0">
                        <span className="col-span-4 text-[10px] uppercase tracking-widest text-muted-foreground">
                            Price
                        </span>
                        <div className="col-span-8 flex items-baseline gap-2">
                            <span className="text-sm font-semibold">{price ? formatShopifyMoney(price) : "—"}</span>
                            {compareAtPrice && (
                                <span className="text-[11px] text-muted-foreground line-through">
                                    {formatShopifyMoney(compareAtPrice)}
                                </span>
                            )}
                        </div>
                    </div>
                    {collections.length > 0 && (
                        <Row label="Collections" value={collections.map(c => c.title).join(", ")} />
                    )}
                    {tags.length > 0 && <Row label="Tags" value={tags.slice(0, 8).join(", ")} />}
                </div>

                {/* Variant options */}
                {productOptions.length > 0 && (
                    <div className="mb-6 border border-border">
                        <div className="border-b border-border bg-muted/30 px-3 py-1.5">
                            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Options</span>
                        </div>
                        {productOptions.map(option => (
                            <div key={option.name} className="border-b border-border/50 px-3 py-2.5 last:border-b-0">
                                <div className="mb-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
                                    {option.name}
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {option.optionValues.map(val => (
                                        <span
                                            key={val.name}
                                            className={`border px-1.5 py-0.5 text-[10px] ${
                                                val.selected
                                                    ? "border-foreground text-foreground"
                                                    : val.available
                                                      ? "border-border text-muted-foreground"
                                                      : "border-border/40 text-muted-foreground/40 line-through"
                                            }`}
                                        >
                                            {val.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Description */}
                {product.description && (
                    <div className="border border-border">
                        <div className="border-b border-border bg-muted/30 px-3 py-1.5">
                            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                                Description
                            </span>
                        </div>
                        <p className="px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
                            {product.description}
                        </p>
                    </div>
                )}

                {/* Machine-readable handle */}
                <div className="mt-4 text-center">
                    <span className="text-[10px] text-muted-foreground">handle: </span>
                    <span className="text-[10px] text-muted-foreground">{product.handle}</span>
                </div>
            </div>
        </div>
    );
}

function Row({label, value}: {label: string; value: string}) {
    return (
        <div className="grid grid-cols-12 border-b border-border/50 px-3 py-2.5 last:border-b-0">
            <span className="col-span-4 text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
            <span className="col-span-8 text-xs text-foreground">{value}</span>
        </div>
    );
}
