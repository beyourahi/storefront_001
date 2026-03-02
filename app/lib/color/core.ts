import Color from "colorjs.io";

import type {RGB, OKLCH, GamutMapOptions} from "./types";

export function parseColor(colorString: string): Color | null {
    if (!colorString) return null;

    try {
        return new Color(colorString.trim());
    } catch {
        return null;
    }
}

export function isValidColor(colorString: string | null | undefined): boolean {
    if (!colorString) return false;
    return parseColor(colorString) !== null;
}

export function toOklch(colorString: string): OKLCH | null {
    const color = parseColor(colorString);
    if (!color) return null;

    try {
        const oklch = color.to("oklch");
        const l = oklch.coords[0] ?? 0;
        const c = oklch.coords[1] ?? 0;
        const h = oklch.coords[2];
        return {
            l,
            c,
            h: h == null || Number.isNaN(h) ? 0 : h
        };
    } catch {
        return null;
    }
}

export function toSrgb(colorString: string, options: GamutMapOptions = {}): RGB | null {
    const color = parseColor(colorString);
    if (!color) return null;

    const {method = "css"} = options;

    try {
        let srgbColor = color.to("srgb");

        if (!srgbColor.inGamut()) {
            srgbColor = srgbColor.toGamut({method});
        }

        const r = srgbColor.coords[0] ?? 0;
        const g = srgbColor.coords[1] ?? 0;
        const b = srgbColor.coords[2] ?? 0;

        return {
            r: Math.round(Math.max(0, Math.min(1, r)) * 255),
            g: Math.round(Math.max(0, Math.min(1, g)) * 255),
            b: Math.round(Math.max(0, Math.min(1, b)) * 255)
        };
    } catch {
        return null;
    }
}

export function toHex(colorString: string): string | null {
    const rgb = toSrgb(colorString);
    if (!rgb) return null;

    const toHexPart = (n: number) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, "0");

    return `#${toHexPart(rgb.r)}${toHexPart(rgb.g)}${toHexPart(rgb.b)}`;
}

export function toOklchString(colorString: string): string | null {
    const oklch = toOklch(colorString);
    if (!oklch) return null;

    return `oklch(${oklch.l.toFixed(4)} ${oklch.c.toFixed(4)} ${oklch.h.toFixed(4)})`;
}

export function isInSrgbGamut(colorString: string): boolean {
    const color = parseColor(colorString);
    if (!color) return false;

    try {
        const srgbColor = color.to("srgb");
        return srgbColor.inGamut();
    } catch {
        return false;
    }
}

export function adjustLightness(colorString: string, delta: number): string {
    const color = parseColor(colorString);
    if (!color) return colorString;

    try {
        const oklch = color.to("oklch");
        const currentL = oklch.coords[0] ?? 0;
        const newL = Math.max(0, Math.min(1, currentL + delta));
        oklch.coords[0] = newL;
        return oklch.toString({format: "oklch"});
    } catch {
        return colorString;
    }
}

export function adjustChroma(colorString: string, factor: number): string {
    const color = parseColor(colorString);
    if (!color) return colorString;

    try {
        const oklch = color.to("oklch");
        const currentC = oklch.coords[1] ?? 0;
        const newC = Math.max(0, Math.min(0.4, currentC * factor));
        oklch.coords[1] = newC;
        return oklch.toString({format: "oklch"});
    } catch {
        return colorString;
    }
}

export function rotateHue(colorString: string, degrees: number): string {
    const color = parseColor(colorString);
    if (!color) return colorString;

    try {
        const oklch = color.to("oklch");
        const currentH = oklch.coords[2] ?? 0;
        let newH = (currentH + degrees) % 360;
        if (newH < 0) newH += 360;
        oklch.coords[2] = newH;
        return oklch.toString({format: "oklch"});
    } catch {
        return colorString;
    }
}

export function toMuted(colorString: string): string {
    const color = parseColor(colorString);
    if (!color) return colorString;

    try {
        const oklch = color.to("oklch");
        const currentL = oklch.coords[0] ?? 0.5;
        const currentC = oklch.coords[1] ?? 0;
        oklch.coords[0] = Math.min(0.92, currentL * 0.95 + 0.1);
        oklch.coords[1] = currentC * 0.6;
        return oklch.toString({format: "oklch"});
    } catch {
        return colorString;
    }
}

export function parseOklch(colorString: string): OKLCH | null {
    const match = colorString.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*[\d.]+)?\s*\)/i);
    if (!match) return null;

    return {
        l: parseFloat(match[1]),
        c: parseFloat(match[2]),
        h: parseFloat(match[3])
    };
}

export function hexToRgb(hex: string): RGB | null {
    const cleanHex = hex.replace("#", "");

    let r: number, g: number, b: number;

    if (cleanHex.length === 3 || cleanHex.length === 4) {
        r = parseInt(cleanHex[0] + cleanHex[0], 16);
        g = parseInt(cleanHex[1] + cleanHex[1], 16);
        b = parseInt(cleanHex[2] + cleanHex[2], 16);
    } else if (cleanHex.length === 6 || cleanHex.length === 8) {
        r = parseInt(cleanHex.substring(0, 2), 16);
        g = parseInt(cleanHex.substring(2, 4), 16);
        b = parseInt(cleanHex.substring(4, 6), 16);
    } else {
        return null;
    }

    if (isNaN(r) || isNaN(g) || isNaN(b)) {
        return null;
    }

    return {r, g, b};
}

export function rgbToHex(rgb: RGB): string {
    const toHexPart = (n: number) => n.toString(16).padStart(2, "0");
    return `#${toHexPart(rgb.r)}${toHexPart(rgb.g)}${toHexPart(rgb.b)}`;
}

export function parseColorToRgb(colorString: string): RGB | null {
    return toSrgb(colorString);
}

export function hexToOklch(hex: string): string {
    const oklchStr = toOklchString(hex);
    return oklchStr ?? hex;
}

export function normalizeToOklch(color: string): string {
    if (!color) return color;

    const trimmed = color.trim();

    if (trimmed.startsWith("oklch")) {
        return trimmed;
    }

    const oklchStr = toOklchString(trimmed);
    return oklchStr ?? trimmed;
}
