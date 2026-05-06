import {useState} from "react";
import {Button} from "~/components/ui/button";
import {cn} from "~/lib/utils";
import {usePwaInstall} from "~/hooks/usePwaInstall";
import {IosInstallInstructions} from "./IosInstallInstructions";
import {AlreadyInstalledInstructions} from "./AlreadyInstalledInstructions";
import {Download} from "lucide-react";

interface OpenInAppButtonProps {
    variant?: "desktop-fixed" | "menu-item" | "navbar";
}

/**
 * Adaptive PWA install trigger rendered in three visual variants:
 * `"desktop-fixed"` (floating pill, desktop-only), `"navbar"` (compact pill for nav
 * bar), and `"menu-item"` (full-width button for the mobile menu).
 * Renders nothing when already in standalone mode or when there is no install action
 * to take (no native prompt, not iOS, not a detected-installed-but-browser session).
 *
 * Click handler has three branches:
 * 1. iOS Safari — native `beforeinstallprompt` is not fired; shows manual instructions.
 * 2. `canInstall` — triggers the deferred `beforeinstallprompt` native dialog.
 * 3. `isAppDetectedAsInstalled` — app is installed but user is in the browser; shows
 *    a "switch to home screen" nudge.
 */
export const OpenInAppButton = ({variant = "menu-item"}: OpenInAppButtonProps) => {
    const {canInstall, isIOS, isStandalone, isAppDetectedAsInstalled, triggerInstall, appName, appIcon} =
        usePwaInstall();
    const [showIosInstructions, setShowIosInstructions] = useState(false);
    const [showAlreadyInstalled, setShowAlreadyInstalled] = useState(false);

    const handleClick = async () => {
        if (isIOS) {
            setShowIosInstructions(true);
            return;
        }

        if (canInstall) {
            await triggerInstall();
            return;
        }

        if (isAppDetectedAsInstalled) {
            setShowAlreadyInstalled(true);
            return;
        }
    };

    const isFixed = variant === "desktop-fixed";
    const isMenuItem = variant === "menu-item";
    const isNavbar = variant === "navbar";

    // Don't render if there's nothing useful to do (no install prompt available, not iOS,
    // and not previously installed-but-browsing-in-browser), or already running standalone.
    if ((!canInstall && !isIOS && !isAppDetectedAsInstalled) || isStandalone) return null;

    return (
        <>
            {isFixed ? (
                <div
                    role="complementary"
                    aria-label="Install this page as an app"
                    // Positioning is handled by the parent FloatingButtonStack container
                    // in root.tsx — no fixed/bottom/z-index needed here.
                    className="flex animate-slide-up-fade max-lg:hidden"
                    style={{
                        animationDelay: "800ms",
                        animationFillMode: "both"
                    }}
                >
                    <button
                        type="button"
                        onClick={() => void handleClick()}
                        className={cn(
                            "flex items-center gap-2.5",
                            // Pill shape
                            "rounded-full",
                            // Dark pill reads cleanly over any page background
                            "bg-[var(--text-primary)] text-[var(--text-inverse)]",
                            // Touch target height and padding
                            "h-11 px-4",
                            // Depth and interaction
                            "shadow-2xl",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-inset",
                            "active:bg-white/10 transition-colors duration-150"
                        )}
                        aria-label="Install app"
                    >
                        <Download className="size-4 shrink-0" aria-hidden="true" strokeWidth={1.75} />
                        <span className="text-[13px] font-semibold tracking-[0.01em] whitespace-nowrap">Open App</span>
                    </button>
                </div>
            ) : isNavbar ? (
                <button
                    type="button"
                    onClick={() => void handleClick()}
                    className={cn(
                        "flex items-center gap-1.5",
                        "rounded-full",
                        // Mirrors the floating pill's dark-on-background aesthetic
                        "bg-[var(--text-primary)] text-[var(--text-inverse)]",
                        "h-8 px-3",
                        "shadow-md",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-inset",
                        "active:opacity-80 transition-opacity duration-150"
                    )}
                    aria-label="Install app"
                >
                    <Download className="size-3.5 shrink-0" aria-hidden="true" strokeWidth={1.75} />
                    <span className="text-[12px] font-semibold tracking-[0.01em] whitespace-nowrap">Open App</span>
                </button>
            ) : (
                <Button
                    onClick={() => void handleClick()}
                    variant="default"
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
                    <span>Open App</span>
                </Button>
            )}

            <IosInstallInstructions
                open={showIosInstructions}
                onDismiss={() => setShowIosInstructions(false)}
                appName={appName}
                appIcon={appIcon}
            />

            <AlreadyInstalledInstructions
                open={showAlreadyInstalled}
                onDismiss={() => setShowAlreadyInstalled(false)}
                appName={appName}
                appIcon={appIcon}
            />
        </>
    );
};
