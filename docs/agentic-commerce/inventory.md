# Agentic Commerce Capability Inventory

Complete catalog of Shopify Agentic Commerce and AI capabilities surveyed for this storefront. Each entry indicates whether the storefront ships the capability, gates it behind setup, or skips it with reason.

## Conventions

- ✅ **Shipped** — code is in place and active when feature flag + credentials are set.
- 🔧 **Setup required** — code is in place but needs manual configuration (env vars, Shopify admin steps, partner approval).
- 📋 **Inventoried only** — Shopify capability that exists but has no storefront implementation surface or is admin-only.
- ⏭ **Deferred** — recognized as valuable, deliberately not shipped this round.

---

## A. Storefront-facing UCP & MCP

### A.1 UCP Discovery — `/.well-known/ucp`
✅ Shipped. Serves the Universal Commerce Protocol `2026-04-08` profile declaring all advertised MCP services and capabilities. Declares 4 capability tokens (`dev.ucp.shopping.discovery`, `dev.shopify.catalog.storefront`, `dev.ucp.shopping.policies`, `dev.ucp.shopping.cart`, `dev.ucp.shopping.checkout`) and 5 services (storefront_mcp, policies_mcp, cart_mcp, checkout_mcp, catalog_mcp). Cart/checkout/catalog services point to the canonical `{shop}.myshopify.com/api/mcp` endpoint derived from `PUBLIC_CHECKOUT_DOMAIN`.

### A.2 Public MCP Server — `POST /api/mcp`
✅ Shipped. JSON-RPC 2.0, no auth. Tools: policy + FAQ retrieval. Used by AI agents to learn shipping/return policies before placing an order.

### A.3 Authenticated MCP Server — `POST /api/ucp/mcp`
✅ Shipped. JSON-RPC 2.0, Bearer JWT auth. Tools: `search_catalog`, `get_product`, `lookup_catalog`, `list_sort_options`, `search_suggest`. JWKS cache (1-hour TTL) with full signature verification.

### A.4 llms.txt Manifest — `/llms.txt`
✅ Shipped. Markdown manifest per llmstxt.org. Includes brand summary, store URL, top 5 collections, top 10 best-selling products with prices, policy URLs, MCP endpoint documentation, sitemap reference, and crawler guidelines.

### A.5 Agent Surface Detection
✅ Shipped. `lib/agentic/agent-surface.ts` derives `{isAgent, source}` from AI attribution (referer, UTM) and JWT session. Propagated via `AgentSurfaceProvider` / `useAgentSurface()` so any component can branch rendering for agent traffic.

### A.6 Agent-Native PDP
✅ Shipped. When `useAgentSurface().isAgent` is true, the PDP swaps the hero section for `AgentProductBrief` — a structured, monospace, field-row layout optimized for agent parsing.

### A.7 Agent-Native Cart View
✅ Shipped. `AgentCartView` replaces the visual cart for agent traffic; emits inline JSON-LD line-item structured data via `useCartJsonLd`.

### A.8 Cart Permalink Handoff — `/cart/{variantId}:{qty}`
✅ Shipped. `routes/cart.$lines.tsx` parses Shopify-style cart permalinks. AI-attributed arrivals (UTM `utm_source=chatgpt|perplexity|claude|...`) land on the cart aside with agent-arrival banner; regular visitors go straight to checkout.

### A.9 Cart Agent-Arrival Banner
✅ Shipped. `components/cart/AgentArrivalBanner.tsx` — dismissible notice surfaced via CMS-driven copy (`FALLBACK_AGENT_ARRIVAL_COPY`) when a buyer arrives via an AI agent's cart link.

### A.10 Cart Agent-Fallback Banner
✅ Shipped. `components/cart/AgentFallbackBanner.tsx` — compact non-dismissible banner shown when an agent hits a cart state it can't proceed through. Directs to `/search` and the MCP endpoints.

### A.11 Full-Page Agent Fallback Banner
✅ Shipped (infrastructure). `components/AgentFallbackBanner.tsx` — full-page interstitial for interactive routes (quizzes, editorial) that agents cannot navigate. Available for mounting on any non-cart route that needs it.

### A.12 Agent Server Bypass
✅ Shipped. `server.ts` calls `handleAgentRequest` BEFORE React Router rendering; product pages requested with `?agent=true` or `Accept: application/x-ucp+json` return raw UCP JSON without invoking the React tree. Significant latency win for agent traffic.

### A.13 Affinity Re-Ranking
✅ Shipped. `lib/agentic/affinity.ts` — server-side re-rank of collection products by customer purchase history. Degrades cleanly for anonymous users.

### A.14 Catalog Extension Structured Data
✅ Shipped. `lib/agentic/structured-data.ts` emits agent-readable `<meta>` tags for SCE (storefront catalog extension) fields: gift card status, shipping requirements, selling plans, stock levels.

### A.15 Predictive Search
✅ Shipped (Hydrogen baseline). Storefront `predictiveSearch` query powers autocomplete with products, queries, collections, articles, and pages.

### A.16 Product Recommendations — RELATED Intent
✅ Shipped. `productRecommendations(intent: RELATED)` rail on every PDP.

### A.17 Product Recommendations — COMPLEMENTARY Intent
✅ Shipped. `productRecommendations(intent: COMPLEMENTARY)` rail on every PDP, rendered as a second carousel below the RELATED rail. Often empty when the merchant hasn't seeded complementary data — the rail renders nothing in that case.

### A.18 AI-Powered PDP Q&A
✅ Shipped. `POST /api/pdp-qa` single-turn endpoint + per-storefront `ProductQA` panel. Buyer asks a question; LLM answers using ONLY the product's own data (no hallucinated specs). 1h cache, cookie-tracked rate limit (5 questions per product per session). Requires `AI_FEATURES_ENABLED=true`, `AI_PDP_QA_ENABLED=true`, and either a Workers AI binding or `ANTHROPIC_API_KEY`.

### A.19 AI-Generated Meta Descriptions
✅ Shipped. `lib/ai-meta.ts` + integration on product PDP `meta()`. When merchant-set `seo.description` is empty AND `AI_META_DESC_ENABLED=true`, generates a 155-char description via LLM. 7-day cache. Pattern is lazy: cache-miss returns null on the current request and populates cache via `waitUntil`, so render latency is never affected. Emits `<meta name="ai-generated" content="description">` on AI-generated descriptions for crawler transparency.

### A.20 LLM Query Reformulation (utility)
✅ Shipped (infrastructure). `lib/ai-search.ts` — exports `reformulateQuery(rawQuery, env, waitUntil)` for expanding short/typo'd queries via LLM. Caller-side integration into the search route is deferred — utility is ready for mounting when desired.

### A.21 AI Crawler Policy in robots.txt
✅ Shipped. `routes/[robots.txt].tsx` explicitly allows 13 AI crawlers (GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, anthropic-ai, Claude-Web, Google-Extended, PerplexityBot, YouBot, Applebot-Extended, cohere-ai, CCBot, Bytespider) and permits agent endpoints (`/.well-known/ucp`, `/llms.txt`, `/api/mcp`, `/api/ucp/mcp`, `/cart/`). Private paths (admin, checkout, account, orders) remain disallowed.

### A.22 Schema.org Structured Data Suite
✅ Shipped. `lib/seo.ts` exports schemas for `Product`, `Organization`, `WebSite` + `SearchAction`, `BreadcrumbList`, `ItemList` (nested inside `CollectionPage`), `FAQPage`, `BlogPosting`, `Brand`, `WebPage`. All mounted on the relevant routes via `meta()` and `script:ld+json` descriptors.

---

## B. Gated / Restricted Shopify Capabilities

### B.1 Shopify Cart MCP — Cart Manipulation Tools
🔧 Setup required. `add_to_cart`, `update_cart`, `get_cart` are auto-exposed by Shopify on `{shop}.myshopify.com/api/mcp`. Declared in our UCP profile under `cart_mcp` service. **Action required:** none from our side — agents call Shopify-hosted directly.

### B.2 Shopify Checkout MCP — `complete_checkout`
🔧 Setup required. Restricted to Token-tier agents. Requires registering the agent's `client_id` in Shopify Dev Dashboard with checkout-completion permission. Self-serve registration is NOT available — contact Shopify partner manager.

### B.3 Customer Accounts MCP
🔧 Setup required. Requires (1) custom domain (not `*.myshopify.com`), (2) Level 2 Protected Customer Data approval from Shopify. Not advertised in our UCP profile until enabled.

### B.4 Order MCP — Order Webhooks for Agents
🔧 Setup required. Order webhooks routed to agents require Shopify partner-manager registration. Not advertised in our UCP profile.

### B.5 Shop Pay Payment Handler for Agents
🔧 Setup required. Preview-only feature; manual `client_id` registration via Shopify UCP discussions forum.

### B.6 Cart Transform — `lineUpdate` Operations
🔧 Setup required. Shopify Plus only.

---

## C. Out-of-Scope (Admin-Only)

### C.1 Shopify Magic
📋 Inventoried only. Shopify's admin AI for product description generation, email subject lines, image generation, FAQ generation. Lives in Shopify Admin UI; no storefront-facing surface.

### C.2 Shopify Sidekick
📋 Inventoried only. Merchant AI assistant in Shopify Admin. App-extension surface only.

---

## D. Deferred Enhancements

### D.1 Agent-Aware Recommendation Re-Rank
⏭ Deferred. Would extend `lib/agentic/affinity.ts` to filter OOS / price-volatile items to the bottom when `useAgentSurface().isAgent`. Requires adding `quantityAvailable` and `compareAtPriceRange` to the `RecommendedProduct` GraphQL fragment. Low marginal value vs. effort for the demo store; ship when first client has volatile inventory.

### D.2 Cloudflare Vectorize Semantic Search
⏭ Deferred. Out of scope per project decision (LLM query reformulation chosen instead). Would require Vectorize binding + product webhook → indexing pipeline + Workers-only deployment path.

### D.3 Conversational Shopping Assistant (Chat Widget)
⏭ Deferred. Skipped per project decision. PDP Q&A panel covers most buyer questions without requiring multi-turn chat history.

### D.4 Cloudflare AI Gateway Integration
⏭ Deferred. Skipped per project decision. Direct provider calls preferred for simpler ops; AI Gateway can be added later by setting an `AI_GATEWAY_URL` env var and routing through it in `ai-provider.ts`.

### D.5 Cart "Share with AI Agent" Affordance
⏭ Deferred. Skipped per project decision. Route handler already recognizes agent-arrived permalinks; the buyer-facing button to generate them was not added.

### D.6 AI Meta Descriptions on Collection Pages
⏭ Deferred. `lib/ai-meta.ts` utility supports collection entity type; integration into the collection route `meta()` export is not wired. Easy to add (~10 LoC, same pattern as PDP).

### D.7 Query Reformulation Route Integration
⏭ Deferred. `lib/ai-search.ts` utility ships ready for mounting. Caller-side integration into the search route is left to a focused future change.
