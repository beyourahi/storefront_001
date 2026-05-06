import {useMemo} from "react";

import {adjustColorForContrast, calculateContrast} from "~/lib/color";

const TARGET_MIN_RATIO = 3;
const MAX_CACHE_SIZE = 128;

const iconColorCache = new Map<string, string>();

function setCache(key: string, value: string): void {
    iconColorCache.set(key, value);

    if (iconColorCache.size <= MAX_CACHE_SIZE) return;

    const oldestKey = iconColorCache.keys().next().value;
    if (oldestKey !== undefined) {
        iconColorCache.delete(oldestKey);
    }
}

/**
 * Derives a navbar/icon color that targets WCAG 4.5:1 while never dropping below 3:1.
 * The hook is memoized and cached by the input color pair to avoid repeated work.
 */
export function useAccessibleIconColor(baseColor: string, backgroundColor: string, targetRatio: number = 4.5): string {
    return useMemo(() => {
        const key = `${baseColor}|${backgroundColor}|${targetRatio}`;
        const cached = iconColorCache.get(key);
        if (cached) return cached;

        const contrast = calculateContrast(baseColor, backgroundColor, "WCAG21");
        if (!contrast) {
            setCache(key, baseColor);
            return baseColor;
        }

        if (contrast.ratio >= targetRatio) {
            setCache(key, baseColor);
            return baseColor;
        }

        const adjusted = adjustColorForContrast(baseColor, backgroundColor, targetRatio, {
            minRatio: TARGET_MIN_RATIO
        });

        const adjustedContrast = calculateContrast(adjusted, backgroundColor, "WCAG21");

        // Defensive guard: never return a candidate below the 3:1 UI floor.
        const result = adjustedContrast && adjustedContrast.ratio >= TARGET_MIN_RATIO ? adjusted : baseColor;

        setCache(key, result);
        return result;
    }, [baseColor, backgroundColor, targetRatio]);
}
