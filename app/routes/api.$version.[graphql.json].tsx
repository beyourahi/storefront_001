import type {Route} from "./+types/api.$version.[graphql.json]";

const VALID_API_VERSION = /^\d{4}-\d{2}$/;
const FORWARDED_HEADERS = ["Content-Type", "Accept"] as const;

export const action = async ({params, context, request}: Route.ActionArgs) => {
    if (!params.version || (!VALID_API_VERSION.test(params.version) && params.version !== "unstable")) {
        return new Response(JSON.stringify({error: "Invalid API version"}), {
            status: 400,
            headers: {"Content-Type": "application/json"}
        });
    }

    const upstreamHeaders = new Headers();
    for (const name of FORWARDED_HEADERS) {
        const value = request.headers.get(name);
        if (value) upstreamHeaders.set(name, value);
    }
    upstreamHeaders.set("X-Shopify-Storefront-Access-Token", context.env.PUBLIC_STOREFRONT_API_TOKEN);

    const response = await fetch(
        `https://${context.env.PUBLIC_CHECKOUT_DOMAIN}/api/${params.version}/graphql.json`,
        {method: "POST", body: request.body, headers: upstreamHeaders}
    );

    return new Response(response.body, {headers: new Headers(response.headers)});
};
