type PwaEventType =
    | "pwa_install_prompt_shown"
    | "pwa_install_accepted"
    | "pwa_install_dismissed"
    | "pwa_update_available"
    | "pwa_update_applied"
    | "service_worker_registered"
    | "service_worker_error"
    | "cache_miss"
    | "offline_page_view";

interface PwaEventData extends Record<string, unknown> {
    event: PwaEventType;
    platform?: string;
    error?: string;
    url?: string;
    timestamp?: string;
}

interface ErrorBoundaryEventData extends Record<string, unknown> {
    event: "error_boundary_triggered";
    error_message: string;
    error_stack?: string;
    component?: string;
}

const pushToDataLayer = (data: Record<string, unknown>): void => {
    if (typeof window === "undefined") return;
    if (!window.dataLayer) return;

    try {
        window.dataLayer.push(data);
    } catch (error) {
        console.warn("[PWA Analytics] Failed to push to dataLayer:", error);
    }
};

export const trackPwaEvent = (eventType: PwaEventType, additionalData?: Record<string, unknown>): void => {
    const eventData: PwaEventData = {
        event: eventType,
        timestamp: new Date().toISOString(),
        ...additionalData
    };

    pushToDataLayer(eventData);
};

export const trackErrorBoundary = (error: Error, componentName?: string): void => {
    const eventData: ErrorBoundaryEventData = {
        event: "error_boundary_triggered",
        error_message: error.message,
        error_stack: error.stack,
        component: componentName
    };

    pushToDataLayer(eventData);
};

export const trackServiceWorkerError = (error: string): void => {
    trackPwaEvent("service_worker_error", {error});
};

export const trackOfflinePageView = (url: string): void => {
    trackPwaEvent("offline_page_view", {url});
};

export const trackCacheMiss = (url: string): void => {
    trackPwaEvent("cache_miss", {url});
};

export const usePwaAnalytics = () => {
    return {
        trackPwaEvent,
        trackErrorBoundary,
        trackServiceWorkerError,
        trackOfflinePageView,
        trackCacheMiss
    };
};
