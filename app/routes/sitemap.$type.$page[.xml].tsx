import type {Route} from "./+types/sitemap.$type.$page[.xml]";
import {getSitemap} from "@shopify/hydrogen";
import {STORE_SITEMAP_LOCALE} from "~/lib/store-locale";

export const loader = async ({request, params, context: {storefront}}: Route.LoaderArgs) => {
    const response = await getSitemap({
        storefront,
        request,
        params,
        locales: [STORE_SITEMAP_LOCALE],
        getLink: ({type, baseUrl, handle, locale}) => {
            if (!locale) return `${baseUrl}/${type}/${handle}`;
            return `${baseUrl}/${locale}/${type}/${handle}`;
        }
    });

    response.headers.set("Cache-Control", `max-age=${60 * 60 * 24}`);

    return response;
};
