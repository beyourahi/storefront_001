import type {Route} from "./+types/[sitemap.xml]";
import {getSitemapIndex} from "@shopify/hydrogen";

/**
 * Serves the sitemap index, extending Shopify's generated index with a custom
 * entry that covers routes absent from the Shopify-generated sitemap
 * (faq, gallery, sale, changelog, wishlist).
 */
export const loader = async ({request, context: {storefront}}: Route.LoaderArgs) => {
    const shopifyResponse = await getSitemapIndex({storefront, request});

    // Shopify's generated index only covers products, collections, blogs, and pages.
    // Inject the custom sitemap so search engines discover our additional routes.
    const url = new URL(request.url);
    const origin = url.origin;
    const body = await shopifyResponse.text();
    const customEntry = `  <sitemap><loc>${origin}/sitemap.custom.xml</loc></sitemap>\n`;
    const enhanced = body.replace("</sitemapindex>", `${customEntry}</sitemapindex>`);

    return new Response(enhanced, {
        headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": `max-age=${60 * 60 * 24}`
        }
    });
};
