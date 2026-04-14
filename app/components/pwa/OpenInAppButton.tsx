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

export const OpenInAppButton = ({variant = "menu-item"}: OpenInAppButtonProps) => {
    const {canInstall, isIOS, isStandalone, isAppDetectedAsInstalled, triggerInstall, appName, appIcon} = usePwaInstall();
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
                    className="flex fixed right-4 z-[var(--z-navbar)] animate-slide-up-fade max-lg:hidden"
                    style={{
                        // Float above the product sticky action bar, device safe-area notch,
                        // and the footer copyright row. Visible only on desktop (≥ lg) — on
                        // mobile/tablet the navbar variant is used instead to avoid duplication.
                        // --floating-btn-min-bottom is responsive (7rem mobile / 4.5rem md+).
                        bottom: "calc(var(--product-sticky-bar-height, 0px) + max(env(safe-area-inset-bottom), var(--floating-btn-min-bottom, 4.5rem)))",
                        animationDelay: "800ms",
                        animationFillMode: "both",
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
                        <Download
                            className="size-4 shrink-0"
                            aria-hidden="true"
                            strokeWidth={1.75}
                        />
                        <span className="text-[13px] font-semibold tracking-[0.01em] whitespace-nowrap">
                            Open App
                        </span>
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
                    <Download
                        className="size-3.5 shrink-0"
                        aria-hidden="true"
                        strokeWidth={1.75}
                    />
                    <span className="text-[12px] font-semibold tracking-[0.01em] whitespace-nowrap">
                        Open App
                    </span>
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
