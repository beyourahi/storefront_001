import type {Route} from "./+types/manifest[.]webmanifest";
import {PWA_MANIFEST_QUERY} from "~/lib/pwa-queries";
import {buildWebAppManifest, getThemeColor} from "~/lib/pwa-parsers";
import {parseSiteSettings, parseThemeSettings} from "~/lib/metaobject-parsers";

export const loader = async ({context, request}: Route.LoaderArgs) => {
    const {dataAdapter} = context;

    const url = new URL(request.url);
    const manifestUrl = `${url.origin}/manifest.webmanifest`;

    try {
        const data = await dataAdapter.query(PWA_MANIFEST_QUERY, {
            cache: dataAdapter.CacheLong()
        });

        const siteSettings = parseSiteSettings(data?.siteSettings);
        const themeConfig = parseThemeSettings(data?.themeSettings);

        const manifest = buildWebAppManifest(siteSettings, themeConfig, manifestUrl);

        if (!manifest) {
            console.error("[PWA Manifest] Missing PWA icons in site_settings; serving minimal manifest");
            return new Response(
                JSON.stringify(
                    {
                        name: siteSettings.brandName || "Store",
                        short_name: (siteSettings.brandName || "Store").slice(0, 12),
                        description: siteSettings.missionStatement || `Shop at ${siteSettings.brandName || "Store"}`,
                        start_url: "/",
                        scope: "/",
                        display: "standalone",
                        orientation: "any",
                        theme_color: getThemeColor(themeConfig),
                        background_color: "#ffffff",
                        categories: ["shopping"],
                        icons: [],
                        related_applications: [
                            {
                                platform: "webapp",
                                url: manifestUrl
                            }
                        ],
                        prefer_related_applications: false,
                        id: "/"
                    },
                    null,
                    2
                ),
                {
                    status: 200,
                    headers: {
                        "Content-Type": "application/manifest+json",
                        "Cache-Control": "public, max-age=300"
                    }
                }
            );
        }

        return new Response(JSON.stringify(manifest, null, 2), {
            status: 200,
            headers: {
                "Content-Type": "application/manifest+json",
                "Cache-Control": "public, max-age=3600, s-maxage=86400"
            }
        });
    } catch (error) {
        console.error("[PWA Manifest] Error generating manifest:", error);

        const fallbackManifest = {
            name: "Store",
            short_name: "Store",
            start_url: "/",
            display: "standalone" as const,
            background_color: "#ffffff",
            theme_color: "#000000"
        };

        return new Response(JSON.stringify(fallbackManifest, null, 2), {
            status: 200,
            headers: {
                "Content-Type": "application/manifest+json",
                "Cache-Control": "public, max-age=300"
            }
        });
    }
};
