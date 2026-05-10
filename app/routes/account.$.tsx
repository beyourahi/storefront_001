import {redirect} from "react-router";
import type {Route} from "./+types/account.$";
import {getBrandNameFromMatches, getSiteUrlFromMatches, buildMeta} from "~/lib/seo";

export const meta: Route.MetaFunction = ({matches}) => {
    const siteUrl = getSiteUrlFromMatches(matches);
    const brandName = getBrandNameFromMatches(matches);
    return buildMeta({
        title: "Account",
        pathname: "/account",
        siteUrl,
        brandName,
        robots: {noIndex: true, noFollow: true}
    }) as any;
};

export const loader = async () => {
    return redirect("/account");
};

export {RouteErrorBoundary as ErrorBoundary} from "~/components/RouteErrorBoundary";
