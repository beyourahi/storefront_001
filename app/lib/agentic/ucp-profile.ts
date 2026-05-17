/**
 * @fileoverview UCP Capability Profile Builder
 *
 * Constructs the machine-readable `UcpProfile` served at `GET /.well-known/ucp`.
 * The profile advertises the storefront's agent capabilities and points agents
 * at the canonical MCP servers — both the custom Hydrogen endpoints we host
 * ourselves AND the Shopify-hosted endpoints auto-exposed on the shop's
 * `*.myshopify.com` subdomain.
 *
 * Domain resolution:
 * - `customDomain` — the host this Hydrogen app serves on (custom domain in
 *   production, `*.myshopify.com` in dev/portfolio). Used for our own MCP routes.
 * - `shopifyDomain` — always the canonical `{shop}.myshopify.com`. Used for
 *   Shopify-hosted MCP servers (cart, checkout, catalog). Derived from
 *   `PUBLIC_CHECKOUT_DOMAIN` (always set for production Oxygen deployments) or
 *   falls back to `PUBLIC_STORE_DOMAIN` when it already ends in `.myshopify.com`.
 *
 * Servers declared (7 total — 4 Shopify-hosted UCP, 2 custom Hydrogen, 1 gated):
 * - `cart_mcp` — Shopify Cart MCP (auto-exposed by Shopify)
 * - `checkout_mcp` — Shopify Checkout MCP (auto-exposed; some tools gated to Token-tier agents)
 * - `catalog_mcp` — Shopify Storefront Catalog MCP (auto-exposed)
 * - `order_mcp` — declared as gated; partner-manager registration required
 * - `storefront_mcp` — our custom authenticated MCP (additional storefront tools, JWT auth)
 * - `policies_mcp` — our custom public MCP (policies, FAQs, brand context)
 * - `customer_accounts_mcp` — declared as gated; custom domain + Level 2 PCD approval required
 */

import type {UcpProfile} from "./types";

/**
 * Best-effort derivation of the canonical `{shop}.myshopify.com` domain for
 * Shopify-hosted MCP servers. Falls back to undefined if neither env var
 * exposes a `.myshopify.com` host; in that case, Shopify-hosted server URLs
 * are omitted from the profile rather than fabricated.
 */
function deriveShopifyDomain(env: Record<string, string | undefined>): string | undefined {
    const checkoutDomain = env.PUBLIC_CHECKOUT_DOMAIN;
    if (checkoutDomain && checkoutDomain.endsWith(".myshopify.com")) return checkoutDomain;
    const storeDomain = env.PUBLIC_STORE_DOMAIN;
    if (storeDomain && storeDomain.endsWith(".myshopify.com")) return storeDomain;
    return undefined;
}

/**
 * Build the UCP capability profile for the `/.well-known/ucp` discovery endpoint.
 *
 * @param env - Environment variables (reads `PUBLIC_STORE_DOMAIN`, `PUBLIC_CHECKOUT_DOMAIN`)
 * @param _request - Incoming request (reserved for future per-request customization)
 */
export function buildUcpProfile(env: Record<string, string | undefined>, _request: Request): UcpProfile {
    const storeDomain = env.PUBLIC_STORE_DOMAIN ?? "";
    const customStoreUrl = storeDomain ? `https://${storeDomain}` : "";
    const shopifyDomain = deriveShopifyDomain(env);
    const shopifyUrl = shopifyDomain ? `https://${shopifyDomain}` : undefined;

    const ucpMcpUrl = customStoreUrl ? `${customStoreUrl}/api/ucp/mcp` : "/api/ucp/mcp";
    const policiesMcpUrl = customStoreUrl ? `${customStoreUrl}/api/mcp` : "/api/mcp";
    const shopifyMcpUrl = shopifyUrl ? `${shopifyUrl}/api/mcp` : undefined;

    const services: UcpProfile["ucp"]["services"] = {
        // Our custom storefront-tools MCP (Bearer JWT) — search-catalog, get-product, lookup-catalog, list-sort-options, search-suggest
        storefront_mcp: {
            url: ucpMcpUrl,
            protocol: "mcp",
            auth: "bearer"
        },
        // Our custom public MCP — policies, FAQs, brand context (no auth)
        policies_mcp: {
            url: policiesMcpUrl,
            protocol: "mcp"
        }
    };

    // Shopify-hosted MCP servers — only declare when we know the canonical {shop}.myshopify.com domain.
    if (shopifyMcpUrl) {
        services.cart_mcp = {url: shopifyMcpUrl, protocol: "mcp"};
        services.checkout_mcp = {url: shopifyMcpUrl, protocol: "mcp"};
        services.catalog_mcp = {url: shopifyMcpUrl, protocol: "mcp"};
        // Order MCP and Customer Accounts MCP are gated:
        //   - Order MCP: requires partner-manager registration (not self-serve)
        //   - Customer Accounts MCP: requires custom domain + Level 2 Protected Customer Data approval
        // They are documented in docs/agentic-commerce/setup.md but not advertised here until enabled.
    }

    return {
        ucp: {
            version: "2026-04-08",
            services,
            capabilities: {
                // Catalog discovery via Storefront MCP — GA
                "dev.ucp.shopping.discovery": [
                    {
                        version: "2026-04-08",
                        spec: "https://ucp.dev/specification/discovery/",
                        mcp_server: ucpMcpUrl
                    }
                ],
                // Storefront Catalog Extension (gift cards, collections, selling plans) — GA
                "dev.shopify.catalog.storefront": [
                    {
                        version: "2026-04-08",
                        spec: "https://shopify.dev/docs/agents/catalog/storefront-mcp",
                        ...(shopifyMcpUrl ? {mcp_server: shopifyMcpUrl} : {})
                    }
                ],
                // Policy & FAQs discovery — no auth required
                "dev.ucp.shopping.policies": [
                    {
                        version: "2026-04-08",
                        spec: "https://ucp.dev/specification/policies/",
                        mcp_server: policiesMcpUrl
                    }
                ],
                // Cart manipulation (add_to_cart, update_cart, get_cart) — Shopify-hosted, GA
                "dev.ucp.shopping.cart": [
                    {
                        version: "2026-04-08",
                        spec: "https://ucp.dev/specification/cart/",
                        ...(shopifyMcpUrl ? {mcp_server: shopifyMcpUrl} : {}),
                        ...(customStoreUrl
                            ? {
                                  cart_permalink_pattern: `${customStoreUrl}/cart/{variant_id}:{quantity}[,{variant_id}:{quantity}...]`
                              }
                            : {})
                    }
                ],
                // Checkout — Shopify-hosted MCP. `complete_checkout` is restricted to Token-tier agents
                // (Dev Dashboard registration required). Permalink handoff works for all agents.
                "dev.ucp.shopping.checkout": [
                    {
                        version: "2026-04-08",
                        spec: "https://ucp.dev/specification/checkout/",
                        status: "preview",
                        ...(shopifyMcpUrl ? {mcp_server: shopifyMcpUrl} : {}),
                        ...(customStoreUrl
                            ? {
                                  cart_permalink_pattern: `${customStoreUrl}/cart/{variant_id}:{quantity}[,{variant_id}:{quantity}...]`
                              }
                            : {})
                    }
                ]
            }
        }
    };
}
