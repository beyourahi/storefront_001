import {useEffect} from "react";
import {trackServiceWorkerError, trackCacheMiss} from "~/hooks/usePwaAnalytics";

declare global {
    interface WindowEventMap {
        "sw-update-available": CustomEvent<{registration: ServiceWorkerRegistration}>;
    }
}

export const ServiceWorkerRegistration = () => {
    useEffect(() => {
        if (typeof window === "undefined") return;

        if (!("serviceWorker" in navigator)) {
            return;
        }

        let refreshing = false;

        navigator.serviceWorker.addEventListener("controllerchange", () => {
            if (refreshing) return;
            refreshing = true;
            window.location.reload();
        });

        const dispatchUpdateAvailable = (registration: ServiceWorkerRegistration) => {
            window.dispatchEvent(
                new CustomEvent("sw-update-available", {
                    detail: {registration}
                })
            );
        };

        const registerSW = () => {
            navigator.serviceWorker
                .register("/sw.js")
                .then(registration => {
                    if (registration.waiting && navigator.serviceWorker.controller) {
                        dispatchUpdateAvailable(registration);
                    }

                    registration.addEventListener("updatefound", () => {
                        const newWorker = registration.installing;

                        if (!newWorker) return;

                        newWorker.addEventListener("statechange", () => {
                            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                                dispatchUpdateAvailable(registration);
                            }
                        });
                    });
                })
                .catch(error => {
                    console.error("[SW] Service Worker registration failed:", error);
                    trackServiceWorkerError(error instanceof Error ? error.message : "Unknown registration error");
                });
        };

        const handleSwMessage = (event: MessageEvent) => {
            if (event.data?.type === "CACHE_MISS") {
                trackCacheMiss(event.data.url);
            }
        };
        navigator.serviceWorker.addEventListener("message", handleSwMessage);

        if (document.readyState === "complete") {
            registerSW();
        } else {
            window.addEventListener("load", registerSW);
            return () => {
                window.removeEventListener("load", registerSW);
                navigator.serviceWorker.removeEventListener("message", handleSwMessage);
            };
        }

        return () => {
            navigator.serviceWorker.removeEventListener("message", handleSwMessage);
        };
    }, []);

    return null;
};
