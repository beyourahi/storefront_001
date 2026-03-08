import {createContext, useContext, type ReactNode} from "react";
import type {
    SiteContent,
    SiteSettings,
    ContactInfo,
    SocialLink,
    SectionHeadings,
    Testimonial,
    FAQItem,
    InstagramMedia,
    HeroMedia,
    ThemeConfig
} from "~/lib/metaobject-parsers";
import {DEFAULT_SITE_SETTINGS, DEFAULT_THEME_CONFIG} from "~/lib/metaobject-parsers";
import type {ThemeFonts, ThemeCoreColors, GeneratedTheme} from "~/lib/theme-utils";
import {generateTheme} from "~/lib/theme-utils";
import {getSwatchBorderColor, getSmartSwatchBorderColor} from "~/lib/color";

const SiteContentContext = createContext<SiteContent | null>(null);

interface SiteContentProviderProps {
    children: ReactNode;
    siteContent: SiteContent;
}

export const SiteContentProvider = ({children, siteContent}: SiteContentProviderProps) => (
    <SiteContentContext.Provider value={siteContent}>{children}</SiteContentContext.Provider>
);

export const useSiteContent = (): SiteContent => {
    const context = useContext(SiteContentContext);
    if (!context) {
        throw new Error("useSiteContent must be used within a SiteContentProvider");
    }
    return context;
};

export const useSiteContentSafe = (): SiteContent => {
    const context = useContext(SiteContentContext);
    if (!context) {
        return {
            siteSettings: DEFAULT_SITE_SETTINGS,
            themeConfig: DEFAULT_THEME_CONFIG
        };
    }
    return context;
};

export const useThemeConfig = (): ThemeConfig => useSiteContentSafe().themeConfig;

export const useSiteSettings = (): SiteSettings => useSiteContentSafe().siteSettings;

export const useContactInfo = (): ContactInfo => {
    const settings = useSiteSettings();
    return {
        email: settings.contactEmail,
        phone: settings.contactPhone,
        businessHours: settings.businessHours,
        address: settings.address
    };
};

export const useSocialLinks = (): SocialLink[] => useSiteSettings().socialLinks;

export const useSectionHeadings = (): SectionHeadings => {
    const settings = useSiteSettings();
    return {
        blogSectionTitle: settings.blogSectionTitle,
        collectionsTitle: settings.collectionsTitle,
        relatedProductsTitle: settings.relatedProductsTitle,
        recommendedTitle: settings.recommendedTitle,
        instagramTitle: settings.instagramTitle
    };
};

export const useBrandMarquee = (): {words: string[]} => {
    const {brandWords} = useSiteSettings();
    return {words: brandWords};
};

export const usePromotionalBanners = (): {
    announcement: string[];
    bannerOneMedia?: HeroMedia;
    bannerTwoMedia?: HeroMedia;
} => {
    const settings = useSiteSettings();
    return {
        announcement: settings.announcementBanner,
        bannerOneMedia: settings.promotionalBannerOneMedia,
        bannerTwoMedia: settings.promotionalBannerTwoMedia
    };
};

export const useTestimonials = (): Testimonial[] => useSiteSettings().testimonials;

export const useFaqItems = (): FAQItem[] => useSiteSettings().faqItems;

export const useInstagramMedia = (): InstagramMedia[] => useSiteSettings().instagramMedia;

export const useThemeFonts = (): ThemeFonts => useThemeConfig().fonts;

export const useThemeColors = (): ThemeCoreColors => useThemeConfig().colors;

export const useGeneratedTheme = (): GeneratedTheme | null => {
    const themeConfig = useThemeConfig();
    return generateTheme(themeConfig.colors, themeConfig.fonts);
};

export const useSwatchBorderColor = (swatchColor: string | null | undefined, customBackground?: string): string => {
    const themeColors = useThemeColors();
    const backgroundColor = customBackground || themeColors.background;
    return getSwatchBorderColor(swatchColor, backgroundColor);
};

export const useSwatchBorderColorOnPrimary = (swatchColor: string | null | undefined): string => {
    const themeColors = useThemeColors();
    return getSwatchBorderColor(swatchColor, themeColors.primary);
};

export const useSmartSwatchBorderColor = (
    swatchColor: string | null | undefined,
    isSelected: boolean,
    onPrimaryBackground: boolean = false
): string => {
    const themeColors = useThemeColors();
    return getSmartSwatchBorderColor({
        swatchColor,
        backgroundColor: themeColors.background,
        isSelected,
        onPrimaryBackground,
        themeColors
    });
};
