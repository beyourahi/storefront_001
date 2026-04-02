import {Link} from "react-router";
import type {OrderListItemFragment} from "customer-accountapi.generated";
import {Card} from "~/components/ui/card";
import {Badge} from "~/components/ui/badge";
import {Button} from "~/components/ui/button";
import {formatShopifyMoney} from "~/lib/currency-formatter";
import {getOrderStatusVariant, formatOrderStatus, type OrderStatusVariant} from "~/lib/order-status";
import {STORE_FORMAT_LOCALE} from "~/lib/store-locale";
import {cn} from "~/lib/utils";

type OrderCardProps = {
    order: OrderListItemFragment;
};

const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString(STORE_FORMAT_LOCALE, {
        year: "numeric",
        month: "long",
        day: "numeric"
    });

const statusBorderMap: Record<OrderStatusVariant, string> = {
    default: "border-l-success",
    secondary: "border-l-warning",
    outline: "border-l-primary",
    destructive: "border-l-destructive"
};

export const OrderCard = ({order}: OrderCardProps) => {
    const lineItemCount = order.lineItems?.nodes?.length ?? 0;
    const variant = getOrderStatusVariant(order.fulfillmentStatus);

    return (
        <Card className={cn("overflow-hidden border-l-4 p-0 transition-shadow hover:shadow-sm", statusBorderMap[variant])}>
            <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between md:p-5">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">{order.name}</span>
                        <Badge variant={variant}>
                            {formatOrderStatus(order.fulfillmentStatus)}
                        </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {formatDate(order.processedAt)} &middot; {lineItemCount} item
                        {lineItemCount !== 1 ? "s" : ""}
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold text-foreground">{formatShopifyMoney(order.totalPrice)}</span>
                    <Button variant="outline" size="sm" asChild>
                        <Link to={`/account/orders/${order.id.split("/").pop()}`}>View Details</Link>
                    </Button>
                </div>
            </div>
        </Card>
    );
};
