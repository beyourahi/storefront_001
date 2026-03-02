import {toSrgb, hexToRgb} from "./core";
import {relativeLuminance, calculateContrast} from "./contrast";
import type {SwatchBorderOptions, SwatchVisibilityResult} from "./types";

const BORDER_CANDIDATES = [
    {hex: "#000000", name: "pure-black"},
    {hex: "#1a1a1a", name: "near-black"},
    {hex: "#1f1f1f", name: "dark"},
    {hex: "#333333", name: "charcoal"},
    {hex: "#4a4a4a", name: "dark-gray"},
    {hex: "#666666", name: "medium-dark"},
    {hex: "#737373", name: "medium"},
    {hex: "#8c8c8c", name: "medium-light"},
    {hex: "#a3a3a3", name: "light-medium"},
    {hex: "#c0c0c0", name: "silver"},
    {hex: "#d4d4d4", name: "light-gray"},
    {hex: "#e5e5e5", name: "very-light"},
    {hex: "#ffffff", name: "pure-white"}
] as const;

const CANDIDATES_WITH_DATA = BORDER_CANDIDATES.map(c => {
    const rgb = hexToRgb(c.hex)!;
    return {
        ...c,
        rgb,
        luminance: relativeLuminance(rgb)
    };
});

const SWATCH_BORDER_DARK = "#1f1f1f";
const SWATCH_BORDER_MEDIUM = "#737373";
const SWATCH_BORDER_LIGHT = "#e5e5e5";
const SWATCH_BORDER_WHITE = "#ffffff";

const MIN_UI_CONTRAST = 3.0;

const calculateContrastRatio = (lum1: number, lum2: number): number => {
    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);
    return (lighter + 0.05) / (darker + 0.05);
};

export const getSwatchBorderColor = (swatchColor: string | null | undefined, backgroundColor: string): string => {
    if (!swatchColor) {
        return SWATCH_BORDER_MEDIUM;
    }

    const swatchRgb = toSrgb(swatchColor);
    const bgRgb = toSrgb(backgroundColor);

    if (!swatchRgb || !bgRgb) {
        return SWATCH_BORDER_MEDIUM;
    }

    const swatchLuminance = relativeLuminance(swatchRgb);
    const bgLuminance = relativeLuminance(bgRgb);

    let bestCandidate = CANDIDATES_WITH_DATA[6];
    let bestMinContrast = 0;

    for (const candidate of CANDIDATES_WITH_DATA) {
        const contrastWithSwatch = calculateContrastRatio(candidate.luminance, swatchLuminance);
        const contrastWithBg = calculateContrastRatio(candidate.luminance, bgLuminance);
        const minContrast = Math.min(contrastWithSwatch, contrastWithBg);

        if (minContrast > bestMinContrast) {
            bestMinContrast = minContrast;
            bestCandidate = candidate;
        }
    }

    if (bestMinContrast >= MIN_UI_CONTRAST) {
        return bestCandidate.hex;
    }

    if (swatchLuminance > 0.5) {
        return SWATCH_BORDER_DARK;
    } else if (swatchLuminance < 0.2) {
        return SWATCH_BORDER_WHITE;
    } else {
        const darkContrast = calculateContrastRatio(CANDIDATES_WITH_DATA[2].luminance, swatchLuminance);
        const lightContrast = calculateContrastRatio(CANDIDATES_WITH_DATA[11].luminance, swatchLuminance);
        return darkContrast > lightContrast ? SWATCH_BORDER_DARK : SWATCH_BORDER_LIGHT;
    }
};

export const getSmartSwatchBorderColor = (options: SwatchBorderOptions): string => {
    const {swatchColor, isSelected = false, onPrimaryBackground = false, themeColors, backgroundColor} = options;

    if (!swatchColor) {
        return onPrimaryBackground ? SWATCH_BORDER_WHITE : SWATCH_BORDER_MEDIUM;
    }

    let effectiveBackground: string;

    if (themeColors) {
        if (onPrimaryBackground) {
            effectiveBackground = isSelected ? themeColors.foreground : themeColors.primary;
        } else {
            effectiveBackground = isSelected ? themeColors.primary : themeColors.background;
        }
    } else {
        effectiveBackground = backgroundColor;
    }

    const swatchRgb = toSrgb(swatchColor);
    const bgRgb = toSrgb(effectiveBackground);

    if (!swatchRgb || !bgRgb) {
        return onPrimaryBackground ? SWATCH_BORDER_WHITE : SWATCH_BORDER_MEDIUM;
    }

    const swatchLuminance = relativeLuminance(swatchRgb);
    const bgLuminance = relativeLuminance(bgRgb);

    let bestCandidate = CANDIDATES_WITH_DATA[6];
    let bestMinContrast = 0;

    for (const candidate of CANDIDATES_WITH_DATA) {
        const contrastWithSwatch = calculateContrastRatio(candidate.luminance, swatchLuminance);
        const contrastWithBg = calculateContrastRatio(candidate.luminance, bgLuminance);
        const minContrast = Math.min(contrastWithSwatch, contrastWithBg);

        if (minContrast > bestMinContrast) {
            bestMinContrast = minContrast;
            bestCandidate = candidate;
        }
    }

    if (bestMinContrast >= MIN_UI_CONTRAST) {
        return bestCandidate.hex;
    }

    const avgLuminance = (swatchLuminance + bgLuminance) / 2;

    if (swatchLuminance > 0.6) {
        return SWATCH_BORDER_DARK;
    } else if (swatchLuminance < 0.15) {
        return bgLuminance > 0.5 ? SWATCH_BORDER_LIGHT : SWATCH_BORDER_WHITE;
    } else {
        return avgLuminance > 0.5 ? SWATCH_BORDER_DARK : SWATCH_BORDER_LIGHT;
    }
};

export const isLightSwatchColor = (swatchColor: string | null | undefined): boolean => {
    if (!swatchColor) return false;

    const rgb = toSrgb(swatchColor);
    if (!rgb) return false;

    const luminance = relativeLuminance(rgb);
    return luminance > 0.5;
};

export const validateSwatchVisibility = (
    swatchColor: string | null | undefined,
    backgroundColor: string,
    minContrast: number = 1.5
): SwatchVisibilityResult => {
    if (!swatchColor) {
        return {
            isValid: false,
            contrastRatio: 0,
            recommendation: "No swatch color provided"
        };
    }

    const result = calculateContrast(swatchColor, backgroundColor, "WCAG21");

    if (!result) {
        return {
            isValid: false,
            contrastRatio: 0,
            recommendation: "Could not calculate contrast - invalid color format"
        };
    }

    if (result.ratio < minContrast) {
        return {
            isValid: false,
            contrastRatio: result.ratio,
            recommendation: `Swatch may be hard to see. Consider adding a border or shadow. Current contrast: ${result.ratioString}`
        };
    }

    return {
        isValid: true,
        contrastRatio: result.ratio,
        recommendation: null
    };
};
