export const THEME_SETTINGS_FRAGMENT = `#graphql
  fragment ThemeSettings on Metaobject {
    id
    handle
    fontBody: field(key: "body_font") { value }
    fontHeading: field(key: "heading_font") { value }
    fontPrice: field(key: "price_font") { value }
    borderRadius: field(key: "border_radius") { value }
    colorPrimary: field(key: "color_primary") { value }
    colorSecondary: field(key: "color_secondary") { value }
    colorBackground: field(key: "color_background") { value }
    colorForeground: field(key: "color_foreground") { value }
    colorAccent: field(key: "color_accent") { value }
  }
` as const;

export const SITE_SETTINGS_FRAGMENT = `#graphql
  fragment SiteSettings on Metaobject {
    id
    handle

    brandName: field(key: "brand_name") { value }
    brandWords: field(key: "words_to_describe_your_brand") { value }
    missionStatement: field(key: "brand_mission") { value }

    brandLogo: field(key: "brand_logo") {
      reference {
        ... on MediaImage {
          __typename
          image {
            url
            altText
            width
            height
          }
        }
      }
    }

    heroHeading: field(key: "hero_main_heading") { value }
    heroDescription: field(key: "hero_description_text") { value }
    featuredProductSection: field(key: "featured_product_section") {
      reference {
        ... on Product {
          __typename
          id
          handle
          title
          vendor
          description
          availableForSale
          featuredImage {
            url
            altText
            width
            height
          }
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
            maxVariantPrice {
              amount
              currencyCode
            }
          }
          compareAtPriceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
          selectedOrFirstAvailableVariant(
            selectedOptions: []
            ignoreUnknownOptions: true
            caseInsensitiveMatch: true
          ) {
            id
            availableForSale
            price {
              amount
              currencyCode
            }
            compareAtPrice {
              amount
              currencyCode
            }
            image {
              url
              altText
              width
              height
            }
          }
          tags
          variants(first: 100) {
            nodes {
              id
              title
              availableForSale
              selectedOptions {
                name
                value
              }
              price {
                amount
                currencyCode
              }
              compareAtPrice {
                amount
                currencyCode
              }
            }
          }
        }
      }
    }
    heroMediaMobile: field(key: "hero_background_media_mobile") {
      reference {
        ... on MediaImage {
          __typename
          image {
            url
            altText
            width
            height
          }
        }
        ... on Video {
          __typename
          sources {
            url
            mimeType
          }
          previewImage {
            url
            altText
          }
          alt
        }
      }
    }
    heroMediaLargeScreen: field(key: "hero_background_media_large_screen") {
      reference {
        ... on MediaImage {
          __typename
          image {
            url
            altText
            width
            height
          }
        }
        ... on Video {
          __typename
          sources {
            url
            mimeType
          }
          previewImage {
            url
            altText
          }
          alt
        }
      }
    }

    siteUrl: field(key: "website_url") { value }

    contactEmail: field(key: "contact_email") { value }
    contactPhone: field(key: "contact_phone") { value }
    businessHours: field(key: "business_hours") { value }
    streetAddress: field(key: "street_address") { value }
    city: field(key: "city") { value }
    state: field(key: "state_province") { value }
    zipCode: field(key: "postal_code") { value }

    blogSectionTitle: field(key: "blog_section_heading") { value }
    collectionsTitle: field(key: "collections_section_heading") { value }
    relatedProductsTitle: field(key: "related_products_heading") { value }
    recommendedTitle: field(key: "recommended_products_heading") { value }
    instagramTitle: field(key: "instagram_section_heading") { value }

    galleryPageHeading: field(key: "gallery_page_heading") { value }
    galleryPageDescription: field(key: "gallery_page_description") { value }
    blogPageHeading: field(key: "blog_page_heading") { value }
    blogPageDescription: field(key: "blog_page_description") { value }

    announcementBanner: field(key: "announcement_banner_text") { value }
    promotionalBannerOneMedia: field(key: "promotional_banner_one_media") {
      reference {
        ... on MediaImage {
          __typename
          image {
            url
            altText
            width
            height
          }
        }
        ... on Video {
          __typename
          sources {
            url
            mimeType
          }
          previewImage {
            url
            altText
          }
          alt
        }
      }
    }
    promotionalBannerTwoMedia: field(key: "promotional_banner_two_media") {
      reference {
        ... on MediaImage {
          __typename
          image {
            url
            altText
            width
            height
          }
        }
        ... on Video {
          __typename
          sources {
            url
            mimeType
          }
          previewImage {
            url
            altText
          }
          alt
        }
      }
    }

    socialLinksData: field(key: "social_links_data") { value }
    testimonialsData: field(key: "testimonials_data") { value }
    faqItemsData: field(key: "faq_items_data") { value }
    instagramMediaData: field(key: "instagram_images_data") {
      references(first: 20) {
        nodes {
          ... on MediaImage {
            __typename
            id
            image {
              url
              altText
              width
              height
            }
          }
          ... on Video {
            __typename
            id
            sources {
              url
              mimeType
            }
            previewImage {
              url
              altText
            }
            alt
          }
        }
      }
    }

    favicon: field(key: "favicon") {
      reference {
        ... on MediaImage {
          __typename
          image {
            url
          }
        }
      }
    }
    icon192: field(key: "icon_192") {
      reference {
        ... on MediaImage {
          __typename
          image {
            url
            altText
            width
            height
          }
        }
      }
    }
    icon512: field(key: "icon_512") {
      reference {
        ... on MediaImage {
          __typename
          image {
            url
            altText
            width
            height
          }
        }
      }
    }
    icon180Apple: field(key: "icon_180_apple") {
      reference {
        ... on MediaImage {
          __typename
          image {
            url
            altText
            width
            height
          }
        }
      }
    }
  }
` as const;
