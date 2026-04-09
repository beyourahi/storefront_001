import {useState, useEffect} from "react";
import {Button} from "~/components/ui/button";
import {cn} from "~/lib/utils";
import {usePwaInstall} from "~/hooks/usePwaInstall";
import {IosInstallInstructions} from "./IosInstallInstructions";
import {Download, Smartphone, X} from "lucide-react";

interface OpenInAppButtonProps {
    variant?: "desktop-fixed" | "menu-item";
}

const DISMISS_KEY = "pwa_banner_dismissed";

export const OpenInAppButton = ({variant = "menu-item"}: OpenInAppButtonProps) => {
    const {canInstall, isIOS, isStandalone, triggerInstall, appName, appIcon} = usePwaInstall();
    const [showIosInstructions, setShowIosInstructions] = useState(false);
    const [dismissed, setDismissed] = useState(false);
    const [exiting, setExiting] = useState(false);

    useEffect(() => {
        if (variant !== "desktop-fixed") return;
        try {
            if (sessionStorage.getItem(DISMISS_KEY)) setDismissed(true);
        } catch {
            // Private browsing or storage unavailable — treat as not dismissed
        }
    }, [variant]);

    const handleClick = async () => {
        if (isIOS) {
            setShowIosInstructions(true);
            return;
        }

        if (canInstall) {
            await triggerInstall();
            return;
        }

        window.location.href = window.location.origin;
    };

    const handleDismiss = () => {
        setExiting(true);
        try {
            sessionStorage.setItem(DISMISS_KEY, "1");
        } catch {
            // ignore
        }
        // Allow exit animation to complete before unmounting
        setTimeout(() => setDismissed(true), 250);
    };

    // desktop-fixed: don't render if dismissed this session
    if (variant === "desktop-fixed" && dismissed) return null;
    // desktop-fixed: don't render on desktop browsers that can't install and aren't iOS
    // (prevents the confusing window.location.origin fallback on Firefox/Safari)
    if (variant === "desktop-fixed" && !canInstall && !isIOS) return null;

    if (isStandalone) {
        if (variant === "desktop-fixed") return null;

        return (
            <div
                className={cn("flex items-center gap-3 text-primary/60", "animate-slide-up-fade opacity-0")}
                style={{animationDelay: "400ms", animationFillMode: "both"}}
            >
                <Smartphone className="size-5" />
                <span className="text-lg font-medium">You&apos;re in the app</span>
            </div>
        );
    }

    const isFixed = variant === "desktop-fixed";
    const isMenuItem = variant === "menu-item";

    return (
        <>
            {isFixed ? (
                <div
                    role="complementary"
                    aria-label="Install this page as an app"
                    className={cn(
                        // Stacking and position
                        "fixed right-4 z-[9999]",
                        // Entry animation — animationFillMode:"both" provides the backwards fill
                        // so the element is hidden during the delay without a separate opacity-0 class.
                        !exiting && "animate-slide-up-fade"
                    )}
                    style={{
                        // Float above the product sticky action bar and device safe-area notch.
                        // --product-sticky-bar-height is set by ProductMobileStickyButtons via
                        // ResizeObserver when on a product page; falls back to 0px elsewhere.
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
                            // Dark pill reads cleanly over any page background
                            "bg-[var(--text-primary)] text-[var(--text-inverse)]",
                            // Touch target height and clip
                            "h-11 overflow-hidden",
                            // Depth
                            "shadow-2xl"
                        )}
                    >
                        {/* ── Install / iOS instructions trigger ──────────── */}
                        <button
                            type="button"
                            onClick={() => void handleClick()}
                            className={cn(
                                "flex items-center gap-2.5",
                                "h-full pl-4 pr-3",
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-inset",
                                "active:bg-white/10 transition-colors duration-150"
                            )}
                            aria-label="Install app"
                        >
                            <Download
                                className="size-4 shrink-0 text-white/80"
                                aria-hidden="true"
                                strokeWidth={1.75}
                            />
                            <span className="text-[13px] font-semibold tracking-[0.01em] whitespace-nowrap pr-0.5">
                                Open in App
                            </span>
                        </button>

                        {/* ── Divider ─────────────────────────────────────── */}
                        <div className="w-px h-5 bg-white/15 shrink-0" aria-hidden="true" />

                        {/* ── Dismiss ─────────────────────────────────────── */}
                        <button
                            type="button"
                            onClick={handleDismiss}
                            className={cn(
                                "flex items-center justify-center",
                                "h-full w-10 shrink-0",
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-inset",
                                "hover:bg-white/10 active:bg-white/15 transition-colors duration-150"
                            )}
                            aria-label="Dismiss install banner"
                        >
                            <X className="size-3.5 text-white/70" aria-hidden="true" strokeWidth={2.5} />
                        </button>
                    </div>
                </div>
            ) : (
                <Button
                    onClick={() => void handleClick()}
                    variant="outline"
                    className={cn(
                        "gap-3",
                        isMenuItem && [
                            "w-full lg:w-auto",
                            "text-lg font-medium min-h-12",
                            "animate-slide-up-fade opacity-0"
                        ]
                    )}
                    style={isMenuItem ? {animationDelay: "400ms", animationFillMode: "both"} : undefined}
                >
                    <Download className="size-5" />
                    <span>Open in App</span>
                </Button>
            )}

            <IosInstallInstructions
                open={showIosInstructions}
                onDismiss={() => setShowIosInstructions(false)}
                appName={appName}
                appIcon={appIcon}
            />
        </>
    );
};
