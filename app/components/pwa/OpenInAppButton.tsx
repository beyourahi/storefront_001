import {useState} from "react";
import {Button} from "~/components/ui/button";
import {cn} from "~/lib/utils";
import {usePwaInstall} from "~/hooks/usePwaInstall";
import {IosInstallInstructions} from "./IosInstallInstructions";
import {Download} from "lucide-react";

interface OpenInAppButtonProps {
    variant?: "desktop-fixed" | "menu-item";
}

export const OpenInAppButton = ({variant = "menu-item"}: OpenInAppButtonProps) => {
    const {canInstall, isIOS, triggerInstall, appName, appIcon} = usePwaInstall();
    const [showIosInstructions, setShowIosInstructions] = useState(false);

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

    const isFixed = variant === "desktop-fixed";
    const isMenuItem = variant === "menu-item";

    return (
        <>
            {isFixed ? (
                <div
                    role="complementary"
                    aria-label="Install this page as an app"
                    className="fixed right-4 z-[9999] animate-slide-up-fade"
                    style={{
                        // Float above the product sticky action bar and device safe-area notch.
                        // --product-sticky-bar-height is set by ProductMobileStickyButtons via
                        // ResizeObserver when on a product page; falls back to 0px elsewhere.
                        bottom: "calc(var(--product-sticky-bar-height, 0px) + max(env(safe-area-inset-bottom), 1rem))",
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
                            Open in App
                        </span>
                    </button>
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
