import type {Route} from "./+types/sitemap[.]custom[.]xml";

/**
 * Custom sitemap for routes not included in the Shopify-generated sitemap index.
 * Referenced from /sitemap.xml via a <sitemap> entry injection.
 */
export const loader = async ({request}: Route.LoaderArgs) => {
    const url = new URL(request.url);
    const origin = url.origin;

    const today = new Date().toISOString().split("T")[0];
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${origin}/faq</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>
  <url><loc>${origin}/gallery</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.5</priority></url>
  <url><loc>${origin}/sale</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>0.7</priority></url>
</urlset>`;

    return new Response(xml, {
        headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": `max-age=${60 * 60 * 24}`
        }
    });
};
