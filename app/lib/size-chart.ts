export type GarmentCategory = "tops" | "bottoms" | "dresses" | "outerwear" | "shoes" | "accessories";

export type MeasurementUnit = "in" | "cm";

export type MeasurementType = "body" | "garment";

export type SizeRegion = "US" | "UK" | "EU" | "Asia";

export interface MeasurementValue {
    value?: number;
    min?: number;
    max?: number;
}

export interface SizeConversion {
    size: string;
    US?: string;
    UK?: string;
    EU?: string;
    Asia?: string;
}

export interface SizeChartRow {
    size: string;
    measurements: Record<string, MeasurementValue>;
}

export interface MeasurementTable {
    type: MeasurementType;
    title: string;
    columns: string[];
    rows: SizeChartRow[];
}

export interface SizeChartData {
    version: "1.0";
    category: GarmentCategory;
    unit: MeasurementUnit;
    tables: MeasurementTable[];
    conversions?: SizeConversion[];
    fitNotes?: string;
    howToMeasure?: string;
    modelInfo?: string;
}

export interface ParsedSizeChart {
    isValid: boolean;
    data: SizeChartData | null;
    error?: string;
}

export function parseSizeChart(jsonValue: string | null | undefined): ParsedSizeChart {
    if (!jsonValue) {
        return {isValid: false, data: null};
    }

    try {
        const parsed = JSON.parse(jsonValue) as unknown;

        if (!isValidSizeChartStructure(parsed)) {
            return {
                isValid: false,
                data: null,
                error: "Invalid size chart structure"
            };
        }

        if (!validateSizeChartData(parsed)) {
            return {
                isValid: false,
                data: null,
                error: "Size chart validation failed"
            };
        }

        return {
            isValid: true,
            data: parsed
        };
    } catch (e) {
        return {
            isValid: false,
            data: null,
            error: e instanceof Error ? e.message : "Failed to parse size chart JSON"
        };
    }
}

function isValidSizeChartStructure(data: unknown): data is SizeChartData {
    if (typeof data !== "object" || data === null) return false;

    const obj = data as Record<string, unknown>;

    if (typeof obj.version !== "string") return false;
    if (typeof obj.category !== "string") return false;
    if (typeof obj.unit !== "string") return false;
    if (!Array.isArray(obj.tables)) return false;

    const validCategories: GarmentCategory[] = ["tops", "bottoms", "dresses", "outerwear", "shoes", "accessories"];
    if (!validCategories.includes(obj.category as GarmentCategory)) return false;

    const validUnits: MeasurementUnit[] = ["in", "cm"];
    if (!validUnits.includes(obj.unit as MeasurementUnit)) return false;

    if (obj.tables.length === 0) return false;

    return true;
}

function validateSizeChartData(data: SizeChartData): boolean {
    for (const table of data.tables) {
        if (table.type !== "body" && table.type !== "garment") return false;

        if (!table.title || typeof table.title !== "string") return false;

        if (!Array.isArray(table.columns) || table.columns.length === 0) return false;

        if (!Array.isArray(table.rows) || table.rows.length === 0) return false;

        for (const row of table.rows) {
            if (!row.size || typeof row.size !== "string") return false;
            if (!row.measurements || typeof row.measurements !== "object") return false;
        }
    }

    if (data.conversions) {
        if (!Array.isArray(data.conversions)) return false;
        for (const conv of data.conversions) {
            if (!conv.size || typeof conv.size !== "string") return false;
        }
    }

    return true;
}

export function convertUnit(value: number, fromUnit: MeasurementUnit, toUnit: MeasurementUnit): number {
    if (fromUnit === toUnit) return value;

    if (fromUnit === "in" && toUnit === "cm") {
        return Math.round(value * 2.54 * 10) / 10;
    }

    if (fromUnit === "cm" && toUnit === "in") {
        return Math.round((value / 2.54) * 10) / 10;
    }

    return value;
}

export function formatMeasurement(
    measurement: MeasurementValue | undefined,
    unit: MeasurementUnit,
    showUnit: boolean = false
): string {
    if (!measurement) return "-";

    const unitSuffix = showUnit ? ` ${unit}` : "";

    if (measurement.value !== undefined) {
        return `${measurement.value}${unitSuffix}`;
    }

    if (measurement.min !== undefined && measurement.max !== undefined) {
        return `${measurement.min}-${measurement.max}${unitSuffix}`;
    }

    if (measurement.min !== undefined) {
        return `${measurement.min}+${unitSuffix}`;
    }

    if (measurement.max !== undefined) {
        return `< ${measurement.max}${unitSuffix}`;
    }

    return "-";
}

export function formatColumnName(columnKey: string): string {
    return columnKey
        .split("_")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ");
}

export function getUnitLabel(unit: MeasurementUnit): string {
    return unit === "in" ? "inches" : "centimeters";
}

export function hasSizeChart(sizeChartValue: string | null | undefined): boolean {
    if (!sizeChartValue) return false;
    const {isValid} = parseSizeChart(sizeChartValue);
    return isValid;
}
