import type {Route} from "./+types/account_.login";

export const loader = async ({context}: Route.LoaderArgs) => {
    return context.customerAccount.login({
        countryCode: context.storefront.i18n.country
    });
};
