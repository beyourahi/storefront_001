import type {Route} from "./+types/account_.authorize";

export const meta: Route.MetaFunction = () => [
    {title: "Redirecting..."},
    {name: "robots", content: "noindex"}
];

export const loader = async ({context}: Route.LoaderArgs) => {
    return context.customerAccount.authorize();
};
