import {Gift, Package, RefreshCw, Layers} from "lucide-react";
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
        (collections && collections.length > 1);

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
            {collections && collections.length > 1 && (
                <Badge
                    variant="outline"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium"
                    aria-label={`Part of collections: ${collections.map(c => c.title).join(", ")}`}
                >
                    <Layers className="h-3 w-3" aria-hidden="true" />
                    {collections.length} Collections
                </Badge>
            )}
        </div>
    );
};
