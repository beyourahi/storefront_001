import type {Route} from "./+types/account_.authorize";
import {getBrandNameFromMatches, getSiteUrlFromMatches, buildMeta} from "~/lib/seo";

export const meta: Route.MetaFunction = ({matches}) => {
    const siteUrl = getSiteUrlFromMatches(matches);
    const brandName = getBrandNameFromMatches(matches);
    return buildMeta({
        title: "Authorizing",
        pathname: "/account/authorize",
        siteUrl,
        brandName,
        robots: {noIndex: true, noFollow: true}
    }) as any;
};

export const loader = async ({context}: Route.LoaderArgs) => {
    return context.customerAccount.authorize();
};

export {RouteErrorBoundary as ErrorBoundary} from "~/components/RouteErrorBoundary";
