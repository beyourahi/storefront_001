import {data as remixData, Form, Link, useLoaderData, useOutletContext} from "react-router";
import type {Route} from "./+types/account._index";
import type {CustomerFragment} from "customer-accountapi.generated";
import type {AccountOutletContext} from "~/routes/account";
import {CUSTOMER_ORDERS_LIST_QUERY} from "~/graphql/customer-account/CustomerOrdersQuery";
import {Button} from "~/components/ui/button";
import {Card, CardContent} from "~/components/ui/card";
import {Avatar, AvatarFallback} from "~/components/ui/avatar";
import {OrderCard} from "~/components/account/OrderCard";
import {AuthRequiredFallback} from "~/components/account/AuthRequiredFallback";
import {StoreCreditWidget} from "~/components/account/StoreCreditWidget";
import {AnimatedSection} from "~/components/sections/AnimatedSection";
import {PackageSearchIcon, ShoppingBagIcon, UserCogIcon, ArrowRightIcon, LogOutIcon} from "lucide-react";
import {
    CUSTOMER_STORE_CREDIT_QUERY,
    getTotalBalance,
    type StoreCreditAccount
} from "~/graphql/customer-account/StoreCreditQueries";
import {STORE_FORMAT_LOCALE} from "~/lib/store-locale";

export const meta: Route.MetaFunction = () => [{title: "Account Dashboard"}];

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
            {
                orders: null,
                storeCreditBalance: null,
                storeCreditAccounts: [],
                isAuthenticated: false as const
            },
            {
                headers: {
                    "Set-Cookie": await context.session.commit(),
                    "Cache-Control": "no-cache, no-store, must-revalidate"
                }
            }
        );
    }

    const [ordersResponse, storeCreditResponse] = await Promise.all([
        customerAccount.query(CUSTOMER_ORDERS_LIST_QUERY, {
            variables: {first: 5}
        }),
        customerAccount.query(CUSTOMER_STORE_CREDIT_QUERY, {
            variables: {
                first: 10,
                transactionsFirst: 10,
                language: customerAccount.i18n.language
            }
        })
    ]);

    const storeCreditAccounts: StoreCreditAccount[] =
        storeCreditResponse?.data?.customer?.storeCreditAccounts?.nodes ?? [];
    const storeCreditBalance = getTotalBalance(storeCreditAccounts);

    return remixData(
        {
            orders: ordersResponse?.data?.customer?.orders?.nodes ?? null,
            storeCreditBalance,
            storeCreditAccounts,
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

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 6) return "Good night";
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    if (hour < 22) return "Good evening";
    return "Good night";
};

const getInitials = (customer: CustomerFragment | null) => {
    if (!customer) return "?";
    const first = customer.firstName?.charAt(0) ?? "";
    const last = customer.lastName?.charAt(0) ?? "";
    return (first + last).toUpperCase() || "?";
};

const formatMemberSince = (dateString: string | null | undefined) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString(STORE_FORMAT_LOCALE, {
        year: "numeric",
        month: "long"
    });
};

const QUICK_ACTIONS = [
    {
        title: "Track Orders",
        description: "View and track your order history",
        to: "/account/orders",
        icon: PackageSearchIcon
    },
    {
        title: "Account Details",
        description: "Update your profile and addresses",
        to: "/account/profile",
        icon: UserCogIcon
    },
    {
        title: "Browse Products",
        description: "Discover new products",
        to: "/collections",
        icon: ShoppingBagIcon
    }
] as const;

const WelcomeBanner = ({customer}: {customer: CustomerFragment}) => (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
            <Avatar className="size-14 sm:size-16">
                {customer.imageUrl ? (
                    <img src={customer.imageUrl} alt={customer.displayName ?? ""} className="size-full object-cover" />
                ) : (
                    <AvatarFallback className="text-lg font-semibold">{getInitials(customer)}</AvatarFallback>
                )}
            </Avatar>
            <div>
                <h1 className="text-2xl font-bold sm:text-3xl">
                    {getGreeting()}, {customer.firstName ?? "there"}
                </h1>
                {customer.emailAddress?.emailAddress && (
                    <p className="text-muted-foreground text-sm">{customer.emailAddress.emailAddress}</p>
                )}
            </div>
        </div>
        <Form method="post" action="/account/logout">
            <Button variant="outline" type="submit" className="gap-2">
                <LogOutIcon className="size-4" />
                Sign Out
            </Button>
        </Form>
    </div>
);

const AccountStats = ({customer, orderCount}: {customer: CustomerFragment; orderCount: number}) => {
    const addressCount = customer.addresses?.nodes?.length ?? 0;
    const memberSince = formatMemberSince(customer.creationDate);

    const stats = [
        {label: "Orders", value: orderCount.toString()},
        {label: "Saved Addresses", value: addressCount.toString()},
        ...(memberSince ? [{label: "Member Since", value: memberSince}] : [])
    ];

    return (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {stats.map(stat => (
                <Card key={stat.label} className="p-4 text-center">
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-muted-foreground text-sm">{stat.label}</p>
                </Card>
            ))}
        </div>
    );
};

const QuickActionsGrid = () => (
    <div>
        <h2 className="mb-4 text-xl font-semibold">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {QUICK_ACTIONS.map(action => (
                <Link viewTransition key={action.to} to={action.to} className="group">
                    <Card className="h-full p-4 transition-colors group-hover:bg-accent">
                        <CardContent className="flex items-start gap-4 p-0">
                            <div className="rounded-lg bg-primary/10 p-2">
                                <action.icon className="size-5 text-primary" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-medium group-hover:text-accent-foreground">{action.title}</h3>
                                <p className="text-muted-foreground text-sm">{action.description}</p>
                            </div>
                            <ArrowRightIcon className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                        </CardContent>
                    </Card>
                </Link>
            ))}
        </div>
    </div>
);

const RecentOrdersSection = ({orders}: {orders: NonNullable<Awaited<ReturnType<typeof loader>>["data"]["orders"]>}) => (
    <div>
        <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Recent Orders</h2>
            <Button variant="ghost" size="sm" asChild>
                <Link viewTransition to="/account/orders" className="gap-1">
                    View All
                    <ArrowRightIcon className="size-4" />
                </Link>
            </Button>
        </div>
        {orders.length > 0 ? (
            <div className="space-y-3">
                {orders.map(order => (
                    <OrderCard key={order.id} order={order} />
                ))}
            </div>
        ) : (
            <Card className="p-8 text-center">
                <PackageSearchIcon className="mx-auto mb-3 size-10 text-muted-foreground" />
                <p className="text-muted-foreground">No orders yet</p>
                <Button asChild className="mt-4" variant="outline">
                    <Link viewTransition to="/collections">Start Shopping</Link>
                </Button>
            </Card>
        )}
    </div>
);

const AccountDashboard = () => {
    const {orders, storeCreditBalance, storeCreditAccounts, isAuthenticated} = useLoaderData<typeof loader>();
    const {customer} = useOutletContext<AccountOutletContext>();

    if (!isAuthenticated || !customer) {
        return <AuthRequiredFallback />;
    }

    const orderCount = orders?.length ?? 0;
    const hasStoreCredit = storeCreditBalance && parseFloat(storeCreditBalance.amount) > 0;

    return (
        <div className="space-y-8 sm:space-y-10 lg:space-y-12">
            <AnimatedSection animation="fade" threshold={0.08}>
                <WelcomeBanner customer={customer} />
            </AnimatedSection>
            {hasStoreCredit && (
                <AnimatedSection animation="slide-up" threshold={0.1}>
                    <StoreCreditWidget balance={storeCreditBalance} accounts={storeCreditAccounts} />
                </AnimatedSection>
            )}
            <AnimatedSection animation="slide-up" threshold={0.1}>
                <AccountStats customer={customer} orderCount={orderCount} />
            </AnimatedSection>
            <AnimatedSection animation="slide-up" threshold={0.1}>
                <QuickActionsGrid />
            </AnimatedSection>
            {orders && (
                <AnimatedSection animation="fade" threshold={0.1}>
                    <RecentOrdersSection orders={orders} />
                </AnimatedSection>
            )}
        </div>
    );
};

export default AccountDashboard;
