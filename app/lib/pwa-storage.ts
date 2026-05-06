/**
 * Thin localStorage wrapper for PWA installation state.
 * Persists whether the app has been installed so subsequent visits can
 * skip the `beforeinstallprompt` flow and set `isAppDetectedAsInstalled`.
 */
const STORAGE_KEYS = {
    APP_INSTALLED: "pwa-app-installed"
} as const;

const isBrowser = typeof window !== "undefined";

/** Returns `true` if a previous session recorded a successful PWA installation. */
export function isAppMarkedAsInstalled(): boolean {
    if (!isBrowser) return false;

    try {
        return localStorage.getItem(STORAGE_KEYS.APP_INSTALLED) === "true";
    } catch {
        return false;
    }
}

/** Persists the installed flag. Called from `usePwaInstall` after the `appinstalled` event fires. */
export function setAppInstalled(): void {
    if (!isBrowser) return;

    try {
        localStorage.setItem(STORAGE_KEYS.APP_INSTALLED, "true");
    } catch {
        // Storage might be full or disabled
    }
}

