import type {Route} from "./+types/[robots.txt]";
import {parseGid} from "@shopify/hydrogen";

export const loader = async ({request, context}: Route.LoaderArgs) => {
    const url = new URL(request.url);

    const {shop} = await context.dataAdapter.query(ROBOTS_QUERY);

    const shopId = parseGid(shop.id).id;
    const body = robotsTxtData({url: url.origin, shopId});

    return new Response(body, {
        status: 200,
        headers: {
            "Content-Type": "text/plain",
            "Cache-Control": `max-age=${60 * 60 * 24}`
        }
    });
};

const robotsTxtData = ({url, shopId}: {shopId?: string; url?: string}) => {
    const sitemapUrl = url ? `${url}/sitemap.xml` : undefined;

    return `
User-agent: *
${generalDisallowRules({sitemapUrl, shopId})}

${aiCrawlerRules({shopId})}

User-agent: adsbot-google
Disallow: /checkouts/
Disallow: /checkout
Disallow: /carts
Disallow: /orders
${shopId ? `Disallow: /${shopId}/checkouts` : ""}
${shopId ? `Disallow: /${shopId}/orders` : ""}
Disallow: /*?*oseid=*
Disallow: /*preview_theme_id*
Disallow: /*preview_script_id*

User-agent: Nutch
Disallow: /

User-agent: AhrefsBot
Crawl-delay: 10
${generalDisallowRules({sitemapUrl, shopId})}

User-agent: AhrefsSiteAudit
Crawl-delay: 10
${generalDisallowRules({sitemapUrl, shopId})}

User-agent: MJ12bot
Crawl-Delay: 10

User-agent: Pinterest
Crawl-delay: 1
`.trim();
};

const aiCrawlerRules = ({shopId}: {shopId?: string}) => {
    return `# AI crawlers — explicitly permitted to index all public storefront content
User-agent: GPTBot
User-agent: OAI-SearchBot
User-agent: ChatGPT-User
User-agent: ClaudeBot
User-agent: anthropic-ai
User-agent: Claude-Web
User-agent: Google-Extended
User-agent: PerplexityBot
User-agent: YouBot
User-agent: Applebot-Extended
User-agent: cohere-ai
User-agent: CCBot
User-agent: Bytespider
Allow: /products
Allow: /collections
Allow: /blogs
Allow: /pages
Allow: /policies
Disallow: /admin
Disallow: /cart
Disallow: /checkout
Disallow: /checkouts/
Disallow: /carts
Disallow: /orders
Disallow: /account
${shopId ? `Disallow: /${shopId}/checkouts` : ""}
${shopId ? `Disallow: /${shopId}/orders` : ""}`;
};

const generalDisallowRules = ({shopId, sitemapUrl}: {shopId?: string; sitemapUrl?: string}) => {
    return `Disallow: /admin
Disallow: /cart
Disallow: /orders
Disallow: /checkouts/
Disallow: /checkout
${shopId ? `Disallow: /${shopId}/checkouts` : ""}
${shopId ? `Disallow: /${shopId}/orders` : ""}
Disallow: /carts
Disallow: /account
Disallow: /collections/*sort_by*
Disallow: /*/collections/*sort_by*
Disallow: /collections/*+*
Disallow: /collections/*%2B*
Disallow: /collections/*%2b*
Disallow: /*/collections/*+*
Disallow: /*/collections/*%2B*
Disallow: /*/collections/*%2b*
Disallow: */collections/*filter*&*filter*
Disallow: /blogs/*+*
Disallow: /blogs/*%2B*
Disallow: /blogs/*%2b*
Disallow: /*/blogs/*+*
Disallow: /*/blogs/*%2B*
Disallow: /*/blogs/*%2b*
Disallow: /*?*oseid=*
Disallow: /*preview_theme_id*
Disallow: /*preview_script_id*
Disallow: /*/*?*ls=*&ls=*
Disallow: /*/*?*ls%3D*%3Fls%3D*
Disallow: /*/*?*ls%3d*%3fls%3d*
Disallow: /search
Disallow: /apple-app-site-association
Disallow: /.well-known/shopify/monorail
${sitemapUrl ? `Sitemap: ${sitemapUrl}` : ""}`;
};

const ROBOTS_QUERY = `#graphql
  query StoreRobots(
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    shop {
      id
    }
  }
` as const;
