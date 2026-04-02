import {data as remixData, Link, useLoaderData, useOutletContext} from "react-router";
import type {Route} from "./+types/account.orders._index";
import type {AccountOutletContext} from "~/routes/account";
import {getPaginationVariables} from "@shopify/hydrogen";
import {CUSTOMER_ORDERS_LIST_QUERY} from "~/graphql/customer-account/CustomerOrdersQuery";
import {OrderCard} from "~/components/account/OrderCard";
import {Button} from "~/components/ui/button";
import {Card} from "~/components/ui/card";
import {PackageSearchIcon} from "lucide-react";

export const meta: Route.MetaFunction = () => [{title: "Order History"}];

export const loader = async ({request, context}: Route.LoaderArgs) => {
    const {customerAccount} = context;

    let isAuthenticated: boolean;
    try {
        isAuthenticated = await customerAccount.isLoggedIn();
    } catch {
        isAuthenticated = false;
    }

    if (!isAuthenticated) {
        return remixData(
            {orders: null, pageInfo: null, isAuthenticated: false as const},
            {
                headers: {
                    "Set-Cookie": await context.session.commit(),
                    "Cache-Control": "no-cache, no-store, must-revalidate"
                }
            }
        );
    }

    const paginationVariables = getPaginationVariables(request, {pageBy: 20});

    const {data} = await customerAccount.query(CUSTOMER_ORDERS_LIST_QUERY, {
        variables: {...paginationVariables}
    });

    return remixData(
        {
            orders: data?.customer?.orders?.nodes ?? null,
            pageInfo: data?.customer?.orders?.pageInfo ?? null,
            isAuthenticated: true as const
        },
        {
            headers: {
                "Set-Cookie": await context.session.commit(),
                "Cache-Control": "no-cache, no-store, must-revalidate"
            }
        }
    );
};

const OrdersPage = () => {
    const {orders, pageInfo, isAuthenticated} = useLoaderData<typeof loader>();
    const {customer} = useOutletContext<AccountOutletContext>();

    if (!isAuthenticated || !customer) {
        return (
            <div className="flex flex-col items-center justify-center gap-6 py-20 text-center">
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Sign in to view your orders</h2>
                <p className="text-muted-foreground max-w-md text-sm">Track your purchases and view order details.</p>
                <p className="text-sm font-medium text-muted-foreground">Let&apos;s get you back on track</p>
                <Button asChild size="lg">
                    <Link to="/account/login">Sign In</Link>
                </Button>
            </div>
        );
    }

    const orderCount = orders?.length ?? 0;

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold sm:text-3xl">Order History</h1>
                {orderCount > 0 && (
                    <span className="text-muted-foreground text-sm">
                        {orderCount} order{orderCount !== 1 ? "s" : ""}
                    </span>
                )}
            </div>

            {orders && orders.length > 0 ? (
                <>
                    <div className="space-y-3">
                        {orders.map(order => (
                            <OrderCard key={order.id} order={order} />
                        ))}
                    </div>

                    {pageInfo && (pageInfo.hasPreviousPage || pageInfo.hasNextPage) && (
                        <div className="flex justify-center gap-4 pt-4">
                            {pageInfo.hasPreviousPage && (
                                <Button variant="outline" asChild>
                                    <Link
                                        to={`/account/orders?direction=previous&cursor=${pageInfo.startCursor}`}
                                        preventScrollReset
                                    >
                                        Previous
                                    </Link>
                                </Button>
                            )}
                            {pageInfo.hasNextPage && (
                                <Button variant="outline" asChild>
                                    <Link
                                        to={`/account/orders?direction=next&cursor=${pageInfo.endCursor}`}
                                        preventScrollReset
                                    >
                                        Next
                                    </Link>
                                </Button>
                            )}
                        </div>
                    )}
                </>
            ) : (
                <Card className="p-6 sm:p-12 text-center">
                    <div className="bg-primary/10 mx-auto mb-4 inline-flex rounded-full p-4 shadow-sm backdrop-blur-sm">
                        <PackageSearchIcon className="text-primary size-6" />
                    </div>
                    <h2 className="text-lg font-semibold lg:text-xl">No orders yet</h2>
                    <p className="text-muted-foreground mt-2 text-sm">When you place an order, it will appear here.</p>
                    <Button asChild className="mt-4">
                        <Link to="/collections">Start Shopping</Link>
                    </Button>
                </Card>
            )}
        </div>
    );
};

export default OrdersPage;

export {RouteErrorBoundary as ErrorBoundary} from "~/components/RouteErrorBoundary";
