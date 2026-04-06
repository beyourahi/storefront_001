# Typography Audit — storefront_001
**Date:** 2026-04-05  
**Methods:** Static code analysis + Playwright computed styles + Live visual verification  
**Routes covered:** `/`, `/collections/all-products`, `/products/deathly-hallows-pendant`, `/sale`, `/faq`  
**Viewports tested:** 375px (mobile), 768px (tablet), 1440px (desktop)

---

## 1. Executive Summary

The typography system is structurally split between two layers: a static CSS fallback (all three font variables collapse to Inter) and a runtime-generated theme (Fraunces + Google Sans Flex + Google Sans Code) that overrides them. When the generated theme loads successfully the font choices are genuinely good — Fraunces is a premium variable-optical serif, Google Sans Flex is a refined variable sans. However, the system has zero fallback resilience: any theme generation failure produces a visually undifferentiated Inter-only UI across all type roles.

The off-scale font-size ratio is **6 off-scale values out of 19 unique values (32%)**, with 11 total off-scale occurrences. The most impactful issue is structural: the hero H1 uses `lineHeight: 0.9` via inline style, causing line overlap at mobile wrap — confirmed visually. The `@tailwindcss/typography` plugin is absent yet `prose` classes are used in three components, meaning product descriptions and all policy pages render HTML content entirely unstyled. The overall aesthetic reads as **above-average template quality** but stops short of luxury; the hero description in particular (12px uppercase Fraunces semibold) actively undermines premium credibility at a key brand moment. No WCAG AA contrast failures were found in the current generated dark theme.

---

## 2. Font System Overview

### Font Families in Use (Confirmed via Playwright `document.fonts` + computed styles)

| Font Family | Role | Tailwind Token | Weight Range | Status |
|---|---|---|---|---|
| **Fraunces** | Display/Serif headings | `font-serif` | 400–800 (variable) | Loaded ✅ |
| **Google Sans Flex** | Body, UI, navigation | `font-sans` | 100–900 (variable) | Loaded ✅ |
| **Google Sans Code** | Prices, monospace | `font-mono` | 400, 500, 600, 700 | Loaded ✅ |
| Inter (fallback) | All roles if theme fails | n/a | System | Available via system |

**Google Fonts URL:** Includes `display=swap` parameter ✓  
**`preconnect` hints:** Present for `fonts.googleapis.com` + `fonts.gstatic.com` ✓  
**`preload` hints:** **None** — no `<link rel="preload">` for any font file ✗

**Default CSS fallback (`app/styles/app.css:68–70`):**
```css
--font-sans: Inter, ui-sans-serif, sans-serif, system-ui;
--font-serif: Inter, ui-sans-serif, sans-serif, system-ui;  /* SAME as --font-sans */
--font-mono: Inter, ui-sans-serif, sans-serif, system-ui;  /* SAME as --font-sans */
```
All three CSS variables resolve identically in the fallback state. Without the generated theme, `font-serif` and `font-mono` are indistinguishable from `font-sans`.

### Font Size Inventory

| Value | Tailwind Class | Usage Count | On-Scale? | Notes |
|---|---|---|---|---|
| 12px | `text-xs` | 134 | ✅ | Most-used small size; dominant at badge/label level |
| 14px | `text-sm` | 382 | ✅ | Most common overall — heavy bias toward small text |
| 16px | `text-base` | 94 | ✅ | Standard body |
| 18px | `text-lg` | 70 | ✅ | Section subtitles, card descriptions |
| 20px | `text-xl` | 61 | ✅ | Mid-level headings |
| 24px | `text-2xl` | 43 | ✅ | H1 on product pages, footer headings |
| 30px | `text-3xl` | 53 | ✅ | Section headings |
| 36px | `text-4xl` | 44 | ✅ | Sale/featured headings |
| 48px | `text-5xl` | 18 | ✅ | Large feature headings |
| 60px | `text-6xl` | 22 | ✅ | Decorative/display |
| 72px | `text-7xl` | 8 | ✅ | Large display |
| 96px | `text-8xl` | 1 | ✅ | Rare decorative |
| 128px | `text-9xl` | 1 | ✅ | Rare decorative |
| ~12px | `text-[12px]` | 2 | ❌ | DiscountBadge, ProductDiscountBadge |
| ~11px | `text-[11px]` | 3 | ❌ | ProductCardTitle (search/grid4), SearchProductGroup, SearchDefaultView |
| ~10px | `text-[10px]` | 4 | ❌ | CompactProductCard badge, SearchInput kbd, MobileMenuSettings |
| ~9px | `text-[9px]` | 1 | ❌ | CompactProductCard PreorderBadge |
| relative | `text-[0.75em]` | 1 | ❌ | WishlistCount badge |
| fluid | `clamp(1.5rem, 3.5vw, 4.5rem)` inline | 2 | ❌ | HeroSection H1, VideoHero H1 — bypasses scale |

**Summary: 13 on-scale, 6 off-scale = 68% on-scale.**

Note: The `clamp(2rem, 1.5rem + 2.5vw, 4rem)` value defined in the `.hero-title-fluid` CSS class is a separate, slightly different curve from the inline-style version used in the actual hero components.

### Font Weight Distribution

| Weight | Count | Usage Context |
|---|---|---|
| `font-medium` (500) | 196 | UI elements, labels, nav links |
| `font-semibold` (600) | 125 | Card titles, buttons, headings |
| `font-bold` (700) | 78 | Section headings, hero, prices |
| `font-normal` (400) | 19 | Body copy, secondary text |
| `font-black` (900) | 10 | GiantText display headings |
| `font-extrabold` (800) | 1 | Rare |

### Font Family Usage Count

| Token | Uses | Note |
|---|---|---|
| `font-serif` | 107 | Headings, product titles, hero |
| `font-mono` | 47 | Prices, time display, kbd shortcuts |
| `font-sans` | 6 | Body (mostly inherited, rarely explicit) |

---

## 3. Playwright Visual Findings

### Font Loading Confirmation (`document.fonts.check()`)

| Font | Check at First Paint | Status |
|---|---|---|
| Fraunces | `document.fonts.check('1em Fraunces')` | ✅ Loaded (1 of 4 weight ranges) |
| Google Sans Flex | `document.fonts.check('1em "Google Sans Flex"')` | ✅ Loaded (1 of 9 weight ranges) |
| Google Sans Code | `document.fonts.check('1em "Google Sans Code"')` | ✅ Loaded (3 of 4 weights) |
| Inter | `document.fonts.check('1em Inter')` | ✅ Present (system fallback) |

**Finding:** Of 32 registered font instances at initial load, only 5 had status `"loaded"`. The remaining 27 were `"unloaded"`, triggering lazy loading as the browser encounters each weight/style. With no `<link rel="preload">` hints, FOUT is observable on first visit for heavier Fraunces weights used in section headings.

### FOUT / FOIT Observation

FOUT was detectable on first cold load: hero text initially renders in the system fallback (Inter-like) before Fraunces loads. The `display=swap` in the Google Fonts URL is correctly set, so flash is brief — but with no preload hint, the Fraunces stylesheet itself must be fetched, parsed, and fonts downloaded before the swap occurs. On fast connections this is imperceptible; on 3G it would be visible.

### Computed vs. Declared Comparison

| Component | Declared | Computed (1440px) | Match? |
|---|---|---|---|
| Hero H1 | `font-serif` + inline clamp | Fraunces, 50.4px, w:600 | ✅ |
| Hero H1 line-height | `lineHeight: 0.9` (inline) | 45.36px (= 0.9 × 50.4) | ✅ Confirmed problematic |
| Nav links | `text-sm font-semibold` | 14px, w:600 | ✅ |
| Product page H1 | `text-2xl sm:text-2xl` | 24px at all breakpoints | ✅ No scaling confirmed |
| Product description | `prose prose-sm leading-relaxed` | 16px, Google Sans Flex | ⚠️ Prose styles have no effect |
| Price (mono) | `font-mono font-bold` | Google Sans Code, 16px, w:700 | ✅ |
| CTA button | `cta-enhanced` class | Google Sans Flex, 14px, w:500, tracking: 0.7px | ✅ |

### Contrast Ratio Results

| Text Pair | Contrast | WCAG AA (4.5:1 normal / 3:1 large) | Notes |
|---|---|---|---|
| Primary text → dark bg (current theme) | **18.64:1** | ✅ AAA | Near-white on near-black |
| Muted text → dark bg (current theme) | **11.36:1** | ✅ AAA | Ample margin |
| Hero white/90 → black/50 overlay | **21:1** | ✅ AAA | |
| Nav link fg/80 → dark navbar | **~15:1** | ✅ AAA | |
| `--text-subtle` → light bg (default CSS) | **5.75:1** | ✅ AA (barely) | Fails AAA; used for placeholder text |
| `--text-secondary` → light bg (default CSS) | **11.24:1** | ✅ AAA | |
| `--text-primary` → light bg (default CSS) | **17.96:1** | ✅ AAA | |

**No WCAG AA failures found in the current dark-mode generated theme.** The only marginal value is `--text-subtle` at 5.75:1 in the light-mode default, which passes AA but fails AAA — relevant for placeholder text in inputs.

### Screenshot-Based Aesthetic Assessment

**Homepage hero (desktop 1440px):** The Fraunces H1 "Wind down with something worth it" is visually strong — the variable-weight serif renders beautifully at ~50px. The immediate problem is the hero description: 12px all-caps Fraunces semibold is jarring. Fraunces is a display face engineered for large sizes; at 12px uppercase its optical complexity compresses into visual noise. The hero hierarchy reads: (1) large serif headline ✓, (2) shouty small-cap microcopy ✗, (3) two buttons. The jump from impact to noise between (1) and (2) breaks the editorial moment.

**Homepage hero (mobile 375px):** At 375px the headline wraps to two lines. With `lineHeight: 0.9`, the two lines visually overlap — the descender of "Wind down with something" crashes into the ascender of "worth it". This is a rendered legibility failure at the primary brand moment.

**Collection page (desktop 1440px):** The `GiantText` "ALL PRODUCTS" fills ~60% of the viewport width in Google Sans Flex at ~250px. The visual impact is genuinely dramatic and premium-feeling. The contrast with the small subtitle below creates strong hierarchy. The product cards beneath show Fraunces titles rendering well at text-base (16px).

**Product page (desktop 1440px):** The product title "Deathly Hallows Pendant" at 24px (`text-2xl`) looks undersized for a dedicated product detail page at desktop. The price "BDT 69" in Google Sans Code is well-differentiated. The description section has no prose plugin styling — the HTML-formatted product details render with browser-default heading/paragraph treatment only.

**Sale page (tablet 768px):** The SaleHero "Save Up to 84% Off" in Fraunces `text-4xl/text-5xl` reads well. The subtitle "Limited-time offers with exceptional value." also uses `font-serif` (Fraunces) — a paragraph-length serif subtitle under a serif heading creates low contrast between hierarchy levels.

---

## 4. Findings by Severity

### CRITICAL

**C-1: Hero H1 `lineHeight: 0.9` causes text overlap on mobile wrap**  
- Location: `app/components/homepage/HeroSection.tsx:112`, `app/components/homepage/VideoHero.tsx:246`  
- Current: `style={{fontSize: "clamp(1.5rem, 3.5vw, 4.5rem)", lineHeight: 0.9}}`  
- Recommended: `lineHeight: 1.1` or `leading-tight` (class-based); at minimum `1.05` for tight single-line, `1.1` for wrapped heading safety  
- Reason: Confirmed by Playwright — at 375px viewport the greeting wraps to two lines; at `lineHeight: 0.9` the rendered line pitch is 0.9 × font-size, so lines physically overlap. The identical inline style in VideoHero duplicates the bug.

**C-2: `@tailwindcss/typography` plugin absent — all `prose` classes silently no-op**  
- Location: `app/components/product/ProductDescriptionAccordion.tsx:99`, `app/components/legal/PolicyContentSection.tsx:57`, `app/components/legal/PolicySectionCard.tsx:84`  
- Current: `prose prose-sm text-muted-foreground leading-relaxed` (and variants) — produces no styling  
- Recommended: Either install `@tailwindcss/typography` and configure it in app.css, or replace `prose` classes with explicit custom typography rules for HTML content blocks  
- Reason: Product descriptions and all policy pages render HTML content (headings, lists, bold, tables) with zero typographic treatment beyond browser defaults. Policy pages are trust-critical surfaces; unstyled legal HTML reads as unfinished.

**C-3: CSS font variable fallbacks are identical for all three roles**  
- Location: `app/styles/app.css:68–70`  
- Current: `--font-sans`, `--font-serif`, `--font-mono` all = `Inter, ui-sans-serif, sans-serif, system-ui`  
- Recommended: Assign meaningful fallbacks: `--font-serif: Georgia, ui-serif, serif;` and `--font-mono: ui-monospace, "Courier New", monospace;`  
- Reason: Any theme generation failure (network error, cold cache, SSR error boundary) produces a UI where product names (font-serif), body text (font-sans), and prices (font-mono) are visually identical. Zero brand differentiation in the fallback state.

---

### MAJOR

**M-1: Product page H1 title is undersized and has no responsive scaling**  
- Location: `app/components/common/ProductPageTitle.tsx:13`  
- Current: `text-2xl font-bold tracking-tight sm:text-2xl` — both declarations are `text-2xl` (24px); no desktop scaling  
- Recommended: `text-2xl font-bold tracking-tight lg:text-3xl xl:text-4xl`  
- Reason: At 1440px desktop, the most prominent product-identifying text renders at 24px — the same size as footer column headers. Premium product pages typically present the product name at 28–40px desktop to anchor the purchase decision zone.

**M-2: Hero description is 12px all-caps Fraunces semibold — aesthetically damages the premium moment**  
- Location: `app/components/homepage/HeroSection.tsx:119`  
- Current: `font-serif text-xs font-semibold uppercase` → 12px uppercase Fraunces 600 weight  
- Recommended: `font-sans text-sm md:text-base font-normal leading-relaxed text-white/80` — use the body font, normal weight, sentence case, and slightly larger size  
- Reason: Fraunces is an optical-size display serif with complex letterforms that lose legibility below 16px. At 12px uppercase with semibold weight, the text reads as a legal disclaimer, not a brand statement. This is the primary descriptive text below the hero headline and it actively undermines the luxury positioning.

**M-3: GiantText uses semantic `<div>` by default — collection/legal page H1s have incorrect hierarchy**  
- Location: `app/components/sections/CollectionHero.tsx:28`, `app/components/sections/ShopAllHero.tsx:19`, `app/components/legal/LegalPageHero.tsx:33`  
- Current: `<GiantText text={title} ...>` — no `as` prop; defaults to `<div>`  
- Recommended: Pass `as="h1"` at every call site where the GiantText is the page's primary title  
- Reason: The visually dominant page heading is not `<h1>` — it's a `<div>` with giant text. Screen readers and SEO crawlers see no H1. The `as` prop exists precisely for this; it's simply not being used.

**M-4: Hero H1 `clamp()` differs from the `.hero-title-fluid` CSS utility class**  
- Location: `app/components/homepage/HeroSection.tsx:112`, `app/styles/app.css:472`  
- Current: Inline style `clamp(1.5rem, 3.5vw, 4.5rem)` vs CSS class `clamp(2rem, 1.5rem + 2.5vw, 4rem)` (different curves, different min/max)  
- Recommended: Consolidate to a single definition; either use `.hero-title-fluid` on the hero H1 or update the class to match the inline value and remove the inline style  
- Reason: Two divergent fluid type expressions for the "same" heading creates maintenance inconsistency. The blog ArticleHero uses `.hero-title-fluid` correctly; the main hero does not.

**M-5: Hero subtitle uses `font-serif` on `font-serif` headline — no voice contrast in the hero**  
- Location: `app/components/homepage/HeroSection.tsx:111–119`, `app/components/sections/SaleHero.tsx:29`  
- Current: H1 = `font-serif`, description paragraph = `font-serif`  
- Recommended: Switch hero/sale subtitles to `font-sans` to create clear voice differentiation between display headline and body-register copy  
- Reason: Using the same display serif for both the headline and its supporting paragraph blurs hierarchy. The sans/serif pairing is the core of the brand's dual-font system; using Fraunces at both levels wastes that contrast.

**M-6: Arbitrary sub-scale font sizes in badge and inline elements**  
- Location: Multiple files (CompactProductCard, DiscountBadge, ProductDiscountBadge, SearchInput, ProductCardTitle, MobileMenuSettings)  
- Current: `text-[9px]`, `text-[10px]`, `text-[11px]`, `text-[12px]`, `text-[0.75em]`  
- Recommended: Consolidate to `text-xs` (12px) as the minimum renderable size; anything below 12px should be eliminated or replaced with iconography  
- Reason: 9px text is unreadable without magnification. 10px is marginal. These bypasses occur in cart drawer badges and search result price displays — critical commerce surfaces. Using arbitrary values instead of scale tokens creates fragile hardcoded sizing that ignores viewport and user font preference scaling.

**M-7: `font-mono` for time display mixed with `font-sans` for date in same inline bar**  
- Location: `app/components/homepage/HeroSection.tsx:103–105`  
- Current: `<span className="text-sm font-medium uppercase">{currentDate}</span>` / `<span className="font-mono text-sm font-medium uppercase">{currentTime}</span>`  
- Recommended: Use consistent font treatment for both — either both `font-mono` (mechanical precision aesthetic) or both `font-sans` (cleaner)  
- Reason: Mixed sans/mono in the same inline row creates visual rhythm inconsistency for what should read as a unified timestamp display.

**M-8: Inconsistent letter-spacing across label and button text**  
- Location: `app/styles/app.css:429–458`, `app/components/homepage/FeaturedProductSpotlight.tsx:99,108`, multiple components  
- Current: Button labels use `0.025em` (cta-enhanced), `0.05em` (cta-primary-emphasis), `tracking-[0.22em]` (FeaturedProductSpotlight button), `tracking-[0.35em]` (vendor label), `tracking-[0.28em]` (GiantText adjacent), `tracking-[0.24em]` (discount pill)  
- Recommended: Define a 3-level tracking scale in the theme: `--tracking-tight: -0.02em`, `--tracking-label: 0.08em`, `--tracking-display: 0.12em` — and use these consistently across uppercase labels, buttons, and eyebrow text  
- Reason: Six different arbitrary em values for letter-spacing on labels/buttons produce inconsistent visual rhythm that reads as uncoordinated rather than considered.

**M-9: No `<link rel="preload">` for critical font files**  
- Location: `app/root.tsx:78–88` (`links()` function)  
- Current: `preconnect` to font origins only; no `preload` for specific font file URLs  
- Recommended: Add `<link rel="preload" href="[google-fonts-css-url]" as="style">` or use the Fonts API with `text=` parameter to preload only critical glyphs of Fraunces and Google Sans Flex  
- Reason: Without preload hints, Fraunces and Google Sans Flex only begin downloading after the render-blocking CSS resolves. This delays the first branded paint and extends the FOUT window, particularly on the hero where the font mismatch between fallback and Fraunces is most visible.

---

### MINOR

**m-1: `font-display: swap` set on `html` element — dead CSS rule**  
- Location: `app/styles/app.css:407`  
- Current: `html { font-display: swap; }`  
- Recommended: Remove this rule. `font-display` is only valid inside `@font-face` blocks, not as a property on `html`.  
- Reason: This rule has no effect on any browser. The actual `display=swap` behavior is correctly handled via the Google Fonts URL query parameter. This creates false documentation suggesting the rule does something.

**m-2: `sm:text-2xl` is redundant with base `text-2xl` in ProductPageTitle**  
- Location: `app/components/common/ProductPageTitle.tsx:13`  
- Current: `text-2xl font-bold tracking-tight sm:text-2xl` — both values are identical  
- Recommended: Remove the `sm:text-2xl` redundancy; if the intent was to scale up at sm, add `lg:text-3xl` (see M-1)  
- Reason: Suggests an incomplete implementation — someone intended to add a responsive size but left the default in place.

**m-3: `.article-content > p:first-of-type` uses `opacity: 0.7` instead of a color token**  
- Location: `app/styles/app.css:788`  
- Current: `opacity: 0.7` for the article lead paragraph  
- Recommended: Use `color: var(--text-subtle)` or `color: var(--text-secondary)` — a semantic token that maintains contrast predictability across surfaces  
- Reason: Opacity-based dimming is context-dependent and makes contrast unpredictable if the element ever appears over a non-background surface (e.g., an image). The color token system already has `--text-subtle` for exactly this purpose.

**m-4: `text-[0.75em]` in WishlistCount — relative sizing creates context-dependent rendering**  
- Location: `app/components/WishlistCount.tsx:10`  
- Current: `text-[0.75em]` for the count badge  
- Recommended: `text-[10px]` or `text-xs` with explicit size to make the badge predictable regardless of parent font-size context  
- Reason: Em-relative sizing makes the badge shrink or grow unpredictably if the component is embedded in different size contexts.

**m-5: GiantText `leading-none` may clip Fraunces descenders on lowercase use**  
- Location: `app/components/common/GiantText.tsx:137`  
- Current: `leading-none` hardcoded on the inner span  
- Recommended: This is acceptable for all-uppercase display text (which is always the case via the `uppercase` class), but document the constraint — if the `uppercase` class is ever removed, descenders will clip  
- Reason: `leading-none` (line-height: 1) on a variable optical-size serif like Fraunces at display sizes may cause descender clipping if the font is ever used in mixed-case display mode.

**m-6: `font-serif` used for both headings and product card secondary text at `opacity: 0.5`**  
- Location: `app/components/common/ProductCardTitle.tsx:76`  
- Current: `<h3 className="text-foreground opacity-50 font-serif font-normal ...">` for the product subtitle  
- Recommended: Use `font-sans` for the product type/subtitle to visually differentiate the secondary line from the primary product name  
- Reason: Two lines of Fraunces stacked — one semibold, one normal/faded — reduces the visual distinction between product name and category. A sans subtitle would create cleaner type contrast within the card.

---

## 5. Responsive Typography Analysis

### Mobile (375px)

- **Hero H1:** Wraps to 2 lines with `lineHeight: 0.9` → lines physically overlap. **Critical failure.**
- **Hero description:** 12px uppercase at mobile. Reads like a legal disclaimer. Fails premium feel entirely.
- **Hero buttons:** Stack vertically — correct responsive behavior. Font sizes appropriate.
- **Collection GiantText:** Fills container width correctly at ~150px. Visually striking on mobile.
- **Product mobile view:** The mobile sticky price + buttons at the bottom are well-sized. The above-fold area is image-only (correct for mobile PDP). No typography breakdown.
- **Nav brand name:** "DROPOUT STUDIO" in uppercase bold sans — readable at mobile, but the uppercase bold sans brand name style makes the mark feel like a wordmark rather than a named brand. No italic or serif contrast.

### Tablet (768px)

- **Sale hero:** Fraunces `text-4xl` at 36px renders with excellent legibility and impact. The transition from the mobile `text-4xl` to desktop `text-5xl` is smooth.
- **Product grid:** Card titles scale correctly from `text-base` to `text-base lg:text-base` — no actual desktop scaling. Grid layout works.
- **Search bar:** Visible at tablet — `font-mono text-[10px]` kbd shortcut hint is borderline at tablet.

### Desktop (1440px)

- **Hero H1:** 50.4px Fraunces semibold — visually strong. Single line at this width so the lineHeight issue doesn't manifest (but is structurally present).
- **GiantText:** Fills 60% container width as configured. The binary-search sizing algorithm works correctly. At 1440px "ALL PRODUCTS" renders at approximately 250px — dramatic and premium.
- **Product page H1:** 24px across all desktop viewports — undersized (see M-1).
- **Featured product section number:** `text-4xl/text-6xl/text-7xl` Fraunces in primary color — visually impactful. One of the strongest typographic moments on the page.
- **Footer:** `text-lg font-serif font-semibold` for column headings, `text-sm` for links. Appropriate hierarchy.

### Large (>1440px)

- Font sizes are capped by the Tailwind scale; no custom breakpoints extend beyond `2xl`. The `hero-title-fluid` class clamps at `4rem` (64px) so the hero won't over-scale. GiantText auto-scales to any width. No obvious large-viewport breakdowns.

---

## 6. Premium Aesthetic Assessment

*These are design judgments from screenshot review, not hard violations.*

### What works well

**Font selection:** Fraunces + Google Sans Flex is a genuinely premium combination. Fraunces is optically complex, slightly anachronistic, and deeply expressive — used at large display sizes it delivers editorial credibility. Google Sans Flex as the body font is clean without being generic. This pairing has clear personality.

**Price typography:** `font-mono font-bold tabular-nums tracking-tight` for prices is exactly right — Google Sans Code at 700 weight creates clear functional differentiation from editorial copy. The mono alignment on price digits in lists reads as precise and curated.

**GiantText sections:** The viewport-filling uppercase sans on collection/legal/shop pages creates genuine visual drama. This is one of the stronger premium moments in the UI — the size contrast between the giant heading and the small subtitle below is stark and confident.

**Color token system:** The OKLCH-based semantic token system is well-designed. The contrast ratios in both dark and light modes are excellent across primary and muted text levels.

### What undermines the premium feel

**The hero description is the single biggest aesthetic failure.** A premium luxury brand uses its hero subtitle to whisper, not shout. "DISCOVER A CURATED COLLECTION OF WELL-MADE ESSENTIALS—CLEAN DESIGN, QUALITY MATERIALS, AND SMALL DETAILS THAT MAKE A BIG DIFFERENCE. SHOP WHAT YOU'LL REACH FOR ON REPEAT." — rendered at 12px, all-caps, semibold Fraunces — reads as a warehouse clearance flyer, not a curated brand statement. The casing, size, weight, and font choice all work against each other. This is the text that most needs to convey brand sophistication and it currently conveys template-kit urgency.

**The product page title doesn't land.** "Deathly Hallows Pendant" at 24px on a 1440px product page is the typographic equivalent of whispering. The product name should command the page. Premium e-commerce treats the PDP title as a declaration; 24px across all desktop viewports is a polite label.

**Fraunces is overused.** It appears in H1s, product card titles, product subtitles, footer headings, hero descriptions, and testimonials. Fraunces earns its premium associations through contrast with the sans — when it's everywhere, it becomes wallpaper. The current usage ratio (107 `font-serif` uses vs 6 explicit `font-sans` uses) means the display face has effectively become the UI font, which neutralizes its special-occasion character.

**The SaleHero subtitle is in Fraunces.** "Limited-time offers with exceptional value." doesn't need to be in a display serif. A promotional subtitle should be in the body font — the serif belongs on the discount number ("Save Up to 84% Off") where its editorialness earns its keep.

**No typographic hierarchy landmark on the homepage below the fold.** After the hero, the page sequences through sections (Products, Featured, Testimonials, FAQ) all with similarly-sized `text-2xl/text-3xl` Fraunces section headings. There's no hierarchy escalation, no editorial breakthrough moment. Each section reads at the same typographic temperature.

---

## 7. Standardization Recommendations

### Font Token Fix (Highest Priority)

Replace the identical CSS variable defaults in `app/styles/app.css`:

```css
/* CURRENT — all three collapse to Inter */
--font-sans: Inter, ui-sans-serif, sans-serif, system-ui;
--font-serif: Inter, ui-sans-serif, sans-serif, system-ui;
--font-mono: Inter, ui-sans-serif, sans-serif, system-ui;

/* RECOMMENDED — meaningful fallbacks */
--font-sans: "Google Sans Flex", ui-sans-serif, system-ui, sans-serif;
--font-serif: "Fraunces", Georgia, ui-serif, serif;
--font-mono: "Google Sans Code", ui-monospace, "Courier New", monospace;
```

The theme-generated values already do this correctly at runtime — fix the defaults to match.

### Typography Scale Architecture

Define a letter-spacing scale in `:root` and `@theme inline`:

```css
/* Proposed tracking scale */
--tracking-tight-display: -0.03em;  /* Large display headings, clamped */
--tracking-tight: -0.02em;          /* Text-2xl+ headings (current tracking-tight) */
--tracking-normal: 0em;             /* Body text */
--tracking-label: 0.08em;           /* Uppercase labels, eyebrow text */
--tracking-caps: 0.12em;            /* All-caps badges, small uppercase spans */
```

Replace all arbitrary `tracking-[0.Xem]` values with these tokens.

### Hero Fluid Type Fix

Consolidate the two divergent fluid type definitions:

```css
/* In app.css — update .hero-title-fluid to match the hero's needs */
.hero-title-fluid {
  font-size: clamp(2rem, 1.5rem + 2.5vw, 4rem);
  font-weight: 700;
  font-family: var(--font-serif);
  line-height: clamp(1.05, 1.0 + 0.2vw, 1.15); /* fluid leading, never below 1.05 */
  letter-spacing: var(--tracking-tight-display);
}
```

Remove the inline `style={{fontSize: ..., lineHeight: 0.9}}` from `HeroSection.tsx` and `VideoHero.tsx`. Apply `.hero-title-fluid` via className instead.

### Product Page Title

```tsx
// ProductPageTitle.tsx — replace current text-2xl sm:text-2xl
<h1 className="font-serif text-2xl font-bold tracking-tight lg:text-3xl xl:text-4xl">{primary}</h1>
```

### Hero Description

```tsx
// HeroSection.tsx — replace font-serif text-xs font-semibold uppercase
<p className="mx-auto mb-8 max-w-2xl font-sans text-sm font-normal leading-relaxed text-white/80 md:text-base">
  {heroDescription}
</p>
```

### Fix `@tailwindcss/typography` or Replace

Install the plugin:
```bash
bun add @tailwindcss/typography
```

Configure in `app/styles/app.css`:
```css
@import "tailwindcss";
@import "@tailwindcss/typography"; /* Add this */

/* Customize prose to match brand tokens */
@theme inline {
  --prose-body: var(--text-primary);
  --prose-headings: var(--text-primary);
  --prose-links: var(--brand-primary);
  --prose-bold: var(--text-primary);
  --prose-code: var(--text-primary);
  --prose-pre-bg: var(--surface-muted);
}
```

Alternatively, replace `prose` classes with explicit `article-content`-style rules already defined in app.css.

### Fix Semantic HTML on GiantText

```tsx
// CollectionHero.tsx
<GiantText as="h1" text={title} className={cn("w-full font-black", ...)} />

// ShopAllHero.tsx
<GiantText as="h1" text={title} className={cn("text-foreground w-full font-black", ...)} />

// LegalPageHero.tsx
<GiantText as="h1" text={title} className={cn("w-full font-black", ...)} />
```

### Font Preload

Add to `links()` in `app/root.tsx`:

```ts
export function links() {
  return [
    { rel: "preconnect", href: "https://fonts.googleapis.com" },
    { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" as const },
    // Preload the Google Fonts CSS (critical path)
    // Note: the actual URL is dynamic from generatedTheme — consider caching the URL
    // or using font-display hints in the generated URL (already has display=swap ✓)
    { rel: "stylesheet", href: appCss },
    // ...
  ];
}
```

The more effective fix is to inject a `<link rel="preload" as="style">` for the Google Fonts stylesheet URL from `generatedTheme.googleFontsUrl` in `Layout()` before the font `<link rel="stylesheet">`.

### Tailwind Config Extension (Optional)

For tighter scale enforcement, define the off-scale sizes as named utilities in `app.css` rather than using arbitrary `[]` brackets:

```css
@theme inline {
  --text-badge: 10px;    /* Replace text-[10px] */
  --text-micro: 11px;    /* Replace text-[11px] */
}
```

This at minimum makes off-scale sizes searchable and replaceable as a group.

---

*Audit conducted using static analysis of all files under `app/`, live Playwright computed style extraction on routes `/`, `/collections/all-products`, `/products/deathly-hallows-pendant`, `/sale`, and `/faq`, and canvas-based contrast ratio calculation. Contrast values for the current dark-mode generated theme are verified against WCAG 2.1 AA/AAA thresholds. All code references are to source file paths relative to `storefront_001/`.*
