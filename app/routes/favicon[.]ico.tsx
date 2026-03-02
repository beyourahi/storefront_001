import type {Route} from "./+types/favicon[.]ico";
import {redirect} from "react-router";

const FAVICON_QUERY = `#graphql
  query Favicon(
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    siteSettings: metaobject(handle: {type: "site_settings", handle: "main"}) {
      favicon: field(key: "favicon") {
        reference {
          ... on MediaImage {
            image { url }
          }
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

        const metaobjectFavicon = data?.siteSettings?.favicon?.reference?.image?.url;

        if (metaobjectFavicon) {
            return redirect(metaobjectFavicon, {
                status: 302,
                headers: {
                    "Cache-Control": "public, max-age=86400, s-maxage=604800"
                }
            });
        }

        return new Response("Favicon not configured", {
            status: 404,
            headers: {
                "Content-Type": "text/plain",
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
