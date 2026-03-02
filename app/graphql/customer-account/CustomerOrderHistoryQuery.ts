import type {CurrencyCode} from "@shopify/hydrogen/customer-account-api-types";

export const ORDER_HISTORY_LINE_ITEM_FRAGMENT = `#graphql
  fragment OrderHistoryLineItem on LineItem {
    id
    name
    title
    productId
    variantId
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
  }
` as const;

export const ORDER_HISTORY_ORDER_FRAGMENT = `#graphql
  fragment OrderHistoryOrder on Order {
    id
    name
    number
    processedAt
    financialStatus
    fulfillmentStatus
    lineItems(first: 10) {
      nodes {
        ...OrderHistoryLineItem
      }
    }
  }
  ${ORDER_HISTORY_LINE_ITEM_FRAGMENT}
` as const;

export const CUSTOMER_ORDER_HISTORY_QUERY = `#graphql
  ${ORDER_HISTORY_ORDER_FRAGMENT}
  query CustomerOrderHistory(
    $first: Int!
    $language: LanguageCode
  ) @inContext(language: $language) {
    customer {
      orders(first: $first, sortKey: PROCESSED_AT, reverse: true) {
        nodes {
          ...OrderHistoryOrder
        }
      }
    }
  }
` as const;

export interface OrderHistoryProduct {
    id: string;
    lineItemId: string;
    productId: string | null;
    variantId: string | null;
    handle: string | null;
    name: string;
    image: {
        url: string;
        altText?: string | null;
        width?: number | null;
        height?: number | null;
    } | null;
    price: {
        amount: string;
        currencyCode: CurrencyCode;
    } | null;
    orderDate: string;
    orderNumber: string;
    orderName: string;
    fulfillmentStatus: string;
}

type OrderHistoryLineItem = {
    id: string;
    name: string;
    title: string;
    productId?: string | null;
    variantId?: string | null;
    quantity: number;
    price?: {
        amount: string;
        currencyCode: CurrencyCode;
    } | null;
    image?: {
        url: string;
        altText?: string | null;
        width?: number | null;
        height?: number | null;
    } | null;
};

type OrderHistoryOrderNode = {
    id: string;
    name: string;
    number: number;
    processedAt: string;
    financialStatus?: string | null;
    fulfillmentStatus?: string | null;
    lineItems: {
        nodes: OrderHistoryLineItem[];
    };
};

export const extractOrderHistoryProducts = (
    orders: OrderHistoryOrderNode[],
    maxProducts: number = 16
): OrderHistoryProduct[] => {
    const seenProductIds = new Set<string>();
    const products: OrderHistoryProduct[] = [];

    for (const order of orders) {
        for (const lineItem of order.lineItems.nodes) {
            if (lineItem.productId && seenProductIds.has(lineItem.productId)) {
                continue;
            }

            if (!lineItem.image?.url) {
                continue;
            }

            if (lineItem.productId) {
                seenProductIds.add(lineItem.productId);
            }

            products.push({
                id: `${order.id}-${lineItem.id}`,
                lineItemId: lineItem.id,
                productId: lineItem.productId ?? null,
                variantId: lineItem.variantId ?? null,
                handle: null,
                name: lineItem.name || lineItem.title,
                image: {
                    url: lineItem.image.url,
                    altText: lineItem.image.altText,
                    width: lineItem.image.width,
                    height: lineItem.image.height
                },
                price: lineItem.price ?? null,
                orderDate: order.processedAt,
                orderNumber: String(order.number),
                orderName: order.name,
                fulfillmentStatus: order.fulfillmentStatus ?? "UNFULFILLED"
            });

            if (products.length >= maxProducts) {
                return products;
            }
        }
    }

    return products;
};
