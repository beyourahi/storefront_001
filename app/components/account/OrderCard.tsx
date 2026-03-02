import {Link} from "react-router";
import type {OrderListItemFragment} from "customer-accountapi.generated";
import {Card} from "~/components/ui/card";
import {Badge} from "~/components/ui/badge";
import {Button} from "~/components/ui/button";
import {formatShopifyMoney} from "~/lib/currency-formatter";
import {getOrderStatusVariant, formatOrderStatus} from "~/lib/order-status";

type OrderCardProps = {
    order: OrderListItemFragment;
};

const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
    });

export const OrderCard = ({order}: OrderCardProps) => {
    const lineItemCount = order.lineItems?.nodes?.length ?? 0;

    return (
        <Card className="p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold">{order.name}</span>
                        <Badge variant={getOrderStatusVariant(order.fulfillmentStatus)}>
                            {formatOrderStatus(order.fulfillmentStatus)}
                        </Badge>
                    </div>
                    <p className="text-muted-foreground text-sm">
                        {formatDate(order.processedAt)} &middot; {lineItemCount} item
                        {lineItemCount !== 1 ? "s" : ""}
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <span className="font-semibold">{formatShopifyMoney(order.totalPrice)}</span>
                    <Button variant="outline" size="sm" asChild>
                        <Link to={`/account/orders/${order.id.split("/").pop()}`}>View Details</Link>
                    </Button>
                </div>
            </div>
        </Card>
    );
};
