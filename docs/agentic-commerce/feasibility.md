# Agentic Commerce Feasibility Matrix

Decision record for every surveyed capability. See `inventory.md` for capability descriptions.

## Scoring criteria

- **Value** — buyer/agent experience improvement and SEO impact
- **Risk** — production reliability impact if the feature misbehaves
- **Effort** — relative implementation cost
- **Decision** — ship / setup-required / defer / skip
- **Reason** — one-line justification

| ID | Capability | Value | Risk | Effort | Decision | Reason |
|---|---|---|---|---|---|---|
| A.1 | UCP discovery (/.well-known/ucp) | High | Low | Low | ✅ ship | Already shipped; enhanced with 5 services (cart/checkout/catalog/storefront/policies MCP) |
| A.2 | Public MCP (policies/FAQ) | High | Low | Low | ✅ ship | Pre-existing infrastructure |
| A.3 | Authenticated MCP (catalog/cart) | High | Med | Med | ✅ ship | Pre-existing; 5 tools available |
| A.4 | llms.txt with catalog snapshot | High | Low | Low | ✅ ship | Ported enhanced version from 002 to 001 |
| A.5 | Agent surface detection | Med | Low | Low | ✅ ship | Pre-existing |
| A.6 | Agent-native PDP | High | Low | Med | ✅ ship | Pre-existing |
| A.7 | Agent-native cart view | High | Low | Med | ✅ ship | Pre-existing |
| A.8 | Cart permalink handoff | High | Low | Low | ✅ ship | Pre-existing; audited identical across storefronts |
| A.9 | Cart agent-arrival banner | Med | Low | Low | ✅ ship | Pre-existing |
| A.10 | Cart agent-fallback banner | Med | Low | Low | ✅ ship | Ported from 002 to 001 (parity) |
| A.11 | Full-page agent-fallback banner | Med | Low | Low | ✅ ship | Ported from 002 to 001 as available infra |
| A.12 | Agent server bypass | High | Med | Med | ✅ ship | Pre-existing |
| A.13 | Affinity re-ranking | Med | Low | Med | ✅ ship | Pre-existing |
| A.14 | SCE structured-data meta tags | Med | Low | Low | ✅ ship | Pre-existing |
| A.15 | Predictive search | High | Low | Low | ✅ ship | Hydrogen baseline |
| A.16 | RELATED recommendation rail | High | Low | Low | ✅ ship | Pre-existing |
| A.17 | COMPLEMENTARY recommendation rail | High | Low | Med | ✅ ship | New — added aliased GraphQL field + second rail |
| A.18 | PDP Q&A panel | High | Med | High | ✅ ship | New — backend route + per-storefront UI; flag-gated; bounded prompt |
| A.19 | AI meta descriptions | Med | Low | Med | ✅ ship | New — lazy cache pattern; merchant value always wins |
| A.20 | LLM query reformulation (utility) | Med | Low | Med | ✅ ship | Utility shipped; route integration deferred (D.7) |
| A.21 | AI crawler allowlist | High | Low | Low | ✅ ship | Pre-existing; 13 AI crawlers, agent endpoints permitted |
| A.22 | Schema.org structured data suite | High | Low | Low | ✅ ship | Pre-existing comprehensive coverage; converged 001's inline Organization schema to shared function |
| B.1 | Shopify Cart MCP (hosted) | High | Low | None | 🔧 setup | Auto-exposed by Shopify; declared in our UCP profile |
| B.2 | `complete_checkout` (Token tier) | High | High | High | 🔧 setup | Requires Shopify partner-team registration; not self-serve |
| B.3 | Customer Accounts MCP | High | High | High | 🔧 setup | Requires custom domain + L2 PCD approval |
| B.4 | Order webhooks for agents | Med | Med | Med | 🔧 setup | Requires partner-team contact |
| B.5 | Shop Pay agent payment handler | Med | High | High | 🔧 setup | Preview-only; manual `client_id` registration |
| B.6 | Cart Transform `lineUpdate` | Low | Med | Med | 🔧 setup | Shopify Plus only |
| C.1 | Shopify Magic | n/a | n/a | n/a | 📋 inventory only | Admin-only |
| C.2 | Shopify Sidekick | n/a | n/a | n/a | 📋 inventory only | Admin-only |
| D.1 | Agent-aware recommendation rerank | Low | Low | Med | ⏭ defer | Low marginal value for demo store; ship when first client has volatile inventory |
| D.2 | Vectorize semantic search | Med | Med | High | ⏭ defer | Out of scope per project decision; LLM reformulation chosen instead |
| D.3 | Conversational chat widget | Med | Med | High | ⏭ defer | Out of scope per project decision; PDP Q&A covers most need |
| D.4 | Cloudflare AI Gateway | Low | Low | Low | ⏭ defer | Out of scope per project decision; can layer in later |
| D.5 | Cart "share with AI agent" button | Low | Low | Low | ⏭ defer | Out of scope per project decision; route handler still recognizes agent permalinks |
| D.6 | AI meta descriptions on collections | Med | Low | Low | ⏭ defer | Utility supports it; PDP integration only this round |
| D.7 | Query reformulation route wiring | Med | Med | Low | ⏭ defer | Utility ready; route integration deferred to avoid regressing search flow |

## Summary

- **Shipped this round**: 22 capabilities (most pre-existing; key additions: COMPLEMENTARY rail, PDP Q&A, AI meta, UCP profile enhancement, llms.txt enrichment, drift convergence)
- **Setup-required**: 6 capabilities (all require Shopify partner-team or Plus tier coordination)
- **Admin-only inventory**: 2 (Magic, Sidekick)
- **Deferred**: 7 capabilities (small-scope follow-ups, infrastructure-ready)
