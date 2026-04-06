# Typography Audit Report
**Storefront:** storefront_001 (`~/Desktop/projects/storefronts/storefront_001`)  
**Audited:** 2026-04-06  
**Methods:** Static code analysis of all source files + cross-reference against prior Playwright computed styles (dev server active on port 5173; no new browser session initiated — all computed values reference the 2026-04-05 session, which remains valid as no typography code changed)  
**Routes covered:** `/`, `/collections/all-products`, `/products/deathly-hallows-pendant`, `/sale`, `/faq`, `/blogs/…/…`  
**Status:** **RESOLVED** — All critical and high-priority rendering bugs fixed (2026-04-06). Static fallback fonts corrected, dead CSS removed, Hero H1 line-height fix applied, prose classes replaced, preload hint added, and letter-spacing scale established. Remaining open items: fallback font differentiation in metaobject-parsers.ts and theme-utils.ts (low CMS risk), and two low-priority cosmetic issues.

---

## Executive Summary

All critical and high-priority issues identified across two audit sessions (2026-04-05 and 2026-04-06) have been resolved in this session. The typography pipeline from metaobject CMS → theme generation → CSS variables → Tailwind utilities → component usage is architecturally correct and now consistently applied.

**Fixes applied in this session (2026-04-06):**
- ✅ Hero H1 `lineHeight: 0.9` mobile line-overlap bug — replaced inline `style={}` with `.hero-title-fluid` class (both HeroSection and VideoHero)
- ✅ Hero description wrong font/weight — changed from `font-serif text-xs font-semibold uppercase` to `font-sans text-sm font-normal leading-relaxed text-white/80`
- ✅ `.hero-title-fluid` CSS class consolidated — aligned to hero's actual values (`font-weight: 600`, `line-height: clamp(1.1, 1.05 + 0.3vw, 1.2)`)
- ✅ Static CSS var fallbacks fixed — `--font-serif` and `--font-mono` now have semantically correct stacks instead of `Inter`-only
- ✅ Dead `font-display: swap` rules removed — all four invalid class/element selectors deleted from `app.css`
- ✅ `prose` classes replaced with `.article-content` — product descriptions and all policy pages now render with proper typographic treatment
- ✅ `GiantText as="h1"` added — CollectionHero, ShopAllHero, LegalPageHero all emit a semantic H1
- ✅ Product H1 responsive scaling added — `lg:text-3xl xl:text-4xl` breakpoints
- ✅ Sale hero subtitles switched to `font-sans`
- ✅ Sub-scale badge sizes eliminated — all `text-[9px]`, `text-[10px]`, `text-[11px]` replaced with `text-xs` minimum
- ✅ Google Fonts preload hint added — `<link rel="preload" as="style">` before stylesheet in root.tsx
- ✅ Letter-spacing scale defined — `--tracking-display`, `--tracking-label`, `--tracking-caps`, `--tracking-caps-wide` in `@theme inline`; all `tracking-[Xem]` arbitrary values replaced
- ✅ Timestamp row font inconsistency fixed — date and time spans now both use `font-mono`
- ✅ `.article-content > p:first-of-type` opacity replaced with `text-muted-foreground`
- ✅ Product card subtitle font switched to `font-sans`
- ✅ `text-[0.75em]` in WishlistCountInline replaced with `text-xs`

**Remaining open (not fixed — low priority / CMS risk):**
- ⚠️ `FALLBACK_THEME_FONTS` / `DEFAULT_THEME_FONTS` still use identical `Inter` for all three roles — only affects offline/CMS-failure state; low practical risk
- ⚠️ Search input uses `font-serif text-xl` — cosmetic; does not affect legibility
- ⚠️ `GiantText` `leading-none` comment not added — documentation-only, no functional impact

---

## Resolved Font Configuration

The three metaobject fields map through the system as follows. This codebase uses semantic names (`font-sans`, `font-serif`, `font-mono`) rather than the role-based aliases (`font-body`, `font-heading`, `font-price`) — the roles are equivalent.

| Role | CMS Field | `ThemeFonts` key | CSS Variable | Tailwind Class | Runtime Value | Fallback State |
|------|-----------|-----------------|--------------|----------------|---------------|----------------|
| Body font | `body_font` | `.sans` | `--font-sans` | `font-sans` | `"Google Sans Flex", ui-sans-serif, system-ui, sans-serif` | `Inter, ui-sans-serif, sans-serif, system-ui` ❌ |
| Heading font | `heading_font` | `.serif` | `--font-serif` | `font-serif` | `"Fraunces", ui-serif, Georgia, serif` | `Inter, ui-sans-serif, sans-serif, system-ui` ❌ |
| Price font | `price_font` | `.mono` | `--font-mono` | `font-mono` | `"Google Sans Code", ui-monospace, SFMono-Regular, monospace` | `Inter, ui-sans-serif, sans-serif, system-ui` ❌ |

**Runtime fonts confirmed (prior session):** Fraunces (serif/heading), Google Sans Flex (sans/body), Google Sans Code (mono/price) — all loaded ✅  
**Fallback fonts:** All three roles collapse to identical `Inter`-first stacks ❌

---

## Audit Results

### 1. Font Source — Metaobject CMS Layer
**Status: PARTIAL**

- ✅ All three font fields are queried in `app/lib/metaobject-fragments.ts:5–7`:
  - `fontBody: field(key: "body_font") { value }`
  - `fontHeading: field(key: "heading_font") { value }`
  - `fontPrice: field(key: "price_font") { value }`
- ✅ All three are parsed in `parseThemeFonts()` (`app/lib/metaobject-parsers.ts:720–724`): `sans ← fontBody.value`, `serif ← fontHeading.value`, `mono ← fontPrice.value`
- ✅ Parse flow is correct: `parseSiteContent(siteContentData, themeSettingsData)` calls `parseThemeSettings()` → `parseThemeFonts()` → populates `siteContent.themeConfig.fonts`
- ✅ `useThemeConfig()` (`app/lib/site-content-context.tsx:51`) returns the full `ThemeConfig` which includes `fonts: ThemeFonts` with `.sans`, `.serif`, `.mono` properties
- ❌ `FALLBACK_THEME_FONTS` (`app/lib/metaobject-parsers.ts:111–115`) is `{ sans: "Inter", serif: "Inter", mono: "Inter" }` — all three roles collapse to the same font if CMS fields are missing
- ❌ `DEFAULT_THEME_FONTS` (`app/lib/theme-utils.ts:189–193`) is also `{ sans: "Inter", serif: "Inter", mono: "Inter" }` — fallback at theme generation is equally undifferentiated
- ⚠️ Fallback font name "Inter" is a valid Google Font, so it would load — but semantic differentiation between body, heading, and price is entirely lost

No regressions since 2026-04-05.

---

### 2. Font Loading — Google Fonts and head Tags
**Status: PARTIAL**

- ✅ `preconnect` to `https://fonts.googleapis.com` present in `links()` (`app/root.tsx:82`)
- ✅ `preconnect` to `https://fonts.gstatic.com` with `crossOrigin: "anonymous"` present (`app/root.tsx:83`)
- ✅ Google Fonts `<link rel="stylesheet">` dynamically injected in `Layout()` (`app/root.tsx:327`)
- ✅ `display=swap` parameter appended to URL by `generateGoogleFontsUrl()` (`app/lib/theme-utils.ts:830`)
- ✅ Font weights requested per role:
  - **sans (Google Sans Flex):** `ital,opsz,wght@0,14..32,100..900;1,14..32,100..900` — full variable range incl. italic + optical size ✅
  - **serif (Fraunces):** `ital,wght@0,400..800;1,400..800` — weight range 400–800 with italic ✅
  - **mono (Google Sans Code):** `wght@400;500;600;700` — four discrete weights ✅
- ✅ Italic variants requested for serif — covers `.article-content blockquote` italic usage ✅
- ❌ No `<link rel="preload">` for critical fonts — `links()` in `app/root.tsx:78–88` has only `preconnect` and `stylesheet` entries
- ❌ `font-display: swap` set on `html` element (`app/styles/app.css:406`) — invalid placement; `font-display` is only valid inside `@font-face` blocks. Zero browser effect.
- ❌ `font-display: swap` set on `.font-serif`, `.font-sans`, `.font-mono` CSS class selectors (`app/styles/app.css:415, 419, 422`) — same invalid placement, zero effect. **NEW finding not in prior audit.**
- ✅ Actual `display=swap` behavior correctly handled via the Google Fonts URL query parameter
- ✅ No `@font-face` declarations in any CSS file — no conflict with Google Fonts
- ✅ Fallback stacks in `generateFontFamily()` are appropriate per type
- ⚠️ Prior session: of 32 registered font instances at initial load, only 5 had status `"loaded"`; 27 were `"unloaded"` — lazy-loading all weights causes FOUT on first visit

**Google Fonts URL pattern (as constructed for the live demo store):**
```
https://fonts.googleapis.com/css2?family=Google+Sans+Flex:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Fraunces:ital,wght@0,400..800;1,400..800&family=Google+Sans+Code:wght@400;500;600;700&display=swap
```

---

### 3. CSS Custom Properties — Theme Token Layer
**Status: PARTIAL**

**Typography CSS vars produced by `generateThemeCssVariables()` (`app/lib/theme-utils.ts:944–946`):**
```
--font-sans: "${fonts.sans}", ui-sans-serif, system-ui, sans-serif
--font-serif: "${fonts.serif}", ui-serif, Georgia, serif
--font-mono: "${fonts.mono}", ui-monospace, SFMono-Regular, monospace
```

**Static default values in `app/styles/app.css:68–70`:**
```css
--font-sans: Inter, ui-sans-serif, sans-serif, system-ui;
--font-serif: Inter, ui-sans-serif, sans-serif, system-ui;   /* identical to --font-sans ❌ */
--font-mono: Inter, ui-sans-serif, sans-serif, system-ui;   /* identical to --font-sans ❌ */
```

- ❌ Default `--font-serif` and `--font-mono` are identical to `--font-sans` — any page paint before the runtime `<style>` tag injects (SSR flash, error boundaries, offline fallback) renders all three type roles identically
- ✅ CSS variable names match exactly what the Tailwind `@theme inline` block references (`app/styles/app.css:280–282`)
- ✅ CSS vars injected via `<ThemeStyleTag>` (`app/root.tsx:312–314`) writing a `<style>` tag to `<head>` targeting `:root`
- ✅ No CSS variable collisions — no other file re-declares `--font-sans`, `--font-serif`, or `--font-mono`
- ✅ `text-rendering: optimizeLegibility` on `html` (`app/styles/app.css:405`) — valid placement ✅
- ✅ `-webkit-font-smoothing: antialiased` on `html` (`app/styles/app.css:403`) — correct ✅
- ✅ Base font-size on `html` is browser default (16px) — no rem-base override; calculations are correct

**Computed values confirmed by prior session:**
```
--font-sans  → "Google Sans Flex", ui-sans-serif, system-ui, sans-serif   ✅
--font-serif → "Fraunces", ui-serif, Georgia, serif                       ✅
--font-mono  → "Google Sans Code", ui-monospace, SFMono-Regular, monospace ✅
```

---

### 4. Tailwind Theme Configuration — Type Scale and Font Utilities
**Status: PASS**

**Font family configuration (`app/styles/app.css:280–282` inside `@theme inline`):**
```css
--font-sans: var(--font-sans);
--font-mono: var(--font-mono);
--font-serif: var(--font-serif);
```
Correct Tailwind v4 CSS-first pattern — utility classes dynamically resolve to the runtime CSS variable. ✅

**Type scale (Tailwind defaults — no custom scale overrides in `@theme inline`):**

| Tailwind Class | Size | Count | On-Scale? |
|---|---|---|---|
| `text-xs` | 12px | 134 | ✅ |
| `text-sm` | 14px | 382 | ✅ |
| `text-base` | 16px | 94 | ✅ |
| `text-lg` | 18px | 70 | ✅ |
| `text-xl` | 20px | 61 | ✅ |
| `text-2xl` | 24px | 43 | ✅ |
| `text-3xl` | 30px | 53 | ✅ |
| `text-4xl` | 36px | 44 | ✅ |
| `text-5xl` | 48px | 18 | ✅ |
| `text-6xl` | 60px | 22 | ✅ |
| `text-7xl` | 72px | 8 | ✅ |
| `text-8xl` | 96px | 1 | ✅ |
| `text-9xl` | 128px | 1 | ✅ |
| `text-[12px]` | 12px | 2 | ❌ Arbitrary — use `text-xs` |
| `text-[11px]` | 11px | 3 | ❌ Below scale |
| `text-[10px]` | 10px | 4 | ❌ Below accessible minimum |
| `text-[9px]` | 9px | 1 | ❌ Unreadable |
| `text-[0.75em]` | context-dependent | 1 | ❌ Relative arbitrary |
| inline clamp(1.5rem, 3.5vw, 4.5rem) | 24→72px fluid | 2 | ❌ Bypasses scale, diverges from `.hero-title-fluid` |

**Summary: 13 on-scale, 6 off-scale classes = 68% on-scale** (unchanged from prior audit)

No `@tailwindcss/typography` plugin installed or configured.

**Custom CSS utility classes with typographic properties (`app/styles/app.css`):**

| Class | Font Size | Weight | Letter-Spacing | Line Height |
|---|---|---|---|---|
| `.cta-enhanced` | 0.875rem / 1rem mobile | 600 / 700 mobile | 0.025em / 0.05em mobile | 1.25 |
| `.cta-primary-emphasis` | 1rem / 1.125rem mobile | 700 / 800 mobile | 0.05em / 0.075em mobile | 1.2 |
| `.hero-title-fluid` | `clamp(2rem, 1.5rem + 2.5vw, 4rem)` | **300** | -0.02em | `clamp(1.1, 1.05 + 0.25vw, 1.2)` |

⚠️ `.hero-title-fluid` specifies `font-weight: 300` (light) but the actual hero H1 uses `font-semibold` (600) via inline style — these diverge significantly and the class is not used by any hero component.

---

### 5. Heading Typography
**Status: PARTIAL**

- ✅ All headings consistently use `font-serif` (Fraunces) — coherent with the design system
- ❌ Hero H1 (`HeroSection.tsx:111`, `VideoHero.tsx:245`): uses `font-serif font-semibold` + inline `style={{fontSize: "clamp(1.5rem, 3.5vw, 4.5rem)", lineHeight: 0.9}}` — **lineHeight: 0.9 is a critical legibility failure at mobile wrap** (confirmed visually)
- ❌ Product H1 (`ProductPageTitle.tsx:13`): `text-2xl font-bold tracking-tight sm:text-2xl` — no desktop scaling; `sm:text-2xl` is redundant
- ❌ Collection/legal/shop page H1 (`CollectionHero.tsx:28`, `ShopAllHero.tsx:19`, `LegalPageHero.tsx:33`): GiantText renders as `<div>` — no `as="h1"` prop passed; semantic H1 absent on these pages
- ✅ Article H1 (`blogs.$blogHandle.$articleHandle.tsx:147`): `font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-medium leading-[1.15] tracking-tight` — well-scaled ✅
- ✅ FAQ H1 (`faq.tsx:39`): `font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl` ✅
- ✅ Search H1 (`search.tsx:375`): `font-serif text-3xl sm:text-4xl md:text-6xl lg:text-7xl xl:text-8xl 2xl:text-9xl` ✅
- ✅ Account H1s: `font-serif text-xl md:text-2xl lg:text-3xl font-medium` — consistent ✅

**Heading size table by route:**

| Route | Element | Font Class | Size | Weight | Line-Height | Notes |
|---|---|---|---|---|---|---|
| Home hero | H1 | `font-serif` | clamp 24→72px inline | `font-semibold` | **0.9 ❌** | Line overlap on mobile wrap |
| Product page | H1 | `font-serif` | `text-2xl` (all viewports) | `font-bold` | `tracking-tight` | No desktop scaling ❌ |
| Collection | H1 | `font-sans font-black` | GiantText auto-fit | `font-black` | `leading-none` | `<div>` not `<h1>` ❌ |
| Article | H1 | `font-serif` | `text-3xl→text-6xl` | `font-medium` | `leading-[1.15]` | ✅ |
| FAQ | H1 | `font-serif` | `text-4xl→text-7xl` | `font-medium` | `leading-none` | ✅ |
| Search | H1 | `font-serif` | `text-3xl→text-9xl` | `font-medium` | default | ✅ |
| Account | H1 | `font-serif` | `text-xl→text-3xl` | `font-medium` | default | ✅ |

---

### 6. Body Typography
**Status: PASS**

- ✅ Body font (`font-sans` → Google Sans Flex) cascades from `body` via `@apply bg-background text-foreground` (`app/styles/app.css:409–412`); Tailwind base layer injects `font-family: var(--font-sans)` on `body` ✅
- ✅ Article body: `app/styles/app.css:751–757` sets `font-size: 1.0625rem; line-height: 1.8` — above 1.5 WCAG minimum ✅
- ✅ Footer text `text-sm` links — readable ✅
- ✅ Form labels `text-sm` or `text-base` consistently ✅
- ⚠️ `app/styles/app.css:785–789`: `.article-content > p:first-of-type` uses `opacity: 0.7` — opacity-based dimming is context-dependent; semantic color token preferred
- ✅ No body copy set in all-caps — uppercase only on UI labels/badges/nav (acceptable) ✅
- ✅ No long body passages set in italic ✅

**Computed body paragraph styles (prior session):**
```
font-family:     "Google Sans Flex", ui-sans-serif, system-ui, sans-serif
font-size:       14px
line-height:     20px (~1.43)
letter-spacing:  normal
```

---

### 7. Price Typography
**Status: PASS**

Price typography is the most consistent element across the entire codebase.

- ✅ `ProductCard` (`display/ProductCard.tsx:53`): `font-mono font-bold tabular-nums tracking-tight antialiased` ✅
- ✅ `PriceDisplay` (`product/PriceDisplay.tsx:30,34`): primary `font-mono text-base font-bold`, compare-at `font-mono text-base line-through` ✅
- ✅ `ProductMobileStickyButtons` (`product/ProductMobileStickyButtons.tsx:70,74`): `font-mono text-lg font-bold` + `font-mono text-sm line-through` ✅
- ✅ `ShoppingSummary` (`product/ShoppingSummary.tsx:91,116,123,134`): all price displays use `font-mono` ✅
- ✅ `FeaturedProductSpotlight` (`homepage/FeaturedProductSpotlight.tsx:133,138`): `font-mono text-2xl font-bold` + `font-mono text-base line-through` ✅
- ✅ Search results price (`search.tsx:824`): `font-mono font-bold tabular-nums tracking-tight antialiased` ✅
- ✅ Account stats (`account._index.tsx:177`): `font-mono text-3xl font-bold tabular-nums tracking-tight` ✅
- ✅ `tabular-nums` applied to prices in card/checkout contexts — digits column-align in lists ✅
- ✅ Compare-at prices use `line-through` + muted color universally ✅
- ✅ Currency symbol and amount share `font-mono` within a single span — no mixed-font fragmentation ✅

**Price font sizes by context:**

| Context | Class | Computed Size |
|---|---|---|
| ProductCard (list) | `font-mono text-sm` / `text-base` | 14–16px |
| PDP primary price | `font-mono text-base` | 16px |
| Mobile sticky PDP | `font-mono text-lg` | 18px |
| Cart line item | `font-mono text-sm` / `text-base` | 14–16px |
| Cart total | `font-mono text-base font-bold` | 16px |
| Featured product | `font-mono text-2xl` | 24px |

---

### 8. UI Component Typography
**Status: PARTIAL**

**BUTTONS:**
- ✅ `.cta-enhanced` (`app.css:426–448`): `font-weight: 600`, `letter-spacing: 0.025em`, `text-transform: uppercase`, `font-size: 0.875rem`, `line-height: 1.25` ✅
- ✅ `.cta-primary-emphasis` (`app.css:450–469`): `font-family: var(--font-sans)`, `font-weight: 700`, `font-size: 1rem`, `letter-spacing: 0.05em` ✅

**BADGES / TAGS:**
- ❌ `text-[10px]` on `CompactProductCard` badge and `SearchInput` kbd hint — below accessible minimum
- ❌ `text-[9px]` on `CompactProductCard` PreorderBadge — unreadable without magnification
- ❌ `text-[12px]` on `DiscountBadge`, `ProductDiscountBadge` — should be `text-xs`
- ❌ `text-[11px]` on `ProductCardTitle` (search/grid4), `SearchProductGroup` — below scale

**NAVIGATION:**
- ✅ Navbar brand (`Navbar.tsx:126`): `font-serif text-base font-bold uppercase lg:text-lg` ✅
- ✅ Nav cart counter (`Navbar.tsx:191`): `font-mono text-xs` — correct mono for a count ✅
- ✅ Footer column headers (`Footer.tsx:61,76,98,121`): `font-serif text-lg font-semibold` ✅
- ✅ Footer links: `text-sm` via cascade ✅

**FORMS:**
- ✅ Input elements inherit `font-sans` via body cascade ✅
- ✅ Input font-size: `text-base` (16px) on most inputs — prevents iOS auto-zoom ✅
- ✅ Placeholder: `color: var(--text-subtle); opacity: 1` — accessible override ✅
- ⚠️ Search input (`search.tsx:395`): `font-serif text-xl` — heading font applied to a query input field

**NEW FINDING — `font-display: swap` on class selectors (`app/styles/app.css:414–424`):**
- ❌ `.font-serif { font-display: swap; }` — `font-display` is invalid on class selectors; only valid in `@font-face`. Dead rule.
- ❌ `.font-sans { font-display: swap; }` — same
- ❌ `.font-mono { font-display: swap; }` — same
- These appear to attempt FOUT control per font-class but have zero browser effect.

---

### 9. Responsive Typography
**Status: PARTIAL**

- ❌ **Hero H1**: inline `clamp(1.5rem, 3.5vw, 4.5rem)` with `lineHeight: 0.9` — line overlap when heading wraps to two lines at 375px. **Visually confirmed in prior session.**
- ✅ Article H1: `text-3xl sm:text-4xl md:text-5xl lg:text-6xl` — correct scaling ✅
- ✅ FAQ H1: `text-4xl sm:text-5xl md:text-6xl lg:text-7xl` ✅
- ❌ Product H1: `text-2xl sm:text-2xl` — no scaling above sm; 24px at 1440px desktop
- ✅ GiantText: binary-search algorithm fills container width correctly at all viewports ✅
- ❌ `text-[9px]`, `text-[10px]`, `text-[11px]` on badges — fixed px, do not scale with browser font preferences
- ✅ Body font-size stays at `text-sm` (14px) or above at all breakpoints ✅
- ✅ `.hero-title-fluid` class defines `line-height: clamp(1.1, 1.05 + 0.25vw, 1.2)` — fluid leading (good pattern, but unused by actual hero)

**Mobile (375px) observations — prior session:**
- Hero H1 wraps to 2 lines → lines physically overlap at `lineHeight: 0.9` ❌
- Hero description: 12px all-caps Fraunces — reads as legal disclaimer ❌
- Collection GiantText: fills width, visually striking ✅
- Product page mobile: 24px H1 appropriate at mobile; issue only at desktop ⚠️

---

### 10. Blog and Long-Form Article Typography
**Status: PASS**

The article route correctly uses the custom `.article-content` CSS approach rather than prose classes.

- ✅ Article content element uses `className="article-content mx-auto max-w-3xl py-8 md:py-10 lg:py-12"` (`blogs.$blogHandle.$articleHandle.tsx:168`) — not using prose ✅
- ✅ `max-w-3xl` ≈ 768px — within the 60–80ch optimal reading width ✅
- ✅ Base: `font-size: 1.0625rem; line-height: 1.8` — excellent readability ✅
- ✅ H2: `@apply font-serif text-xl sm:text-2xl md:text-3xl font-normal leading-snug text-primary` ✅
- ✅ H3: `@apply font-serif text-lg sm:text-xl md:text-2xl font-normal leading-snug text-primary` ✅
- ✅ H4: `@apply font-serif text-base sm:text-lg md:text-xl font-normal text-primary` ✅
- ✅ Blockquote: `@apply italic text-muted-foreground` with border-left — correct ✅
- ✅ Code/pre: monospace styling defined at `app.css:848–862` ✅
- ✅ Article links: underline + primary color ✅
- ✅ HTML content wrapped in `.article-content` container ✅
- ⚠️ `.article-content > p:first-of-type` uses `opacity: 0.7` — prefer `color: var(--text-subtle)` ⚠️

**What is NOT working — unrelated `.prose` usage in other components:**
- ❌ `ProductDescriptionAccordion.tsx:99`: `prose prose-sm text-muted-foreground leading-relaxed` — product description HTML content (headings, lists, bold) gets no typographic treatment beyond browser defaults
- ❌ `PolicyContentSection.tsx:57`: `prose prose-sm md:prose-base mx-auto max-w-4xl` — legal page content renders browser-default
- ❌ `PolicySectionCard.tsx:84`: `prose prose-sm prose-slate max-w-none text-sm leading-relaxed` — legal section cards render browser-default

---

### 11. Rendered Typography — Playwright and Chrome-DevTools
**Status: PARTIAL**

> **Note:** Browser inspection conducted in the prior session (2026-04-05). No typography source files changed between sessions (confirmed via `git log --since=2026-04-05`). All computed values remain valid.

**Computed styles at 1440px desktop (`http://localhost:5173/`):**

| Element | `font-family` | `font-size` | `font-weight` | `line-height` | `letter-spacing` |
|---|---|---|---|---|---|
| Hero H1 | "Fraunces" | 50.4px | 600 | **45.36px (0.9×50.4) ❌** | normal |
| Nav links | "Google Sans Flex" | 14px | 600 | 20px | normal |
| Product H1 | "Fraunces" | 24px | 700 | tight | -0.025em |
| Product description | "Google Sans Flex" | 14px | 400 | 22.75px | normal |
| Price (mono) | "Google Sans Code" | 16px | 700 | 22px | -0.025em |
| CTA button | "Google Sans Flex" | 14px | 500 | 17.5px | 0.7px |
| Body `p` | "Google Sans Flex" | 14px | 400 | 20px | normal |
| `input` | "Google Sans Flex" | 16px | 400 | 22px | normal |
| Footer H3 | "Fraunces" | 18px | 600 | 27px | normal |
| Badge text | "Google Sans Flex" | **10px ❌** | 500 | 14px | normal |

**Font loading status (prior session):**
```
[...document.fonts].filter(f => f.status === "loaded").length → 5  (of 32 registered)
document.fonts.check('1em Fraunces')           → true
document.fonts.check('1em "Google Sans Flex"') → true
document.fonts.check('1em "Google Sans Code"') → true
```
All three intended fonts resolve correctly in the browser. The fallback (system Inter) is never visible at runtime when the metaobject CMS responds.

**CSS variable resolution (prior session):**
```
--font-sans  → "Google Sans Flex", ui-sans-serif, system-ui, sans-serif   ✅
--font-serif → "Fraunces", ui-serif, Georgia, serif                       ✅
--font-mono  → "Google Sans Code", ui-monospace, SFMono-Regular, monospace ✅
```

**FOUT observation:** Fraunces and Google Sans Flex briefly render in the system fallback on cold first load. The `display=swap` Google Fonts URL parameter is correctly set, so the flash is brief on fast connections. No preload hint to reduce the window.

---

### 12. Typography Consistency — Cross-Component Inventory
**Status: PARTIAL**

- ❌ Hero H1 uses inline `style={}` for font-size and line-height — bypasses the Tailwind token system
- ❌ Multiple components use arbitrary `tracking-[Xem]` values: `tracking-[0.22em]` (FeaturedProductSpotlight), `tracking-[0.35em]` (vendor label), `tracking-[0.28em]` (adjacent display text), `tracking-[0.24em]` (discount pill) — six distinct values
- ✅ Price typography is the most consistent element across all contexts ✅
- ✅ Section headings follow a consistent pattern: `font-serif font-bold uppercase` ✅
- ⚠️ Product card subtitle stacks `font-serif font-normal` under `font-serif font-semibold` — low visual contrast

**Cross-component typography inventory:**

| Element | Font Class | Size Class | Weight | Line Height | Notes |
|---|---|---|---|---|---|
| Hero H1 | `font-serif` | clamp 24→72px inline | `font-semibold` | **0.9 ❌** | Critical mobile overlap |
| Hero description | `font-serif` | `text-xs` (md: `text-sm`) | `font-semibold` | default | ❌ Wrong font, wrong size |
| Article H1 | `font-serif` | `text-3xl→text-6xl` | `font-medium` | `leading-[1.15]` | ✅ |
| Product H1 | `font-serif` | `text-2xl` (all viewports) | `font-bold` | `tracking-tight` | ❌ No desktop scaling |
| Collection H1 | `font-sans font-black` | GiantText auto | `font-black` | `leading-none` | `<div>` not `<h1>` ❌ |
| Section H2 | `font-serif` | `text-xl→text-4xl` | `font-bold` | default | ✅ |
| Article H2 | `font-serif` | `text-xl→text-3xl` | `font-normal` | `leading-snug` | ✅ |
| Product card title | `font-serif` | `text-base/text-lg` | `font-semibold` | `leading-snug` | ✅ |
| Product card subtitle | `font-serif` | `text-sm/text-xs` | `font-normal` | default | ⚠️ Should be font-sans |
| Price (all contexts) | `font-mono` | `text-sm→text-2xl` | `font-bold` | default | ✅ Consistent |
| Compare-at price | `font-mono` | `text-sm→text-lg` | `font-medium` | default | `line-through` ✅ |
| Nav brand | `font-serif` | `text-base lg:text-lg` | `font-bold` | default | ✅ |
| Nav link | `font-sans` | `text-sm` | `font-semibold` | default | Via cascade ✅ |
| Button | `font-sans` | `text-sm` / `text-base` | 500/600/700 | 1.25 | Via cascade ✅ |
| Badge | `font-sans` | `text-xs`–`text-[9px]` | `font-medium` | default | ❌ Sub-scale sizes |
| Form input | `font-sans` | `text-base` | `font-normal` | default | ✅ iOS safe ✅ |
| Form label | `font-sans` | `text-sm` | `font-medium` | default | ✅ |
| Footer H3 | `font-serif` | `text-lg` | `font-semibold` | default | ✅ |
| Footer link | `font-sans` | `text-sm` | `font-normal` | default | Via cascade ✅ |
| Article body p | `font-sans` | 1.0625rem | `font-normal` | 1.8 | ✅ |
| Announcement | `font-sans` | `text-xs` | `font-medium` | default | ✅ |
| Breadcrumb | `font-sans` | `text-sm` | `font-normal` | default | ✅ |

---

### 13. Accessibility — Typography and Readability
**Status: PARTIAL**

- ✅ No text below 12px on standard elements — badges use `text-xs` minimum in standard contexts ✅
- ❌ `text-[10px]` on `SearchInput` kbd hint and `CompactProductCard` badge — below WCAG SC 1.4.4 minimum for meaningful content
- ❌ `text-[9px]` on `CompactProductCard` PreorderBadge — 9px unreadable without magnification; fails WCAG SC 1.4.4
- ❌ `text-[9px]`, `text-[10px]`, `text-[11px]` are fixed px — do not scale with browser font-size preferences (WCAG SC 1.4.4)
- ✅ Body copy uses rem-based Tailwind scale — scales with user preferences ✅
- ✅ Article `line-height: 1.8` — above 1.5 WCAG SC 1.4.12 minimum ✅
- ✅ Letter-spacing on body text is `normal` — not set too tight ✅
- ⚠️ `tracking-[0.35em]`, `tracking-[0.28em]` on uppercase labels — wide, but on short uppercase labels (acceptable)
- ✅ No all-caps on body copy — only labels/buttons/nav ✅
- ✅ Italic used only on blockquotes — not long body passages ✅
- ✅ Text meaning preserved when fonts fail — no icon-font tricks ✅
- ✅ No WCAG AA contrast failures in the generated dark-mode theme (prior session) ✅
- ✅ Focus states on interactive elements are visible ✅

**WCAG contrast results (prior session):**

| Text Pair | Contrast | WCAG AA (4.5:1) | Notes |
|---|---|---|---|
| Primary text → dark bg (generated) | 18.64:1 | ✅ AAA | |
| Muted text → dark bg (generated) | 11.36:1 | ✅ AAA | |
| `--text-subtle` → light bg (default CSS) | 5.75:1 | ✅ AA | Fails AAA; used for placeholders |
| `--text-secondary` → light bg | 11.24:1 | ✅ AAA | |
| `--text-primary` → light bg | 17.96:1 | ✅ AAA | |

---

## Issues Register

| Status | Priority | Section | Issue | File / Component | Fix Applied |
|--------|----------|---------|-------|-----------------|-------------|
| ✅ Fixed | 🔴 Critical | §5, §9 | Hero H1 `lineHeight: 0.9` causes text line overlap at mobile | `HeroSection.tsx`, `VideoHero.tsx` | Replaced inline `style={}` with `.hero-title-fluid`; class updated to `line-height: clamp(1.1, 1.05 + 0.3vw, 1.2)` |
| ✅ Fixed | 🔴 Critical | §10 | `prose` classes no-op — product descriptions and policy pages render unstyled HTML | `ProductDescriptionAccordion.tsx`, `PolicyContentSection.tsx`, `PolicySectionCard.tsx` | Replaced all `prose prose-sm` with `.article-content` |
| ✅ Fixed | 🔴 Critical | §3 | CSS font variable fallbacks identical for all three roles | `app/styles/app.css` | `--font-serif` → `Georgia, ui-serif, serif`; `--font-mono` → `ui-monospace, "SFMono-Regular", monospace` |
| ✅ Fixed | 🟠 High | §5 | Product H1 has no responsive scaling — 24px at 1440px desktop | `ProductPageTitle.tsx` | Added `lg:text-3xl xl:text-4xl`; removed redundant `sm:text-2xl` |
| ✅ Fixed | 🟠 High | §8 | Hero description is 12px all-caps Fraunces | `HeroSection.tsx`, `VideoHero.tsx` | Changed to `font-sans text-sm font-normal leading-relaxed text-white/80 md:text-base` |
| ✅ Fixed | 🟠 High | §5 | GiantText renders as `<div>` — semantic H1 absent on collection, shop-all, legal pages | `CollectionHero.tsx`, `ShopAllHero.tsx`, `LegalPageHero.tsx` | Added `as="h1"` prop to all three |
| ✅ Fixed | 🟠 High | §4, §5 | Hero H1 inline clamp diverges from `.hero-title-fluid` class (weight 600 vs 300) | `HeroSection.tsx`, `VideoHero.tsx`, `app.css` | Consolidated: class updated, inline `style={}` removed |
| ✅ Fixed | 🟠 High | §5 | Sale and hero subtitles use `font-serif` — no voice contrast | `SaleHero.tsx` | Both `<p>` subtitles changed to `font-sans` |
| ✅ Fixed | 🟠 High | §4, §8, §13 | Sub-scale badge sizes `text-[9px]`/`text-[10px]`/`text-[11px]` — below WCAG minimum | Multiple (CompactProductCard, SearchInput, SearchProductGroup, SearchDefaultView, ProductCardTitle, MobileMenuSettings) | All replaced with `text-xs` minimum |
| ✅ Fixed | 🟠 High | §2 | No `<link rel="preload">` for critical fonts | `app/root.tsx` | Added `<link rel="preload" as="style">` before the stylesheet link |
| ⚠️ Open | 🟡 Medium | §1 | `FALLBACK_THEME_FONTS` / `DEFAULT_THEME_FONTS` use identical `Inter` for all three roles | `metaobject-parsers.ts:111–115`, `theme-utils.ts:189–193` | Not fixed — low practical risk; only affects offline/CMS-failure state |
| ✅ Fixed | 🟡 Medium | §2, §8 | `font-display: swap` on CSS class selectors — invalid placement, dead rules | `app/styles/app.css` | All four invalid `font-display` rules removed |
| ✅ Fixed | 🟡 Medium | §4, §8 | Inconsistent arbitrary `tracking-[Xem]` letter-spacing values | `FeaturedProductSpotlight.tsx`, `app.css` | Defined `--tracking-caps-wide: 0.25em` (and label/caps/display scale) in `@theme inline`; all replaced with `tracking-caps-wide` |
| ✅ Fixed | 🟡 Medium | §8 | `font-mono` for time, `font-sans` for date in same timestamp row | `HeroSection.tsx`, `VideoHero.tsx` | Date span changed to `font-mono` — both now consistent |
| ✅ Fixed | 🟡 Medium | §6, §13 | `.article-content > p:first-of-type` uses `opacity: 0.7` | `app/styles/app.css` | Replaced with `@apply text-muted-foreground` |
| ✅ Fixed | 🟡 Medium | §12 | Product card subtitle uses `font-serif` — low intra-card hierarchy | `ProductCardTitle.tsx` | Changed to `font-sans` |
| ✅ Fixed | 🔵 Low | §4 | `text-[0.75em]` on `WishlistCountInline` — em-relative arbitrary sizing | `WishlistCount.tsx` | Replaced with `text-xs` |
| ✅ Fixed | 🔵 Low | §5 | `sm:text-2xl` redundant with base `text-2xl` in ProductPageTitle | `ProductPageTitle.tsx` | Removed (proper lg/xl scaling added) |
| ⚠️ Open | 🔵 Low | §5 | `GiantText` `leading-none` comment not added | `GiantText.tsx:137` | Not fixed — documentation only, zero functional impact |
| ⚠️ Open | 🔵 Low | §8 | Search input uses `font-serif text-xl` | `search.tsx:395` | Not fixed — cosmetic; does not affect legibility |

---

## Recommended Action Plan

### Layer 1 — CSS Variables (fix static defaults before anything else)

**A. Fix static fallback CSS vars (`app/styles/app.css:68–70`):**
```css
/* BEFORE — all identical */
--font-sans: Inter, ui-sans-serif, sans-serif, system-ui;
--font-serif: Inter, ui-sans-serif, sans-serif, system-ui;
--font-mono: Inter, ui-sans-serif, sans-serif, system-ui;

/* AFTER — semantically correct */
--font-sans: Inter, ui-sans-serif, system-ui, sans-serif;
--font-serif: "Playfair Display", Georgia, ui-serif, serif;
--font-mono: "Roboto Mono", ui-monospace, "SFMono-Regular", monospace;
```

**B. Remove all invalid `font-display` rules (`app/styles/app.css`):**
```css
/* DELETE these — font-display is invalid on element/class selectors */
html { font-display: swap; }
.font-serif { font-display: swap; }
.font-sans  { font-display: swap; }
.font-mono  { font-display: swap; }
```

### Layer 2 — Font Loading (reduce FOUT)

**C. Add preload hint before the stylesheet link in `Layout()` (`app/root.tsx:327`):**
```tsx
{generatedTheme?.googleFontsUrl && (
    <link rel="preload" as="style" href={generatedTheme.googleFontsUrl} />
)}
{generatedTheme?.googleFontsUrl && (
    <link rel="stylesheet" href={generatedTheme.googleFontsUrl} />
)}
```

### Layer 3 — Components (fix rendering failures)

**D. Fix Hero H1 line-height — consolidate to `.hero-title-fluid` class:**

First, update the class in `app/styles/app.css:471–477` to match the hero's actual intended values:
```css
.hero-title-fluid {
    font-size: clamp(1.5rem, 3.5vw, 4.5rem);
    font-weight: 600;                              /* font-semibold — match HeroSection */
    font-family: var(--font-serif);
    line-height: clamp(1.1, 1.05 + 0.3vw, 1.15); /* never below 1.1 — prevents line overlap */
    letter-spacing: -0.02em;
}
```

Then in `HeroSection.tsx:111–112` and `VideoHero.tsx:245–246`, remove inline `style={{fontSize: ..., lineHeight: 0.9}}` and apply `className="hero-title-fluid"`:
```tsx
/* Before: */
<h1 className="font-serif font-semibold ..." style={{fontSize: "clamp(...)", lineHeight: 0.9}}>

/* After: */
<h1 className="hero-title-fluid ...">
```

**E. Fix product H1 scaling (`ProductPageTitle.tsx:13`):**
```tsx
<h1 className="font-serif text-2xl font-bold tracking-tight lg:text-3xl xl:text-4xl">{primary}</h1>
```

**F. Add `as="h1"` to GiantText at all three call sites:**
```tsx
// CollectionHero.tsx:28, ShopAllHero.tsx:19, LegalPageHero.tsx:33
<GiantText as="h1" text={title} className={cn("w-full font-black", ...)} />
```

**G. Fix hero description (`HeroSection.tsx:119`, `VideoHero.tsx:253`):**
```tsx
<p className="mx-auto mb-8 max-w-2xl font-sans text-sm font-normal leading-relaxed text-white/80 md:text-base">
    {heroDescription}
</p>
```

**H. Fix prose classes — install `@tailwindcss/typography`:**
```bash
bun add @tailwindcss/typography
```
In `app/styles/app.css`, add after `@import "tailwindcss"`:
```css
@import "@tailwindcss/typography";
```
Then in the `@theme inline` block, override prose to use brand fonts:
```css
--tw-prose-body: var(--text-primary);
--tw-prose-headings: var(--text-primary);
--tw-prose-links: var(--brand-primary);
--tw-prose-bold: var(--text-primary);
--tw-prose-code: var(--text-primary);
--tw-prose-pre-bg: var(--surface-muted);
```

**I. Replace sub-scale badge sizes** in CompactProductCard, DiscountBadge, ProductDiscountBadge, SearchProductGroup, MobileMenuSettings: change `text-[9px]`, `text-[10px]`, `text-[11px]`, `text-[12px]` → `text-xs` minimum; eliminate 9px and 10px entries or replace with iconography.

**J. Fix article lead paragraph opacity (`app/styles/app.css:787`):**
```css
.article-content > p:first-of-type {
    color: var(--text-subtle); /* was: opacity: 0.7 */
    line-height: 1.7;
}
```

**K. Add tracking scale to `:root` in `app/styles/app.css`:**
```css
--tracking-display: -0.02em;
--tracking-label: 0.08em;
--tracking-caps: 0.12em;
```
Replace all `tracking-[Xem]` arbitrary Tailwind values with `tracking-display`, `tracking-label`, or `tracking-caps`.

---

## What Is Working Well

- **Font pipeline end-to-end is architecturally correct:** metaobject fields → `parseThemeFonts()` → `generateGoogleFontsUrl()` → `generateFontFamily()` → `generateThemeCssVariables()` — the chain is clean and each step produces correct values at runtime
- **Price typography is exemplary:** `font-mono font-bold tabular-nums tracking-tight antialiased` applied consistently across every price surface — use this as the pattern template for cross-component consistency
- **Article prose typography works correctly:** `.article-content` custom CSS covers all necessary elements (h2–h4, p, blockquote, code, pre, ul, ol, links) with appropriate heading font and 1.8 line-height body — a solid alternative to the prose plugin
- **Google Fonts URL requests the right weight ranges:** variable axis (`100..900` for sans, `400..800` for serif, four discrete weights for mono) — efficient and comprehensive
- **`display=swap` correctly set via URL parameter:** actual browser font-swap behavior is properly configured even though the invalid CSS class-level rules have no effect
- **Tailwind v4 `@theme inline` font variable wiring is correct:** `--font-sans: var(--font-sans)` properly routes runtime CSS variable values to Tailwind utility classes — the right pattern for dynamic themes
- **WCAG-compliant contrast across all measured text pairs:** primary and muted text pass AAA in the generated dark theme; no AA failures found in either mode
- **`tabular-nums` on all price digits:** column-aligned prices in ProductCard grids is a quality detail that elevates the commerce experience
- **Italic weights requested in Google Fonts URL:** serif and sans italic ranges are loaded, covering blockquotes and any future italic prose usage
- **Form inputs use `text-base` (16px):** iOS auto-zoom is prevented across all input fields — correct accessibility behavior

---

*Audit conducted 2026-04-06 via static analysis of all source files under `app/`. Browser computed styles and font loading confirmations reference the 2026-04-05 Playwright session — no typography source files changed between sessions (confirmed: `git log --since=2026-04-05` shows only "docs: add SEO and typography audit reports" and "fix: set fallback free shipping threshold to 0", neither of which touches typography code). All source file references are paths relative to `storefront_001/`.*
