import {useState, Fragment} from "react";
import {Ruler, Info} from "lucide-react";
import {cn} from "~/lib/utils";
import {useLockBodyScroll} from "~/lib/LenisProvider";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody} from "~/components/ui/dialog";
import {Tabs, TabsList, TabsTrigger, TabsContent} from "~/components/ui/tabs";
import type {SizeChartData, MeasurementTable, MeasurementUnit, SizeConversion} from "~/lib/size-chart";
import {formatMeasurement, formatColumnName, convertUnit} from "~/lib/size-chart";

interface SizeChartDialogProps {
    sizeChart: SizeChartData;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SizeChartDialog({sizeChart, open, onOpenChange}: SizeChartDialogProps) {
    const [displayUnit, setDisplayUnit] = useState<MeasurementUnit>(sizeChart.unit);

    useLockBodyScroll(open);

    const defaultTab = sizeChart.tables[0]?.type || "body";

    const hasConversions = sizeChart.conversions && sizeChart.conversions.length > 0;

    const hasHowToMeasure = Boolean(sizeChart.howToMeasure);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className={cn(
                    "max-w-[calc(100%-2rem)]! sm:max-w-2xl! max-h-[85dvh]! rounded-3xl!",
                    "flex flex-col p-0! overflow-hidden"
                )}
            >
                <DialogHeader className="shrink-0 px-4 pt-4 pb-3 sm:px-6 sm:pt-6 sm:pb-4 border-b border-border">
                    <div className="flex items-start justify-between gap-4 pr-10 sm:pr-12">
                        <div className="space-y-1">
                            <DialogTitle className="flex items-center gap-2 text-xl sm:text-2xl font-medium">
                                <Ruler className="size-5 sm:size-6 shrink-0" />
                                <span>Size Guide</span>
                            </DialogTitle>
                            <DialogDescription className="text-sm text-left text-muted-foreground">
                                Find your perfect fit with our measurements
                            </DialogDescription>
                        </div>
                        <UnitToggle currentUnit={displayUnit} onUnitChange={setDisplayUnit} />
                    </div>
                </DialogHeader>

                <DialogBody className="flex-1 overflow-y-auto" data-lenis-prevent>
                    <div className="px-4 py-4 sm:px-6 sm:py-5">
                        <Tabs defaultValue={defaultTab} className="w-full">
                            <TabsList className="w-full justify-start mb-5 overflow-x-auto scrollbar-hide">
                                {sizeChart.tables.map(table => (
                                    <TabsTrigger key={table.type} value={table.type} className="shrink-0">
                                        {table.title}
                                    </TabsTrigger>
                                ))}
                                {hasConversions && (
                                    <TabsTrigger value="conversions" className="shrink-0">
                                        Conversions
                                    </TabsTrigger>
                                )}
                                {hasHowToMeasure && (
                                    <TabsTrigger value="how-to-measure" className="shrink-0">
                                        How to Measure
                                    </TabsTrigger>
                                )}
                            </TabsList>

                            {sizeChart.tables.map(table => (
                                <TabsContent key={table.type} value={table.type}>
                                    <MeasurementTableDisplay
                                        table={table}
                                        originalUnit={sizeChart.unit}
                                        displayUnit={displayUnit}
                                    />
                                </TabsContent>
                            ))}

                            {hasConversions && (
                                <TabsContent value="conversions">
                                    <ConversionsTableDisplay conversions={sizeChart.conversions!} />
                                </TabsContent>
                            )}

                            {hasHowToMeasure && (
                                <TabsContent value="how-to-measure">
                                    <HowToMeasureDisplay content={sizeChart.howToMeasure!} />
                                </TabsContent>
                            )}
                        </Tabs>

                        {sizeChart.fitNotes && (
                            <div className="mt-6">
                                <div className="flex gap-3 rounded-2xl bg-muted p-4 text-sm">
                                    <Info className="size-4 shrink-0 mt-0.5 text-muted-foreground" />
                                    <p className="text-foreground leading-relaxed">{sizeChart.fitNotes}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </DialogBody>
            </DialogContent>
        </Dialog>
    );
}

function UnitToggle({
    currentUnit,
    onUnitChange
}: {
    currentUnit: MeasurementUnit;
    onUnitChange: (unit: MeasurementUnit) => void;
}) {
    const units: Array<{value: MeasurementUnit; label: string}> = [
        {value: "in", label: "in"},
        {value: "cm", label: "cm"}
    ];

    return (
        <div className="inline-flex gap-1.5 shrink-0">
            {units.map(unit => (
                <button
                    key={unit.value}
                    type="button"
                    onClick={() => onUnitChange(unit.value)}
                    aria-pressed={currentUnit === unit.value}
                    className={cn(
                        "inline-flex min-h-9 min-w-12 items-center justify-center rounded-full border-2 px-3 py-1.5 text-sm font-medium transition-all duration-200",
                        "active:scale-95",
                        currentUnit === unit.value
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-primary bg-transparent text-primary hover:bg-primary hover:text-primary-foreground"
                    )}
                >
                    {unit.label}
                </button>
            ))}
        </div>
    );
}

function MeasurementTableDisplay({
    table,
    originalUnit,
    displayUnit
}: {
    table: MeasurementTable;
    originalUnit: MeasurementUnit;
    displayUnit: MeasurementUnit;
}) {
    const needsConversion = originalUnit !== displayUnit;

    return (
        <div className="rounded-2xl border border-border overflow-hidden">
            <div className="overflow-x-auto scrollbar-hide">
                <table className="w-full min-w-max border-collapse text-sm">
                    <thead>
                        <tr className="bg-muted">
                            <th className="sticky left-0 bg-muted text-left font-semibold text-foreground px-4 py-3 border-r border-border/50 min-w-16">
                                Size
                            </th>
                            {table.columns.map(column => (
                                <th
                                    key={column}
                                    className="text-center font-semibold text-foreground px-4 py-3 whitespace-nowrap"
                                >
                                    <span>{formatColumnName(column)}</span>
                                    <span className="text-muted-foreground font-normal ml-1">({displayUnit})</span>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {table.rows.map((row, index) => (
                            <tr key={row.size} className={cn(index % 2 === 1 && "bg-muted/30")}>
                                <td className="sticky left-0 bg-inherit font-semibold text-foreground px-4 py-3 border-r border-border/50">
                                    {row.size}
                                </td>
                                {table.columns.map(column => {
                                    const measurement = row.measurements[column];
                                    let displayValue: string;

                                    if (!measurement) {
                                        displayValue = "—";
                                    } else if (needsConversion) {
                                        const converted = convertMeasurementValue(
                                            measurement,
                                            originalUnit,
                                            displayUnit
                                        );
                                        displayValue = formatMeasurement(converted, displayUnit);
                                    } else {
                                        displayValue = formatMeasurement(measurement, displayUnit);
                                    }

                                    return (
                                        <td
                                            key={column}
                                            className="text-center text-foreground px-4 py-3 tabular-nums font-mono"
                                        >
                                            {displayValue}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function ConversionsTableDisplay({conversions}: {conversions: SizeConversion[]}) {
    type RegionKey = Exclude<keyof SizeConversion, "size">;

    const allRegions: Array<{key: RegionKey; label: string}> = [
        {key: "US", label: "US"},
        {key: "UK", label: "UK"},
        {key: "EU", label: "EU"},
        {key: "Asia", label: "Asia"}
    ];

    const regions = allRegions.filter(region => conversions.some(conv => conv[region.key]));

    return (
        <div className="rounded-2xl border border-border overflow-hidden">
            <div className="overflow-x-auto scrollbar-hide">
                <table className="w-full min-w-max border-collapse text-sm">
                    <thead>
                        <tr className="bg-muted">
                            <th className="sticky left-0 bg-muted text-left font-semibold text-foreground px-4 py-3 border-r border-border/50 min-w-16">
                                Size
                            </th>
                            {regions.map(region => (
                                <th
                                    key={region.key}
                                    className="text-center font-semibold text-foreground px-4 py-3 min-w-16"
                                >
                                    {region.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {conversions.map((conv, index) => (
                            <tr key={conv.size} className={cn(index % 2 === 1 && "bg-muted/30")}>
                                <td className="sticky left-0 bg-inherit font-semibold text-foreground px-4 py-3 border-r border-border/50">
                                    {conv.size}
                                </td>
                                {regions.map(region => (
                                    <td key={region.key} className="text-center text-foreground px-4 py-3">
                                        {conv[region.key] || "—"}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function HowToMeasureDisplay({content}: {content: string}) {
    const paragraphs = content.split("\n\n");

    return (
        <div className="space-y-4">
            {paragraphs.map((paragraph, paragraphIndex) => (
                // eslint-disable-next-line react/no-array-index-key
                <p key={paragraphIndex} className="text-foreground leading-relaxed">
                    {parseMarkdownText(paragraph)}
                </p>
            ))}
        </div>
    );
}

function parseMarkdownText(text: string): React.ReactNode[] {
    const result: React.ReactNode[] = [];
    let remaining = text;
    let keyIndex = 0;

    while (remaining.length > 0) {
        const boldMatch = remaining.match(/^\*\*(.+?)\*\*/);
        if (boldMatch) {
            void result.push(<strong key={++keyIndex}>{boldMatch[1]}</strong>);
            remaining = remaining.slice(boldMatch[0].length);
            continue;
        }

        const italicMatch = remaining.match(/^\*(.+?)\*/);
        if (italicMatch) {
            void result.push(<em key={++keyIndex}>{italicMatch[1]}</em>);
            remaining = remaining.slice(italicMatch[0].length);
            continue;
        }

        if (remaining.startsWith("\n")) {
            void result.push(<br key={++keyIndex} />);
            remaining = remaining.slice(1);
            continue;
        }

        const nextSpecial = remaining.search(/\*|\n/);
        if (nextSpecial === -1) {
            void result.push(<Fragment key={++keyIndex}>{remaining}</Fragment>);
            break;
        } else if (nextSpecial === 0) {
            void result.push(<Fragment key={++keyIndex}>{remaining[0]}</Fragment>);
            remaining = remaining.slice(1);
        } else {
            void result.push(<Fragment key={++keyIndex}>{remaining.slice(0, nextSpecial)}</Fragment>);
            remaining = remaining.slice(nextSpecial);
        }
    }

    return result;
}

function convertMeasurementValue(
    measurement: {value?: number; min?: number; max?: number},
    fromUnit: MeasurementUnit,
    toUnit: MeasurementUnit
): {value?: number; min?: number; max?: number} {
    if (fromUnit === toUnit) return measurement;

    const result: {value?: number; min?: number; max?: number} = {};

    if (measurement.value !== undefined) {
        result.value = convertUnit(measurement.value, fromUnit, toUnit);
    }
    if (measurement.min !== undefined) {
        result.min = convertUnit(measurement.min, fromUnit, toUnit);
    }
    if (measurement.max !== undefined) {
        result.max = convertUnit(measurement.max, fromUnit, toUnit);
    }

    return result;
}
