import {SITE_SETTINGS_FRAGMENT, THEME_SETTINGS_FRAGMENT} from "./metaobject-fragments";

export const PWA_MANIFEST_QUERY = `#graphql
  query PwaManifest(
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    siteSettings: metaobject(handle: {type: "site_settings", handle: "main"}) {
      ...SiteSettings
    }
    themeSettings: metaobject(handle: {type: "theme_settings", handle: "main"}) {
      ...ThemeSettings
    }
    shop {
      name
      description
      primaryDomain {
        url
      }
      brand {
        logo {
          image {
            url
            altText
            width
            height
          }
        }
        coverImage {
          image {
            url
            altText
            width
            height
          }
        }
        shortDescription
      }
    }
  }
  ${SITE_SETTINGS_FRAGMENT}
  ${THEME_SETTINGS_FRAGMENT}
` as const;
