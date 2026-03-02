import {useState, useEffect, useRef} from "react";
import {WifiOff, Wifi} from "lucide-react";
import {cn} from "~/lib/utils";
import {useNetworkStatus} from "~/hooks/useNetworkStatus";

interface NetworkStatusIndicatorProps {
    className?: string;
}

export const NetworkStatusIndicator = ({className}: NetworkStatusIndicatorProps) => {
    const {isOnline} = useNetworkStatus();
    const [showOnlineMessage, setShowOnlineMessage] = useState(false);
    const wasOfflineRef = useRef(false);

    useEffect(() => {
        if (!isOnline) {
            wasOfflineRef.current = true;
        } else if (wasOfflineRef.current) {
            setShowOnlineMessage(true);
            wasOfflineRef.current = false;

            const timer = setTimeout(() => {
                setShowOnlineMessage(false);
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [isOnline]);

    if (isOnline && !showOnlineMessage) {
        return null;
    }

    return (
        <div
            role="status"
            aria-live="polite"
            className={cn(
                "fixed top-0 inset-x-0 z-9999",
                "transition-all duration-300 ease-out",
                !isOnline ? "bg-destructive text-destructive-foreground" : "bg-success text-success-foreground",
                className
            )}
        >
            <div className="pt-[env(safe-area-inset-top)]">
                <div className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium">
                    {!isOnline ? (
                        <>
                            <WifiOff className="size-4 shrink-0" aria-hidden="true" />
                            <span>You&apos;re offline. Some features are unavailable.</span>
                        </>
                    ) : (
                        <>
                            <Wifi className="size-4 shrink-0" aria-hidden="true" />
                            <span>Back online</span>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
