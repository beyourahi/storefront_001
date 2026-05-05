import {useMemo} from "react";
import {Link, useNavigate} from "react-router";
import {AlertTriangle} from "lucide-react";
import {Button} from "~/components/ui/button";
import type {MappedProductOptions} from "@shopify/hydrogen";
import {ColorSwatch} from "~/components/ui/color-swatch";

type OptionSelectorProps = {
    productOptions: MappedProductOptions[];
};

/**
 * Variant option picker for the PDP. Two filtering passes apply before render:
 * 1. Removes option values that are unavailable across all variants.
 * 2. Hides entire option axes where only one value is available (no meaningful choice).
 *
 * Two rendering paths per value:
 * - `isDifferentProduct === true`: renders a `<Link>` to a separate product URL
 *   (used for combined-listing products that share option names across different SKUs).
 * - Otherwise: navigates within the same product by updating `variantUriQuery` search params.
 *
 * Color options with swatch data (Shopify color metafield or image) render a `<ColorSwatch>`.
 */
export const OptionSelector = ({productOptions}: OptionSelectorProps) => {
    const navigate = useNavigate();

    const filteredOptions = useMemo(
        () =>
            productOptions
                .map(option => ({
                    ...option,
                    optionValues: option.optionValues.filter(value => value.available)
                }))
                .filter(option => option.optionValues.length > 0),
        [productOptions]
    );

    const visibleOptions = useMemo(
        () => filteredOptions.filter(option => option.optionValues.length > 1),
        [filteredOptions]
    );

    if (visibleOptions.length === 0) return null;

    // Check if any selected option is unavailable
    const hasUnavailableSelection = productOptions.some(option =>
        option.optionValues.some(value => value.selected && !value.available)
    );

    return (
        <div className="space-y-6">
            {visibleOptions.map(option => {
                return (
                    <div key={option.name}>
                        <h3 className="text-foreground mb-3 text-sm font-semibold">{option.name}</h3>
                        <div className="flex flex-wrap items-center gap-2">
                            {option.optionValues.map(value => {
                                const {
                                    name,
                                    handle,
                                    variantUriQuery,
                                    selected,
                                    available,
                                    exists,
                                    isDifferentProduct,
                                    swatch
                                } = value;

                                const swatchImageUrl =
                                    swatch?.image && typeof swatch.image === "object" && "url" in swatch.image
                                        ? (swatch.image as {url: string}).url
                                        : typeof swatch?.image === "string"
                                          ? swatch.image
                                          : null;

                                const hasSwatchData = Boolean(swatch?.color || swatchImageUrl);

                                const optionContent = hasSwatchData ? (
                                    <span className="inline-flex items-center gap-2">
                                        <ColorSwatch
                                            color={swatch?.color}
                                            image={swatchImageUrl}
                                            name={name}
                                            size="sm"
                                            selected={selected}
                                        />
                                        <span>{name}</span>
                                    </span>
                                ) : (
                                    name
                                );

                                if (isDifferentProduct) {
                                    return (
                                        <Button
                                            key={option.name + name}
                                            variant={selected ? "default" : "secondary"}
                                            size="sm"
                                            className="min-w-24 h-11 sm:h-8"
                                            asChild
                                        >
                                            <Link
                                                prefetch="viewport"
                                                preventScrollReset
                                                replace
                                                to={`/products/${handle}?${variantUriQuery}`}
                                            >
                                                {optionContent}
                                            </Link>
                                        </Button>
                                    );
                                }

                                return (
                                    <Button
                                        key={option.name + name}
                                        variant={selected ? "default" : "secondary"}
                                        size="sm"
                                        className="min-w-24 h-11 sm:h-8"
                                        disabled={!exists || !available}
                                        type="button"
                                        onClick={() => {
                                            if (!selected) {
                                                void navigate(`?${variantUriQuery}`, {
                                                    replace: true,
                                                    preventScrollReset: true
                                                });
                                            }
                                        }}
                                    >
                                        {optionContent}
                                    </Button>
                                );
                            })}
                        </div>
                    </div>
                );
            })}

            {hasUnavailableSelection && (
                <div className="bg-destructive/10 border-destructive/20 flex animate-pulse items-center gap-2 rounded-md border p-3">
                    <AlertTriangle className="text-destructive h-4 w-4 shrink-0" />
                    <p className="text-destructive text-sm font-medium">This combination is currently out of stock.</p>
                </div>
            )}
        </div>
    );
};
