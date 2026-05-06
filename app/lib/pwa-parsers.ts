import type {SiteSettings, ThemeConfig} from "types";
import {toHex} from "./color";

export interface ManifestIcon {
    src: string;
    sizes: string;
    type: string;
    purpose?: "any" | "maskable" | "monochrome";
}

export interface RelatedApplication {
    platform: "webapp" | "play" | "itunes" | "windows";
    url?: string;
    id?: string;
}

export interface WebAppManifest {
    name: string;
    short_name: string;
    description: string;
    start_url: string;
    scope: string;
    display: "standalone" | "fullscreen" | "minimal-ui" | "browser";
    orientation: "any" | "portrait" | "landscape";
    theme_color: string;
    background_color: string;
    categories: string[];
    icons: ManifestIcon[];
    related_applications: RelatedApplication[];
    prefer_related_applications: boolean;
    id: string;
}

/** Truncate text at a word boundary to avoid cutting words mid-way (e.g. for PWA home-screen labels). */
function truncateToWordBoundary(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    const truncated = text.slice(0, maxLength);
    const lastSpace = truncated.lastIndexOf(" ");
    return lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated;
}

const toHexColor = (color: string): string => {
    const hex = toHex(color);
    return hex ?? "#000000";
};

const buildIconsArray = (siteSettings: SiteSettings): ManifestIcon[] => {
    const icons: ManifestIcon[] = [];
    const logo = siteSettings.brandLogo?.url;

    // Prefer explicit icon URLs from metaobjects, then resize brand logo via Shopify CDN
    const icon192 = siteSettings.icon192Url ?? (logo ? `${logo}&width=192&height=192` : null);
    const icon512 = siteSettings.icon512Url ?? (logo ? `${logo}&width=512&height=512` : null);

    if (icon192) {
        icons.push({
            src: icon192,
            sizes: "192x192",
            type: "image/png",
            purpose: "any"
        });
    }

    if (icon512) {
        icons.push({
            src: icon512,
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable"
        });
    }

    // Static fallbacks when no brand logo is available (PWA installability requires 192 + 512)
    if (!icon192) {
        icons.push({src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any"});
    }
    if (!icon512) {
        icons.push({src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable"});
    }

    // Always include favicon
    icons.push({src: "/favicon.ico", sizes: "48x48", type: "image/x-icon"});

    return icons;
};

export const buildWebAppManifest = (
    siteSettings: SiteSettings,
    themeConfig: ThemeConfig,
    manifestUrl: string
): WebAppManifest => {
    const icons = buildIconsArray(siteSettings);
    const themeColor = toHexColor(themeConfig.colors.primary);
    const backgroundColor = toHexColor(themeConfig.colors.background);

    return {
        name: siteSettings.brandName || "Store",
        short_name: truncateToWordBoundary(siteSettings.brandName || "Store", 12),
        description: siteSettings.missionStatement || `Shop at ${siteSettings.brandName || "Store"}`,
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "any",
        categories: ["shopping"],
        theme_color: themeColor,
        background_color: backgroundColor,
        icons,
        id: "/",
        related_applications: [
            {
                platform: "webapp",
                url: manifestUrl
            }
        ],
        prefer_related_applications: false
    };
};

export const getAppleTouchIconUrl = (siteSettings: SiteSettings): string | null => {
    return siteSettings.icon180AppleUrl ?? siteSettings.icon192Url ?? siteSettings.brandLogo?.url ?? null;
};

export const buildLettermarkIconSvg = (brandName: string): string => {
    const letter = brandName.trim().charAt(0).toUpperCase() || "S";
    return [
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180" role="img" aria-label="${letter}">`,
        `<rect width="180" height="180" rx="32" fill="#161616" />`,
        `<text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" fill="#ffffff"`,
        ` font-family="Inter, Arial, sans-serif" font-size="88" font-weight="700">${letter}</text>`,
        `</svg>`
    ].join("");
};

export const getThemeColor = (themeConfig: ThemeConfig): string => {
    return toHexColor(themeConfig.colors.primary);
};
