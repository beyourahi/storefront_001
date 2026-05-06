import type {Route} from "./+types/account_.login";
import {STORE_COUNTRY_CODE} from "~/lib/store-locale";

export const meta: Route.MetaFunction = () => [{title: "Redirecting..."}, {name: "robots", content: "noindex"}];

export const loader = async ({context}: Route.LoaderArgs) => {
    return context.customerAccount.login({
        countryCode: STORE_COUNTRY_CODE
    });
};

export {RouteErrorBoundary as ErrorBoundary} from "~/components/RouteErrorBoundary";
