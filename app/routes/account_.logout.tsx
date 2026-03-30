import {redirect} from "react-router";
import type {Route} from "./+types/account_.logout";

export const meta: Route.MetaFunction = () => [
    {title: "Redirecting..."},
    {name: "robots", content: "noindex"}
];

export const loader = async () => {
    return redirect("/");
};

export const action = async ({context}: Route.ActionArgs) => {
    return context.customerAccount.logout();
};
