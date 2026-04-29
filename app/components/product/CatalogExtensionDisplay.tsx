import {Gift, Package, RefreshCw, Layers, ArrowRight} from "lucide-react";
import {Link} from "react-router";
import {Badge} from "~/components/ui/badge";
import {cn} from "~/lib/utils";

type SellingPlan = {
    name: string;
    recurringDeliveries?: boolean;
};

type ProductCollection = {
    handle: string;
    title: string;
};

export type CatalogExtensionDisplayProps = {
    isGiftCard?: boolean;
    requiresShipping?: boolean;
    sellingPlans?: SellingPlan[];
    collections?: ProductCollection[];
    className?: string;
};

export const CatalogExtensionDisplay = ({
    isGiftCard,
    requiresShipping,
    sellingPlans,
    collections,
    className
}: CatalogExtensionDisplayProps) => {
    const hasContent =
        isGiftCard ||
        requiresShipping === false ||
        (sellingPlans && sellingPlans.length > 0) ||
        (collections && collections.length > 0);

    if (!hasContent) return null;

    return (
        <div className={cn("flex flex-wrap gap-2", className)}>
            {isGiftCard && (
                <Badge
                    variant="secondary"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium"
                    aria-label="This is a gift card"
                >
                    <Gift className="h-3 w-3" aria-hidden="true" />
                    Gift Card
                </Badge>
            )}
            {requiresShipping === false && (
                <Badge
                    variant="outline"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border-primary/30 text-primary"
                    aria-label="Digital product — no shipping required"
                >
                    <Package className="h-3 w-3" aria-hidden="true" />
                    Digital — No Shipping
                </Badge>
            )}
            {sellingPlans && sellingPlans.length > 0 && (
                <Badge
                    variant="secondary"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium"
                    aria-label={`Available as subscription: ${sellingPlans.map(p => p.name).join(", ")}`}
                >
                    <RefreshCw className="h-3 w-3" aria-hidden="true" />
                    {sellingPlans.length === 1 ? sellingPlans[0].name : `${sellingPlans.length} Plans`}
                </Badge>
            )}
            {collections && collections.length > 0 && (
                <div
                    className="w-full rounded-lg border border-primary/20 bg-primary/6 px-3.5 py-2.5"
                    aria-label={`Also found in: ${collections.map(c => c.title).join(", ")}`}
                >
                    <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-primary/70 select-none">
                        <Layers className="h-3 w-3" aria-hidden="true" />
                        Also found in
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        {collections.map(c => (
                            <Badge
                                key={c.handle}
                                asChild
                                variant="outline"
                                className="border-primary/30 bg-primary/10 text-primary px-3 py-1 text-sm font-medium transition-all duration-150 can-hover:scale-[1.02] can-hover:bg-overlay-light can-hover:border-primary/60 can-hover:shadow-sm"
                            >
                                <Link to={`/collections/${c.handle}`} prefetch="intent" viewTransition>
                                    {c.title}
                                    <ArrowRight className="opacity-50" />
                                </Link>
                            </Badge>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
