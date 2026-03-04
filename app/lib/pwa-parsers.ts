import type {SiteSettings, ThemeConfig} from "~/lib/metaobject-parsers";
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

export interface ShopBrandData {
    name: string;
    description: string | null;
    shortDescription: string | null;
    logoUrl: string | null;
    primaryColor: string | null;
}

const toHexColor = (color: string): string => {
    const hex = toHex(color);
    return hex ?? "#000000";
};

export const parseShopBrand = (shop: any): ShopBrandData => ({
    name: shop?.name ?? "Store",
    description: shop?.description ?? null,
    shortDescription: shop?.brand?.shortDescription ?? null,
    logoUrl: shop?.brand?.logo?.image?.url ?? null,
    primaryColor: shop?.brand?.colors?.primary?.[0]?.background ?? null
});

const buildIconsArray = (siteSettings: SiteSettings): ManifestIcon[] | null => {
    const icons: ManifestIcon[] = [];

    const icon192 = siteSettings.icon192Url;
    if (icon192) {
        icons.push({
            src: icon192,
            sizes: "192x192",
            type: "image/png",
            purpose: "any"
        });
    }

    const icon512 = siteSettings.icon512Url;
    if (icon512) {
        icons.push({
            src: icon512,
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable"
        });
    }

    if (icons.length === 0) {
        return null;
    }

    return icons;
};

export const buildWebAppManifest = (
    siteSettings: SiteSettings,
    themeConfig: ThemeConfig,
    shopBrand: ShopBrandData,
    manifestUrl: string
): WebAppManifest | null => {
    const icons = buildIconsArray(siteSettings);
    if (!icons) {
        return null;
    }

    const themeColor = toHexColor(themeConfig.colors.primary);
    const backgroundColor = toHexColor(themeConfig.colors.background);

    return {
        name: siteSettings.brandName || shopBrand.name,
        short_name: (siteSettings.brandName || shopBrand.name).slice(0, 12),
        description:
            siteSettings.missionStatement ||
            shopBrand.shortDescription ||
            shopBrand.description ||
            `Shop at ${shopBrand.name}`,
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
    return siteSettings.icon180AppleUrl ?? null;
};

export const getThemeColor = (themeConfig: ThemeConfig): string => {
    return toHexColor(themeConfig.colors.primary);
};
