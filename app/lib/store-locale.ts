/**
 * Per-deployment locale configuration. Update all constants here when
 * onboarding a new client — they drive currency formatting, SEO, sitemap
 * locale tags, and the Hydrogen i18n context.
 */
export const STORE_COUNTRY_CODE = "BD" as const;
export const STORE_LANGUAGE_CODE = "EN" as const;
export const STORE_FORMAT_LOCALE = "en-BD" as const;
export const STORE_LOCALE = "en_BD" as const;
export const STORE_SITEMAP_LOCALE = "en-BD" as const;

export const STORE_I18N = {
    language: STORE_LANGUAGE_CODE,
    country: STORE_COUNTRY_CODE
} as const;
