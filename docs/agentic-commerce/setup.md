# Agentic Commerce Setup Guide

Step-by-step instructions to activate the AI-powered features shipped in this storefront. All features are flagged off by default; activation requires both environment variables AND (for AI-dependent features) a configured provider.

## 1. Feature Flag Master Switch

All AI features require the master switch on:

```bash
AI_FEATURES_ENABLED=true
```

When unset or `false`, none of the AI features activate regardless of per-feature flags.

## 2. AI Provider — Pick One

The provider is auto-detected at runtime. Set up ONE of these:

### Option A: Cloudflare Workers AI (Workers deployments only)

Add to `wrangler.jsonc`:

```jsonc
{
  "ai": {
    "binding": "AI"
  }
}
```

Then `wrangler deploy`. No API key needed. Free tier of Workers Paid plan included. Uses `@cf/meta/llama-3.3-70b-instruct-fp8-fast` by default.

Does NOT work on Shopify Oxygen — Oxygen doesn't expose the Workers AI binding.

### Option B: Anthropic API (works everywhere — Workers + Oxygen)

```bash
ANTHROPIC_API_KEY=sk-ant-...
```

Get a key from https://console.anthropic.com. Uses `claude-haiku-4-5-20251001` by default (fast, cheap, well-suited for bounded Q&A and short generation). Per-request cost.

For Oxygen deployments, set via `shopify hydrogen env push --variable ANTHROPIC_API_KEY=sk-ant-...` or the Oxygen dashboard.

### Verification

The provider detection logic lives in `app/lib/ai-provider.ts:getAIModel()`. To verify what's selected:

```typescript
import {describeAIProvider} from "~/lib/ai-provider";
describeAIProvider(context.env);
// → {enabled: true, provider: "workers-ai"} or {provider: "anthropic"} or {enabled: false, provider: null}
```

## 3. Per-Feature Flags

Turn on individual features as needed:

### PDP Q&A Panel

```bash
AI_PDP_QA_ENABLED=true
```

Activates the "Ask about this product" panel on every product page. Rate-limited to 5 questions per product per session via cookie. Answers cached 1h.

### AI Meta Description Fallback

```bash
AI_META_DESC_ENABLED=true
```

When a product lacks a merchant-set `seo.description`, generates one server-side. Cached 7d. Merchant-set descriptions always win.

### LLM Query Reformulation

```bash
AI_QUERY_REFORMULATION_ENABLED=true
```

Activates the `reformulateQuery()` utility. Note: caller-side integration into the search route is not currently wired — utility ships ready to mount. See `lib/ai-search.ts`.

## 4. Local Development

Create `.env.local` at the storefront root:

```bash
SESSION_SECRET=<32-char-random>
PUBLIC_STORE_DOMAIN=horcrux-demo-store.myshopify.com
PUBLIC_STOREFRONT_API_TOKEN=586d8fd7c598fea7e1b97a8eff48ed49
PUBLIC_CHECKOUT_DOMAIN=horcrux-demo-store.myshopify.com

# AI features (all default off)
AI_FEATURES_ENABLED=true
AI_PDP_QA_ENABLED=true
AI_META_DESC_ENABLED=true
AI_QUERY_REFORMULATION_ENABLED=true

# Pick one provider
ANTHROPIC_API_KEY=sk-ant-...
```

For Workers AI in dev, add to `.dev.vars`:

```bash
# Workers AI works in `npm run dev:workers` mode (full Wrangler) — not in plain `npm run dev`
```

Then:

```bash
npm install
npm run codegen
npm run dev:workers   # for Workers AI testing
# or
npm run dev           # for Anthropic-key testing
```

## 5. Shopify Admin Steps (Optional Enhancements)

### Extend `site_settings` Metaobject for AI Copy (Recommended Future Work)

Currently AI-related copy is hardcoded fallback constants. To make it merchant-editable:

1. Open Shopify Admin → Settings → Custom data → Metaobjects → `site_settings`
2. Add fields:
   - `product_qa_heading` (single-line text) — e.g. "Ask about this piece"
   - `product_qa_disclosure` (multi-line text) — AI disclosure copy
   - `agent_fallback_heading` (single-line text) — agent banner title
   - `agent_fallback_subtitle` (multi-line text) — agent banner body
3. Extend `app/lib/metaobject-fragments.ts` to fetch the new fields.
4. Extend `app/lib/metaobject-parsers.ts` with corresponding `FALLBACK_*` constants.
5. Add hooks in `app/lib/site-content-context.tsx`.
6. Replace the hardcoded strings in `ProductQA.tsx` and `AgentFallbackBanner.tsx` with hook calls.

### Enable Storefront-Hosted Catalog & Cart MCP (Optional)

Shopify auto-exposes Cart, Checkout, and Catalog MCPs on `{shop}.myshopify.com/api/mcp`. To verify your shop is participating:

1. Open https://`{shop}`.myshopify.com/api/mcp in a browser — should return MCP discovery JSON.
2. If not enabled, contact your Shopify partner manager to opt in.

### Apply for `complete_checkout` Capability (Plus/Enterprise)

Required for agents to complete purchases without buyer hand-off:

1. Open Shopify Dev Dashboard → Apps → Your App → Permissions.
2. Request "Purchase completion via UCP" scope.
3. Register your agent's `client_id` with Shopify partner team.

This is NOT self-serve — partner-team coordination required. Most storefronts will operate on cart-permalink handoff (`/cart/{variantId}:{qty}`), where the buyer confirms in our cart UI before checkout.

### Apply for Customer Accounts MCP (Custom Domain + L2 PCD)

Required for agents to access customer profile, addresses, orders:

1. Custom domain must be live (`yourbrand.com`, not `yourbrand.myshopify.com`).
2. Apply for Level 2 Protected Customer Data approval in Shopify Admin → Settings → Customer privacy.
3. Once approved, declare the `customer_accounts_mcp` service in `lib/agentic/ucp-profile.ts`.

## 6. Cloudflare Setup (Workers Deployments Only)

### AI Binding

```jsonc
// wrangler.jsonc
{
  "ai": {
    "binding": "AI"
  }
}
```

### Analytics Engine (Already Configured)

```jsonc
{
  "analytics_engine_datasets": [
    {"binding": "AGENT_ANALYTICS", "dataset": "agent_events"}
  ]
}
```

Powers the `emitAgentEvent()` allowlist. View results in the Cloudflare dashboard → Analytics & Logs → Engine.

## 7. Validation Checklist After Setup

After enabling features, verify each is working:

- [ ] Hit `/llms.txt` — should include top collections + products
- [ ] Hit `/.well-known/ucp` — should declare 5 services (cart_mcp, checkout_mcp, catalog_mcp, storefront_mcp, policies_mcp)
- [ ] Hit `/robots.txt` — should list AI crawlers with explicit Allow rules
- [ ] Visit any PDP — page source should contain `<script type="application/ld+json">` blocks for Product, Breadcrumb, Brand
- [ ] Visit any PDP — should see "Ask about this product" / "Ask about this piece" panel (storefront-specific)
- [ ] Submit a question — should get a real LLM answer
- [ ] Visit a product without merchant `seo.description` — should generate one after first request (check `<meta name="description">` after a second visit)
- [ ] Hit `/api/mcp` with JSON-RPC `tools/list` — should return policy/FAQ tools
- [ ] Hit `/api/ucp/mcp` with `Authorization: Bearer <jwt>` — should return catalog tools

## 8. Rollback

Every AI feature is flag-gated. To disable:

```bash
# Disable all AI features instantly:
unset AI_FEATURES_ENABLED
wrangler deploy  # or Oxygen redeploy

# Disable a single feature:
unset AI_PDP_QA_ENABLED
```

Storefront remains fully functional with zero AI features — graceful degradation is the default.
