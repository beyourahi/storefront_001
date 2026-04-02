import {data as remixData, Link, useLoaderData, useOutletContext} from "react-router";
import type {Route} from "./+types/account.orders._index";
import type {AccountOutletContext} from "~/routes/account";
import {getPaginationVariables} from "@shopify/hydrogen";
import {CUSTOMER_ORDERS_LIST_QUERY} from "~/graphql/customer-account/CustomerOrdersQuery";
import {OrderCard} from "~/components/account/OrderCard";
import {Button} from "~/components/ui/button";
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
            <div className="rounded-2xl bg-gradient-to-br from-muted/40 via-card to-muted/20 px-6 py-12 text-center sm:px-12">
                <h2 className="font-serif text-xl font-medium text-foreground md:text-2xl">Sign in to view your orders</h2>
                <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">Track your purchases and view order details.</p>
                <Button asChild size="lg" className="mt-6">
                    <Link to="/account/login">Sign In</Link>
                </Button>
            </div>
        );
    }

    const orderCount = orders?.length ?? 0;

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-8 md:mb-10">
                <div>
                    <h1 className="font-serif text-xl font-medium text-foreground md:text-2xl lg:text-3xl">Order History</h1>
                    {orderCount > 0 && (
                        <p className="text-sm text-muted-foreground mt-1">
                            {orderCount} order{orderCount !== 1 ? "s" : ""}
                        </p>
                    )}
                </div>
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
                <div className="rounded-2xl bg-gradient-to-br from-muted/40 via-card to-muted/20 px-6 py-12 text-center sm:px-12">
                    <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-primary/10">
                        <PackageSearchIcon className="size-7 text-primary" />
                    </div>
                    <h2 className="font-serif text-xl font-medium text-foreground">No orders yet</h2>
                    <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">When you place an order, it will appear here.</p>
                    <Button asChild className="mt-6">
                        <Link to="/collections">Start Shopping</Link>
                    </Button>
                </div>
            )}
        </div>
    );
};

export default OrdersPage;

export {RouteErrorBoundary as ErrorBoundary} from "~/components/RouteErrorBoundary";
