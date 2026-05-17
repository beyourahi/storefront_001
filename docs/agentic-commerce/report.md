# Agentic Commerce Implementation Report

## Summary

This storefront ships with a comprehensive agentic commerce surface — both pre-existing infrastructure (UCP discovery, MCP endpoints, agent-aware UI, structured data) and net-new AI-powered features (PDP Q&A, meta description generation, query reformulation utility). All AI features are flag-gated and degrade gracefully when no provider is configured.

Companion storefront (`storefront_002`) ships the same backend wiring with a visually distinct frontend treatment — the agentic backend is intentionally identical across storefronts so future capability additions land in both via the same code path.

## What Shipped (Net-New)

### Drift Convergence (Phase A)
- `AgentFallbackBanner` (full-page + cart-inline variants) ported from storefront_002 to storefront_001.
- `useAgentFallbackCopy()` hook + `FALLBACK_AGENT_FALLBACK_COPY` constant added to storefront_001.
- `recently-viewed-tools.ts` server-side cookie reader added to storefront_001. Storefront_002's pre-existing version was patched: the cookie name was wrong (`recently_viewed` vs the actual `shopify-recently-viewed` that the client writes), silently breaking the agentic `lookup_catalog` personalization path.
- `CartMain.tsx` location split in storefront_002 confirmed intentional (re-export shim for cross-storefront import-path symmetry) — no change.

### Structured Data Convergence (Phase B)
- `generateOrganizationSchema()` ported from storefront_002 to storefront_001. Storefront_001 was emitting an equivalent inline schema; refactored to use the shared function so future changes land in one place.
- All other JSON-LD generators (Product, Breadcrumb, WebSite+SearchAction, ItemList, FAQPage, BlogPosting, Brand, WebPage) were already shipped in both storefronts via `lib/seo.ts`.

### Agent Discoverability (Phase C)
- `llms.txt` enriched with top 5 collections + top 10 best-selling products + policy URLs (ported from 002 to 001).
- `/.well-known/ucp` profile expanded to declare 5 services (cart_mcp, checkout_mcp, catalog_mcp, storefront_mcp, policies_mcp). The Shopify-hosted services are derived from `PUBLIC_CHECKOUT_DOMAIN` (always the `*.myshopify.com` canonical) so agents reach the correct endpoint even when the storefront serves on a custom domain. New `dev.ucp.shopping.cart` capability advertised.
- `<link rel="alternate" type="application/json" href="/.well-known/ucp" title="UCP Capability Profile">` added to `<head>` in both storefronts for HTML-inspection discovery.
- `[robots.txt]` confirmed: AI crawler allowlist already comprehensive (13 crawlers, agent endpoints permitted) — no change needed.

### Native Shopify Recommendations (Phase D)
- `productRecommendations(intent: COMPLEMENTARY)` rail added on both PDPs. Single GraphQL request via aliased fields (`related` + `complementary`); two distinct carousels render below the fold. Empty-data case renders nothing.
- Visually distinct treatment per storefront:
  - **storefront_001**: "These pair beautifully together" — serif headings, utility-first carousel
  - **storefront_002**: "Pairs Well With" — centered serif heading, cinematic carousel

### AI Infrastructure (Phase E)
- `lib/ai-provider.ts` — auto-detect provider abstraction. Tries Workers AI binding first (free, Workers-only), falls back to Anthropic API (works everywhere), returns null when neither is configured.
- `lib/ai-cache.ts` — Cloudflare Cache API wrapper with sha-256 keys, namespace prefixes, configurable TTLs.
- `observability.ts` event allowlist extended with: `agent_pdp_qa_query`, `agent_pdp_qa_cache_hit`, `agent_meta_generation`, `agent_query_reformulation`.
- Dependencies added: `ai`, `@ai-sdk/anthropic`, `workers-ai-provider`, `react-markdown`.

### PDP Q&A Panel (Phase H)
- `POST /api/pdp-qa` endpoint: validates inputs, enforces rate limit (5 questions per product per session via cookie), checks 1h cache, fetches product context, prompts LLM with strict grounding rules, caches result via `waitUntil`.
- System prompt explicitly forbids hallucinated specs/warranties/materials and defers price/shipping/availability questions to the product page itself.
- Per-storefront UI components:
  - **storefront_001**: Collapsed-by-default disclosure pattern, utility-first form input, monospace transcript styling
  - **storefront_002**: Always-visible rounded card with cinematic motion entrance, animated send button with dots while loading
- Both components lazy-load `react-markdown` and render LLM output through it with safe defaults (no raw HTML passthrough, no script execution).

### AI Meta Description Fallback (Phase I)
- `lib/ai-meta.ts` — generates a 155-char meta description when merchant `seo.description` is empty. 7-day cache. Lazy pattern: cache-miss returns null on the current request and populates cache via `waitUntil`, so render latency is always zero.
- Cache key includes a content hash of title+description so descriptions auto-refresh when the merchant edits product copy.
- Integrated into both storefronts' product PDP `meta()` exports. AI-generated descriptions emit `<meta name="ai-generated" content="description">` for crawler transparency.
- Collection meta integration deferred (same pattern, easy to add later).

### LLM Query Reformulation (Phase J)
- `lib/ai-search.ts` — exports `reformulateQuery(rawQuery, env, waitUntil)`. Returns null when no useful reformulation is available; caller falls back to raw query.
- 24h cache.
- Caller-side route integration deferred (utility ships ready to mount in `routes/search.tsx`).

### Cart Agent-Arrival (Phase F)
- `cart.$lines.tsx` audited in both storefronts: functionally identical, working correctly. No changes needed.

### Documentation (Phase G)
- `docs/agentic-commerce/inventory.md` — full catalog of 22+ surveyed capabilities with implementation status
- `docs/agentic-commerce/feasibility.md` — decision matrix with value/risk/effort/reason for every capability
- `docs/agentic-commerce/setup.md` — operator guide for enabling AI features, configuring providers, applying for gated Shopify capabilities, validating setup
- `docs/agentic-commerce/report.md` — this document

## Architectural Decisions

### Auto-Detect Provider Strategy
Chose runtime auto-detection over a single hardcoded provider so the same code path works on both Workers (where Workers AI is free and immediate) and Oxygen (where Anthropic key is required). Same `getAIModel(env)` call in every feature; no caller-side branching.

### Cache API Over KV/Vectorize
Chose Cloudflare Cache API over Workers KV or Vectorize for AI response caching because (a) zero new bindings required, (b) works on both Workers and Oxygen, (c) AI response caching tolerates opportunistic eviction. Trade-off: per-zone scope (not globally consistent), which is acceptable for this workload.

### Lazy Cache-Populate Pattern for AI Meta
AI meta description generation NEVER blocks the render path. Cache miss returns null on the current request and triggers background generation via `waitUntil`. Next request within the TTL window gets the generated description. This means P95 render latency is unaffected by LLM latency.

### Single-Turn Q&A (No Chat History)
Chose single-turn bounded Q&A over multi-turn chat to keep the prompt context surface narrow. Each question is grounded in a fresh product context with no conversational state — drastically lower hallucination risk than open-ended chat.

### Distinct Visual Identity Per Storefront, Identical Backend
Every new backend file (`ai-provider.ts`, `ai-cache.ts`, `ai-meta.ts`, `ai-search.ts`, `api.pdp-qa.tsx`) is byte-identical across both storefronts. Frontend components (`ProductQA.tsx`, recommendation rail JSX) diverge to match each storefront's visual language. This means future agentic features can land in both storefronts via the same backend code path while still expressing each brand's distinct identity.

## Performance Impact

Expected impact when AI features are off (default): zero. AI provider modules are dynamically imported only inside route handlers that need them; nothing AI-related is in the root bundle. JSON-LD additions are server-rendered and add ~1-2 KB per page to the response body.

Expected impact when AI features are on:
- PDP Q&A panel client JS (lazy-loaded on expansion): ~12 KB gzip (react-markdown is the bulk)
- LLM call latency on cache miss: 1.5-3s for Anthropic Haiku, 800ms-2s for Workers AI Llama 3.3 70B
- LLM call on cache hit: <50ms (Cache API)

## Security Posture

- **No API keys in client bundle** — all AI provider keys read from `context.env` server-side only. CI grep on production build output to verify no leakage.
- **LLM output sanitized** — rendered via `react-markdown` with safe defaults (no `rehype-raw`, no HTML passthrough, no script execution).
- **Rate limits** — PDP Q&A is cookie-tracked at 5 questions per product per session. Prevents abuse, keeps per-buyer cost bounded.
- **No PII forwarded to LLM** — only product context goes to the LLM. No buyer identity, no cart state, no order history, no email.
- **AI disclosure** — AI-generated meta descriptions are tagged `<meta name="ai-generated" content="description">` so crawlers know.
- **Sensitive routes uncacheable** — cart, checkout, account, and API routes remain uncacheable at every layer.

## Future Enhancement Candidates (Prioritized by ROI)

1. **AI meta descriptions on collection pages** — same utility, ~10 LoC integration. High SEO value for stores with sparse collection descriptions.
2. **LLM query reformulation in search route** — utility is shipped, just needs caller-side mount. Improves zero-result search experience.
3. **CMS-driven AI copy** — Shopify admin metaobject fields for PDP Q&A heading/disclosure/placeholder, so merchants can edit without touching code. Pattern documented in `setup.md`.
4. **Agent-aware recommendation rerank** — add `quantityAvailable` to `RecommendedProduct` fragment and filter OOS to the bottom when `useAgentSurface().isAgent`. Useful for storefronts with volatile inventory.
5. **Apply for `complete_checkout` capability** — unlocks zero-touch agent checkout. Requires Shopify partner-team coordination.
6. **AI Gateway integration** — set `AI_GATEWAY_URL` env var; add a few lines in `ai-provider.ts` to proxy through Gateway. Adds caching, rate limiting, observability for LLM calls.
7. **Conversational chat widget** — full multi-turn chat with cart-add via tool calls. Significant scope; postponed.
8. **Vectorize semantic search** — full semantic ranking via Cloudflare Vectorize. Adds infrastructure complexity but eliminates query reformulation entirely.

## Rollback Posture

Every AI feature is environment-flag-gated. Disable via `unset AI_FEATURES_ENABLED` + redeploy. The storefront remains fully functional with zero AI features active — graceful degradation is the default state.

## Verification

Run before deploying:
```bash
npm run codegen
npm run typecheck
npm run lint
npm run build
```

All four pass cleanly in both storefronts as of this report.
