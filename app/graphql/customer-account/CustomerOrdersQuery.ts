export const ORDER_LIST_ITEM_FRAGMENT = `#graphql
  fragment OrderListItem on Order {
    id
    name
    number
    processedAt
    fulfillmentStatus
    fulfillments(first: 1) {
      nodes {
        status
      }
    }
    totalPrice {
      amount
      currencyCode
    }
    lineItems(first: 20) {
      nodes {
        id
        title
        quantity
        price {
          amount
          currencyCode
        }
        image {
          url
          altText
          width
          height
        }
        variantTitle
      }
    }
  }
` as const;

export const CUSTOMER_ORDERS_LIST_FRAGMENT = `#graphql
  fragment CustomerOrdersList on Customer {
    orders(
      sortKey: PROCESSED_AT,
      reverse: true,
      first: $first,
      last: $last,
      before: $startCursor,
      after: $endCursor
    ) {
      nodes {
        ...OrderListItem
      }
      pageInfo {
        hasPreviousPage
        hasNextPage
        endCursor
        startCursor
      }
    }
  }
  ${ORDER_LIST_ITEM_FRAGMENT}
` as const;

export const CUSTOMER_ORDERS_LIST_QUERY = `#graphql
  ${CUSTOMER_ORDERS_LIST_FRAGMENT}
  query CustomerOrdersList(
    $endCursor: String
    $first: Int
    $last: Int
    $startCursor: String
    $language: LanguageCode
  ) @inContext(language: $language) {
    customer {
      ...CustomerOrdersList
    }
  }
` as const;
