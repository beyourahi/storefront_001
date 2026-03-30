import type {LoaderFunctionArgs, MetaFunction} from "react-router";
import {redirect} from "react-router";

export const meta: MetaFunction = () => [
    {title: "Redirecting..."},
    {name: "robots", content: "noindex"}
];

export const loader = async (_args: LoaderFunctionArgs) => {
    return redirect("/account/wishlist", {status: 301});
};

const WishlistRedirect = () => {
    return null;
};

export default WishlistRedirect;
