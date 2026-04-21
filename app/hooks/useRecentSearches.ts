/**
 * @fileoverview Recent Searches Hook with LocalStorage Persistence
 *
 * @description
 * Manages a user's recent search history with automatic localStorage persistence.
 * Each entry stores the search term plus an optional thumbnail image URL captured
 * when the user clicks a product result — letting the UI show a visual cue alongside
 * the text term.
 *
 * @architecture
 * - State synchronized with localStorage on mount and updates
 * - Case-insensitive deduplication (newer searches bubble to top)
 * - Graceful degradation for SSR and private browsing modes
 * - Maximum 8 searches to prevent localStorage bloat
 * - Backward compatible with the legacy `string[]` format (auto-migrated on read)
 *
 * @storage
 * Key: "hydrogen-store-recent-searches"
 * Format (new): JSON array of `{term: string, image?: string}`
 * Format (legacy): JSON array of strings (auto-upgraded on first write)
 */

import {useCallback, useEffect, useMemo, useState} from "react";

const STORAGE_KEY = "hydrogen-store-recent-searches";
const MAX_RECENT_SEARCHES = 8;

export interface RecentSearchEntry {
    term: string;
    image?: string;
}

export interface UseRecentSearchesReturn {
    /** Full entries with optional thumbnail image */
    recentSearchEntries: RecentSearchEntry[];
    /** Legacy string-only view for callers that don't care about images */
    recentSearches: string[];
    /** Add a new search term. If `image` is provided, it is stored alongside. */
    addSearch: (term: string, image?: string) => void;
    /** Remove a specific search term from history (case-insensitive) */
    removeSearch: (term: string) => void;
    /** Clear all search history */
    clearSearches: () => void;
}

/**
 * Parse raw localStorage data into entries, tolerating both the legacy
 * `string[]` shape and the current `{term, image?}[]` shape.
 */
function parseStoredEntries(raw: unknown): RecentSearchEntry[] {
    if (!Array.isArray(raw)) return [];

    const entries: RecentSearchEntry[] = [];
    for (const item of raw) {
        if (typeof item === "string" && item.trim()) {
            entries.push({term: item});
        } else if (item && typeof item === "object" && typeof (item as RecentSearchEntry).term === "string") {
            const e = item as RecentSearchEntry;
            const term = e.term.trim();
            if (!term) continue;
            entries.push(typeof e.image === "string" && e.image ? {term, image: e.image} : {term});
        }
    }
    return entries.slice(0, MAX_RECENT_SEARCHES);
}

export function useRecentSearches(): UseRecentSearchesReturn {
    const [entries, setEntries] = useState<RecentSearchEntry[]>([]);

    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (!stored) return;
            const parsed = JSON.parse(stored) as unknown;
            setEntries(parseStoredEntries(parsed));
        } catch {
            // Ignore localStorage parse and availability errors.
        }
    }, []);

    const saveToStorage = useCallback((next: RecentSearchEntry[]) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
            // Ignore localStorage write errors.
        }
    }, []);

    const addSearch = useCallback(
        (term: string, image?: string) => {
            const trimmed = term.trim();
            if (!trimmed) return;

            setEntries(prev => {
                const normalized = trimmed.toLowerCase();
                const existing = prev.find(e => e.term.toLowerCase() === normalized);
                const filtered = prev.filter(e => e.term.toLowerCase() !== normalized);
                // Preserve an older image if this call didn't provide a new one.
                const nextImage = image ?? existing?.image;
                const next: RecentSearchEntry = nextImage ? {term: trimmed, image: nextImage} : {term: trimmed};
                const updated = [next, ...filtered].slice(0, MAX_RECENT_SEARCHES);
                saveToStorage(updated);
                return updated;
            });
        },
        [saveToStorage]
    );

    const removeSearch = useCallback(
        (term: string) => {
            setEntries(prev => {
                const updated = prev.filter(e => e.term.toLowerCase() !== term.toLowerCase());
                saveToStorage(updated);
                return updated;
            });
        },
        [saveToStorage]
    );

    const clearSearches = useCallback(() => {
        setEntries([]);
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch {
            // Ignore localStorage remove errors.
        }
    }, []);

    const recentSearches = useMemo(() => entries.map(e => e.term), [entries]);

    return useMemo(
        () => ({
            recentSearchEntries: entries,
            recentSearches,
            addSearch,
            removeSearch,
            clearSearches
        }),
        [entries, recentSearches, addSearch, removeSearch, clearSearches]
    );
}
