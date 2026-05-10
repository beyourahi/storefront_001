import {redirect} from "react-router";
import type {Route} from "./+types/account_.logout";
import {getBrandNameFromMatches, getSiteUrlFromMatches, buildMeta} from "~/lib/seo";

export const meta: Route.MetaFunction = ({matches}) => {
    const siteUrl = getSiteUrlFromMatches(matches);
    const brandName = getBrandNameFromMatches(matches);
    return buildMeta({
        title: "Sign Out",
        pathname: "/account/logout",
        siteUrl,
        brandName,
        robots: {noIndex: true, noFollow: true}
    }) as any;
};

export const loader = async () => {
    return redirect("/");
};

export const action = async ({context}: Route.ActionArgs) => {
    return context.customerAccount.logout();
};

export {RouteErrorBoundary as ErrorBoundary} from "~/components/RouteErrorBoundary";
