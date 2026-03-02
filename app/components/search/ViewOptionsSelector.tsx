import {Grid2X2, LayoutGrid, List} from "lucide-react";
import {Button} from "~/components/ui/button";
import {cn} from "~/lib/utils";
import type {GridColumns} from "~/lib/gridColumns";

type LayoutMode = "grid" | "list";

type ViewOptionsSelectorProps = {
    gridColumns: GridColumns;
    onGridColumnsChange: (columns: GridColumns) => void;
    layoutMode: LayoutMode;
    onLayoutModeChange: (mode: LayoutMode) => void;
    showSortOptions?: boolean;
};

const columnChoices: GridColumns[] = [2, 3, 4];

export function ViewOptionsSelector({
    gridColumns,
    onGridColumnsChange,
    layoutMode,
    onLayoutModeChange
}: ViewOptionsSelectorProps) {
    return (
        <div className="flex items-center gap-2">
            <div className="flex items-center rounded-full border border-primary/30 p-1">
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Grid view"
                    onClick={() => onLayoutModeChange("grid")}
                    className={cn(
                        "h-8 w-8 rounded-full",
                        layoutMode === "grid" ? "bg-primary text-primary-foreground" : "text-primary"
                    )}
                >
                    <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="List view"
                    onClick={() => onLayoutModeChange("list")}
                    className={cn(
                        "h-8 w-8 rounded-full",
                        layoutMode === "list" ? "bg-primary text-primary-foreground" : "text-primary"
                    )}
                >
                    <List className="h-4 w-4" />
                </Button>
            </div>

            {layoutMode === "grid" && (
                <div className="flex items-center rounded-full border border-primary/30 p-1">
                    {columnChoices.map(choice => (
                        <Button
                            key={choice}
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => onGridColumnsChange(choice)}
                            className={cn(
                                "h-8 min-w-8 rounded-full px-2",
                                gridColumns === choice ? "bg-primary text-primary-foreground" : "text-primary"
                            )}
                        >
                            {choice === 2 ? <Grid2X2 className="h-4 w-4" /> : choice}
                        </Button>
                    ))}
                </div>
            )}
        </div>
    );
}

export type {LayoutMode};
