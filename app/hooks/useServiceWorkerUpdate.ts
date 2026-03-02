import {useState, useEffect} from "react";

interface UseServiceWorkerUpdateReturn {
    updateAvailable: boolean;
    applyUpdate: () => void;
    dismissUpdate: () => void;
}

const trackEvent = (event: string, data?: Record<string, unknown>): void => {
    if (typeof window !== "undefined" && window.dataLayer) {
        window.dataLayer.push({event, ...data});
    }
};

export const useServiceWorkerUpdate = (): UseServiceWorkerUpdateReturn => {
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const handleUpdateAvailable = (e: CustomEvent<{registration: ServiceWorkerRegistration}>) => {
            setRegistration(e.detail.registration);
            setUpdateAvailable(true);
            trackEvent("pwa_update_available");
        };

        window.addEventListener("sw-update-available", handleUpdateAvailable);

        return () => {
            window.removeEventListener("sw-update-available", handleUpdateAvailable);
        };
    }, []);

    const applyUpdate = () => {
        if (!registration?.waiting) {
            console.warn("[SW Update] No waiting service worker to activate");
            return;
        }

        registration.waiting.postMessage({type: "SKIP_WAITING"});
        trackEvent("pwa_update_accepted");
    };

    const dismissUpdate = () => {
        setUpdateAvailable(false);
        trackEvent("pwa_update_dismissed");
    };

    return {
        updateAvailable,
        applyUpdate,
        dismissUpdate
    };
};
