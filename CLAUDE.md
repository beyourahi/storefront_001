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

Part of the **storefront family** (`storefront_001`, `storefront_002`, `storefront_003`, etc.) — a collection of commercial Shopify Hydrogen templates built to be sold to multiple client brands across different niches. High-performance storefront based on React Router 7, Shopify Oxygen, and Cloudflare Workers with PWA support, metaobject CMS, wishlist flows, blog surfaces, and offline/error handling. **Critical**: import from `react-router`, never `@remix-run/react`.

Backend behavior, data flow, and Hydrogen conventions **must remain consistent** across all storefronts — the frontend layer (UI, presentation, visual identity) is where storefronts differentiate.

### Hydrogen Implementation Reference

`~/Desktop/projects/demo-store` is a **freshly scaffolded, unmodified Shopify Hydrogen codebase** — the **primary source of truth** for all non-frontend-visual-design patterns. Consult it first when uncertain about core Hydrogen conventions, data-fetching patterns, route/loader structure, or server-side implementation details.

### Dual Deployment Targets

| Target                             | Purpose                         | Data Source                               |
| ---------------------------------- | ------------------------------- | ----------------------------------------- |
| **Shopify Oxygen**                 | Client production deployments   | Client's own Shopify store (no fallback)  |
| **Cloudflare Workers + local dev** | Portfolio showcase + dev server | Demo Shopify store credentials + in-repo content defaults |

- On **Oxygen**: use the client's Shopify credentials only
- On **Cloudflare Workers** portfolio deployments: `wrangler.jsonc` is preconfigured with the demo-store credentials
- During **local development**: point `.env` at the desired Shopify store; UI and content defaults currently live in `app/lib/metaobject-parsers.ts`

## Tech Stack

| Category      | Tech             | Version    | Notes                               |
| ------------- | ---------------- | ---------- | ----------------------------------- |
| **Framework** | React            | 18.3.1     |                                     |
|               | React Router     | 7.12.0     | Hydrogen preset, file-based routing |
|               | Shopify Hydrogen | 2026.1.3   | Storefront + Customer Account APIs  |
|               | Storefront API   | 2026-01    | GraphQL API version                 |
|               | TypeScript       | 5.x        | Strict mode, ES2022 target          |
|               | Vite             | 6          | Build tooling                       |
| **UI**        | Tailwind CSS     | v4         | CSS-first config via `@import`      |
|               | shadcn/ui        | Latest     | Radix-backed components             |
|               | Lucide React     | Latest     | Icons                               |
|               | OKLCH colors     | -          | Theme + contrast pipeline           |
| **Features**  | Embla Carousel   | 8          | Product galleries, auto-scroll      |
|               | Lenis            | 1.3        | Smooth scrolling                    |
|               | Vaul             | 1.1        | Drawer primitives                   |
|               | Wishlist         | Custom     | Account + share flows               |
|               | Blog             | Custom     | Article + author surfaces           |
|               | PWA              | Custom     | Custom service worker, offline      |
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
│   │   ├── account/               # Account dashboard surfaces
│   │   ├── blog/                  # Blog surfaces
│   │   ├── cart/                  # Cart drawer + line items
│   │   ├── collection/            # Collection page components (sort/filter bar)
│   │   ├── common/                # Shared presentational (breadcrumbs, price, skeletons)
│   │   ├── contact/               # Contact page components
│   │   ├── custom/                # Custom overrides (collection pagination)
│   │   ├── display/               # Product/collection cards
│   │   ├── gallery/               # Masonry grid
│   │   ├── homepage/              # Hero, sections, promotions
│   │   ├── icons/                 # Custom icon components
│   │   ├── layout/                # Navbar, footer, mobile menu, search overlay
│   │   ├── legal/                 # Policy/legal page layouts
│   │   ├── motion/                # Animation primitives (parallax)
│   │   ├── product/               # PDP components (gallery, options, purchase)
│   │   ├── pwa/                   # Install prompts, SW update banner
│   │   ├── search/                # Search results + controls
│   │   ├── sections/              # Reusable page sections
│   │   └── ProductLightbox/       # Fullscreen image lightbox
│   ├── lib/                       # Shared utilities
│   │   ├── color/                 # OKLCH + contrast helpers
│   │   ├── performance/           # Image optimization helpers
│   │   ├── product/               # Product parsing, pricing, variants
│   │   ├── queries/               # Shared GraphQL queries
│   │   ├── search/                # Search URL utilities
│   │   ├── types/                 # Shared type definitions
│   │   ├── validation/            # Custom validators (regex-based)
│   │   ├── metaobject-*.ts        # CMS queries/parsers/fragments
│   │   ├── data-source.ts         # Data adapter abstraction
│   │   └── site-content-context.tsx # Site-wide content React context
│   ├── graphql/customer-account/  # Customer account queries
│   ├── hooks/                     # Shared hooks
│   ├── assets/icons/              # Static icon assets
│   └── styles/app.css             # Tailwind v4 + theme tokens
├── public/                        # Static assets (sw.js, pwa-install-capture.js)
├── vite.config.ts                 # Vite build config
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
bun run deploy       # Build + deploy to Cloudflare Workers
bun run dev:workers  # Build + run via Wrangler locally
```

## Code Style

**ESLint**: Flat config with TypeScript, React, and accessibility rules

- camelCase/PascalCase naming
- object shorthand preferred
- keep code readable over clever

**Formatting**: 4 spaces, 120 chars, double quotes, semicolons required

**TypeScript**: Strict mode, ES2022 target, `~/` alias only

**React**: Import from `react-router`.

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

For portfolio Workers deploys, demo-store credentials live in `wrangler.jsonc`. UI and content defaults are currently embedded in `app/lib/metaobject-parsers.ts` rather than a separate fallback-data module.

**Setup**: `bun install && bun run codegen && bun run dev`

## Key Files

**Architecture**: `app/lib/metaobject-queries.ts`, `app/lib/metaobject-parsers.ts`, `app/lib/metaobject-fragments.ts`, `app/lib/data-source.ts`, `app/lib/site-content-context.tsx`, `app/lib/color/`
**Config**: `vite.config.ts`, `react-router.config.ts`, `eslint.config.js`, `prettier.config.js`, `app/styles/app.css`, `wrangler.jsonc`
**GraphQL**: `storefrontapi.generated.d.ts`, `customer-accountapi.generated.d.ts`
**Theme System**: `app/lib/theme-utils.ts`, `app/root.tsx`, `app/styles/app.css`
**PWA/Offline**: `app/components/OfflineAwareErrorPage.tsx`, `app/routes/manifest[.]webmanifest.tsx`, `public/sw.js`

## Critical Warnings

**1. React Router Imports**

- **Problem**: `@remix-run/react` causes runtime and compatibility issues
- **Solution**: Always import from `react-router`

**2. GraphQL Codegen**

- **Problem**: Stale generated types after query or fragment changes
- **Solution**: Run `bun run codegen` after ANY GraphQL modification

**3. Theme and Contrast**

- **Problem**: Hardcoded colors drift from semantic tokens and break contrast
- **Solution**: Use semantic theme tokens from `app/styles/app.css` and `app/lib/theme-utils.ts`

**4. Metaobject Fallbacks**

- **Problem**: Missing CMS data can break pages
- **Solution**: Keep fallbacks aligned in `app/lib/metaobject-parsers.ts`

**5. Offline/Cache Behavior**

- **Problem**: Cached UI can hold stale content after changes
- **Solution**: Review service worker and offline flows when touching PWA behavior

**6. Node Version**

- **Problem**: Node < 20.19.0 causes build/runtime issues
- **Solution**: Use the required version and confirm via `node --version`

**7. Path Alias**

- **Problem**: Relative imports create churn and inconsistency
- **Solution**: Always use `~/`

## Execution Strategy

- Use **multiple sub-agents** for independent tasks (research, implementation, review)
- Use **git worktrees** for parallel implementation work
- Provide agents with **context, constraints, and objectives** — not overly prescriptive step-by-step instructions
- Quality priorities: **clarity > technical correctness > practical usefulness > context density > signal over noise**

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

---

## Cleanup (MANDATORY)

- **MANDATORY CLEANUP**: After every successful task implementation, if the `tmp_screenshots/` directory was created during the work, it must be deleted before the task is considered complete. Do not skip this step — it is a hard requirement.
- **MANDATORY CLEANUP**: After every successful task implementation, if the `.playwright-mcp/` directory exists in the project root, it must be deleted before the task is considered complete. This directory is created by the Playwright MCP server during browser automation and is a transient artifact that must not persist in the codebase. Do not skip this step — it is a hard requirement.
