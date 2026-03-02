const STORAGE_KEYS = {
    APP_INSTALLED: "pwa-app-installed"
} as const;

const isBrowser = typeof window !== "undefined";

export function isAppMarkedAsInstalled(): boolean {
    if (!isBrowser) return false;

    try {
        return localStorage.getItem(STORAGE_KEYS.APP_INSTALLED) === "true";
    } catch {
        return false;
    }
}

export function setAppInstalled(): void {
    if (!isBrowser) return;

    try {
        localStorage.setItem(STORAGE_KEYS.APP_INSTALLED, "true");
    } catch {
        // Storage might be full or disabled
    }
}

export function clearAppInstalled(): void {
    if (!isBrowser) return;

    try {
        localStorage.removeItem(STORAGE_KEYS.APP_INSTALLED);
    } catch {
        // Silently fail
    }
}
