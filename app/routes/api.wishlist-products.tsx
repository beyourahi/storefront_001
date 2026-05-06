import type {ActionFunctionArgs, LoaderFunctionArgs} from "react-router";
import {data} from "react-router";
import {createRateLimiter, getClientIP, getRateLimitResponse} from "~/lib/rate-limit";

const limiter = createRateLimiter({windowMs: 60_000, maxRequests: 20});

const WISHLIST_PRODUCTS_QUERY = `#graphql
  query WishlistProducts($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on Product {
        id
        title
        handle
        description
        tags
        vendor
        productType
        availableForSale
        options {
          id
          name
          values
        }
        images(first: 5) {
          nodes {
            id
            url
            altText
            width
            height
          }
        }
        media(first: 5) {
          nodes {
            __typename
            ... on MediaImage {
              id
              image { url altText width height }
            }
            ... on Video {
              id
              sources { url mimeType }
              previewImage { url altText width height }
            }
          }
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
        variants(first: 250) {
          nodes {
            id
            title
            availableForSale
            quantityAvailable
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
        seo {
          title
          description
        }
      }
    }
  }
`;

export const loader = async ({request: _request}: LoaderFunctionArgs) => {
    return data({error: "Method not allowed"}, {status: 405});
};

export const action = async ({request, context}: ActionFunctionArgs) => {
    const rateLimitResponse = getRateLimitResponse(limiter.check(getClientIP(request)));
    if (rateLimitResponse) return rateLimitResponse;

    if (request.method !== "POST") {
        return data({error: "Method not allowed"}, {status: 405});
    }

    try {
        const body = (await request.json()) as {ids?: string[]};
        const {ids} = body;

        if (!ids || !Array.isArray(ids)) {
            return data({error: "Invalid request: ids must be an array"}, {status: 400});
        }

        if (ids.length > 50) {
            return data(
                {
                    error: "Too many items: Maximum 50 products can be fetched at once"
                },
                {status: 400}
            );
        }

        const validGidPattern = /^gid:\/\/shopify\/Product\/\d+$/;
        const invalidIds = ids.filter(id => !validGidPattern.test(id));

        if (invalidIds.length > 0) {
            return data(
                {
                    error: "Invalid product GID format",
                    invalidIds
                },
                {status: 400}
            );
        }

        const {dataAdapter} = context;
        const {nodes} = await dataAdapter.query(WISHLIST_PRODUCTS_QUERY, {
            variables: {ids}
        });

        const products = nodes.filter(Boolean);

        return data({products});
    } catch (error) {
        console.error("Error fetching wishlist products:", error);
        return data({error: "Failed to fetch products"}, {status: 500});
    }
};
