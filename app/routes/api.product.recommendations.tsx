import type {Route} from "./+types/api.product.recommendations";

export const loader = async ({request, context}: Route.LoaderArgs) => {
    const url = new URL(request.url);
    const productId = url.searchParams.get("productId");

    if (!productId) {
        return new Response(JSON.stringify({error: "productId is required"}), {
            status: 400,
            headers: {"Content-Type": "application/json"}
        });
    }

    const {productRecommendations} = await context.dataAdapter.query(PRODUCT_RECOMMENDATIONS_QUERY, {
        variables: {productId}
    });

    return new Response(JSON.stringify({products: (productRecommendations ?? []).filter((p: any) => p.availableForSale)}), {
        status: 200,
        headers: {"Content-Type": "application/json"}
    });
};

const PRODUCT_RECOMMENDATIONS_QUERY = `#graphql
  query ProductRecommendations(
    $country: CountryCode
    $language: LanguageCode
    $productId: ID!
  ) @inContext(country: $country, language: $language) {
    productRecommendations(productId: $productId) {
      id
      title
      handle
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
    }
  }
` as const;
