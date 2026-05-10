import type {Route} from "./+types/account_.login";
import {STORE_COUNTRY_CODE} from "~/lib/store-locale";
import {getBrandNameFromMatches, getSiteUrlFromMatches, buildMeta} from "~/lib/seo";

export const meta: Route.MetaFunction = ({matches}) => {
    const siteUrl = getSiteUrlFromMatches(matches);
    const brandName = getBrandNameFromMatches(matches);
    return buildMeta({
        title: "Sign In",
        pathname: "/account/login",
        siteUrl,
        brandName,
        robots: {noIndex: true, noFollow: true}
    }) as any;
};

export const loader = async ({context}: Route.LoaderArgs) => {
    return context.customerAccount.login({
        countryCode: STORE_COUNTRY_CODE
    });
};

export {RouteErrorBoundary as ErrorBoundary} from "~/components/RouteErrorBoundary";
