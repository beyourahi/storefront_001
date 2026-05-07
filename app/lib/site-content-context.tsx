/**
 * @fileoverview Site Content React Context Provider and Hooks
 *
 * @description
 * React Context system for providing site-wide content from Shopify metaobjects (site_settings
 * and theme_settings) throughout the application. Offers specialized hooks for accessing
 * specific content sections with type safety and fallback defaults.
 *
 * @architecture
 * Context Provider Pattern (Simplified - 80/20 Rule):
 * - SiteContentProvider wraps app in root.tsx
 * - Data fetched in root.tsx loader from 2 metaobjects (site_settings + theme_settings)
 * - Provides SiteSettings + ThemeConfig to all routes/components
 * - Hooks offer typed access to specific content sections
 *
 * Note: UI content hooks (useProductContent, useCartContent, etc.) have been removed.
 * Components now import FALLBACK_* constants directly from metaobject-parsers.ts.
 * This follows the 80/20 rule - only high-value, frequently-changed content
 * (brand, hero, promotions, theme) needs Shopify Admin control.
 *
 * Data Structure:
 * - SiteSettings: Brand, hero, SEO, sections, promotions, collections
 * - ThemeConfig: Fonts (sans, serif, mono) + Colors (primary, secondary, background, foreground, accent)
 *
 * Hook Variants:
 * - useSiteContent(): Full content (throws if outside provider)
 * - useSiteContentSafe(): Full content with fallback defaults
 * - useSiteSettings(): Only site settings
 * - useThemeConfig(): Only theme configuration
 * - useSocialLinks(): Social media links array
 * - useSectionHeadings(): Section heading strings
 * - useTestimonials(), useFaqItems(), useInstagramMedia(): Collections
 * - useGeneratedTheme(): Complete theme with CSS variables and fonts
 *
 * @dependencies
 * - React (createContext, useContext)
 * - TypeScript types from types/index.ts
 * - Default values from ./metaobject-parsers.ts
 * - Theme generation from ./theme-utils.ts
 *
 * @related
 * - app/root.tsx - Fetches data and wraps app with SiteContentProvider
 * - app/lib/metaobject-queries.ts - GraphQL queries for site content
 * - app/lib/metaobject-parsers.ts - Parses query results into typed objects
 * - app/lib/theme-utils.ts - Generates CSS variables from theme config
 * - app/lib/metaobject-parsers.ts - FALLBACK_* constants for UI content (import directly)
 * - app/components/* - All components can use hooks to access site content
 */

import {createContext, useContext, useMemo, type ReactNode} from "react";
import type {
    SiteContent,
    SiteSettings,
    SocialLink,
    FAQItem,
    ThemeCoreColors,
    ThemeConfig,
    TrafficSourceBanner,
    HomepageVariant
} from "types";
import {
    DEFAULT_SITE_SETTINGS,
    DEFAULT_THEME_CONFIG,
    FALLBACK_AGENT_ARRIVAL_COPY
} from "~/lib/metaobject-parsers";
import {getSmartSwatchBorderColor} from "~/lib/color";

// =============================================================================
// SOCIAL LINK VALIDATION
// =============================================================================

// Bare platform homepage URLs that indicate an unconfigured social link.
// Comparison is done after normalizing (trim, strip trailing slash, lowercase).
const GENERIC_SOCIAL_URLS = new Set([
    "https://www.instagram.com", "https://instagram.com",
    "http://www.instagram.com", "http://instagram.com",
    "https://www.facebook.com", "https://facebook.com",
    "http://www.facebook.com", "http://facebook.com",
    "https://www.threads.net", "https://threads.net",
    "https://www.threads.com", "https://threads.com",
    "https://www.twitter.com", "https://twitter.com",
    "http://www.twitter.com", "http://twitter.com",
    "https://www.x.com", "https://x.com",
    "http://www.x.com", "http://x.com",
    "https://www.tiktok.com", "https://tiktok.com",
    "http://www.tiktok.com", "http://tiktok.com",
    "https://www.youtube.com", "https://youtube.com",
    "http://www.youtube.com", "http://youtube.com",
    "https://www.pinterest.com", "https://pinterest.com",
    "http://www.pinterest.com", "http://pinterest.com",
    "https://www.linkedin.com", "https://linkedin.com",
    "http://www.linkedin.com", "http://linkedin.com",
    "https://www.snapchat.com", "https://snapchat.com",
    "https://www.whatsapp.com", "https://whatsapp.com",
    "https://wa.me", "https://www.wa.me"
]);

function isValidSocialUrl(url: string): boolean {
    if (!url || !url.trim()) return false;
    try {
        new URL(url);
    } catch {
        return false;
    }
    const normalized = url.trim().replace(/\/+$/, "").toLowerCase();
    return !GENERIC_SOCIAL_URLS.has(normalized);
}

// =============================================================================
// CONTEXT
// =============================================================================

/**
 * Context provides SiteContent (site_settings + theme_settings)
 * UI content uses FALLBACK_* constants directly from metaobject-parsers.ts
 */
const SiteContentContext = createContext<SiteContent | null>(null);

// =============================================================================
// PROVIDER
// =============================================================================

interface SiteContentProviderProps {
    children: ReactNode;
    siteContent: SiteContent;
}

/**
 * Provider component that wraps the application to provide site content
 * Use at the root level (in root.tsx) to make content available everywhere
 */
export function SiteContentProvider({children, siteContent}: SiteContentProviderProps) {
    return <SiteContentContext.Provider value={siteContent}>{children}</SiteContentContext.Provider>;
}

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Hook to access the full site content
 * Throws an error if used outside of SiteContentProvider
 */
export function useSiteContentSafe(): SiteContent {
    const context = useContext(SiteContentContext);
    if (!context) {
        return {
            siteSettings: DEFAULT_SITE_SETTINGS,
            themeConfig: DEFAULT_THEME_CONFIG
        };
    }
    return context;
}

/**
 * Hook to access theme configuration
 * Returns the theme config from site content (fonts and colors)
 */
export function useThemeConfig(): ThemeConfig {
    return useSiteContentSafe().themeConfig;
}

/**
 * Hook to access site settings (contains ALL site configuration)
 */
export function useSiteSettings(): SiteSettings {
    return useSiteContentSafe().siteSettings;
}

// =============================================================================
// HOOKS FOR COLLECTIONS (JSON arrays stored in site_settings)
// =============================================================================

/**
 * Hook to access FAQ items
 * Returns the faqItems array from site settings
 */
export function useFaqItems(): FAQItem[] {
    return useSiteSettings().faqItems;
}

/**
 * Hook to access validated social links from site_settings.
 * Filters out empty, malformed, or unconfigured (bare platform homepage) URLs.
 * Returns sorted by displayOrder — safe to render directly without further filtering.
 */
export function useSocialLinks(): SocialLink[] {
    const {socialLinks} = useSiteSettings();
    return useMemo(
        () =>
            (socialLinks ?? [])
                .filter(link => isValidSocialUrl(link.url))
                .sort((a, b) => a.displayOrder - b.displayOrder),
        [socialLinks]
    );
}

/**
 * Hook to access shop location data (Google Maps embeds + share links).
 * Returns index-paired arrays — consumers zip them and skip incomplete pairs.
 * Both arrays are empty when no locations are configured in Shopify Admin.
 */
export function useShopLocation(): {embedUrls: string[]; shareLinks: string[]} {
    const settings = useSiteSettings();
    return useMemo(
        () => ({
            embedUrls: settings.googleMapsEmbed,
            shareLinks: settings.googleMapsLink
        }),
        [settings]
    );
}

// =============================================================================
// HOOKS FOR THEME CUSTOMIZATION
// =============================================================================

/**
 * Hook to access core theme colors
 * Returns the 5 core brand colors (primary, secondary, background, foreground, accent)
 */
export function useThemeColors(): ThemeCoreColors {
    return useThemeConfig().colors;
}

// =============================================================================
// HOOKS FOR WCAG-COMPLIANT SWATCH STYLING
// =============================================================================

/**
 * Smart hook for dynamic swatch border color based on full context
 *
 * This is the most intelligent swatch border calculation that considers:
 * 1. The swatch color itself
 * 2. Whether the option is currently selected (changes button background)
 * 3. Whether on a primary-colored page section (mobile hero)
 * 4. Theme colors from the site content
 *
 * The algorithm determines the effective background the swatch is visually
 * sitting on (which changes based on button selection state), then finds
 * a border color that provides WCAG 3:1 contrast against both the swatch
 * color AND the effective background.
 *
 * Use this hook when the swatch is inside a button that changes background
 * on selection (like variant option pills).
 *
 * @param swatchColor - The swatch color (HEX format)
 * @param isSelected - Whether the parent button is in selected state
 * @param onPrimaryBackground - Whether on a primary-colored page section
 * @returns HEX color string for the border with optimal contrast
 *
 * @example
 * ```tsx
 * function VariantSwatch({ color, selected }: { color: string; selected: boolean }) {
 *   const borderColor = useSmartSwatchBorderColor(color, selected, false);
 *   // Border dynamically adapts when selection state changes
 * }
 * ```
 *
 * @example
 * ```tsx
 * // On mobile hero (coral background)
 * function MobileVariantSwatch({ color, selected }: { color: string; selected: boolean }) {
 *   const borderColor = useSmartSwatchBorderColor(color, selected, true);
 *   // Border adapts to coral bg context AND selection state
 * }
 * ```
 */
export function useSmartSwatchBorderColor(
    swatchColor: string | null | undefined,
    isSelected: boolean,
    onPrimaryBackground: boolean = false
): string {
    const themeColors = useThemeColors();

    return getSmartSwatchBorderColor({
        swatchColor,
        backgroundColor: themeColors.background,
        isSelected,
        onPrimaryBackground,
        themeColors
    });
}

// =============================================================================
// HOOKS FOR AGENTIC COMMERCE FIELDS (Phase 1 — foundation)
// =============================================================================

/**
 * Hook to access traffic-source banner overrides keyed by utm_source.
 * Returns null when not configured (Phase 5).
 */
export function useTrafficSourceBanners(): TrafficSourceBanner[] | null {
    return useSiteSettings().trafficSourceBanners;
}

/**
 * Hook to access segment-based homepage hero variants.
 * Returns null when not configured (Phase 5).
 */
export function useHomepageVariants(): HomepageVariant[] | null {
    return useSiteSettings().homepageVariants;
}

// =============================================================================
// UI CONTENT MIGRATION NOTE
// =============================================================================
// The following hooks were removed as part of the 80/20 simplification:
// - useProductContent() - import FALLBACK_PRODUCT_CONTENT from metaobject-parsers.ts
// - useCartContent() - import FALLBACK_CART_CONTENT from metaobject-parsers.ts
// - useAccountContent() - import FALLBACK_ACCOUNT_CONTENT from metaobject-parsers.ts
// - useSearchContent() - import FALLBACK_SEARCH_CONTENT from metaobject-parsers.ts
// - useUIMessages() - import FALLBACK_UI_MESSAGES from metaobject-parsers.ts
// - useErrorContent() - import FALLBACK_ERROR_CONTENT from metaobject-parsers.ts
// - useWishlistContent() - import FALLBACK_WISHLIST_CONTENT from metaobject-parsers.ts
//
// Components should now import these constants directly from '~/lib/metaobject-parsers'

// =============================================================================
// AGENT ARRIVAL
// =============================================================================

/**
 * Hook to access agent-arrival banner copy.
 * Returns the fallback constant. When Shopify metaobject support is added for
 * agentArrivalCopy, this hook can read from SiteSettings without changing callers.
 */
export function useAgentArrivalCopy(): typeof FALLBACK_AGENT_ARRIVAL_COPY {
    return FALLBACK_AGENT_ARRIVAL_COPY;
}

