/**
 * Native app deep-link module.
 *
 * Framework-agnostic pure logic — no DOM or router coupling.
 * DOM side-effects (window.location, localStorage, event listeners) are
 * confined to `openNativeApp()` and can be swapped out for testing.
 *
 * ─── CONFIGURATION ───────────────────────────────────────────────────────────
 * Before deploying, update APP_CONFIG with your app's credentials.
 *
 * Deep-link strategy:
 *   • If universalLinkBase is set → use Universal Links / App Links (preferred).
 *     The OS intercepts the HTTPS URL and opens the native app when installed.
 *     No JS detection or timeout is needed; OS handles the fallback natively.
 *
 *   • If universalLinkBase is null → use URI scheme + timeout-based fallback.
 *     Attempts to open myapp://route, then after 1200ms redirects to the
 *     App Store / Play Store if the app did not open (detected via page blur
 *     and visibilitychange events).
 *
 * Deferred deep link:
 *   Without Branch.io or Firebase Dynamic Links, the App Store does not pass
 *   parameters to the app on install. The module saves the intended destination
 *   to localStorage so the native app can retrieve it on first launch via a
 *   custom URL scheme call or a dedicated handshake endpoint.
 *   For production, integrate with Branch.io or Firebase Dynamic Links to
 *   reliably carry the destination through the install funnel.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export const APP_CONFIG = {
    /** Custom URI scheme (without "://"). Example: "myapp" → "myapp://home" */
    uriScheme: "myapp",

    /** iOS App Store URL for your native app */
    appStoreUrl: "https://apps.apple.com/app/id000000000",

    /** Android Google Play Store URL for your native app */
    playStoreUrl: "https://play.google.com/store/apps/details?id=com.example.app",

    /**
     * Base URL for Universal Links (iOS) / App Links (Android).
     * When set, this is used instead of the URI scheme — the OS intercepts
     * the HTTPS request and opens the native app if installed, or falls
     * back to the browser. Set to null to use the URI scheme.
     * Example: "https://app.mystore.com"
     */
    universalLinkBase: null as string | null,

    /**
     * Milliseconds to wait before assuming the native app is not installed
     * and redirecting to the store. Only used with the URI scheme strategy.
     * 1000–1500ms is the accepted industry range.
     */
    openTimeoutMs: 1200,

    /** localStorage key used to persist the deferred deep link destination */
    deferredDeepLinkKey: "native_app_deferred_path",
} as const;

// ---------------------------------------------------------------------------
// Platform detection
// ---------------------------------------------------------------------------

export type Platform = "ios" | "android" | "desktop";

/**
 * Detects the current platform from a userAgent string.
 * Pure function — pass navigator.userAgent for production use.
 */
export function detectPlatform(userAgent: string): Platform {
    // iOS: iPhone, iPad (modern iPads report as iPad or Macintosh with touch)
    if (/iPad|iPhone|iPod/.test(userAgent) && !/Windows Phone/.test(userAgent)) {
        return "ios";
    }
    // Android
    if (/Android/.test(userAgent)) {
        return "android";
    }
    return "desktop";
}

/** Returns true only for platforms that have a native app equivalent */
export function isNativeAppPlatform(platform: Platform): boolean {
    return platform === "ios" || platform === "android";
}

// ---------------------------------------------------------------------------
// Web path → native app route mapping
// ---------------------------------------------------------------------------

/**
 * Maps a web pathname to a native app route segment.
 *
 * Route mapping conventions:
 *   Web path                       App route
 *   ──────────────────────────     ─────────────────────────
 *   /                              home
 *   /products/:handle              product/:handle
 *   /collections                   collections
 *   /collections/all               collections
 *   /collections/:handle           collection/:handle
 *   /cart                          cart
 *   /search                        search
 *   /sale                          sale
 *   /wishlist                      wishlist
 *   /blogs                         blogs
 *   /blogs/:blog/:article          article/:blog/:article
 *   /blogs/:blog                   blog/:blog
 *   /account                       account
 *   /account/profile               account/profile
 *   /account/orders                account/orders
 *   /account/orders/:id            account/orders/:id
 *   /account/addresses             account/addresses
 *   /account/subscriptions         account/subscriptions
 *   /account/subscriptions/:id     account/subscriptions/:id
 *   /account/returns               account/returns
 *   /account/wishlist              account/wishlist
 *   <unmatched>                    home  (safe fallback)
 */
export function mapPathToAppRoute(pathname: string): string {
    // Exact path matches
    const exactRoutes: Record<string, string> = {
        "/": "home",
        "/collections": "collections",
        "/collections/all": "collections",
        "/collections/all-products": "collections",
        "/cart": "cart",
        "/search": "search",
        "/sale": "sale",
        "/wishlist": "wishlist",
        "/wishlists": "wishlist",
        "/blogs": "blogs",
        "/gallery": "gallery",
        "/account": "account",
        "/account/profile": "account/profile",
        "/account/addresses": "account/addresses",
        "/account/orders": "account/orders",
        "/account/returns": "account/returns",
        "/account/wishlist": "account/wishlist",
        "/account/subscriptions": "account/subscriptions",
    };

    if (exactRoutes[pathname] !== undefined) return exactRoutes[pathname]!;

    // Parameterized pattern matches — ordered from most to least specific
    const patterns: Array<[RegExp, (m: RegExpMatchArray) => string]> = [
        [/^\/products\/([^/]+)$/, m => `product/${m[1]}`],
        [/^\/collections\/([^/]+)$/, m => `collection/${m[1]}`],
        [/^\/blogs\/([^/]+)\/([^/]+)$/, m => `article/${m[1]}/${m[2]}`],
        [/^\/blogs\/([^/]+)$/, m => `blog/${m[1]}`],
        [/^\/account\/orders\/([^/]+)$/, m => `account/orders/${m[1]}`],
        [/^\/account\/subscriptions\/([^/]+)$/, m => `account/subscriptions/${m[1]}`],
        [/^\/policies\/([^/]+)$/, () => "home"],
    ];

    for (const [pattern, builder] of patterns) {
        const match = pathname.match(pattern);
        if (match) return builder(match);
    }

    // Fallback: unmapped paths land on home
    return "home";
}

/** Builds the full URI scheme deep link URL for a given web pathname */
export function buildUriSchemeDeepLink(pathname: string): string {
    const appRoute = mapPathToAppRoute(pathname);
    return `${APP_CONFIG.uriScheme}://${appRoute}`;
}

/** Builds a Universal Link URL for a given web pathname */
export function buildUniversalLink(pathname: string, base: string): string {
    return `${base.replace(/\/$/, "")}${pathname}`;
}

// ---------------------------------------------------------------------------
// Store URLs (with encoded deferred deep link destination)
// ---------------------------------------------------------------------------

/**
 * Returns the platform-appropriate store URL with the current path encoded
 * as a query parameter for deferred deep linking.
 *
 * The `path` and `referral` params are readable by the native app:
 *   - On iOS: read from the install source URL via SKAdNetwork attribution
 *     or a Branch.io / Adjust deep link flow
 *   - On Android: read from Play Install Referrer API
 *   - Fallback: app reads `native_app_deferred_path` from localStorage on first
 *     launch by opening a silent handshake URL on your domain
 */
export function getStoreUrl(platform: "ios" | "android", currentPath: string): string {
    const base = platform === "ios" ? APP_CONFIG.appStoreUrl : APP_CONFIG.playStoreUrl;
    const params = new URLSearchParams({
        referral: "web_open_in_app",
        path: currentPath,
    });
    return `${base}?${params.toString()}`;
}

// ---------------------------------------------------------------------------
// Open / install flow
// ---------------------------------------------------------------------------

export interface OpenNativeAppOptions {
    /** Web pathname at the time the button was tapped (e.g. "/products/my-shoe") */
    pathname: string;
    /** Resolved platform — must be "ios" or "android" */
    platform: "ios" | "android";
}

/**
 * Executes the native app open/install flow.
 *
 * Universal Link path (when APP_CONFIG.universalLinkBase is set):
 *   Sets window.location to the Universal Link URL. The OS routes to the app
 *   if installed, or to the browser if not. No JS detection needed.
 *
 * URI scheme path (default):
 *   1. Saves the current pathname to localStorage for deferred deep linking.
 *   2. Sets window.location to the URI scheme deep link.
 *   3. Listens for `visibilitychange` and `blur` — either fires when the OS
 *      switches focus to the native app, signalling success.
 *   4. After APP_CONFIG.openTimeoutMs, if the page is still visible and no
 *      focus-loss was detected, redirects to the store (app not installed).
 *
 * Timing note: 1200ms is conservative. Some Android devices take 800–1000ms
 * to hand off to the OS. Reducing below 1000ms risks false-positive store
 * redirects on slow devices.
 */
export function openNativeApp({ pathname, platform }: OpenNativeAppOptions): void {
    if (typeof window === "undefined") return;

    // ── Universal Links path ──────────────────────────────────────────────
    if (APP_CONFIG.universalLinkBase) {
        const universalLink = buildUniversalLink(pathname, APP_CONFIG.universalLinkBase);
        window.location.href = universalLink;
        return;
    }

    // ── URI scheme + timeout-based fallback ───────────────────────────────
    const deepLink = buildUriSchemeDeepLink(pathname);
    const storeUrl = getStoreUrl(platform, pathname);
    let appOpened = false;

    // Save deferred destination before navigation (localStorage survives across
    // the install flow if the user returns to the browser after install)
    try {
        localStorage.setItem(APP_CONFIG.deferredDeepLinkKey, pathname);
    } catch {
        // Blocked in private browsing or storage quota exceeded — not critical
    }

    const cleanup = () => {
        clearTimeout(fallbackTimer);
        document.removeEventListener("visibilitychange", onVisibilityChange);
        window.removeEventListener("blur", onBlur);
    };

    const onAppOpened = () => {
        if (appOpened) return;
        appOpened = true;
        cleanup();
    };

    const onVisibilityChange = () => {
        if (document.hidden) onAppOpened();
    };

    const onBlur = () => onAppOpened();

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", onBlur);

    // Attempt to open the native app via URI scheme
    window.location.href = deepLink;

    // Redirect to store if the app didn't open
    const fallbackTimer = setTimeout(() => {
        cleanup();
        if (!appOpened) {
            window.location.href = storeUrl;
        }
    }, APP_CONFIG.openTimeoutMs);
}
