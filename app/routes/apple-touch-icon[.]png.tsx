import type {Route} from "./+types/apple-touch-icon[.]png";
import {redirect} from "react-router";
import {SITE_SETTINGS_FRAGMENT} from "~/lib/metaobject-fragments";
import {parseSiteSettings} from "~/lib/metaobject-parsers";
import {buildLettermarkIconSvg, getAppleTouchIconUrl} from "~/lib/pwa-parsers";

const APPLE_ICON_QUERY = `#graphql
  query AppleTouchIcon(
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    siteSettings: metaobject(handle: {type: "site_settings", handle: "main"}) {
      ...SiteSettings
    }
  }
  ${SITE_SETTINGS_FRAGMENT}
` as const;

export const loader = async ({context}: Route.LoaderArgs) => {
    const {dataAdapter} = context;

    try {
        const data = await dataAdapter.query(APPLE_ICON_QUERY, {
            cache: dataAdapter.CacheLong()
        });

        const siteSettings = parseSiteSettings(data?.siteSettings);
        const iconUrl = getAppleTouchIconUrl(siteSettings);

        if (iconUrl) {
            return redirect(iconUrl, {
                status: 302,
                headers: {
                    "Cache-Control": "public, max-age=3600, s-maxage=86400"
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
        console.error("[Apple Touch Icon] Error:", error);
        return new Response("Error loading icon", {
            status: 500,
            headers: {
                "Content-Type": "text/plain",
                "Cache-Control": "no-store"
            }
        });
    }
};
