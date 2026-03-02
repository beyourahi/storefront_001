import type {ScreenSize} from "~/hooks/useScreenSize";

export type GridColumns = 1 | 2 | 3 | 4;

export function getValidColumnsForScreenSize(screenSize: ScreenSize): GridColumns[] {
    switch (screenSize) {
        case "mobile":
            return [2];
        case "tablet":
            return [2];
        case "desktop":
        default:
            return [2, 3, 4];
    }
}

export function getDefaultColumnsForScreenSize(screenSize: ScreenSize): GridColumns {
    switch (screenSize) {
        case "mobile":
            return 2;
        case "tablet":
            return 2;
        case "desktop":
        default:
            return 3;
    }
}

export function constrainColumnsToScreenSize(columns: GridColumns, screenSize: ScreenSize): GridColumns {
    const validOptions = getValidColumnsForScreenSize(screenSize);

    if (validOptions.includes(columns)) {
        return columns;
    }

    const sorted = [...validOptions].sort((a, b) => Math.abs(a - columns) - Math.abs(b - columns));
    return sorted[0];
}

export function isColumnOptionVisible(option: GridColumns, screenSize: ScreenSize): boolean {
    return getValidColumnsForScreenSize(screenSize).includes(option);
}

export function getGridClassName(gridColumns: GridColumns, layoutMode: "grid" | "list"): string {
    if (layoutMode === "list") {
        return "flex flex-col gap-0 mb-8";
    }

    const responsiveGap = "gap-x-responsive gap-y-responsive-lg";

    switch (gridColumns) {
        case 1:
            return `grid ${responsiveGap} grid-cols-1 mb-8`;
        case 2:
            return `grid ${responsiveGap} grid-cols-2 mb-8`;
        case 3:
            return `grid ${responsiveGap} grid-cols-3 mb-8`;
        case 4:
        default:
            return `grid ${responsiveGap} grid-cols-4 mb-8`;
    }
}
