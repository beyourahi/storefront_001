export const SUBSCRIPTION_LINE_FRAGMENT = `#graphql
  fragment SubscriptionLine on SubscriptionLine {
    id
    name
    title
    variantTitle
    quantity
    currentPrice {
      amount
      currencyCode
    }
    lineDiscountedPrice {
      amount
      currencyCode
    }
    image {
      altText
      url
      width
      height
    }
    sku
  }
` as const;

export const SUBSCRIPTION_BILLING_POLICY_FRAGMENT = `#graphql
  fragment SubscriptionBillingPolicy on SubscriptionBillingPolicy {
    interval
    intervalCount {
      count
    }
    minCycles
    maxCycles
  }
` as const;

export const SUBSCRIPTION_DELIVERY_POLICY_FRAGMENT = `#graphql
  fragment SubscriptionDeliveryPolicy on SubscriptionDeliveryPolicy {
    interval
    intervalCount {
      count
    }
  }
` as const;

export const SUBSCRIPTION_BILLING_CYCLE_FRAGMENT = `#graphql
  fragment SubscriptionBillingCycle on SubscriptionBillingCycle {
    cycleIndex
    cycleStartAt
    cycleEndAt
    billingAttemptExpectedDate
    skipped
    status
  }
` as const;

export const SUBSCRIPTION_CONTRACT_FRAGMENT = `#graphql
  fragment SubscriptionContract on SubscriptionContract {
    id
    status
    createdAt
    updatedAt
    nextBillingDate
    currencyCode
    note
    deliveryPrice {
      amount
      currencyCode
    }
    billingPolicy {
      ...SubscriptionBillingPolicy
    }
    deliveryPolicy {
      ...SubscriptionDeliveryPolicy
    }
    lines(first: 10) {
      nodes {
        ...SubscriptionLine
      }
    }
    upcomingBillingCycles(first: 5) {
      nodes {
        ...SubscriptionBillingCycle
      }
    }
    lastPaymentStatus
    lastBillingAttemptErrorType
  }
  ${SUBSCRIPTION_LINE_FRAGMENT}
  ${SUBSCRIPTION_BILLING_POLICY_FRAGMENT}
  ${SUBSCRIPTION_DELIVERY_POLICY_FRAGMENT}
  ${SUBSCRIPTION_BILLING_CYCLE_FRAGMENT}
` as const;

export const CUSTOMER_SUBSCRIPTIONS_QUERY = `#graphql
  query CustomerSubscriptions(
    $first: Int
    $after: String
    $last: Int
    $before: String
    $reverse: Boolean = false
    $language: LanguageCode
  ) @inContext(language: $language) {
    customer {
      subscriptionContracts(
        first: $first
        after: $after
        last: $last
        before: $before
        reverse: $reverse
      ) {
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
        nodes {
          id
          status
          createdAt
          nextBillingDate
          currencyCode
          billingPolicy {
            interval
            intervalCount {
              count
            }
          }
          lines(first: 3) {
            nodes {
              id
              name
              title
              quantity
              currentPrice {
                amount
                currencyCode
              }
              image {
                altText
                url
                width
                height
              }
            }
          }
        }
      }
    }
  }
` as const;

export const CUSTOMER_SUBSCRIPTION_QUERY = `#graphql
  query CustomerSubscription($id: ID!, $language: LanguageCode) @inContext(language: $language) {
    customer {
      subscriptionContract(id: $id) {
        ...SubscriptionContract
        orders(first: 5, reverse: true) {
          nodes {
            id
            name
            processedAt
            totalPrice {
              amount
              currencyCode
            }
            fulfillmentStatus
          }
        }
        originOrder {
          id
          name
          processedAt
        }
      }
    }
  }
  ${SUBSCRIPTION_CONTRACT_FRAGMENT}
` as const;

export const SUBSCRIPTION_STATUSES = {
    ACTIVE: {label: "Active", variant: "default" as const},
    PAUSED: {label: "Paused", variant: "secondary" as const},
    CANCELLED: {label: "Cancelled", variant: "destructive" as const},
    EXPIRED: {label: "Expired", variant: "outline" as const},
    FAILED: {label: "Failed", variant: "destructive" as const}
} as const;

export type SubscriptionStatus = keyof typeof SUBSCRIPTION_STATUSES;

export const BILLING_INTERVALS = {
    DAY: "day",
    WEEK: "week",
    MONTH: "month",
    YEAR: "year"
} as const;

export type BillingInterval = keyof typeof BILLING_INTERVALS;

export const formatBillingFrequency = (
    interval: string,
    intervalCount: number | {count: number} | null | undefined
): string => {
    const intervalLower = interval.toLowerCase();
    const count = typeof intervalCount === "object" ? (intervalCount?.count ?? 1) : (intervalCount ?? 1);

    if (count === 1) {
        switch (intervalLower) {
            case "day":
                return "Daily";
            case "week":
                return "Weekly";
            case "month":
                return "Monthly";
            case "year":
                return "Yearly";
            default:
                return `Every ${intervalLower}`;
        }
    }

    return `Every ${count} ${intervalLower}s`;
};
