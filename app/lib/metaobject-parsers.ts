import type {
    SiteSettings,
    SocialLink,
    Testimonial,
    FAQItem,
    InstagramMedia,
    SiteContent,
    HeroMedia,
    ProductContent,
    CartContent,
    AccountContent,
    SearchContent,
    UIMessages,
    ErrorContent,
    WishlistContent
} from "~/lib/fallback-data";
import type {ThemeFonts, ThemeCoreColors} from "~/lib/theme-utils";
import {
    FALLBACK_BRAND_WORDS,
    FALLBACK_SOCIAL_LINKS,
    FALLBACK_SITE_SETTINGS,
    FALLBACK_THEME_FONTS,
    FALLBACK_THEME_COLORS,
    FALLBACK_PRODUCT_CONTENT,
    FALLBACK_CART_CONTENT,
    FALLBACK_ACCOUNT_CONTENT,
    FALLBACK_SEARCH_CONTENT,
    FALLBACK_UI_MESSAGES,
    FALLBACK_ERROR_CONTENT,
    FALLBACK_WISHLIST_CONTENT
} from "~/lib/fallback-data";

export interface ThemeConfig {
    fonts: ThemeFonts;
    colors: ThemeCoreColors;
}

export const DEFAULT_THEME_CONFIG: ThemeConfig = {
    fonts: FALLBACK_THEME_FONTS,
    colors: FALLBACK_THEME_COLORS
};

// =============================================================================
// RE-EXPORTS FOR BACKWARDS COMPATIBILITY
// =============================================================================

// eslint-disable-next-line @typescript-eslint/naming-convention -- legacy export name for backwards compatibility
export const DEFAULT_words_to_describe_your_brand = FALLBACK_BRAND_WORDS;
export const DEFAULT_SOCIAL_LINKS = FALLBACK_SOCIAL_LINKS;
export const DEFAULT_SITE_SETTINGS: SiteSettings = FALLBACK_SITE_SETTINGS;

const parseHeroMedia = (heroMediaField: any): HeroMedia | undefined => {
    const ref = heroMediaField?.reference;
    if (!ref) return undefined;

    if (ref.__typename === "MediaImage" && ref.image?.url) {
        return {
            mediaType: "image",
            url: ref.image.url,
            altText: ref.image.altText,
            width: ref.image.width,
            height: ref.image.height
        };
    }

    if (ref.__typename === "Video" && ref.sources?.length > 0) {
        const mp4Source = ref.sources.find((s: any) => s.mimeType === "video/mp4");
        const videoSource = mp4Source || ref.sources[0];

        return {
            mediaType: "video",
            url: videoSource.url,
            altText: ref.previewImage?.altText,
            previewImage: ref.previewImage?.url
                ? {url: ref.previewImage.url, altText: ref.previewImage.altText}
                : undefined
        };
    }

    return undefined;
};

const parseBrandWords = (brandWordsField: any): string[] => {
    if (!brandWordsField?.value) return FALLBACK_BRAND_WORDS;

    try {
        const parsed = JSON.parse(brandWordsField.value) as unknown;
        if (
            Array.isArray(parsed) &&
            parsed.length > 0 &&
            parsed.every((item): item is string => typeof item === "string")
        ) {
            return parsed;
        }
        return FALLBACK_BRAND_WORDS;
    } catch {
        return FALLBACK_BRAND_WORDS;
    }
};

const parseAnnouncementTexts = (announcementField: any): string[] => {
    if (!announcementField?.value) return [];

    try {
        const parsed = JSON.parse(announcementField.value) as unknown;
        if (
            Array.isArray(parsed) &&
            parsed.length > 0 &&
            parsed.every((item): item is string => typeof item === "string")
        ) {
            return parsed;
        }
        return [];
    } catch {
        return [];
    }
};

const parseFreeShippingThreshold = (value: any): number | null => {
    if (!value?.value) return null;
    const parsed = parseFloat(value.value);
    return isNaN(parsed) ? null : parsed;
};

const extractHandleFromUrl = (url: string, platform: string): string => {
    try {
        const urlObj = new URL(url);
        const pathname = urlObj.pathname.replace(/^\/+|\/+$/g, "");
        if (!pathname) return "";

        const lowerPlatform = platform.toLowerCase();
        if (
            lowerPlatform === "instagram" ||
            lowerPlatform === "tiktok" ||
            lowerPlatform === "twitter" ||
            lowerPlatform === "x"
        ) {
            return `@${pathname}`;
        }
        if (lowerPlatform === "facebook" || lowerPlatform === "linkedin" || lowerPlatform === "youtube") {
            return `/${pathname}`;
        }
        return pathname;
    } catch {
        return "";
    }
};

const parseSocialLinks = (jsonField: any): SocialLink[] => {
    if (!jsonField?.value) return [];

    try {
        const parsed = JSON.parse(jsonField.value) as unknown;
        if (!Array.isArray(parsed) || parsed.length === 0) return [];

        const links = parsed
            .map((item: any, index: number) => {
                const platform = item.text || item.label || "";
                const url = item.url || "";
                return {
                    id: `social-${index}`,
                    platform,
                    handle: extractHandleFromUrl(url, platform),
                    url,
                    displayOrder: index + 1
                };
            })
            .filter((link: SocialLink) => link.platform && link.url);

        return links.length > 0 ? links : [];
    } catch {
        return [];
    }
};

const parseTestimonialsJson = (jsonField: any): Testimonial[] => {
    if (!jsonField?.value) return [];

    try {
        const parsed = JSON.parse(jsonField.value) as unknown;
        if (!Array.isArray(parsed)) return [];

        return parsed
            .map((item: any, index: number) => ({
                id: item.id || `testimonial-${index}`,
                customerName: item.customerName || "Anonymous",
                location: item.location || "",
                rating: parseInt(item.rating || "5", 10),
                text: item.text || "",
                avatar: item.avatarUrl
                    ? {url: item.avatarUrl, altText: item.avatarAltText || item.customerName}
                    : undefined
            }))
            .filter((t: Testimonial) => t.text);
    } catch {
        return [];
    }
};

const parseFaqItemsJson = (jsonField: any): FAQItem[] => {
    if (!jsonField?.value) return [];

    try {
        const parsed = JSON.parse(jsonField.value) as unknown;
        if (!Array.isArray(parsed)) return [];

        return parsed
            .map((item: any, index: number) => ({
                id: item.id || `faq-${index}`,
                question: item.question || "",
                answer: item.answer || ""
            }))
            .filter((f: FAQItem) => f.question && f.answer);
    } catch {
        return [];
    }
};

const extractImageUrl = (field: {reference?: {__typename?: string; image?: {url?: string}}} | null): string | null => {
    if (!field?.reference) return null;
    if (field.reference.__typename !== "MediaImage") return null;
    return field.reference.image?.url ?? null;
};

const parseInstagramMedia = (mediaField: any): InstagramMedia[] => {
    const nodes = mediaField?.references?.nodes;
    if (!Array.isArray(nodes) || nodes.length === 0) return [];

    return nodes
        .map((ref: any, index: number): InstagramMedia | null => {
            if (ref.__typename === "MediaImage" && ref.image?.url) {
                return {
                    id: ref.id || `instagram-${index}`,
                    mediaType: "image",
                    url: ref.image.url,
                    altText: ref.image.altText || `Instagram post ${index + 1}`,
                    width: ref.image.width,
                    height: ref.image.height
                };
            }

            if (ref.__typename === "Video" && ref.sources?.length > 0) {
                const mp4Source = ref.sources.find((s: any) => s.mimeType === "video/mp4");
                const videoSource = mp4Source || ref.sources[0];

                return {
                    id: ref.id || `instagram-${index}`,
                    mediaType: "video",
                    url: videoSource.url,
                    altText: ref.previewImage?.altText || `Instagram video ${index + 1}`,
                    previewImage: ref.previewImage?.url
                        ? {url: ref.previewImage.url, altText: ref.previewImage.altText}
                        : undefined
                };
            }

            return null;
        })
        .filter((item): item is InstagramMedia => item !== null);
};

const parseThemeFonts = (data: any): ThemeFonts => ({
    sans: data.fontBody?.value || FALLBACK_THEME_FONTS.sans,
    serif: data.fontHeading?.value || FALLBACK_THEME_FONTS.serif,
    mono: data.fontPrice?.value || FALLBACK_THEME_FONTS.mono
});

const isValidColor = (color: string): boolean => {
    if (!color || typeof color !== "string") return false;
    const trimmed = color.trim();
    if (trimmed.startsWith("oklch(") && trimmed.endsWith(")")) return true;
    if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(trimmed)) return true;
    return false;
};

const parseThemeColors = (data: any): ThemeCoreColors => {
    const primary = data.colorPrimary?.value;
    const secondary = data.colorSecondary?.value;
    const background = data.colorBackground?.value;
    const foreground = data.colorForeground?.value;
    const accent = data.colorAccent?.value;

    return {
        primary: isValidColor(primary) ? primary.trim() : FALLBACK_THEME_COLORS.primary,
        secondary: isValidColor(secondary) ? secondary.trim() : FALLBACK_THEME_COLORS.secondary,
        background: isValidColor(background) ? background.trim() : FALLBACK_THEME_COLORS.background,
        foreground: isValidColor(foreground) ? foreground.trim() : FALLBACK_THEME_COLORS.foreground,
        accent: isValidColor(accent) ? accent.trim() : FALLBACK_THEME_COLORS.accent
    };
};

export const parseThemeSettings = (data: any): ThemeConfig => {
    if (!data) return DEFAULT_THEME_CONFIG;

    return {
        fonts: parseThemeFonts(data),
        colors: parseThemeColors(data)
    };
};

export const parseSiteSettings = (data: any): SiteSettings => {
    if (!data) return FALLBACK_SITE_SETTINGS;

    const parsedTestimonials = parseTestimonialsJson(data.testimonialsData);
    const parsedFaqItems = parseFaqItemsJson(data.faqItemsData);
    const parsedInstagramMedia = parseInstagramMedia(data.instagramMediaData);

    return {
        brandName: data.brandName?.value || FALLBACK_SITE_SETTINGS.brandName,
        brandLogo: (() => {
            const ref = data.brandLogo?.reference;
            if (!ref || ref.__typename !== "MediaImage" || !ref.image?.url) return null;
            return {
                url: ref.image.url as string,
                altText: (ref.image.altText as string | null) ?? null,
                width: (ref.image.width as number | null) ?? null,
                height: (ref.image.height as number | null) ?? null
            };
        })(),
        brandWords: parseBrandWords(data.brandWords),
        missionStatement: data.missionStatement?.value || FALLBACK_SITE_SETTINGS.missionStatement,

        heroHeading: data.heroHeading?.value || FALLBACK_SITE_SETTINGS.heroHeading,
        heroDescription: data.heroDescription?.value || FALLBACK_SITE_SETTINGS.heroDescription,
        heroMediaMobile: parseHeroMedia(data.heroMediaMobile) || FALLBACK_SITE_SETTINGS.heroMediaMobile,
        heroMediaLargeScreen: parseHeroMedia(data.heroMediaLargeScreen) || FALLBACK_SITE_SETTINGS.heroMediaLargeScreen,

        siteUrl: data.siteUrl?.value || FALLBACK_SITE_SETTINGS.siteUrl,
        defaultSeoTitle: data.defaultSeoTitle?.value || FALLBACK_SITE_SETTINGS.defaultSeoTitle,
        defaultSeoDescription: data.defaultSeoDescription?.value || FALLBACK_SITE_SETTINGS.defaultSeoDescription,

        contactEmail: data.contactEmail?.value || FALLBACK_SITE_SETTINGS.contactEmail,
        contactPhone: data.contactPhone?.value || FALLBACK_SITE_SETTINGS.contactPhone,
        businessHours: data.businessHours?.value || FALLBACK_SITE_SETTINGS.businessHours,
        address: {
            street: data.streetAddress?.value || FALLBACK_SITE_SETTINGS.address.street,
            city: data.city?.value || FALLBACK_SITE_SETTINGS.address.city,
            state: data.state?.value || FALLBACK_SITE_SETTINGS.address.state,
            zip: data.zipCode?.value || FALLBACK_SITE_SETTINGS.address.zip,
            country: data.country?.value || FALLBACK_SITE_SETTINGS.address.country
        },

        blogSectionTitle: data.blogSectionTitle?.value || FALLBACK_SITE_SETTINGS.blogSectionTitle,
        collectionsTitle: data.collectionsTitle?.value || FALLBACK_SITE_SETTINGS.collectionsTitle,
        relatedProductsTitle: data.relatedProductsTitle?.value || FALLBACK_SITE_SETTINGS.relatedProductsTitle,
        recommendedTitle: data.recommendedTitle?.value || FALLBACK_SITE_SETTINGS.recommendedTitle,
        instagramTitle: data.instagramTitle?.value || FALLBACK_SITE_SETTINGS.instagramTitle,

        galleryPageHeading: data.galleryPageHeading?.value || FALLBACK_SITE_SETTINGS.galleryPageHeading,
        galleryPageDescription: data.galleryPageDescription?.value || FALLBACK_SITE_SETTINGS.galleryPageDescription,
        blogPageHeading: data.blogPageHeading?.value || FALLBACK_SITE_SETTINGS.blogPageHeading,
        blogPageDescription: data.blogPageDescription?.value || FALLBACK_SITE_SETTINGS.blogPageDescription,

        announcementBanner: parseAnnouncementTexts(data.announcementBanner),
        promotionalBannerOneMedia: parseHeroMedia(data.promotionalBannerOneMedia),
        promotionalBannerTwoMedia: parseHeroMedia(data.promotionalBannerTwoMedia),

        freeShippingThreshold: parseFreeShippingThreshold(data.freeShippingThreshold),

        socialLinks: parseSocialLinks(data.socialLinksData),
        testimonials: parsedTestimonials,
        faqItems: parsedFaqItems,
        instagramMedia: parsedInstagramMedia,

        faviconUrl: extractImageUrl(data.favicon),
        icon192Url: extractImageUrl(data.icon192),
        icon512Url: extractImageUrl(data.icon512),
        icon180AppleUrl: extractImageUrl(data.icon180Apple)
    };
};

export const parseProductContent = (data: unknown): ProductContent => {
    if (!data || typeof data !== "object") return FALLBACK_PRODUCT_CONTENT;
    const d = data as Record<string, {value?: string}>;

    return {
        addToCartStandard: d.addToCartStandard?.value || FALLBACK_PRODUCT_CONTENT.addToCartStandard,
        addToCartPreorder: d.addToCartPreorder?.value || FALLBACK_PRODUCT_CONTENT.addToCartPreorder,
        addToCartSoldOut: d.addToCartSoldOut?.value || FALLBACK_PRODUCT_CONTENT.addToCartSoldOut,
        addToCartSubscribe: d.addToCartSubscribe?.value || FALLBACK_PRODUCT_CONTENT.addToCartSubscribe,
        addToCartOffline: d.addToCartOffline?.value || FALLBACK_PRODUCT_CONTENT.addToCartOffline,
        offlineHelperText: d.offlineHelperText?.value || FALLBACK_PRODUCT_CONTENT.offlineHelperText,
        selectFrequency: d.selectFrequency?.value || FALLBACK_PRODUCT_CONTENT.selectFrequency,
        stockInStock: d.stockInStock?.value || FALLBACK_PRODUCT_CONTENT.stockInStock,
        stockOutOfStock: d.stockOutOfStock?.value || FALLBACK_PRODUCT_CONTENT.stockOutOfStock,
        stockLowTemplate: d.stockLowTemplate?.value || FALLBACK_PRODUCT_CONTENT.stockLowTemplate,
        purchaseTypeLabel: d.purchaseTypeLabel?.value || FALLBACK_PRODUCT_CONTENT.purchaseTypeLabel,
        oneTimeLabel: d.oneTimeLabel?.value || FALLBACK_PRODUCT_CONTENT.oneTimeLabel,
        subscribeSaveLabel: d.subscribeSaveLabel?.value || FALLBACK_PRODUCT_CONTENT.subscribeSaveLabel,
        savePercentageTemplate: d.savePercentageTemplate?.value || FALLBACK_PRODUCT_CONTENT.savePercentageTemplate,
        sizeGuideCta: d.sizeGuideCta?.value || FALLBACK_PRODUCT_CONTENT.sizeGuideCta,
        quantityLabel: d.quantityLabel?.value || FALLBACK_PRODUCT_CONTENT.quantityLabel,
        tabDescription: d.tabDescription?.value || FALLBACK_PRODUCT_CONTENT.tabDescription,
        tabShipping: d.tabShipping?.value || FALLBACK_PRODUCT_CONTENT.tabShipping,
        tabReviews: d.tabReviews?.value || FALLBACK_PRODUCT_CONTENT.tabReviews,
        badgeNew: d.badgeNew?.value || FALLBACK_PRODUCT_CONTENT.badgeNew,
        badgeSale: d.badgeSale?.value || FALLBACK_PRODUCT_CONTENT.badgeSale,
        badgeBestseller: d.badgeBestseller?.value || FALLBACK_PRODUCT_CONTENT.badgeBestseller,
        badgeClearance: d.badgeClearance?.value || FALLBACK_PRODUCT_CONTENT.badgeClearance,
        badgePremium: d.badgePremium?.value || FALLBACK_PRODUCT_CONTENT.badgePremium,
        badgePreorder: d.badgePreorder?.value || FALLBACK_PRODUCT_CONTENT.badgePreorder,
        badgeLimited: d.badgeLimited?.value || FALLBACK_PRODUCT_CONTENT.badgeLimited,
        shareButtonLabel: d.shareButtonLabel?.value || FALLBACK_PRODUCT_CONTENT.shareButtonLabel,
        wishlistAddLabel: d.wishlistAddLabel?.value || FALLBACK_PRODUCT_CONTENT.wishlistAddLabel,
        wishlistRemoveLabel: d.wishlistRemoveLabel?.value || FALLBACK_PRODUCT_CONTENT.wishlistRemoveLabel,
        relatedProductsTitle: d.relatedProductsTitle?.value || FALLBACK_PRODUCT_CONTENT.relatedProductsTitle
    };
};

export const parseCartContent = (data: unknown): CartContent => {
    if (!data || typeof data !== "object") return FALLBACK_CART_CONTENT;
    const d = data as Record<string, {value?: string}>;

    return {
        cartDrawerTitle: d.cartDrawerTitle?.value || FALLBACK_CART_CONTENT.cartDrawerTitle,
        cartPageTitle: d.cartPageTitle?.value || FALLBACK_CART_CONTENT.cartPageTitle,
        itemCountSingular: d.itemCountSingular?.value || FALLBACK_CART_CONTENT.itemCountSingular,
        itemCountPlural: d.itemCountPlural?.value || FALLBACK_CART_CONTENT.itemCountPlural,
        emptyCartHeading: d.emptyCartHeading?.value || FALLBACK_CART_CONTENT.emptyCartHeading,
        emptyCartCta: d.emptyCartCta?.value || FALLBACK_CART_CONTENT.emptyCartCta,
        quantityLabel: d.quantityLabel?.value || FALLBACK_CART_CONTENT.quantityLabel,
        removeLabel: d.removeLabel?.value || FALLBACK_CART_CONTENT.removeLabel,
        subtotalLabel: d.subtotalLabel?.value || FALLBACK_CART_CONTENT.subtotalLabel,
        shippingLabel: d.shippingLabel?.value || FALLBACK_CART_CONTENT.shippingLabel,
        taxLabel: d.taxLabel?.value || FALLBACK_CART_CONTENT.taxLabel,
        totalLabel: d.totalLabel?.value || FALLBACK_CART_CONTENT.totalLabel,
        taxShippingNotice: d.taxShippingNotice?.value || FALLBACK_CART_CONTENT.taxShippingNotice,
        discountPlaceholder: d.discountPlaceholder?.value || FALLBACK_CART_CONTENT.discountPlaceholder,
        discountApplyButton: d.discountApplyButton?.value || FALLBACK_CART_CONTENT.discountApplyButton,
        discountApplied: d.discountApplied?.value || FALLBACK_CART_CONTENT.discountApplied,
        discountError: d.discountError?.value || FALLBACK_CART_CONTENT.discountError,
        freeShippingLabel: d.freeShippingLabel?.value || FALLBACK_CART_CONTENT.freeShippingLabel,
        freeShippingUnlocked: d.freeShippingUnlocked?.value || FALLBACK_CART_CONTENT.freeShippingUnlocked,
        freeShippingAwayTemplate: d.freeShippingAwayTemplate?.value || FALLBACK_CART_CONTENT.freeShippingAwayTemplate,
        freeShippingAlmost: d.freeShippingAlmost?.value || FALLBACK_CART_CONTENT.freeShippingAlmost,
        freeShippingCalculating: d.freeShippingCalculating?.value || FALLBACK_CART_CONTENT.freeShippingCalculating,
        orderNotesPlaceholder: d.orderNotesPlaceholder?.value || FALLBACK_CART_CONTENT.orderNotesPlaceholder,
        checkoutButton: d.checkoutButton?.value || FALLBACK_CART_CONTENT.checkoutButton,
        checkoutCalculating: d.checkoutCalculating?.value || FALLBACK_CART_CONTENT.checkoutCalculating,
        checkoutOfflineWarning: d.checkoutOfflineWarning?.value || FALLBACK_CART_CONTENT.checkoutOfflineWarning,
        storeCreditNotice: d.storeCreditNotice?.value || FALLBACK_CART_CONTENT.storeCreditNotice,
        closeButton: d.closeButton?.value || FALLBACK_CART_CONTENT.closeButton,
        suggestionsTitle: d.suggestionsTitle?.value || FALLBACK_CART_CONTENT.suggestionsTitle
    };
};

export const parseAccountContent = (data: unknown): AccountContent => {
    if (!data || typeof data !== "object") return FALLBACK_ACCOUNT_CONTENT;
    const d = data as Record<string, {value?: string}>;

    return {
        greetingMorning: d.greetingMorning?.value || FALLBACK_ACCOUNT_CONTENT.greetingMorning,
        greetingMidday: d.greetingMidday?.value || FALLBACK_ACCOUNT_CONTENT.greetingMidday,
        greetingAfternoon: d.greetingAfternoon?.value || FALLBACK_ACCOUNT_CONTENT.greetingAfternoon,
        greetingEvening: d.greetingEvening?.value || FALLBACK_ACCOUNT_CONTENT.greetingEvening,
        greetingNight: d.greetingNight?.value || FALLBACK_ACCOUNT_CONTENT.greetingNight,
        greetingFallback: d.greetingFallback?.value || FALLBACK_ACCOUNT_CONTENT.greetingFallback,
        sectionRecentOrders: d.sectionRecentOrders?.value || FALLBACK_ACCOUNT_CONTENT.sectionRecentOrders,
        sectionQuickActions: d.sectionQuickActions?.value || FALLBACK_ACCOUNT_CONTENT.sectionQuickActions,
        sectionAccountStats: d.sectionAccountStats?.value || FALLBACK_ACCOUNT_CONTENT.sectionAccountStats,
        sectionRecentlyViewed: d.sectionRecentlyViewed?.value || FALLBACK_ACCOUNT_CONTENT.sectionRecentlyViewed,
        actionTrackOrders: d.actionTrackOrders?.value || FALLBACK_ACCOUNT_CONTENT.actionTrackOrders,
        actionShopNow: d.actionShopNow?.value || FALLBACK_ACCOUNT_CONTENT.actionShopNow,
        actionAddresses: d.actionAddresses?.value || FALLBACK_ACCOUNT_CONTENT.actionAddresses,
        actionGetHelp: d.actionGetHelp?.value || FALLBACK_ACCOUNT_CONTENT.actionGetHelp,
        actionEditProfile: d.actionEditProfile?.value || FALLBACK_ACCOUNT_CONTENT.actionEditProfile,
        actionOrderHistory: d.actionOrderHistory?.value || FALLBACK_ACCOUNT_CONTENT.actionOrderHistory,
        statOrdersPlaced: d.statOrdersPlaced?.value || FALLBACK_ACCOUNT_CONTENT.statOrdersPlaced,
        statSavedAddresses: d.statSavedAddresses?.value || FALLBACK_ACCOUNT_CONTENT.statSavedAddresses,
        statMemberSince: d.statMemberSince?.value || FALLBACK_ACCOUNT_CONTENT.statMemberSince,
        emptyNoOrdersHeading: d.emptyNoOrdersHeading?.value || FALLBACK_ACCOUNT_CONTENT.emptyNoOrdersHeading,
        emptyNoOrdersMessage: d.emptyNoOrdersMessage?.value || FALLBACK_ACCOUNT_CONTENT.emptyNoOrdersMessage,
        emptyNoAddresses: d.emptyNoAddresses?.value || FALLBACK_ACCOUNT_CONTENT.emptyNoAddresses,
        navDashboard: d.navDashboard?.value || FALLBACK_ACCOUNT_CONTENT.navDashboard,
        navOrders: d.navOrders?.value || FALLBACK_ACCOUNT_CONTENT.navOrders,
        navReturns: d.navReturns?.value || FALLBACK_ACCOUNT_CONTENT.navReturns,
        navWishlist: d.navWishlist?.value || FALLBACK_ACCOUNT_CONTENT.navWishlist,
        navAccountDetails: d.navAccountDetails?.value || FALLBACK_ACCOUNT_CONTENT.navAccountDetails,
        logoutButton: d.logoutButton?.value || FALLBACK_ACCOUNT_CONTENT.logoutButton,
        saveButton: d.saveButton?.value || FALLBACK_ACCOUNT_CONTENT.saveButton,
        cancelButton: d.cancelButton?.value || FALLBACK_ACCOUNT_CONTENT.cancelButton,
        viewAllOrders: d.viewAllOrders?.value || FALLBACK_ACCOUNT_CONTENT.viewAllOrders,
        storeCreditLabel: d.storeCreditLabel?.value || FALLBACK_ACCOUNT_CONTENT.storeCreditLabel,
        storeCreditAvailable: d.storeCreditAvailable?.value || FALLBACK_ACCOUNT_CONTENT.storeCreditAvailable
    };
};

export const parseSearchContent = (data: unknown): SearchContent => {
    if (!data || typeof data !== "object") return FALLBACK_SEARCH_CONTENT;
    const d = data as Record<string, {value?: string}>;

    return {
        searchPlaceholder: d.searchPlaceholder?.value || FALLBACK_SEARCH_CONTENT.searchPlaceholder,
        recentSearchesHeading: d.recentSearchesHeading?.value || FALLBACK_SEARCH_CONTENT.recentSearchesHeading,
        popularSearchesHeading: d.popularSearchesHeading?.value || FALLBACK_SEARCH_CONTENT.popularSearchesHeading,
        featuredCollectionsHeading:
            d.featuredCollectionsHeading?.value || FALLBACK_SEARCH_CONTENT.featuredCollectionsHeading,
        clearAllButton: d.clearAllButton?.value || FALLBACK_SEARCH_CONTENT.clearAllButton,
        emptyResultsHeading: d.emptyResultsHeading?.value || FALLBACK_SEARCH_CONTENT.emptyResultsHeading,
        emptyResultsMessageTemplate:
            d.emptyResultsMessageTemplate?.value || FALLBACK_SEARCH_CONTENT.emptyResultsMessageTemplate,
        viewAllResults: d.viewAllResults?.value || FALLBACK_SEARCH_CONTENT.viewAllResults,
        categoryProducts: d.categoryProducts?.value || FALLBACK_SEARCH_CONTENT.categoryProducts,
        categoryCollections: d.categoryCollections?.value || FALLBACK_SEARCH_CONTENT.categoryCollections,
        categoryArticles: d.categoryArticles?.value || FALLBACK_SEARCH_CONTENT.categoryArticles,
        sortFeatured: d.sortFeatured?.value || FALLBACK_SEARCH_CONTENT.sortFeatured,
        sortPriceLowHigh: d.sortPriceLowHigh?.value || FALLBACK_SEARCH_CONTENT.sortPriceLowHigh,
        sortPriceHighLow: d.sortPriceHighLow?.value || FALLBACK_SEARCH_CONTENT.sortPriceHighLow,
        sortNewest: d.sortNewest?.value || FALLBACK_SEARCH_CONTENT.sortNewest,
        sortBestSelling: d.sortBestSelling?.value || FALLBACK_SEARCH_CONTENT.sortBestSelling,
        sortAToZ: d.sortAToZ?.value || FALLBACK_SEARCH_CONTENT.sortAToZ,
        sortZToA: d.sortZToA?.value || FALLBACK_SEARCH_CONTENT.sortZToA,
        filterByPrice: d.filterByPrice?.value || FALLBACK_SEARCH_CONTENT.filterByPrice,
        filterByColor: d.filterByColor?.value || FALLBACK_SEARCH_CONTENT.filterByColor,
        filterBySize: d.filterBySize?.value || FALLBACK_SEARCH_CONTENT.filterBySize,
        filterAvailability: d.filterAvailability?.value || FALLBACK_SEARCH_CONTENT.filterAvailability,
        filterInStock: d.filterInStock?.value || FALLBACK_SEARCH_CONTENT.filterInStock,
        resultsCountTemplate: d.resultsCountTemplate?.value || FALLBACK_SEARCH_CONTENT.resultsCountTemplate,
        loadMoreButton: d.loadMoreButton?.value || FALLBACK_SEARCH_CONTENT.loadMoreButton,
        loadingText: d.loadingText?.value || FALLBACK_SEARCH_CONTENT.loadingText,
        gridViewLabel: d.gridViewLabel?.value || FALLBACK_SEARCH_CONTENT.gridViewLabel,
        listViewLabel: d.listViewLabel?.value || FALLBACK_SEARCH_CONTENT.listViewLabel,
        col2Label: d.col2Label?.value || FALLBACK_SEARCH_CONTENT.col2Label,
        col3Label: d.col3Label?.value || FALLBACK_SEARCH_CONTENT.col3Label,
        col4Label: d.col4Label?.value || FALLBACK_SEARCH_CONTENT.col4Label,
        applyFilters: d.applyFilters?.value || FALLBACK_SEARCH_CONTENT.applyFilters,
        clearFilters: d.clearFilters?.value || FALLBACK_SEARCH_CONTENT.clearFilters
    };
};

export const parseUIMessages = (data: unknown): UIMessages => {
    if (!data || typeof data !== "object") return FALLBACK_UI_MESSAGES;
    const d = data as Record<string, {value?: string}>;

    return {
        successGeneric: d.successGeneric?.value || FALLBACK_UI_MESSAGES.successGeneric,
        successCartAdd: d.successCartAdd?.value || FALLBACK_UI_MESSAGES.successCartAdd,
        successCartRemove: d.successCartRemove?.value || FALLBACK_UI_MESSAGES.successCartRemove,
        successWishlistAdd: d.successWishlistAdd?.value || FALLBACK_UI_MESSAGES.successWishlistAdd,
        successWishlistRemove: d.successWishlistRemove?.value || FALLBACK_UI_MESSAGES.successWishlistRemove,
        successWishlistCleared: d.successWishlistCleared?.value || FALLBACK_UI_MESSAGES.successWishlistCleared,
        successSaved: d.successSaved?.value || FALLBACK_UI_MESSAGES.successSaved,
        successLinkCopied: d.successLinkCopied?.value || FALLBACK_UI_MESSAGES.successLinkCopied,
        successDiscount: d.successDiscount?.value || FALLBACK_UI_MESSAGES.successDiscount,
        successSubscribed: d.successSubscribed?.value || FALLBACK_UI_MESSAGES.successSubscribed,
        errorGeneric: d.errorGeneric?.value || FALLBACK_UI_MESSAGES.errorGeneric,
        errorNetwork: d.errorNetwork?.value || FALLBACK_UI_MESSAGES.errorNetwork,
        errorSession: d.errorSession?.value || FALLBACK_UI_MESSAGES.errorSession,
        errorRequired: d.errorRequired?.value || FALLBACK_UI_MESSAGES.errorRequired,
        errorInvalidEmail: d.errorInvalidEmail?.value || FALLBACK_UI_MESSAGES.errorInvalidEmail,
        errorCopyFailed: d.errorCopyFailed?.value || FALLBACK_UI_MESSAGES.errorCopyFailed,
        loadingGeneric: d.loadingGeneric?.value || FALLBACK_UI_MESSAGES.loadingGeneric,
        loadingProcessing: d.loadingProcessing?.value || FALLBACK_UI_MESSAGES.loadingProcessing,
        loadingCalculating: d.loadingCalculating?.value || FALLBACK_UI_MESSAGES.loadingCalculating,
        loadingSaving: d.loadingSaving?.value || FALLBACK_UI_MESSAGES.loadingSaving,
        loadingAdding: d.loadingAdding?.value || FALLBACK_UI_MESSAGES.loadingAdding,
        validationPasswordShort: d.validationPasswordShort?.value || FALLBACK_UI_MESSAGES.validationPasswordShort,
        validationPasswordMismatch:
            d.validationPasswordMismatch?.value || FALLBACK_UI_MESSAGES.validationPasswordMismatch,
        validationEmailRequired: d.validationEmailRequired?.value || FALLBACK_UI_MESSAGES.validationEmailRequired,
        statusOnline: d.statusOnline?.value || FALLBACK_UI_MESSAGES.statusOnline,
        statusOffline: d.statusOffline?.value || FALLBACK_UI_MESSAGES.statusOffline,
        cartItemsRemain: d.cartItemsRemain?.value || FALLBACK_UI_MESSAGES.cartItemsRemain,
        cartQuantityUpdated: d.cartQuantityUpdated?.value || FALLBACK_UI_MESSAGES.cartQuantityUpdated,
        cartAllItemsAddedTemplate: d.cartAllItemsAddedTemplate?.value || FALLBACK_UI_MESSAGES.cartAllItemsAddedTemplate,
        cartSomeUnavailable: d.cartSomeUnavailable?.value || FALLBACK_UI_MESSAGES.cartSomeUnavailable
    };
};

export const parseErrorContent = (data: unknown): ErrorContent => {
    if (!data || typeof data !== "object") return FALLBACK_ERROR_CONTENT;
    const d = data as Record<string, {value?: string}>;

    return {
        notFoundHeading: d.notFoundHeading?.value || FALLBACK_ERROR_CONTENT.notFoundHeading,
        notFoundMessage: d.notFoundMessage?.value || FALLBACK_ERROR_CONTENT.notFoundMessage,
        notFoundPrimaryCta: d.notFoundPrimaryCta?.value || FALLBACK_ERROR_CONTENT.notFoundPrimaryCta,
        notFoundSecondaryCta: d.notFoundSecondaryCta?.value || FALLBACK_ERROR_CONTENT.notFoundSecondaryCta,
        serverErrorHeading: d.serverErrorHeading?.value || FALLBACK_ERROR_CONTENT.serverErrorHeading,
        serverErrorMessage: d.serverErrorMessage?.value || FALLBACK_ERROR_CONTENT.serverErrorMessage,
        serverErrorRetry: d.serverErrorRetry?.value || FALLBACK_ERROR_CONTENT.serverErrorRetry,
        serverErrorHome: d.serverErrorHome?.value || FALLBACK_ERROR_CONTENT.serverErrorHome,
        serverErrorContactPrefix: d.serverErrorContactPrefix?.value || FALLBACK_ERROR_CONTENT.serverErrorContactPrefix,
        serverErrorContactLink: d.serverErrorContactLink?.value || FALLBACK_ERROR_CONTENT.serverErrorContactLink,
        offlineHeading: d.offlineHeading?.value || FALLBACK_ERROR_CONTENT.offlineHeading,
        offlineMessage: d.offlineMessage?.value || FALLBACK_ERROR_CONTENT.offlineMessage,
        offlineRetry: d.offlineRetry?.value || FALLBACK_ERROR_CONTENT.offlineRetry,
        offlineHome: d.offlineHome?.value || FALLBACK_ERROR_CONTENT.offlineHome,
        offlineTip: d.offlineTip?.value || FALLBACK_ERROR_CONTENT.offlineTip,
        maintenanceHeading: d.maintenanceHeading?.value || FALLBACK_ERROR_CONTENT.maintenanceHeading,
        maintenanceMessage: d.maintenanceMessage?.value || FALLBACK_ERROR_CONTENT.maintenanceMessage,
        maintenanceEstimated: d.maintenanceEstimated?.value || FALLBACK_ERROR_CONTENT.maintenanceEstimated
    };
};

export const parseWishlistContent = (data: unknown): WishlistContent => {
    if (!data || typeof data !== "object") return FALLBACK_WISHLIST_CONTENT;
    const d = data as Record<string, {value?: string}>;

    return {
        pageHeading: d.pageHeading?.value || FALLBACK_WISHLIST_CONTENT.pageHeading,
        metaDescription: d.metaDescription?.value || FALLBACK_WISHLIST_CONTENT.metaDescription,
        itemCountLoading: d.itemCountLoading?.value || FALLBACK_WISHLIST_CONTENT.itemCountLoading,
        itemCountEmpty: d.itemCountEmpty?.value || FALLBACK_WISHLIST_CONTENT.itemCountEmpty,
        itemCountSingularTemplate:
            d.itemCountSingularTemplate?.value || FALLBACK_WISHLIST_CONTENT.itemCountSingularTemplate,
        itemCountPluralTemplate: d.itemCountPluralTemplate?.value || FALLBACK_WISHLIST_CONTENT.itemCountPluralTemplate,
        emptyHeading: d.emptyHeading?.value || FALLBACK_WISHLIST_CONTENT.emptyHeading,
        emptyMessage: d.emptyMessage?.value || FALLBACK_WISHLIST_CONTENT.emptyMessage,
        emptyCta: d.emptyCta?.value || FALLBACK_WISHLIST_CONTENT.emptyCta,
        sortNewest: d.sortNewest?.value || FALLBACK_WISHLIST_CONTENT.sortNewest,
        sortOldest: d.sortOldest?.value || FALLBACK_WISHLIST_CONTENT.sortOldest,
        sortPriceUp: d.sortPriceUp?.value || FALLBACK_WISHLIST_CONTENT.sortPriceUp,
        sortPriceDown: d.sortPriceDown?.value || FALLBACK_WISHLIST_CONTENT.sortPriceDown,
        listLabel: d.listLabel?.value || FALLBACK_WISHLIST_CONTENT.listLabel,
        shareButton: d.shareButton?.value || FALLBACK_WISHLIST_CONTENT.shareButton,
        addAllButton: d.addAllButton?.value || FALLBACK_WISHLIST_CONTENT.addAllButton,
        clearButton: d.clearButton?.value || FALLBACK_WISHLIST_CONTENT.clearButton,
        shareDialogHeading: d.shareDialogHeading?.value || FALLBACK_WISHLIST_CONTENT.shareDialogHeading,
        shareCopyLink: d.shareCopyLink?.value || FALLBACK_WISHLIST_CONTENT.shareCopyLink,
        shareCopied: d.shareCopied?.value || FALLBACK_WISHLIST_CONTENT.shareCopied,
        shareDescriptionTemplate:
            d.shareDescriptionTemplate?.value || FALLBACK_WISHLIST_CONTENT.shareDescriptionTemplate,
        clearDialogTitle: d.clearDialogTitle?.value || FALLBACK_WISHLIST_CONTENT.clearDialogTitle,
        clearDialogMessageTemplate:
            d.clearDialogMessageTemplate?.value || FALLBACK_WISHLIST_CONTENT.clearDialogMessageTemplate,
        clearDialogWarning: d.clearDialogWarning?.value || FALLBACK_WISHLIST_CONTENT.clearDialogWarning,
        clearDialogKeep: d.clearDialogKeep?.value || FALLBACK_WISHLIST_CONTENT.clearDialogKeep,
        clearDialogConfirm: d.clearDialogConfirm?.value || FALLBACK_WISHLIST_CONTENT.clearDialogConfirm,
        addAllSuccessTemplate: d.addAllSuccessTemplate?.value || FALLBACK_WISHLIST_CONTENT.addAllSuccessTemplate,
        unavailableHeading: d.unavailableHeading?.value || FALLBACK_WISHLIST_CONTENT.unavailableHeading,
        unavailableMessage: d.unavailableMessage?.value || FALLBACK_WISHLIST_CONTENT.unavailableMessage,
        clearUnavailableButton: d.clearUnavailableButton?.value || FALLBACK_WISHLIST_CONTENT.clearUnavailableButton,
        browseProductsButton: d.browseProductsButton?.value || FALLBACK_WISHLIST_CONTENT.browseProductsButton,
        sharedWishlistBadge: d.sharedWishlistBadge?.value || FALLBACK_WISHLIST_CONTENT.sharedWishlistBadge,
        sharedWishlistEmpty: d.sharedWishlistEmpty?.value || FALLBACK_WISHLIST_CONTENT.sharedWishlistEmpty,
        myWishlistTitle: d.myWishlistTitle?.value || FALLBACK_WISHLIST_CONTENT.myWishlistTitle,
        curatedItemsTemplate: d.curatedItemsTemplate?.value || FALLBACK_WISHLIST_CONTENT.curatedItemsTemplate
    };
};

export const parseSiteContent = (
    siteContentData: {siteSettings?: unknown} | null,
    themeSettingsData: {themeSettings?: unknown} | null
): SiteContent => ({
    siteSettings: parseSiteSettings(siteContentData?.siteSettings),
    themeConfig: parseThemeSettings(themeSettingsData?.themeSettings)
});
