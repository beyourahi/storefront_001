# storefront_001

## Always Do First

**Invoke the `frontend-design` skill** before writing any frontend code, every session, no exceptions.

## ⚠️ Git Worktree Workflow (MANDATORY)

**NEVER CREATE BRANCHES**. Use git worktrees for parallel work:

```bash
git worktree add ../storefront_001-<feature-name>   # Create worktree
git worktree list                                   # List worktrees
git worktree remove <path>                          # Remove worktree
git worktree prune                                  # Clean stale refs
```

Direct commits to `main` only. This keeps the repo aligned with the worktree-only workflow and avoids branch sprawl.

**Always break large tasks into focused scopes** — run parallel agents with git worktrees, each with a narrow, well-defined goal.

---

## Project Overview

A **commercial Shopify Hydrogen template** built to be sold to multiple client brands across different niches. High-performance storefront based on React Router 7, Shopify Oxygen, and Cloudflare Workers with PWA support, metaobject CMS, wishlist flows, blog surfaces, and offline/error handling. **Critical**: import from `react-router`, never `@remix-run/react`.

### Dual Deployment Targets

| Target                             | Purpose                         | Data Source                               |
| ---------------------------------- | ------------------------------- | ----------------------------------------- |
| **Shopify Oxygen**                 | Client production deployments   | Client's own Shopify store (no fallback)  |
| **Cloudflare Workers + local dev** | Portfolio showcase + dev server | Fallback demo store + `fallback-data.ts`  |

- On **Oxygen**: NEVER use the fallback store or `fallback-data.ts` — all data comes from the client's Shopify store
- On **Cloudflare Workers** and during **local development**: ALWAYS use the fallback demo store for products and `fallback-data.ts` for non-product content

## Tech Stack

| Category      | Tech             | Version    | Notes                               |
| ------------- | ---------------- | ---------- | ----------------------------------- |
| **Framework** | React            | 18.3.1     | React Compiler enabled              |
|               | React Router     | 7.12.0     | Hydrogen preset, file-based routing |
|               | Shopify Hydrogen | 2026.1.0   | Storefront + Customer Account APIs  |
|               | Storefront API   | 2026-01    | GraphQL API version                 |
|               | TypeScript       | 5.x        | Strict mode, ES2022 target          |
|               | Vite             | 6          | Build tooling                       |
| **UI**        | Tailwind CSS     | v4         | CSS-first config via `@import`      |
|               | shadcn/ui        | Latest     | Radix-backed components             |
|               | Lucide React     | Latest     | Icons                               |
|               | OKLCH colors     | -          | Theme + contrast pipeline           |
| **Features**  | Workbox          | 7          | Service worker, offline support     |
|               | Wishlist         | Custom     | Account + share flows               |
|               | Blog             | Custom     | Article + author surfaces           |
|               | Metaobjects      | Shopify    | Theme + content CMS                 |
| **Dev**       | ESLint           | 9          | Flat config                         |
|               | Bun              | Latest     | Package manager + scripts           |
|               | Node.js          | >= 20.19.0 | **Strict requirement**              |

**GraphQL**: Dual-project (Storefront API + Customer Account API)  
**Path Alias**: `~/` → `app/`

## Core Architecture

```text
storefront_001/
├── app/
│   ├── routes/                    # Route modules
│   ├── components/                # UI and feature components
│   │   ├── ui/                    # shadcn/ui generated primitives
│   │   ├── blog/                  # Blog surfaces
│   │   ├── cart/                  # Cart surfaces
│   │   ├── layout/                # Navigation, footer, overlays
│   │   └── pwa/                   # Offline/PWA helpers
│   ├── lib/                       # Shared utilities
│   │   ├── color/                 # OKLCH + contrast helpers
│   │   ├── metaobject-*.ts        # CMS queries/parsers/fragments
│   │   ├── product/               # Product utilities
│   │   └── validation/            # Zod schemas
│   ├── graphql/customer-account/  # Customer account queries
│   ├── hooks/                     # Shared hooks
│   └── styles/app.css             # Tailwind v4 + theme tokens
├── public/                        # Static assets + manifest
├── vite.config.ts                 # React Compiler + Vite config
└── react-router.config.ts         # Hydrogen preset
```

## Common Commands

```bash
bun run dev          # Dev server + GraphQL codegen
bun run build        # Production build
bun run preview      # Preview build
bun run lint         # ESLint
bun run typecheck    # TypeScript + route types
bun run codegen      # Regenerate GraphQL types
```

## Code Style

**ESLint**: Flat config with TypeScript, React, and accessibility rules

- camelCase/PascalCase naming
- object shorthand preferred
- keep code readable over clever

**Formatting**: 4 spaces, 120 chars, double quotes, semicolons required

**TypeScript**: Strict mode, ES2022 target, `~/` alias only

**React**: No manual memoization by default because React Compiler is enabled. Import from `react-router`.

**Files**: Keep components in PascalCase, utilities in camelCase, and co-locate related feature code.

## MCP Servers

**shopify-dev**: Hydrogen, Storefront API, Customer Account API, GraphQL validation  
**context7**: Tailwind, Radix UI, React, TypeScript

Prefer MCP documentation tools over web search for official docs. Run `bun run codegen` after any GraphQL change.

## Testing

**Current**: No committed test suite expected in this repo state  
**Recommended when adding tests later**: Vitest, React Testing Library, Playwright, MSW

## Cart Actions Reference (`app/routes/cart.tsx`)

| Action                                 | Method                          | Notes                                  |
| -------------------------------------- | ------------------------------- | -------------------------------------- |
| `CartForm.ACTIONS.LinesAdd`            | `cart.addLines()`               | Add line items                         |
| `CartForm.ACTIONS.LinesUpdate`         | `cart.updateLines()`            | Update quantities / attributes         |
| `CartForm.ACTIONS.LinesRemove`         | `cart.removeLines()`            | Remove line items                      |
| `CartForm.ACTIONS.DiscountCodesUpdate` | `cart.updateDiscountCodes()`    | Replace all discount codes             |
| `CartForm.ACTIONS.GiftCardCodesUpdate` | `cart.updateGiftCardCodes()`    | Replace all gift card codes            |
| `CartForm.ACTIONS.GiftCardCodesAdd`    | `cart.addGiftCardCodes()`       | Append gift card codes (2026.1.0+)     |
| `CartForm.ACTIONS.GiftCardCodesRemove` | `cart.removeGiftCardCodes()`    | Remove applied gift card codes         |
| `CartForm.ACTIONS.NoteUpdate`          | `cart.updateNote()`             | Update cart note                       |
| `CartForm.ACTIONS.BuyerIdentityUpdate` | `cart.updateBuyerIdentity()`    | Update buyer country / customer        |

## Repository

**Commits**: Conventional prefixes preferred: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`, `perf:`  
**Before Push**: `bun run typecheck`, `bun run lint`, `bun run codegen` after GraphQL changes  
**Code Review**: Read comments before editing; preserve intent and constraints

## Environment

**Node.js**: `>= 20.19.0`  
**Env Vars** (`.env`):

```bash
SESSION_SECRET=<32chars>                        # Required
PUBLIC_STORE_DOMAIN=<store>.myshopify.com      # Required in real store mode
PUBLIC_STOREFRONT_API_TOKEN=<token>            # Required in real store mode
PUBLIC_GTM_CONTAINER_ID=GTM-XXXXXXX            # Optional
```

**Fallback Demo Store (Cloudflare Workers, Local Dev, and Portfolio Showcase ONLY):**

> ⚠️ Used during local development and Cloudflare Workers portfolio deployments. **NEVER use on Oxygen / client deployments.**

```bash
PUBLIC_STOREFRONT_API_TOKEN=586d8fd7c598fea7e1b97a8eff48ed49
PUBLIC_STORE_DOMAIN=horcrux-demo-store.myshopify.com
PUBLIC_CHECKOUT_DOMAIN=horcrux-demo-store.myshopify.com
PRIVATE_STOREFRONT_API_TOKEN=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
PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID=d59946cb-1d27-415f-bb8e-c8ea32ffb5eb
PUBLIC_CUSTOMER_ACCOUNT_API_URL=https://shopify.com/66049638586
SHOP_ID=66049638586
```

Non-product content falls back to `fallback-data.ts` in `app/lib/`.

**Setup**: `bun install && bun run codegen && bun run dev`

## Key Files

**Architecture**: `app/lib/metaobject-queries.ts`, `app/lib/metaobject-parsers.ts`, `app/lib/metaobject-fragments.ts`, `app/lib/color/`, `app/components/pwa/`  
**Config**: `vite.config.ts`, `react-router.config.ts`, `eslint.config.js`, `app/styles/app.css`  
**GraphQL**: `storefrontapi.generated.d.ts`, `customer-accountapi.generated.d.ts`  
**Theme System**: `app/lib/theme-utils.ts`, `app/root.tsx`, `app/styles/app.css`  
**PWA/Offline**: `app/components/OfflineAwareErrorPage.tsx`, `public/manifest.webmanifest`

## Critical Warnings

**1. React Router Imports**

- **Problem**: `@remix-run/react` causes runtime and compatibility issues
- **Solution**: Always import from `react-router`

**2. React Compiler Target**

- **Problem**: Must target React 18 correctly
- **Location**: `vite.config.ts`

**3. GraphQL Codegen**

- **Problem**: Stale generated types after query or fragment changes
- **Solution**: Run `bun run codegen` after ANY GraphQL modification

**4. Theme and Contrast**

- **Problem**: Hardcoded colors drift from semantic tokens and break contrast
- **Solution**: Use semantic theme tokens from `app/styles/app.css` and `app/lib/theme-utils.ts`

**5. Metaobject Fallbacks**

- **Problem**: Missing CMS data can break pages
- **Solution**: Keep fallbacks aligned in `app/lib/metaobject-parsers.ts`

**6. Offline/Cache Behavior**

- **Problem**: Cached UI can hold stale content after changes
- **Solution**: Review service worker and offline flows when touching PWA behavior

**7. Node Version**

- **Problem**: Node < 20.19.0 causes build/runtime issues
- **Solution**: Use the required version and confirm via `node --version`

**8. Path Alias**

- **Problem**: Relative imports create churn and inconsistency
- **Solution**: Always use `~/`

## Code Comments (MANDATORY)

Read all comments before editing. Update comments when changing behavior. Add concise comments where logic, constraints, or intent are not obvious.

## Accessibility (MANDATORY)

### Contrast Ratios

| Content                      | Minimum | WCAG        |
| ---------------------------- | ------- | ----------- |
| Normal text                  | 4.5:1   | 1.4.3 (AA)  |
| Large text (≥18pt/14pt bold) | 3:1     | 1.4.3 (AA)  |
| UI components                | 3:1     | 1.4.11 (AA) |
| Touch targets                | 44x44px | 2.5.5 (A)   |

**Color System**: OKLCH-based tokens live in `app/styles/app.css`, with theme derivation in `app/lib/theme-utils.ts`.
