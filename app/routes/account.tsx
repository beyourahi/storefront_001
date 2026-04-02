import {Suspense} from "react";
import {
    data as remixData,
    NavLink,
    Outlet,
    useLoaderData,
    useRouteError,
    isRouteErrorResponse
} from "react-router";
import type {ShouldRevalidateFunction} from "react-router";
import {Button} from "~/components/ui/button";
import {Badge} from "~/components/ui/badge";
import {WishlistCountInline} from "~/components/WishlistCount";
import type {Route} from "./+types/account";
import {getSeoMeta} from "@shopify/hydrogen";
import {CUSTOMER_DETAILS_QUERY} from "~/graphql/customer-account/customer";
import {cn} from "~/lib/utils";

export const meta: Route.MetaFunction = () => {
    return (
        getSeoMeta({
            title: "My Account",
            description: "Manage your account, orders, addresses, and profile settings.",
            robots: {noIndex: true, noFollow: true}
        }) ?? []
    );
};

// Revalidate on pathname changes (sub-route navigation) but not during same-URL
// hydration. The previous `() => true` caused a Suspense hydration race: the loader
// re-ran before hydration completed, forcing React to abandon SSR and flash the page.
export const shouldRevalidate: ShouldRevalidateFunction = ({
    currentUrl,
    nextUrl,
    defaultShouldRevalidate
}) => {
    if (currentUrl.pathname !== nextUrl.pathname) return true;
    return defaultShouldRevalidate;
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
            {customer: null, isAuthenticated: false as const},
            {
                headers: {
                    "Set-Cookie": await context.session.commit(),
                    "Cache-Control": "no-cache, no-store, must-revalidate"
                }
            }
        );
    }

    const {data, errors} = await customerAccount.query(CUSTOMER_DETAILS_QUERY);

    if (errors?.length || !data?.customer) {
        return remixData(
            {customer: null, isAuthenticated: false as const},
            {
                headers: {
                    "Set-Cookie": await context.session.commit(),
                    "Cache-Control": "no-cache, no-store, must-revalidate"
                }
            }
        );
    }

    return remixData(
        {customer: data.customer, isAuthenticated: true as const},
        {
            headers: {
                "Set-Cookie": await context.session.commit(),
                "Cache-Control": "no-cache, no-store, must-revalidate"
            }
        }
    );
};

export type AccountOutletContext = {
    customer: Awaited<ReturnType<typeof loader>>["data"]["customer"];
    isAuthenticated: boolean;
};

const AccountNavLink = ({to, end, children}: {to: string; end?: boolean; children: React.ReactNode}) => (
    <NavLink to={to} end={end} className="group shrink-0">
        {({isActive, isPending}) => (
            <span
                className={cn(
                    "relative inline-block pb-1 text-base sm:text-xl md:text-2xl lg:text-3xl font-medium transition-colors whitespace-nowrap",
                    isPending
                        ? "text-muted-foreground"
                        : isActive
                          ? "text-primary"
                          : "text-muted-foreground group-hover:text-primary"
                )}
            >
                {children}
                <span
                    className={cn(
                        "absolute bottom-0 left-0 w-full h-0.5 bg-primary transition-transform duration-300 ease-out origin-left",
                        isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                    )}
                />
            </span>
        )}
    </NavLink>
);

const AccountMenu = () => (
    <div className="overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <nav
            role="navigation"
            aria-label="Account navigation"
            className={cn(
                "flex items-center justify-start sm:justify-center min-w-max mx-auto",
                "gap-4 sm:gap-6 md:gap-8 lg:gap-10 xl:gap-12"
            )}
        >
            <AccountNavLink to="/account" end>
                Dashboard
            </AccountNavLink>
            <AccountNavLink to="/account/orders">Orders</AccountNavLink>
            <AccountNavLink to="/account/wishlist">
                Wishlist <WishlistCountInline />
            </AccountNavLink>
            <AccountNavLink to="/account/returns">Returns</AccountNavLink>
            <AccountNavLink to="/account/profile">Account Details</AccountNavLink>
        </nav>
    </div>
);

const AccountContentSkeleton = () => (
    <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 rounded bg-muted" />
        <div className="h-64 rounded bg-muted/50" />
    </div>
);

const AccountLayout = () => {
    const {customer, isAuthenticated} = useLoaderData<typeof loader>();

    return (
        <div className="px-container pt-8 sm:pt-10 md:pt-12 mb-4 pb-6 sm:pb-8 md:pb-12 lg:pb-16 xl:pb-20 min-h-[calc(100dvh-var(--total-header-height))]">
            {isAuthenticated && <AccountMenu />}
            <div className={cn(isAuthenticated ? "mt-8 md:mt-10 lg:mt-12 xl:mt-14" : "mt-4")}>
                <Suspense fallback={<AccountContentSkeleton />}>
                    <Outlet context={{customer, isAuthenticated} satisfies AccountOutletContext} />
                </Suspense>
            </div>
        </div>
    );
};

export default AccountLayout;

export const ErrorBoundary = () => {
    const error = useRouteError();
    let statusCode = 500;
    let errorMessage = "An unexpected error occurred.";

    if (isRouteErrorResponse(error)) {
        statusCode = error.status;
        errorMessage = error.data?.message ?? error.data ?? errorMessage;
    } else if (error instanceof Error) {
        errorMessage = error.message;
    }

    const title = statusCode === 404 ? "Page Not Found" : "Account Error";

    return (
        <div className="relative flex min-h-[50vh] flex-col items-center justify-center px-4 py-16">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--color-primary)_0%,_transparent_50%)] opacity-[0.03]" />
            <div className="relative mx-auto w-full max-w-lg text-center">
                <div className="space-y-6">
                    <div className="inline-flex items-center">
                        <Badge variant="outline" className="px-4 py-1.5 text-xs font-medium">
                            Error {statusCode}
                        </Badge>
                    </div>
                    <div className="space-y-4">
                        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">{title}</h1>
                        <p className="text-base leading-relaxed text-muted-foreground">{errorMessage}</p>
                        <p className="text-sm font-medium text-muted-foreground">Let&apos;s get you back on track</p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4">
                        <Button asChild>
                            <a href="/account">Return to Account</a>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
