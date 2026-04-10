# PWA "Open in App" Audit Report — `storefront_001`

**Date:** 2026-04-10  
**Scope:** Static analysis of all PWA install / open-in-app button instances, install state lifecycle, manifest validity, and cross-environment expectations.  
**Status:** Read-only audit — no production code modified.

---

## 1. Manifest Audit

| Criterion | Status | Notes |
|---|---|---|
| `display: standalone` | ✅ Pass | `pwa-parsers.ts:104` hardcoded |
| `start_url: "/"` within scope | ✅ Pass | `scope: "/"`, `start_url: "/"` |
| 192×192 icon present | ✅ Pass | Dynamic or fallback `/icon-192.png` (file exists) |
| 512×512 icon present | ✅ Pass | Dynamic or fallback `/icon-512.png` (file exists) |
| Maskable icon variant | ✅ Pass | 512px icon has `purpose: "maskable"` (parsers:71) |
| Apple touch icon | ✅ Pass | `/apple-touch-icon.png` linked in `root.tsx:89` |
| Manifest linked in `<head>` | ✅ Pass | `{rel: "manifest", href: "/manifest.webmanifest"}` (root.tsx:88) |
| Service worker with fetch handler | ✅ Pass | Workbox registers `navigate` routes + default handler |
| `prefer_related_applications: false` | ✅ Pass | `pwa-parsers.ts:117` — web prompt is NOT suppressed |
| `related_applications` | ⚠️ Present | `platform: "webapp"` + manifest URL — required for `getInstalledRelatedApps()` but has accuracy caveats (see Issue #7) |
| `id` field | ✅ Pass | `id: "/"` matches `start_url` — needed for `getInstalledRelatedApps()` |
| Manifest served with correct MIME type | ✅ Pass | `Content-Type: application/manifest+json` (routes/manifest.tsx:22) |
| Fallback manifest on error | ✅ Pass | Error handler returns a minimal valid manifest |

**No blocking manifest issues.** All installability criteria are met.

---

## 2. Button Instance Catalogue

| Location | Component | Variant | Platform Target | Visibility Condition | Click Handler | iOS Fallback |
|---|---|---|---|---|---|---|
| `app/root.tsx:461` | `OpenInAppButton` | `desktop-fixed` | Desktop only (`hidden lg:flex`) | `(canInstall \|\| isIOS) && !isStandalone` | `triggerInstall()` / iOS sheet | Yes (`IosInstallInstructions`) |
| `app/components/layout/Navbar.tsx:94-105` | Inline `<Button>` | n/a | Mobile only (inside `lg:hidden` div) | `(canInstall \|\| isIOS) && !isStandalone` | `handleInstallClick()` → `triggerInstall()` / iOS sheet | Yes (`IosInstallInstructions` at Navbar:243) |
| `app/components/pwa/OpenInAppButton.tsx` | Self (`menu-item` default) | `menu-item` | Not currently rendered anywhere | — | — | — |

**Key finding:** The `menu-item` variant of `OpenInAppButton` is **never instantiated** in the current codebase. Only `desktop-fixed` is used (in `root.tsx`). The PWA install logic is duplicated between `OpenInAppButton` (via `usePwaInstall`) and `Navbar` (also via `usePwaInstall`), giving **two independent state machines** tracking the same `BeforeInstallPromptEvent`.

---

## 3. Install State Lifecycle Trace

### Event Capture Flow

```
Browser fires beforeinstallprompt
        │
        ▼ [pwa-install-capture.js — loaded async]
        window.__pwaInstallPromptEvent = e   (e.preventDefault() called)
        │
        ▼ [React hydrates, useEffect runs for Navbar first (tree order)]
        Navbar's usePwaInstall → reads window.__pwaInstallPromptEvent
        → stores in deferredPromptRef.current
        → setCanInstall(true)
        → delete window.__pwaInstallPromptEvent   ← CONSUMED
        │
        ▼ [OpenInAppButton's usePwaInstall useEffect runs next]
        Reads window.__pwaInstallPromptEvent → UNDEFINED (already deleted)
        Adds window.addEventListener("beforeinstallprompt") → will never fire (event already passed)
        setCanInstall(false)  ← STAYS FALSE
```

### State Persistence

| Mechanism | Where | Survives Hard Refresh? | Survives New Tab? |
|---|---|---|---|
| `deferredPromptRef` | Component-level React ref | No | No |
| `window.__pwaInstallPromptEvent` | Global window | No | No |
| `localStorage["pwa-app-installed"]` | `pwa-storage.ts` | Yes | Yes |
| `isStandalone` (media query) | Computed on mount | Yes (re-detected) | Yes |

### After `userChoice` Resolves

- Calling hook: `deferredPromptRef.current = null`, `setCanInstall(false)`, `setIsInstalling(false)` ✅
- Sibling hook (other usePwaInstall instance): still holds `canInstall=false` (it never got the event), no stale ref ✅
- `appinstalled` event listener: calls `setAppInstalled()` (writes localStorage), `setIsStandalone(true)`, hides button ✅

### Detection Methods

| Method | Code Location | Platform | Correct? |
|---|---|---|---|
| `window.matchMedia("(display-mode: standalone)")` | `usePwaInstall.ts:52` | All | ✅ |
| `navigator.standalone === true` | `usePwaInstall.ts:53` | iOS Safari only | ✅ |
| `localStorage["pwa-app-installed"]` | `pwa-storage.ts:7` | All | ✅ (fallback, survives sessions) |
| `navigator.getInstalledRelatedApps()` | `usePwaInstall.ts:99` | Chrome Android/Windows | ⚠️ See Issue #7 |

---

## 4. Cross-Environment Matrix

*(Static analysis — no live browser testing performed per audit scope)*

| Browser / Platform | Prompt Available | Install Detection | Button Visible | Fallback UX | Expected Behavior | Issues |
|---|---|---|---|---|---|---|
| **Chrome desktop (Win/macOS)** | ✅ BeforeInstallPromptEvent | `matchMedia` + localStorage | ❌ Likely broken | None | Desktop pill should show | **CRITICAL** — Navbar hook consumes event; desktop button never gets it |
| **Chrome Android** | ✅ BeforeInstallPromptEvent | All methods | Navbar icon shows | n/a | Mobile icon triggers prompt | ✅ Works |
| **Edge desktop** | ✅ (same as Chrome) | `matchMedia` + localStorage | ❌ Same bug as Chrome desktop | None | Should show | **CRITICAL** — same dual-hook issue |
| **Edge Android** | ✅ | Same | Mobile icon shows | n/a | ✅ | Same as Chrome Android |
| **Samsung Internet** | ✅ (partial) | `matchMedia` | Depends | None | Icon may show | Event timing more variable |
| **Firefox desktop** | ❌ No BeforeInstallPromptEvent | `matchMedia` | ❌ Hidden (correct) | None needed | Button correctly hidden | ✅ |
| **Firefox Android** | ❌ No BeforeInstallPromptEvent | `matchMedia` | ❌ Hidden (correct) | None needed | Button correctly hidden | ✅ |
| **Safari macOS** | ❌ No BeforeInstallPromptEvent | `matchMedia` | ❌ Hidden (correct) | None | Button correctly hidden | ✅ |
| **Safari iOS** | ❌ (no programmatic API) | `navigator.standalone` | Mobile iOS sheet | ✅ `IosInstallInstructions` | Sheet shows manual steps | ✅ Works — but see Issue #4 (iPadOS) |
| **Opera desktop** | ✅ (Chromium-based) | `matchMedia` + localStorage | ❌ Same as Chrome desktop | None | Should show | **CRITICAL** — same dual-hook issue |

---

## 5. Issue Log

---

### ISSUE-001 — CRITICAL
**Dual `usePwaInstall()` instances cause install event capture race: desktop button never shows**

- **Affected environments:** Chrome/Edge/Opera on desktop (Windows, macOS, Linux)
- **Root cause:** `pwa-install-capture.js` stashes the `BeforeInstallPromptEvent` on `window.__pwaInstallPromptEvent`. Both `Navbar` (line 55) and `OpenInAppButton` (line 13) call `usePwaInstall()`, each running their own `useEffect`. React runs sibling effects in render order — Navbar is rendered first (root.tsx:449 before 461), so its `useEffect` runs first, reads and **deletes** `window.__pwaInstallPromptEvent`. OpenInAppButton's hook finds nothing. The desktop-fixed button (`hidden lg:flex`) never sets `canInstall=true` and is never rendered.
- **Reproduction:** Visit the site fresh in Chrome desktop. Open DevTools → Application → Manifest → "Add to home screen". The desktop pill button never appears.
- **Observed:** Desktop pill never renders.
- **Expected:** Desktop pill should appear on desktop viewports when the install prompt is available.
- **Severity:** CRITICAL — the desktop install CTA is completely broken.

---

### ISSUE-002 — HIGH
**`pwa-install-capture.js` loaded with `async` attribute — event may fire before script loads**

- **File:** `app/root.tsx:354`
- **Affected environments:** All browsers, especially slow connections or when browser fires `beforeinstallprompt` very early
- **Root cause:** `<script src="/pwa-install-capture.js" async ...>` means the script downloads and executes in parallel with HTML parsing, not synchronously. If the browser fires `beforeinstallprompt` before the script executes, the event is lost entirely for that session — no hook can recover it afterward.
- **Expected:** The capture script should either load without `async`/`defer`, or be inlined directly into the HTML `<head>` to eliminate the network round-trip entirely.
- **Severity:** HIGH — intermittently silences the install feature with no error.

---

### ISSUE-003 — HIGH
**Workbox loaded from external Google CDN — SW fails if CDN is unreachable**

- **File:** `public/sw.js:4`
- **Affected environments:** Any environment where `storage.googleapis.com` is blocked (corporate networks, China, privacy-focused configurations) or temporarily unavailable
- **Root cause:** `importScripts("https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js")` — the entire SW is a no-op if this request fails. The guard at line 6 (`if (!workbox)`) only logs an error. No routes are registered. No offline fallback. Install eligibility may also be affected if the SW doesn't handle fetches correctly.
- **Fix:** Bundle Workbox locally using `workbox-build` or the Vite Workbox plugin; serve from a `/` relative path.
- **Severity:** HIGH — in affected environments, the SW is completely non-functional.

---

### ISSUE-004 — MEDIUM
**iPadOS 13+ not detected as iOS — no install guidance for iPad users**

- **File:** `app/hooks/usePwaInstall.ts:44-47`
- **Root cause:** `detectIOSDevice()` checks `/iPad|iPhone|iPod/.test(ua)`. iPadOS 13+ reports a desktop Safari user agent (`Macintosh; Intel Mac OS X`), so `isIOS = false`. The browser also has no `BeforeInstallPromptEvent`, so `canInstall = false`. Render condition `(!canInstall && !isIOS) → return null` hides the button. iPad users get no install affordance.
- **Fix:** Add `navigator.maxTouchPoints > 1` as a secondary signal alongside the UA check.
- **Severity:** MEDIUM — iPad users silently get no install path.

---

### ISSUE-005 — MEDIUM
**`isAppDetectedAsInstalled` computed but ignored in button logic — missing "launch in app" path**

- **Files:** `app/hooks/usePwaInstall.ts:94-106`, `app/components/pwa/OpenInAppButton.tsx:35`
- **Root cause:** `usePwaInstall` returns `isAppDetectedAsInstalled` (true when localStorage or `getInstalledRelatedApps` confirms install), but `OpenInAppButton` destructures it away unused. Users who installed the PWA and return in the browser see no "Open in App" button — the prompt is gone and `canInstall=false`.
- **Expected:** When `isAppDetectedAsInstalled=true && !isStandalone`, the button should show with an appropriate CTA.
- **Severity:** MEDIUM — returning installed users get no re-entry affordance.

---

### ISSUE-006 — MEDIUM
**Dead code: `window.location.href = window.location.origin` is unreachable**

- **File:** `app/components/pwa/OpenInAppButton.tsx:27`
- **Root cause:** The render guard at line 35 (`if ((!canInstall && !isIOS) || isStandalone) return null`) ensures the component only renders when `canInstall || isIOS`. The click handler handles `isIOS` at line 17 (return early) and `canInstall` at line 22 (return after triggerInstall). The `window.location.href` branch at line 27 can never execute. Additionally, navigating to `window.location.origin` in a browser tab does not open the standalone PWA — it just reloads the site in-browser.
- **Severity:** MEDIUM — dead code obscures intent and the "open in installed app" problem remains unsolved.

---

### ISSUE-007 — MEDIUM
**`getInstalledRelatedApps()` check may silently fail or return incorrect results**

- **File:** `app/hooks/usePwaInstall.ts:99-112`
- **Root cause:** `getInstalledRelatedApps()` is Chromium-only on Android and Windows. It requires: (1) the site be HTTPS, (2) `related_applications` in the manifest include a `webapp` entry whose `url` matches the manifest URL, and (3) the `id` in the manifest matches what the browser recorded on install. The `url` in `related_applications` is the dynamic manifest URL (includes origin), not a stable identifier. If the origin changes between install and check (e.g., Cloudflare Workers vs Oxygen domain), the check returns no results. The localStorage fallback covers this but only persists from the `appinstalled` event — it won't survive device restores.
- **Severity:** MEDIUM — install detection may miss some installed users on certain platforms/configurations.

---

### ISSUE-008 — LOW
**`IosInstallInstructions` instantiated in both `Navbar` and `OpenInAppButton` — fragile duplication**

- **Files:** `app/components/layout/Navbar.tsx:243`, `app/components/pwa/OpenInAppButton.tsx:101`
- **Root cause:** Two separate Sheet instances exist in the DOM, each controlled by independent `showIosInstructions` state. Currently non-conflicting because `OpenInAppButton` is desktop-only (`hidden lg:flex`). If `menu-item` variant is ever used on mobile, both sheets could show for the same interaction.
- **Severity:** LOW — currently harmless, but a future regression trap.

---

### ISSUE-009 — LOW
**`pwa_install_prompt_shown` analytics event is never emitted**

- **Files:** `app/hooks/usePwaAnalytics.ts:218`, `app/hooks/usePwaInstall.ts:130-134`
- **Root cause:** `trackInstallPrompt()` is defined but never called. The `handleBeforeInstall` callback at usePwaInstall.ts:130 captures the event and sets state but does not fire the analytics event. Other events (`pwa_installed`, `pwa_install_prompt_dismissed`) are tracked correctly in `triggerInstall()`.
- **Severity:** LOW — analytics gap only; no functional impact.

---

### ISSUE-010 — LOW
**`setIsStandalone(true)` in `appinstalled` handler conflates "installed now" with "running standalone"**

- **File:** `app/hooks/usePwaInstall.ts:148`
- **Root cause:** After the `appinstalled` event fires, the hook calls `setIsStandalone(true)` to hide the button. Semantically, `isStandalone` means "currently running in standalone display mode," not "was just installed." Any downstream consumer using `isStandalone` to branch on display mode will get a false positive. The cleaner signal for "just installed" is `isAppDetectedAsInstalled`.
- **Severity:** LOW — no current downstream misuse; code smell.

---

## 6. Prioritised Remediation Plan

---

### P0 — CRITICAL: Fix the dual-hook race condition (ISSUE-001)

The root cause is two separate `usePwaInstall()` hook instances competing for a one-shot event. The fix is to make the deferred event a **singleton**.

**Option A (recommended): Lift to a `PwaInstallProvider` context**

Create a single provider at the root level that owns the `BeforeInstallPromptEvent` state. All consumers call `usePwaInstallContext()` to read from the shared instance. This is the cleanest architecture — one event capture, one state machine, zero races.

**Option B (quick fix): Module-level singleton in `usePwaInstall.ts`**

Extract `_deferredPrompt` and `_canInstall` to module scope (outside the hook function). Each hook instance reads from the shared module variable instead of its own ref. When one instance triggers install and clears the ref, all instances see the change on next render. Requires a subscriber pattern or a shared set of state setters.

---

### P1 — HIGH: Inline the capture script to guarantee pre-hydration execution (ISSUE-002)

**File:** `app/root.tsx:354`

Remove the external `<script src="/pwa-install-capture.js" async>` tag. Move the 6-line IIFE directly into the HTML `<head>` as an inline `<script>` element. In React Router / Hydrogen, this is done by passing the script content as an inline tag inside `Layout`'s `<head>`. The nonce prop must still be forwarded to satisfy CSP.

Inlining eliminates the network round-trip entirely and guarantees the listener is registered before the browser can fire `beforeinstallprompt`.

---

### P2 — HIGH: Bundle Workbox locally (ISSUE-003)

**File:** `public/sw.js`

Replace the `importScripts` CDN call with a build-time bundled Workbox. Use `workbox-build` (generateSW or injectManifest strategy) or integrate via a Vite plugin. The SW should import Workbox modules from your own origin (`/workbox-sw.js`), eliminating the external CDN dependency and resolving potential CSP `script-src` conflicts.

---

### P3 — MEDIUM: Detect iPadOS 13+ (ISSUE-004)

**File:** `app/hooks/usePwaInstall.ts:44-47`

```ts
const detectIOSDevice = (): boolean => {
    if (typeof window === "undefined") return false;
    const ua = navigator.userAgent;
    const isTraditionalIOS = /iPad|iPhone|iPod/.test(ua) && !("MSStream" in window);
    // iPadOS 13+ reports desktop UA; detect via touch capability on "Mac"
    const isiPadOS = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
    return isTraditionalIOS || isiPadOS;
};
```

---

### P4 — MEDIUM: Solve the "already installed, browsing in browser" case (ISSUES-005 + 006)

Remove the dead `window.location.href` branch and make `isAppDetectedAsInstalled` drive a visible affordance.

**In `OpenInAppButton.tsx`**, update the render condition and click handler:

```tsx
const {canInstall, isIOS, isStandalone, isAppDetectedAsInstalled, triggerInstall} = usePwaInstall();

const handleClick = async () => {
    // iOS and "already installed" users both get the instructions sheet
    // (no cross-browser API exists to programmatically focus the standalone window)
    if (isIOS || isAppDetectedAsInstalled) {
        setShowIosInstructions(true);
        return;
    }
    if (canInstall) {
        await triggerInstall();
        return;
    }
};

// Render when: prompt available OR iOS OR already-installed-but-in-browser — but not when standalone
if ((!canInstall && !isIOS && !isAppDetectedAsInstalled) || isStandalone) return null;
```

Note: no cross-browser API reliably opens an already-installed PWA's standalone window programmatically. A sheet explaining "open from your home screen" is the correct UX fallback. Consider creating a dedicated `AlreadyInstalledInstructions` component with platform-appropriate copy, or extend `IosInstallInstructions` to handle this variant.

---

### P5 — LOW: Add missing `trackInstallPrompt()` call (ISSUE-009)

**File:** `app/hooks/usePwaInstall.ts:130-134`

```ts
const handleBeforeInstall = (e: Event) => {
    e.preventDefault();
    deferredPromptRef.current = e as BeforeInstallPromptEvent;
    setCanInstall(true);
    trackInstallPrompt(); // add this line
};
```

---

### P6 — LOW: Consolidate `IosInstallInstructions` (ISSUE-008)

Remove the `IosInstallInstructions` instance from `OpenInAppButton` (the desktop-fixed variant is hidden on mobile anyway — the component is `hidden lg:flex`). If P0's context refactor is implemented, lift the single sheet instance into the `PwaInstallProvider` so there is exactly one in the DOM regardless of how many consumers exist.

---

## Summary Table

| ID | Severity | Issue | File | Fix Complexity |
|---|---|---|---|---|
| 001 | CRITICAL | Dual hook — desktop button never shows | `usePwaInstall.ts`, `root.tsx` | Medium (shared context or module singleton) |
| 002 | HIGH | `async` capture script may miss event | `root.tsx:354` | Trivial (inline the script) |
| 003 | HIGH | Workbox from external CDN | `public/sw.js:4` | High (build pipeline change) |
| 004 | MEDIUM | iPadOS 13+ undetected as iOS | `usePwaInstall.ts:44` | Trivial (one-liner UA fix) |
| 005 | MEDIUM | `isAppDetectedAsInstalled` unused | `OpenInAppButton.tsx` | Medium (UX design + code) |
| 006 | MEDIUM | Dead code `window.location.href` | `OpenInAppButton.tsx:27` | Trivial (remove or repurpose) |
| 007 | MEDIUM | `getInstalledRelatedApps()` reliability | `usePwaInstall.ts:99` | Low (document limitation) |
| 008 | LOW | Duplicate `IosInstallInstructions` | `Navbar.tsx`, `OpenInAppButton.tsx` | Low |
| 009 | LOW | Missing `trackInstallPrompt()` call | `usePwaInstall.ts:130` | Trivial (one-liner) |
| 010 | LOW | `isStandalone` semantics overloaded | `usePwaInstall.ts:148` | Low |

The single highest-impact change is **P0 (ISSUE-001)**: converting `usePwaInstall` into a shared context or module singleton. This unblocks the desktop install button entirely and is a prerequisite for any UX improvements to the install flow. **P1 (ISSUE-002)** is a one-line change with immediate reliability gains and should ship alongside P0.
