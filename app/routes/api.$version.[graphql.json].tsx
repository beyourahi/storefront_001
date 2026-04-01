import type {Route} from "./+types/api.$version.[graphql.json]";

/** Maximum allowed request body size in bytes (100KB) */
const MAX_BODY_SIZE = 100_000;

/** Valid API version format: YYYY-MM or "unstable" */
const API_VERSION_PATTERN = /^\d{4}-\d{2}$|^unstable$/;

/** Headers allowed to be forwarded to the Shopify Storefront API */
const ALLOWED_HEADERS = new Set([
    "content-type",
    "accept",
    "x-shopify-storefront-access-token",
    "x-sdk-version",
    "x-sdk-variant"
]);

export const action = async ({params, context, request}: Route.ActionArgs) => {
    // Validate API version format to prevent path traversal or injection
    if (!params.version || !API_VERSION_PATTERN.test(params.version)) {
        return new Response(JSON.stringify({error: "Invalid API version format"}), {
            status: 400,
            headers: {"Content-Type": "application/json"}
        });
    }

    // Enforce request body size limit to prevent abuse
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > MAX_BODY_SIZE) {
        return new Response(JSON.stringify({error: "Request body too large"}), {
            status: 413,
            headers: {"Content-Type": "application/json"}
        });
    }

    // Read and check actual body size (content-length can be spoofed)
    const body = await request.text();
    if (body.length > MAX_BODY_SIZE) {
        return new Response(JSON.stringify({error: "Request body too large"}), {
            status: 413,
            headers: {"Content-Type": "application/json"}
        });
    }

    // Build sanitized headers — only forward allowed headers, strip cookies/auth/etc.
    const forwardHeaders = new Headers();
    for (const [key, value] of request.headers.entries()) {
        if (ALLOWED_HEADERS.has(key.toLowerCase())) {
            forwardHeaders.set(key, value);
        }
    }

    const response = await fetch(`https://${context.env.PUBLIC_CHECKOUT_DOMAIN}/api/${params.version}/graphql.json`, {
        method: "POST",
        body,
        headers: forwardHeaders
    });

    return new Response(response.body, {headers: new Headers(response.headers)});
};
