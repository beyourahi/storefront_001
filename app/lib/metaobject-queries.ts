import {SITE_SETTINGS_FRAGMENT, THEME_SETTINGS_FRAGMENT} from "./metaobject-fragments";

export const THEME_SETTINGS_QUERY = `#graphql
  query ThemeSettings(
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    themeSettings: metaobject(handle: {type: "theme_settings", handle: "main"}) {
      ...ThemeSettings
    }
  }
  ${THEME_SETTINGS_FRAGMENT}
` as const;

export const SITE_CONTENT_QUERY = `#graphql
  query SiteContent(
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    siteSettings: metaobject(handle: {type: "site_settings", handle: "main"}) {
      ...SiteSettings
    }
  }
  ${SITE_SETTINGS_FRAGMENT}
` as const;
