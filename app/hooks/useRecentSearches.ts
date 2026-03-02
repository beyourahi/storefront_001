import {useEffect, useState} from "react";

const STORAGE_KEY = "hydrogen-store-recent-searches";
const MAX_RECENT_SEARCHES = 8;

export interface UseRecentSearchesReturn {
    recentSearches: string[];
    addSearch: (term: string) => void;
    removeSearch: (term: string) => void;
    clearSearches: () => void;
}

export function useRecentSearches(): UseRecentSearchesReturn {
    const [recentSearches, setRecentSearches] = useState<string[]>([]);

    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (!stored) return;

            const parsed = JSON.parse(stored) as unknown;
            if (Array.isArray(parsed) && parsed.every(item => typeof item === "string")) {
                setRecentSearches(parsed.slice(0, MAX_RECENT_SEARCHES));
            }
        } catch {
            // Ignore localStorage parse and availability errors.
        }
    }, []);

    const saveToStorage = (searches: string[]) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(searches));
        } catch {
            // Ignore localStorage write errors.
        }
    };

    const addSearch = (term: string) => {
        const trimmed = term.trim();
        if (!trimmed) return;

        setRecentSearches(prev => {
            const normalized = trimmed.toLowerCase();
            const filtered = prev.filter(item => item.toLowerCase() !== normalized);
            const updated = [trimmed, ...filtered].slice(0, MAX_RECENT_SEARCHES);
            saveToStorage(updated);
            return updated;
        });
    };

    const removeSearch = (term: string) => {
        setRecentSearches(prev => {
            const updated = prev.filter(item => item.toLowerCase() !== term.toLowerCase());
            saveToStorage(updated);
            return updated;
        });
    };

    const clearSearches = () => {
        setRecentSearches([]);
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch {
            // Ignore localStorage remove errors.
        }
    };

    return {
        recentSearches,
        addSearch,
        removeSearch,
        clearSearches
    };
}
