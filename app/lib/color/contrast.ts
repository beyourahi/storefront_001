/**
 * @fileoverview Dual-Algorithm Contrast Calculation (WCAG 2.1 + APCA)
 *
 * @description
 * Provides both WCAG 2.1 and APCA contrast calculations for comprehensive
 * accessibility compliance. WCAG 2.1 remains the legal standard; APCA
 * provides better perceptual accuracy for real-world usability.
 *
 * @architecture
 * Contrast Strategy:
 * 1. WCAG 2.1 for legal compliance (4.5:1 text, 3:1 UI)
 * 2. APCA for design guidance (considers font size/weight)
 * 3. Both reported for transparency
 *
 * Why both algorithms?
 * - Studies show WCAG 2.1 has 23% false fails and 47% false passes
 * - APCA is more perceptually accurate but not yet legally required
 * - Reporting both gives designers the best of both worlds
 *
 * APCA Lightness Contrast (Lc) Thresholds:
 * - Lc >= 90: Preferred for body text
 * - Lc >= 75: Minimum for body text
 * - Lc >= 60: Large text (24px+)
 * - Lc >= 45: Headlines, non-body text
 * - Lc >= 30: UI elements, icons
 * - Lc >= 15: Placeholder text, disabled states
 *
 * @dependencies
 * - colorjs.io (for contrast calculations)
 * - ./core.ts (for color parsing)
 *
 * @related
 * - types.ts - ContrastResult, APCAResult types
 * - core.ts - parseColor, toSrgb
 * - swatch.ts - Uses contrast for border selection
 *
 * @see https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html
 * @see https://git.apcacontrast.com/
 */

import {parseColor, toSrgb} from "./core";
import type {ContrastResult, ContrastAlgorithm, RGB, APCAResult} from "./types";

function getMinFontSizeForApca(Lc: number): number {
    if (Lc >= 90) return 12;
    if (Lc >= 75) return 14;
    if (Lc >= 60) return 16;
    if (Lc >= 45) return 24;
    if (Lc >= 30) return 36;
    return 48;
}

function getMinFontWeightForApca(Lc: number): number {
    if (Lc >= 90) return 300;
    if (Lc >= 75) return 400;
    if (Lc >= 60) return 500;
    if (Lc >= 45) return 600;
    return 700;
}

export function relativeLuminance(rgb: RGB): number {
    const linearize = (value: number): number => {
        const v = value / 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };

    const r = linearize(rgb.r);
    const g = linearize(rgb.g);
    const b = linearize(rgb.b);

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(color1: RGB, color2: RGB): number {
    const l1 = relativeLuminance(color1);
    const l2 = relativeLuminance(color2);

    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);

    return (lighter + 0.05) / (darker + 0.05);
}

export function calculateContrast(
    foreground: string,
    background: string,
    algorithm: ContrastAlgorithm = "both"
): ContrastResult | null {
    const fgColor = parseColor(foreground);
    const bgColor = parseColor(background);

    if (!fgColor || !bgColor) return null;

    const result: ContrastResult = {
        ratio: 0,
        ratioString: "0:1",
        passesAA: false,
        passesAALarge: false,
        passesAAA: false,
        passesAAALarge: false,
        wcagLevel: "Fail"
    };

    if (algorithm === "WCAG21" || algorithm === "both") {
        try {
            const wcagRatio = bgColor.contrast(fgColor, "WCAG21");

            result.ratio = wcagRatio;
            result.ratioString = `${wcagRatio.toFixed(2)}:1`;
            result.passesAA = wcagRatio >= 4.5;
            result.passesAALarge = wcagRatio >= 3;
            result.passesAAA = wcagRatio >= 7;
            result.passesAAALarge = wcagRatio >= 4.5;

            if (wcagRatio >= 7) {
                result.wcagLevel = "AAA";
            } else if (wcagRatio >= 4.5) {
                result.wcagLevel = "AA";
            } else if (wcagRatio >= 3) {
                result.wcagLevel = "AA Large";
            }
        } catch {
            const fgRgb = toSrgb(foreground);
            const bgRgb = toSrgb(background);

            if (fgRgb && bgRgb) {
                const ratio = contrastRatio(fgRgb, bgRgb);
                result.ratio = ratio;
                result.ratioString = `${ratio.toFixed(2)}:1`;
                result.passesAA = ratio >= 4.5;
                result.passesAALarge = ratio >= 3;
                result.passesAAA = ratio >= 7;
                result.passesAAALarge = ratio >= 4.5;

                if (ratio >= 7) {
                    result.wcagLevel = "AAA";
                } else if (ratio >= 4.5) {
                    result.wcagLevel = "AA";
                } else if (ratio >= 3) {
                    result.wcagLevel = "AA Large";
                }
            }
        }
    }

    if (algorithm === "APCA" || algorithm === "both") {
        try {
            const apcaRaw = bgColor.contrast(fgColor, "APCA");
            const Lc = Math.abs(apcaRaw);

            const apca: APCAResult = {
                Lc,
                minFontSize: getMinFontSizeForApca(Lc),
                minFontWeight: getMinFontWeightForApca(Lc),
                passesBody: Lc >= 60,
                passesLarge: Lc >= 45,
                passesUI: Lc >= 30
            };

            result.apca = apca;
        } catch {
            // APCA not available
        }
    }

    return result;
}


const WHITE_FOREGROUND = "oklch(1 0 0)";
const DARK_FOREGROUND = "oklch(0.25 0.02 45)";

export function getContrastForeground(
    backgroundColor: string,
    options: {
        lightForeground?: string;
        darkForeground?: string;
    } = {}
): string {
    const {lightForeground = WHITE_FOREGROUND, darkForeground = DARK_FOREGROUND} = options;

    const bgColor = parseColor(backgroundColor);
    if (!bgColor) return darkForeground;

    const lightColor = parseColor(lightForeground);
    const darkColor = parseColor(darkForeground);

    if (!lightColor || !darkColor) return darkForeground;

    try {
        const lightContrast = Math.abs(bgColor.contrast(lightColor, "APCA"));
        const darkContrast = Math.abs(bgColor.contrast(darkColor, "APCA"));

        const useLight = lightContrast >= darkContrast;
        const foreground = useLight ? lightForeground : darkForeground;

        return foreground;
    } catch {
        try {
            const lightRatio = bgColor.contrast(lightColor, "WCAG21");
            const darkRatio = bgColor.contrast(darkColor, "WCAG21");

            return lightRatio >= darkRatio ? lightForeground : darkForeground;
        } catch {
            const bgRgb = toSrgb(backgroundColor);
            if (bgRgb) {
                const luminance = relativeLuminance(bgRgb);
                return luminance > 0.5 ? darkForeground : lightForeground;
            }
            return darkForeground;
        }
    }
}
