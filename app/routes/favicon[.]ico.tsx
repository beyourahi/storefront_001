import type {Route} from "./+types/favicon[.]ico";
import {redirect} from "react-router";
import {parseSiteSettings, parseShopBrand} from "~/lib/metaobject-parsers";
import {buildLettermarkIconSvg} from "~/lib/pwa-parsers";

const FAVICON_QUERY = `#graphql
  query Favicon(
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    siteSettings: metaobject(handle: {type: "site_settings", handle: "main"}) {
      favicon: field(key: "favicon") {
        reference {
          ... on MediaImage {
            __typename
            image { url }
          }
        }
      }
      icon192: field(key: "icon_192") {
        reference {
          ... on MediaImage {
            __typename
            image { url altText width height }
          }
        }
      }
    }
    shop {
      name
      brand {
        logo {
          image { url }
        }
      }
    }
  }
` as const;

export const loader = async ({context}: Route.LoaderArgs) => {
    const {dataAdapter} = context;

    try {
        const data = await dataAdapter.query(FAVICON_QUERY, {
            cache: dataAdapter.CacheLong()
        });

        const siteSettings = {...parseSiteSettings(data?.siteSettings), ...parseShopBrand(data?.shop)};
        const metaobjectFavicon = siteSettings.faviconUrl || siteSettings.brandLogo?.url || siteSettings.icon192Url;

        if (metaobjectFavicon) {
            return redirect(metaobjectFavicon, {
                status: 302,
                headers: {
                    "Cache-Control": "public, max-age=86400, s-maxage=604800"
                }
            });
        }

        return new Response(buildLettermarkIconSvg(siteSettings.brandName || "Store"), {
            status: 200,
            headers: {
                "Content-Type": "image/svg+xml",
                "Cache-Control": "public, max-age=300"
            }
        });
    } catch (error) {
        console.error("[Favicon] Error:", error);
        return new Response("Error loading favicon", {
            status: 500,
            headers: {
                "Content-Type": "text/plain",
                "Cache-Control": "no-store"
            }
        });
    }
};
