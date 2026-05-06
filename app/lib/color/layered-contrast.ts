import {blendWithOpacity, calculateContrast, relativeLuminance, contrastRatio} from "./contrast";
import {toSrgb, rgbToHex, parseColor} from "./core";
import type {RGB, ContrastResult, ContrastAlgorithm} from "./types";

/**
 * Composes multiple semi-transparent layers using Porter-Duff alpha compositing.
 * Layers are applied bottom-to-top (base → overlays).
 *
 * This utility enables accurate WCAG 2.1 contrast calculations for multi-layer designs
 * like the Shop All card, which uses: base background + gradient + info box overlay.
 *
 * @param layers - Array of {color: string, opacity: number}, from bottom to top
 * @returns Composited RGB color, or null if parsing fails
 *
 * @example
 * // Shop All card effective background (3 layers)
 * const effectiveBg = composeLayeredBackground([
 *   { color: 'oklch(0.98 0.002 264)', opacity: 1 },    // base (100% opaque)
 *   { color: 'oklch(0.5 0.15 264)', opacity: 0.15 },   // gradient layer
 *   { color: 'oklch(0.95 0.004 264)', opacity: 0.60 }  // info box overlay
 * ]);
 */
export function composeLayeredBackground(layers: Array<{color: string; opacity: number}>): RGB | null {
    if (layers.length === 0) return null;

    // Start with first layer (base) - must be fully opaque or treated as such
    let composited = toSrgb(layers[0].color);
    if (!composited) return null;

    // Apply each subsequent layer using alpha compositing (Porter-Duff "over" operation)
    for (let i = 1; i < layers.length; i++) {
        const layer = layers[i];
        const layerRgb = toSrgb(layer.color);
        if (!layerRgb) continue;

        // Blend current layer on top of composited result
        composited = blendWithOpacity(layerRgb, composited, layer.opacity);
    }

    return composited;
}

/**
 * Calculates WCAG 2.1 contrast ratio for foreground against multi-layer background.
 *
 * Use this when text or icons sit on top of multiple semi-transparent overlays.
 * The function composes all background layers first, then calculates contrast.
 *
 * @param foreground - Foreground color string (text, icon, UI element)
 * @param layers - Background layers from bottom to top
 * @param algorithm - WCAG21, APCA, or both (default: WCAG21)
 * @returns ContrastResult with ratios and pass/fail status, or null if parsing fails
 *
 * @example
 * // Check if product count text meets WCAG AA (4.5:1 for normal text)
 * const result = calculateLayeredContrast(
 *   'oklch(0.45 0.015 264)', // muted-foreground text
 *   [
 *     { color: 'oklch(0.98 0.002 264)', opacity: 1 },
 *     { color: 'oklch(0.5 0.15 264)', opacity: 0.15 },
 *     { color: 'oklch(0.95 0.004 264)', opacity: 0.60 }
 *   ]
 * );
 * console.log(result.passesAA); // true if ratio >= 4.5:1
 */
export function calculateLayeredContrast(
    foreground: string,
    layers: Array<{color: string; opacity: number}>,
    algorithm: ContrastAlgorithm = "WCAG21"
): ContrastResult | null {
    const effectiveBg = composeLayeredBackground(layers);
    if (!effectiveBg) return null;

    const bgHex = rgbToHex(effectiveBg);
    return calculateContrast(foreground, bgHex, algorithm);
}

/**
 * Finds minimum opacity needed for an adjustable layer to achieve target contrast ratio.
 *
 * Useful for determining how much to increase overlay opacity (e.g., icon boxes, info overlays)
 * while preserving the visual design. Uses binary search for efficiency.
 *
 * @param foreground - Icon or text color to test
 * @param baseLayers - Fixed background layers (base + gradient)
 * @param adjustableLayer - Layer to adjust (e.g., icon box overlay)
 * @param targetRatio - Target WCAG contrast ratio (3 for UI, 4.5 for normal text, 7 for AAA)
 * @returns Minimum opacity (0-1) needed to achieve target, or null if unreachable
 *
 * @example
 * // Find minimum icon box opacity to achieve 3:1 contrast for icons
 * const minOpacity = findMinimumOpacity(
 *   'oklch(0.2032 0.1386 264.11)', // primary icon color
 *   [
 *     { color: 'oklch(0.98 0.002 264)', opacity: 1 },   // base
 *     { color: 'oklch(0.5 0.15 264)', opacity: 0.15 }   // gradient
 *   ],
 *   { color: 'oklch(0.2032 0.1386 264.11)' },           // icon box color
 *   3  // WCAG AA UI component requirement
 * );
 * console.log(`Need ${(minOpacity * 100).toFixed(0)}% opacity`);
 */
export function findMinimumOpacity(
    foreground: string,
    baseLayers: Array<{color: string; opacity: number}>,
    adjustableLayer: {color: string},
    targetRatio: number
): number | null {
    // Binary search bounds
    let minOpacity = 0;
    let maxOpacity = 1;
    const tolerance = 0.01; // Stop when within 1% of target
    const maxIterations = 20;

    // Quick check: Does 0% opacity already pass?
    const baseResult = calculateLayeredContrast(foreground, baseLayers);
    if (baseResult && baseResult.ratio >= targetRatio) {
        return 0;
    }

    // Quick check: Does 100% opacity reach target?
    const fullOpacityResult = calculateLayeredContrast(foreground, [
        ...baseLayers,
        {color: adjustableLayer.color, opacity: 1}
    ]);
    if (!fullOpacityResult || fullOpacityResult.ratio < targetRatio) {
        // Target unreachable even at 100% opacity
        return null;
    }

    // Binary search for minimum opacity
    for (let i = 0; i < maxIterations; i++) {
        const testOpacity = (minOpacity + maxOpacity) / 2;

        const layers = [...baseLayers, {color: adjustableLayer.color, opacity: testOpacity}];

        const result = calculateLayeredContrast(foreground, layers);
        if (!result) return null;

        // Found a ratio within tolerance of target
        if (Math.abs(result.ratio - targetRatio) < tolerance) {
            return testOpacity;
        }

        // Ratio too low, need more opacity
        if (result.ratio < targetRatio) {
            minOpacity = testOpacity;
        } else {
            // Ratio too high, can reduce opacity
            maxOpacity = testOpacity;
        }
    }

    // Return the final opacity (slightly over target to ensure compliance)
    return maxOpacity;
}

/**
 * Validates WCAG 2.1 compliance for all elements in a multi-layer card design.
 *
 * Returns a detailed report of contrast ratios and compliance status for each element type.
 * Use this for auditing and documentation purposes.
 *
 * @param elements - Array of {name, foreground, layers, requirement} objects to validate
 * @returns Compliance report with pass/fail status for each element
 *
 * @example
 * const report = validateLayeredCompliance([
 *   {
 *     name: 'Heading Text',
 *     foreground: 'oklch(0.18 0.02 264)',
 *     layers: baseLayers,
 *     requirement: { ratio: 3, type: 'large' }
 *   },
 *   {
 *     name: 'Product Count',
 *     foreground: 'oklch(0.45 0.015 264)',
 *     layers: baseLayers,
 *     requirement: { ratio: 4.5, type: 'normal' }
 *   }
 * ]);
 */
export function validateLayeredCompliance(
    elements: Array<{
        name: string;
        foreground: string;
        layers: Array<{color: string; opacity: number}>;
        requirement: {ratio: number; type: "normal" | "large" | "ui"};
    }>
): Array<{
    name: string;
    ratio: number;
    required: number;
    passes: boolean;
    type: "normal" | "large" | "ui";
}> {
    return elements.map(element => {
        const result = calculateLayeredContrast(element.foreground, element.layers);
        const ratio = result?.ratio ?? 0;
        const passes = ratio >= element.requirement.ratio;

        return {
            name: element.name,
            ratio,
            required: element.requirement.ratio,
            passes,
            type: element.requirement.type
        };
    });
}
