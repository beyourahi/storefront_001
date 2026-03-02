import type {Route} from "./+types/account_.authorize";

export const loader = async ({context}: Route.LoaderArgs) => {
    return context.customerAccount.authorize();
};
