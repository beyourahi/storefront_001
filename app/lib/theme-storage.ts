/**
 * @fileoverview Theme Data Caching for Offline Accessibility
 *
 * @description
 * Client-side localStorage utilities for persisting generated theme data (colors + fonts) to
 * ensure brand-consistent styling on the offline page when network is unavailable. Caches
 * the complete theme configuration and updates the service worker cache for the offline route.
 *
 * @architecture
 * Theme Caching Strategy:
 * - Save theme to localStorage on app mount (when theme is loaded from Shopify)
 * - Offline page reads cached theme from localStorage
 * - Falls back to default theme if cache is unavailable
 * - Timestamp tracking for cache validation
 *
 * Storage Structure:
 * - Key: "hydrogen-theme-cache"
 * - Value: JSON {theme: GeneratedTheme, timestamp: number}
 * - Persistence: Never expires (always shows most recent theme)
 *
 * Service Worker Integration:
 * - updateOfflinePageCache() asks SW to refresh /offline route cache
 * - Ensures offline page has latest theme CSS from SSR
 * - Uses postMessage to communicate with service worker
 *
 * Offline Page Flow:
 * 1. User browses site → theme loaded from Shopify → saved to localStorage
 * 2. Network goes offline → user navigates → /offline route served by SW
 * 3. Offline page reads theme from localStorage → displays brand colors/fonts
 * 4. Fallback: If no cached theme, uses default theme constants
 *
 * @dependencies
 * - TypeScript types from types (GeneratedTheme)
 * - Browser localStorage API
 * - Service Worker postMessage API
 *
 * @related
 * - app/routes/offline.tsx - Reads cached theme for offline page styling
 * - app/root.tsx - Saves theme to localStorage on mount
 * - app/lib/theme-utils.ts - Generates theme from colors and fonts
 * - public/service-worker.js - Handles UPDATE_OFFLINE_CACHE message
 */

import type {GeneratedTheme} from "types";

const STORAGE_KEY = "hydrogen-theme-cache";

interface CachedTheme {
    theme: GeneratedTheme;
    timestamp: number;
}

/** Persist the generated theme to localStorage for offline page use. */
export function saveThemeToStorage(theme: GeneratedTheme): void {
    if (typeof window === "undefined") return;

    try {
        const cached: CachedTheme = {
            theme,
            timestamp: Date.now()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cached));
    } catch (error) {
        console.warn("[ThemeStorage] Failed to save theme:", error);
    }
}

/** Read the cached theme from localStorage. Returns null in SSR, on parse error, or when not yet saved. */
export function getThemeFromStorage(): GeneratedTheme | null {
    if (typeof window === "undefined") return null;

    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return null;

        const parsed = JSON.parse(stored) as unknown;

        if (
            parsed !== null &&
            typeof parsed === "object" &&
            "theme" in parsed &&
            parsed.theme !== null &&
            typeof parsed.theme === "object" &&
            "cssVariables" in parsed.theme &&
            "fonts" in parsed.theme
        ) {
            return (parsed as CachedTheme).theme;
        }

        return null;
    } catch (error) {
        console.warn("[ThemeStorage] Failed to load theme:", error);
        return null;
    }
}


/**
 * Ask the active service worker to refresh the `/offline` route cache.
 * Ensures the offline page SSR renders the latest theme CSS.
 * No-op when the SW is not registered or not yet active.
 */
export async function updateOfflinePageCache(): Promise<void> {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    try {
        const registration = await navigator.serviceWorker.ready;
        if (!registration.active) return;
        registration.active.postMessage({type: "UPDATE_OFFLINE_CACHE"});
    } catch (error) {
        if (process.env.NODE_ENV === "development") {
            console.warn("[ThemeStorage] Failed to request offline cache update:", error);
        }
    }
}
