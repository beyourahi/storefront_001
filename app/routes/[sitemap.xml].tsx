import type {Route} from "./+types/[sitemap.xml]";
import {getSitemapIndex} from "@shopify/hydrogen";

export const loader = async ({request, context: {storefront}}: Route.LoaderArgs) => {
    const shopifyResponse = await getSitemapIndex({storefront, request});

    // Inject custom sitemap entry for pages not covered by Shopify's default sitemap
    // (contact, faq, gallery, sale are custom routes absent from the Shopify-generated index)
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
