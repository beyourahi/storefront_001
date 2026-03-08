export const CART_QUERY_FRAGMENT = `#graphql
  fragment Money on MoneyV2 {
    currencyCode
    amount
  }
  fragment CartLine on CartLine {
    id
    quantity
    attributes {
      key
      value
    }
    cost {
      totalAmount {
        ...Money
      }
      amountPerQuantity {
        ...Money
      }
      compareAtAmountPerQuantity {
        ...Money
      }
    }
    merchandise {
      ... on ProductVariant {
        id
        availableForSale
        quantityAvailable
        compareAtPrice {
          ...Money
        }
        price {
          ...Money
        }
        requiresShipping
        title
        image {
          id
          url
          altText
          width
          height
        }
        product {
          handle
          title
          id
          vendor
        }
        selectedOptions {
          name
          value
        }
      }
    }
    parentRelationship {
      parent {
        id
        merchandise {
          ... on ProductVariant {
            title
            product {
              title
              handle
            }
          }
        }
      }
    }
    sellingPlanAllocation {
      sellingPlan {
        id
        name
        options {
          name
          value
        }
      }
      priceAdjustments {
        perDeliveryPrice {
          amount
          currencyCode
        }
      }
    }
  }
  fragment CartLineComponent on ComponentizableCartLine {
    id
    quantity
    attributes {
      key
      value
    }
    cost {
      totalAmount {
        ...Money
      }
      amountPerQuantity {
        ...Money
      }
      compareAtAmountPerQuantity {
        ...Money
      }
    }
    merchandise {
      ... on ProductVariant {
        id
        availableForSale
        quantityAvailable
        compareAtPrice {
          ...Money
        }
        price {
          ...Money
        }
        requiresShipping
        title
        image {
          id
          url
          altText
          width
          height
        }
        product {
          handle
          title
          id
          vendor
        }
        selectedOptions {
          name
          value
        }
      }
    }
    sellingPlanAllocation {
      sellingPlan {
        id
        name
        options {
          name
          value
        }
      }
      priceAdjustments {
        perDeliveryPrice {
          amount
          currencyCode
        }
      }
    }
  }
  fragment CartApiQuery on Cart {
    updatedAt
    id
    appliedGiftCards {
      id
      lastCharacters
      amountUsed {
        ...Money
      }
      balance {
        ...Money
      }
    }
    checkoutUrl
    totalQuantity
    buyerIdentity {
      countryCode
      customer {
        id
        email
        firstName
        lastName
        displayName
      }
      email
      phone
    }
    lines(first: $numCartLines) {
      nodes {
        ...CartLine
      }
      nodes {
        ...CartLineComponent
      }
    }
    cost {
      subtotalAmount {
        ...Money
      }
      totalAmount {
        ...Money
      }
    }
    note
    attributes {
      key
      value
    }
    discountCodes {
      code
      applicable
    }
  }
` as const;

const MENU_FRAGMENT = `#graphql
  fragment MenuItem on MenuItem {
    id
    resourceId
    tags
    title
    type
    url
  }
  fragment ChildMenuItem on MenuItem {
    ...MenuItem
  }
  fragment ParentMenuItem on MenuItem {
    ...MenuItem
    items {
      ...ChildMenuItem
    }
  }
  fragment Menu on Menu {
    id
    items {
      ...ParentMenuItem
    }
  }
` as const;

export const HEADER_QUERY = `#graphql
  query Header(
    $country: CountryCode
    $headerMenuHandle: String!
    $language: LanguageCode
  ) @inContext(language: $language, country: $country) {
    menu(handle: $headerMenuHandle) {
      ...Menu
    }
  }
  ${MENU_FRAGMENT}
` as const;

export const FOOTER_QUERY = `#graphql
  query Footer(
    $country: CountryCode
    $footerMenuHandle: String!
    $language: LanguageCode
  ) @inContext(language: $language, country: $country) {
    menu(handle: $footerMenuHandle) {
      ...Menu
    }
  }
  ${MENU_FRAGMENT}
` as const;

export const CART_SUGGESTIONS_QUERY = `#graphql
  query CartSuggestions(
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    products(first: 12, sortKey: BEST_SELLING) {
      nodes {
        id
        handle
        title
        availableForSale
        productType
        tags
        featuredImage {
          id
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
        variants(first: 1) {
          nodes {
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
          }
        }
      }
    }
  }
` as const;

export const MENU_COLLECTIONS_QUERY = `#graphql
  query MenuCollections(
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(language: $language, country: $country) {
    collections(first: 50, sortKey: TITLE) {
      nodes {
        id
        handle
        title
        image {
          id
          url
          altText
          width
          height
        }
        products(first: 250) {
          nodes {
            id
            title
            productType
            availableForSale
          }
        }
      }
    }
    allProducts: products(first: 250) {
      nodes {
        id
        handle
        title
        productType
        availableForSale
        featuredImage {
          id
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
        }
        variants(first: 10) {
          nodes {
            availableForSale
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
` as const;

/**
 * Shop shipping configuration query.
 *
 * Fetches the free shipping threshold from shop metafields.
 * The threshold is configured in Shopify Admin under:
 * Settings > Custom data > Shop > custom.free_shipping_threshold
 *
 * @returns Shop metafield with free shipping threshold value
 */
export const SHOP_SHIPPING_CONFIG_QUERY = `#graphql
  query ShopShippingConfig {
    shop {
      freeShippingThreshold: metafield(namespace: "custom", key: "free_shipping_threshold") {
        value
        type
      }
    }
  }
` as const;
