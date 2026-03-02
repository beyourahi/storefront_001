import {useState} from "react";
import {Button} from "~/components/ui/button";
import {cn} from "~/lib/utils";
import {usePwaInstall} from "~/hooks/usePwaInstall";
import {IosInstallInstructions} from "./IosInstallInstructions";
import {Download, Smartphone} from "lucide-react";

interface OpenInAppButtonProps {
    variant?: "desktop-fixed" | "menu-item";
}

export const OpenInAppButton = ({variant = "menu-item"}: OpenInAppButtonProps) => {
    const {canInstall, isIOS, isStandalone, triggerInstall, appName, appIcon} = usePwaInstall();
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
            <Button
                onClick={() => void handleClick()}
                variant={isFixed ? "default" : "outline"}
                className={cn(
                    "gap-3",
                    isFixed && ["fixed bottom-4 right-4 md:bottom-6 md:right-6", "z-[9999]", "hidden md:flex"],
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

            <IosInstallInstructions
                open={showIosInstructions}
                onDismiss={() => setShowIosInstructions(false)}
                appName={appName}
                appIcon={appIcon}
            />
        </>
    );
};
