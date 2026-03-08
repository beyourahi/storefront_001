import {data as remixData, Link, useLoaderData, useOutletContext} from "react-router";
import type {Route} from "./+types/account.subscriptions._index";
import type {AccountOutletContext} from "~/routes/account";
import {Image, Money} from "@shopify/hydrogen";
import {
    CUSTOMER_SUBSCRIPTIONS_QUERY,
    SUBSCRIPTION_STATUSES,
    formatBillingFrequency,
    type SubscriptionStatus
} from "~/graphql/customer-account/SubscriptionQueries";
import {AuthRequiredFallback} from "~/components/account/AuthRequiredFallback";
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "~/components/ui/card";
import {Badge} from "~/components/ui/badge";
import {Button} from "~/components/ui/button";
import {Separator} from "~/components/ui/separator";

export const meta: Route.MetaFunction = () => [{title: "Subscriptions"}];

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
            {subscriptions: [], isAuthenticated: false},
            {
                headers: {
                    "Set-Cookie": await context.session.commit(),
                    "Cache-Control": "no-cache, no-store, must-revalidate"
                }
            }
        );
    }

    const {data, errors} = await customerAccount.query(CUSTOMER_SUBSCRIPTIONS_QUERY, {
        variables: {
            first: 20,
            language: customerAccount.i18n.language
        }
    });

    if (errors?.length) {
        throw new Error(errors[0].message);
    }

    const subscriptions = data?.customer?.subscriptionContracts?.nodes ?? [];

    return remixData(
        {subscriptions, isAuthenticated: true},
        {
            headers: {
                "Set-Cookie": await context.session.commit(),
                "Cache-Control": "no-cache, no-store, must-revalidate"
            }
        }
    );
};

type SubscriptionContract = {
    id: string;
    status: SubscriptionStatus;
    createdAt: string;
    nextBillingDate: string | null;
    currencyCode: string;
    billingPolicy: {
        interval: string;
        intervalCount: {count: number} | null;
    };
    lines: {
        nodes: Array<{
            id: string;
            name: string;
            title: string;
            quantity: number;
            currentPrice: {
                amount: string;
                currencyCode: string;
            };
            image?: {
                altText?: string | null;
                url: string;
                width?: number | null;
                height?: number | null;
            } | null;
        }>;
    };
};

export default function SubscriptionsIndex() {
    const {subscriptions, isAuthenticated} = useLoaderData<{
        subscriptions: SubscriptionContract[];
        isAuthenticated: boolean;
    }>();
    const {customer} = useOutletContext<AccountOutletContext>();

    if (!isAuthenticated || !customer) {
        return (
            <AuthRequiredFallback
                message="Sign in to view subscriptions"
                description="Access your subscription contracts and manage recurring orders."
            />
        );
    }

    return (
        <div className="space-y-6">
            <header className="space-y-2">
                <h2 className="text-2xl font-semibold tracking-tight">Subscriptions</h2>
                <p className="text-sm text-muted-foreground">Manage your recurring orders and subscription plans.</p>
            </header>

            <Separator />

            {subscriptions.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-muted-foreground">You have no active subscriptions.</p>
                        <Button asChild variant="link" className="mt-4">
                            <Link viewTransition to="/collections">Browse Products</Link>
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {subscriptions.map(subscription => (
                        <SubscriptionCard key={subscription.id} subscription={subscription} />
                    ))}
                </div>
            )}
        </div>
    );
}

const SubscriptionCard = ({subscription}: {subscription: SubscriptionContract}) => {
    const statusConfig = SUBSCRIPTION_STATUSES[subscription.status] ?? SUBSCRIPTION_STATUSES.ACTIVE;
    const frequency = formatBillingFrequency(
        subscription.billingPolicy.interval,
        subscription.billingPolicy.intervalCount
    );

    const firstLine = subscription.lines.nodes[0];
    const additionalItems = subscription.lines.nodes.length - 1;

    const nextBillingDate = subscription.nextBillingDate
        ? new Date(subscription.nextBillingDate).toLocaleDateString()
        : "N/A";

    const totalAmount = subscription.lines.nodes.reduce((sum, line) => {
        return sum + parseFloat(line.currentPrice.amount) * line.quantity;
    }, 0);

    return (
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <CardTitle className="text-base">
                            {firstLine?.title ?? "Subscription"}
                            {additionalItems > 0 && (
                                <span className="text-muted-foreground font-normal">
                                    {" "}
                                    +{additionalItems} more item{additionalItems > 1 ? "s" : ""}
                                </span>
                            )}
                        </CardTitle>
                        <CardDescription>{frequency}</CardDescription>
                    </div>
                    <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex gap-4">
                    <div className="flex -space-x-2">
                        {subscription.lines.nodes.slice(0, 3).map(line => (
                            <div
                                key={line.id}
                                className="h-16 w-16 shrink-0 overflow-hidden rounded-md border bg-muted"
                            >
                                {line.image ? (
                                    <Image data={line.image} sizes="64px" className="h-full w-full object-cover" />
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center text-muted-foreground text-sm">
                                        No image
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="flex-1 space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Next billing</span>
                            <span>{nextBillingDate}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Total</span>
                            <span className="font-medium">
                                <Money
                                    data={{
                                        amount: totalAmount.toFixed(2),
                                        currencyCode: subscription.currencyCode as any
                                    }}
                                />
                            </span>
                        </div>
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                <Button variant="link" className="h-auto p-0" asChild>
                    <Link viewTransition to={`/account/subscriptions/${btoa(subscription.id)}`}>Manage Subscription →</Link>
                </Button>
            </CardFooter>
        </Card>
    );
};
