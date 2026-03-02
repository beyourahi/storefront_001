import type {Route} from "./+types/api.products.$handle";

export const loader = async ({params, context}: Route.LoaderArgs) => {
    const {handle} = params;

    if (!handle) {
        return new Response(JSON.stringify({error: "handle is required"}), {
            status: 400,
            headers: {"Content-Type": "application/json"}
        });
    }

    const {product} = await context.dataAdapter.query(PRODUCT_BY_HANDLE_QUERY, {
        variables: {handle}
    });

    if (!product) {
        return new Response(JSON.stringify({error: "Product not found"}), {
            status: 404,
            headers: {"Content-Type": "application/json"}
        });
    }

    return new Response(JSON.stringify({product}), {
        status: 200,
        headers: {"Content-Type": "application/json"}
    });
};

const PRODUCT_BY_HANDLE_QUERY = `#graphql
  query ProductByHandle(
    $country: CountryCode
    $language: LanguageCode
    $handle: String!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      id
      title
      handle
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
` as const;
