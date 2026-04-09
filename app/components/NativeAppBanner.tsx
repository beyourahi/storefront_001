/**
 * NativeAppBanner — persistent floating button that deep-links into the
 * native iOS / Android app or routes to the appropriate store.
 *
 * Behaviour matrix:
 *   iOS / Android + tap    → try URI scheme; timeout → App Store / Play Store
 *   Desktop                → hidden entirely (no native app equivalent)
 *   Already dismissed      → hidden for the session (sessionStorage key)
 *   Running as PWA         → hidden (standalone display-mode; unrelated feature)
 *
 * Positioning:
 *   Fixed bottom-right, above safe-area-inset-bottom and above the product
 *   page sticky action bar (reads --product-sticky-bar-height from :root).
 *
 * This component owns zero deep-link logic — all of it lives in
 * ~/lib/native-app-link.ts and is injected via the openNativeApp call.
 */

import {useState, useEffect} from "react";
import {useLocation} from "react-router";
import {Smartphone, X} from "lucide-react";
import {cn} from "~/lib/utils";
import {detectPlatform, isNativeAppPlatform, openNativeApp} from "~/lib/native-app-link";
import type {Platform} from "~/lib/native-app-link";

const DISMISS_KEY = "native_app_banner_dismissed";

/** Returns true when the page is running in standalone / installed-PWA mode */
function isStandaloneMode(): boolean {
    if (typeof window === "undefined") return false;
    return (
        window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as Navigator & {standalone?: boolean}).standalone === true
    );
}

export function NativeAppBanner() {
    const location = useLocation();
    const [platform, setPlatform] = useState<Extract<Platform, "ios" | "android"> | null>(null);
    const [dismissed, setDismissed] = useState(false);
    const [exiting, setExiting] = useState(false);

    useEffect(() => {
        // All detection is client-only
        // Dev/preview: ?native_app_banner=preview forces the banner visible for
        // visual testing without needing a real mobile UA. Remove in production
        // if you want to be strict, but it has no effect for real users.
        const params = new URLSearchParams(window.location.search);
        if (params.get("native_app_banner") === "preview") {
            setPlatform("ios");
            return;
        }

        const detected = detectPlatform(navigator.userAgent);

        // Desktop browsers have no native app to open
        if (!isNativeAppPlatform(detected)) return;

        // Running as an installed PWA — this feature is unrelated to PWA install
        if (isStandaloneMode()) return;

        // Already dismissed this session
        try {
            if (sessionStorage.getItem(DISMISS_KEY)) return;
        } catch {
            // sessionStorage unavailable (private browsing, etc.) — still show
        }

        setPlatform(detected as Extract<Platform, "ios" | "android">);
    }, []);

    const handleOpen = () => {
        if (!platform) return;
        openNativeApp({pathname: location.pathname, platform});
    };

    const handleDismiss = () => {
        setExiting(true);
        try {
            sessionStorage.setItem(DISMISS_KEY, "1");
        } catch {
            // ignore
        }
        // Remove after exit animation
        setTimeout(() => setDismissed(true), 250);
    };

    // Not a mobile platform, already dismissed, or in standalone mode
    if (!platform || dismissed) return null;

    const storeLabel = platform === "ios" ? "App Store" : "Play Store";

    return (
        <div
            role="complementary"
            aria-label={`Open this page in the app — available on ${storeLabel}`}
            className={cn(
                // Stacking and position
                "fixed right-4 z-[9999]",
                // Mobile only — desktop has no native app equivalent
                "md:hidden",
                // Entry animation — animationFillMode:"both" provides the backwards fill
                // (hides element during delay) without needing a separate opacity-0 class,
                // which would conflict with the animation's final opacity:1 fill state.
                !exiting && "animate-slide-up-fade"
            )}
            style={{
                // Float above the product sticky action bar and safe-area notch.
                // --product-sticky-bar-height is set by ProductMobileStickyButtons
                // via ResizeObserver when on a product page; falls back to 0px.
                bottom: "calc(var(--product-sticky-bar-height, 0px) + max(env(safe-area-inset-bottom), 1rem))",
                animationDelay: exiting ? "0ms" : "800ms",
                animationFillMode: "both",
                // Exit: quick fade + slight drop
                ...(exiting && {
                    opacity: 0,
                    transform: "translateY(6px)",
                    transition: "opacity 200ms ease, transform 200ms ease",
                }),
            }}
        >
            <div
                className={cn(
                    "flex items-center gap-0",
                    // Pill shape
                    "rounded-full",
                    // Colours — dark pill reads cleanly over any page background
                    "bg-[var(--text-primary)] text-[var(--text-inverse)]",
                    // Touch target and visual weight
                    "h-11 overflow-hidden",
                    // Depth
                    "shadow-2xl"
                )}
            >
                {/* ── Open-in-app trigger ─────────────────────────────── */}
                <button
                    type="button"
                    onClick={handleOpen}
                    className={cn(
                        "flex items-center gap-2.5",
                        "h-full pl-4 pr-3",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-inset",
                        "active:bg-white/10 transition-colors duration-150"
                    )}
                    aria-label={`Open in the ${storeLabel} app`}
                >
                    <Smartphone
                        className="size-4 shrink-0 text-white/80"
                        aria-hidden="true"
                        strokeWidth={1.75}
                    />
                    <span className="text-[13px] font-semibold tracking-[0.01em] whitespace-nowrap pr-0.5">
                        Open in App
                    </span>
                </button>

                {/* ── Divider ─────────────────────────────────────────── */}
                <div className="w-px h-5 bg-white/15 shrink-0" aria-hidden="true" />

                {/* ── Dismiss ─────────────────────────────────────────── */}
                <button
                    type="button"
                    onClick={handleDismiss}
                    className={cn(
                        "flex items-center justify-center",
                        "h-full w-10 shrink-0",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-inset",
                        "hover:bg-white/10 active:bg-white/15 transition-colors duration-150"
                    )}
                    aria-label="Dismiss app banner"
                >
                    <X className="size-3.5 text-white/70" aria-hidden="true" strokeWidth={2.5} />
                </button>
            </div>
        </div>
    );
}
