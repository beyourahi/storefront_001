/**
 * @fileoverview Smart Swatch Border Color Algorithm
 *
 * @description
 * Calculates optimal border colors for color swatches that must contrast
 * with both the swatch color AND the parent background. Uses expanded
 * candidate palette for better coverage across all color combinations.
 *
 * @architecture
 * Border Selection Strategy:
 * 1. Generate 13 candidate border colors (vs previous 4-7)
 * 2. Calculate WCAG contrast against swatch AND background
 * 3. Select candidate with highest minimum contrast
 * 4. Fallback to luminance-based heuristic if needed
 *
 * WCAG 1.4.11 Non-text Contrast:
 * UI components need 3:1 minimum contrast with adjacent colors.
 *
 * @dependencies
 * - ./core.ts - Color parsing and conversion
 * - ./contrast.ts - Luminance calculation
 *
 * @related
 * - types.ts - SwatchBorderOptions, SwatchVisibilityResult
 * - site-content-context.tsx - Uses these hooks for product swatches
 *
 * @see https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast.html
 */

import {toSrgb, hexToRgb} from "./core";
import {relativeLuminance, calculateContrast} from "./contrast";
import type {RGB, SwatchBorderOptions} from "./types";

// =============================================================================
// BORDER COLOR CANDIDATES
// =============================================================================

/**
 * Expanded border color candidates for comprehensive coverage
 *
 * Includes 13 shades from pure black to pure white for better
 * edge case handling across all swatch/background combinations.
 */
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

// Pre-compute RGB values and luminance for candidates
const CANDIDATES_WITH_DATA = BORDER_CANDIDATES.map(c => {
    const rgb = hexToRgb(c.hex)!;
    return {
        ...c,
        rgb,
        luminance: relativeLuminance(rgb)
    };
});

// Named constants for common borders
const SWATCH_BORDER_DARK = "#1f1f1f";
const SWATCH_BORDER_MEDIUM = "#737373";
const SWATCH_BORDER_LIGHT = "#e5e5e5";
const SWATCH_BORDER_WHITE = "#ffffff";

/** WCAG minimum contrast for UI components */
const MIN_UI_CONTRAST = 3.0;

// =============================================================================
// CONTRAST RATIO HELPER
// =============================================================================

/**
 * Calculate contrast ratio from two luminance values
 * Internal helper to avoid RGB conversion overhead
 */
function calculateContrastRatio(lum1: number, lum2: number): number {
    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);
    return (lighter + 0.05) / (darker + 0.05);
}

// =============================================================================
// SWATCH BORDER FUNCTIONS
// =============================================================================


/**
 * Smart swatch border considering selection state and context
 *
 * This is the "smart" version that considers:
 * 1. The swatch color itself
 * 2. Whether the parent button is selected (changes button background)
 * 3. The page background (normal vs primary/coral)
 * 4. Theme colors (primary, background, foreground)
 *
 * Context Rules:
 * - When unselected on normal page: swatch sits on transparent button → page background visible
 * - When selected on normal page: swatch sits on primary-colored button
 * - When unselected on primary page: swatch sits on transparent button → primary background visible
 * - When selected on primary page: swatch sits on foreground-colored button
 *
 * @param options - SwatchBorderOptions with full context
 * @returns HEX color string for the border
 */
export function getSmartSwatchBorderColor(options: SwatchBorderOptions): string {
    const {swatchColor, isSelected = false, onPrimaryBackground = false, themeColors, backgroundColor} = options;

    // If no swatch color, return a contextually appropriate neutral
    if (!swatchColor) {
        return onPrimaryBackground ? SWATCH_BORDER_WHITE : SWATCH_BORDER_MEDIUM;
    }

    // Determine the effective background behind the swatch
    let effectiveBackground: string;

    if (themeColors) {
        if (onPrimaryBackground) {
            // On primary background (like mobile hero coral section)
            effectiveBackground = isSelected ? themeColors.foreground : themeColors.primary;
        } else {
            // On normal background
            effectiveBackground = isSelected ? themeColors.primary : themeColors.background;
        }
    } else {
        effectiveBackground = backgroundColor;
    }

    // Parse colors to RGB
    const swatchRgb = toSrgb(swatchColor);
    const bgRgb = toSrgb(effectiveBackground);

    // If parsing fails, return a safe contextual default
    if (!swatchRgb || !bgRgb) {
        return onPrimaryBackground ? SWATCH_BORDER_WHITE : SWATCH_BORDER_MEDIUM;
    }

    // Calculate luminance values
    const swatchLuminance = relativeLuminance(swatchRgb);
    const bgLuminance = relativeLuminance(bgRgb);

    // Find the best border color
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

    // If best option meets 3:1, use it
    if (bestMinContrast >= MIN_UI_CONTRAST) {
        return bestCandidate.hex;
    }

    // Fallback: adaptive logic based on both swatch and background luminance
    const avgLuminance = (swatchLuminance + bgLuminance) / 2;

    if (swatchLuminance > 0.6) {
        // Light swatch - needs dark border
        return SWATCH_BORDER_DARK;
    } else if (swatchLuminance < 0.15) {
        // Very dark swatch - needs light border
        return bgLuminance > 0.5 ? SWATCH_BORDER_LIGHT : SWATCH_BORDER_WHITE;
    } else {
        // Medium swatch - choose based on average context luminance
        return avgLuminance > 0.5 ? SWATCH_BORDER_DARK : SWATCH_BORDER_LIGHT;
    }
}

