import {redirect} from "react-router";
import type {MetaFunction} from "react-router";

export const meta: MetaFunction = () => [{title: "Redirecting..."}, {name: "robots", content: "noindex"}];

export const loader = async () => {
    return redirect("/collections/all-products");
};

export {RouteErrorBoundary as ErrorBoundary} from "~/components/RouteErrorBoundary";
