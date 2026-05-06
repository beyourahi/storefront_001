import {data as remixData, redirect, useLoaderData, Link} from "react-router";
import type {Route} from "./+types/account.returns._index";
import {Image} from "@shopify/hydrogen";
import {CUSTOMER_RETURNS_QUERY, getReturnStatusConfig} from "~/graphql/customer-account/CustomerReturnsQuery";
import {RETURNS_AVAILABILITY_QUERY, checkReturnsEnabled} from "~/graphql/customer-account/ReturnsAvailabilityQuery";
import {Card, CardContent} from "~/components/ui/card";
import {Badge} from "~/components/ui/badge";
import {Button} from "~/components/ui/button";
import {AuthRequiredFallback} from "~/components/account/AuthRequiredFallback";
import {PackageX, ArrowRightIcon, CalendarIcon, PackageIcon, PackageSearchIcon, ShoppingBagIcon} from "lucide-react";
import {STORE_FORMAT_LOCALE} from "~/lib/store-locale";
import {parseProductTitle} from "~/lib/product";

export const meta: Route.MetaFunction = () => {
    return [{title: "Returns History"}, {name: "robots", content: "noindex,nofollow"}];
};

export const loader = async ({context}: Route.LoaderArgs) => {
    const {customerAccount} = context;

    let isAuthenticated: boolean;
    try {
        isAuthenticated = await customerAccount.isLoggedIn();
    } catch {
        isAuthenticated = false;
    }

    if (!isAuthenticated) {
        return remixData(
            {returns: [] as ReturnWithOrder[], isAuthenticated: false},
            {
                headers: {
                    "Set-Cookie": await context.session.commit(),
                    "Cache-Control": "no-cache, no-store, must-revalidate"
                }
            }
        );
    }

    const returnsAvailabilityResponse = await customerAccount.query(RETURNS_AVAILABILITY_QUERY, {
        variables: {
            first: 10,
            language: customerAccount.i18n.language
        }
    });

    const availabilityOrders = returnsAvailabilityResponse?.data?.customer?.orders?.nodes ?? [];
    const returnsEnabled = checkReturnsEnabled(availabilityOrders);

    if (!returnsEnabled) {
        throw redirect("/account/orders");
    }

    const {data, errors} = await customerAccount.query(CUSTOMER_RETURNS_QUERY, {
        variables: {
            first: 250,
            language: customerAccount.i18n.language
        }
    });

    if (errors?.length) {
        console.error("Error fetching returns:", errors);
    }

    const ordersWithReturns = data?.customer?.orders?.nodes ?? [];
    const allReturns: ReturnWithOrder[] = [];

    for (const order of ordersWithReturns) {
        const returns = order.returns?.nodes ?? [];
        for (const returnItem of returns) {
            allReturns.push({
                ...returnItem,
                order: {
                    id: order.id,
                    name: order.name,
                    number: order.number,
                    processedAt: order.processedAt
                }
            });
        }
    }

    // Returns are flattened across all orders; sort newest-first by return creation date.
    allReturns.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
    });

    return remixData(
        {returns: allReturns, isAuthenticated: true},
        {
            headers: {
                "Set-Cookie": await context.session.commit(),
                "Cache-Control": "no-cache, no-store, must-revalidate"
            }
        }
    );
};

interface ReturnWithOrder {
    id: string;
    name: string;
    status: string;
    createdAt?: string | null;
    returnLineItems: {
        nodes: Array<{
            id: string;
            quantity: number;
            returnReason?: string | null;
            lineItem: {
                id: string;
                title: string;
                variantTitle?: string | null;
                image?: {
                    altText?: string | null;
                    url: string;
                    width?: number | null;
                    height?: number | null;
                } | null;
            };
        }>;
    };
    order: {
        id: string;
        name: string;
        number: number;
        processedAt: string;
    };
}

const ReturnsHistoryRoute = () => {
    const {returns, isAuthenticated} = useLoaderData<typeof loader>();

    if (!isAuthenticated) {
        return (
            <AuthRequiredFallback
                message="Sign in to view and manage your returns."
                secondaryCTA={{label: "Browse Products", to: "/collections"}}
            />
        );
    }

    const hasReturns = returns.length > 0;

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-8 md:mb-10">
                <div>
                    <h1 className="font-serif text-xl font-medium text-foreground md:text-2xl lg:text-3xl">
                        Returns History
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">Track and manage your return requests</p>
                </div>
                {hasReturns && (
                    <div className="mt-3 sm:mt-0">
                        <Button variant="ghost" asChild>
                            <Link to="/account/orders" className="flex items-center gap-1.5">
                                View Orders
                                <ArrowRightIcon className="size-4" />
                            </Link>
                        </Button>
                    </div>
                )}
            </div>

            {returns.length === 0 ? (
                <ReturnsEmpty />
            ) : (
                <div className="grid gap-4 md:gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {returns.map((returnItem, index) => (
                        <ReturnCard key={returnItem.id} returnItem={returnItem} index={index} />
                    ))}
                </div>
            )}
        </div>
    );
};

const ReturnsEmpty = () => (
    <Card className="rounded-2xl py-0 bg-linear-to-br from-muted/40 via-card to-muted/20">
        <CardContent className="flex flex-col items-center justify-center py-16 md:py-24 text-center px-6">
            <div className="flex items-center justify-center size-20 md:size-24 rounded-2xl bg-muted/50 mb-6">
                <PackageX className="size-10 md:size-12 text-muted-foreground" />
            </div>
            <h3 className="font-serif text-xl font-medium text-foreground md:text-2xl mb-2">No returns yet</h3>
            <p className="text-muted-foreground text-sm md:text-base mb-8 max-w-sm leading-relaxed">
                When you request a return for an order, it will appear here for easy tracking.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild size="lg">
                    <Link to="/account/orders" className="gap-2">
                        <PackageSearchIcon className="size-4" />
                        View Orders
                    </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                    <Link to="/collections">Continue Shopping</Link>
                </Button>
            </div>
        </CardContent>
    </Card>
);

const ReturnCard = ({returnItem, index: _index = 0}: {returnItem: ReturnWithOrder; index?: number}) => {
    const statusConfig = getReturnStatusConfig(returnItem.status);
    const lineItems = returnItem.returnLineItems.nodes;
    const firstItem = lineItems[0];
    const firstItemTitle = firstItem ? parseProductTitle(firstItem.lineItem.title) : null;
    const totalQuantity = lineItems.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <Link to="/account/orders" className="group block no-underline">
            <Card className="hover:shadow-lg transition-all duration-300 rounded-2xl py-0 overflow-hidden h-full group-hover:-translate-y-0.5">
                <CardContent className="p-5 md:p-6 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-4 min-w-0">
                        <span className="font-mono text-lg font-semibold text-foreground tracking-tight min-w-0 truncate">
                            {returnItem.name}
                        </span>
                        <Badge variant={statusConfig.variant} className="text-xs uppercase tracking-wide shrink-0">
                            {statusConfig.label}
                        </Badge>
                    </div>

                    <div className="flex -space-x-3 mb-5">
                        {lineItems.slice(0, 4).map((item, idx) => (
                            <div
                                key={item.id}
                                className="relative size-14 rounded-xl overflow-hidden bg-muted/50 shrink-0 ring-2 ring-card shadow-sm"
                                style={{zIndex: 10 - idx}}
                            >
                                {item.lineItem.image ? (
                                    <Image
                                        data={item.lineItem.image}
                                        width={56}
                                        height={56}
                                        className="size-full object-cover"
                                    />
                                ) : (
                                    <div className="size-full bg-muted flex items-center justify-center">
                                        <ShoppingBagIcon className="size-5 text-muted-foreground" />
                                    </div>
                                )}
                                {idx === 3 && lineItems.length > 4 && (
                                    <div className="absolute inset-0 bg-primary/80 flex items-center justify-center">
                                        <span className="text-sm font-semibold text-primary-foreground">
                                            +{lineItems.length - 4}
                                        </span>
                                    </div>
                                )}
                            </div>
                        ))}
                        {lineItems.length === 0 && (
                            <div className="size-14 rounded-xl bg-muted flex items-center justify-center ring-2 ring-card">
                                <PackageIcon className="size-6 text-muted-foreground" />
                            </div>
                        )}
                    </div>

                    <div className="space-y-1.5 mt-auto min-w-0">
                        {returnItem.createdAt && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                                <CalendarIcon className="size-3.5 shrink-0" />
                                {new Date(returnItem.createdAt).toLocaleDateString(STORE_FORMAT_LOCALE, {
                                    weekday: "short",
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric"
                                })}
                            </p>
                        )}
                        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                            <PackageIcon className="size-3.5 shrink-0" />
                            Order {returnItem.order.name}
                        </p>
                        {firstItem && firstItemTitle && (
                            <p className="text-base font-semibold text-foreground truncate pt-1">
                                {firstItemTitle.primary}
                                {firstItemTitle.secondary && (
                                    <span className="font-normal text-muted-foreground text-sm">
                                        {" "}
                                        {firstItemTitle.secondary}
                                    </span>
                                )}
                                {lineItems.length > 1 && (
                                    <span className="text-muted-foreground font-normal text-sm">
                                        {" "}
                                        + {lineItems.length - 1} more
                                    </span>
                                )}
                            </p>
                        )}
                        <p className="text-sm text-muted-foreground">
                            {totalQuantity} {totalQuantity === 1 ? "item" : "items"} in return
                        </p>
                    </div>

                    {statusConfig.description && (
                        <div className="mt-4 pt-4">
                            <p className="text-sm text-muted-foreground leading-relaxed">{statusConfig.description}</p>
                        </div>
                    )}

                    <div className="mt-4 flex items-center gap-1.5 text-sm font-medium text-primary group-hover:gap-2.5 transition-all duration-200">
                        <span>View Details</span>
                        <ArrowRightIcon className="size-4" />
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
};

export default ReturnsHistoryRoute;

export {RouteErrorBoundary as ErrorBoundary} from "~/components/RouteErrorBoundary";
