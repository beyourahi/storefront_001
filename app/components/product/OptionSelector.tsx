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
 * Variant option picker for the PDP. Two passes apply before render:
 * 1. Keeps all option values where the variant exists — OOS values are shown disabled,
 *    non-existent combinations (exists=false) are hidden.
 * 2. Hides entire option axes where only one value exists (no meaningful choice).
 *
 * Two rendering paths per value:
 * - `isDifferentProduct === true`: renders a `<Link>` to a separate product URL
 *   (used for combined-listing products that share option names across different SKUs).
 * - Otherwise: navigates within the same product by updating `variantUriQuery` search params.
 *
 * OOS values are shown with a diagonal strikethrough, `disabled`, reduced opacity, and a
 * descriptive `aria-label`. Hover/active states are suppressed for OOS variants.
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
                    // Include OOS variants (exists=true, available=false); hide non-existent combos (exists=false)
                    optionValues: option.optionValues.filter(value => value.exists !== false)
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

                                const isOos = !available;

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
                                        <span className="leading-none">{name}</span>
                                    </span>
                                ) : (
                                    <span className="leading-none">{name}</span>
                                );

                                // Diagonal strikethrough overlay for OOS variants
                                const oosOverlay = isOos ? (
                                    <span
                                        className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden rounded-[inherit]"
                                        aria-hidden="true"
                                    >
                                        <span className="block h-[1.5px] w-[150%] rotate-[-28deg] bg-current opacity-30" />
                                    </span>
                                ) : null;

                                if (isDifferentProduct) {
                                    return (
                                        <Button
                                            key={option.name + name}
                                            variant={selected ? "default" : "secondary"}
                                            size="sm"
                                            className="relative overflow-hidden min-w-24 h-11 sm:h-8"
                                            asChild
                                        >
                                            <Link
                                                prefetch="viewport"
                                                preventScrollReset
                                                replace
                                                to={`/products/${handle}?${variantUriQuery}`}
                                                aria-label={isOos ? `${name}, sold out` : undefined}
                                            >
                                                {optionContent}
                                                {oosOverlay}
                                            </Link>
                                        </Button>
                                    );
                                }

                                return (
                                    <Button
                                        key={option.name + name}
                                        variant={selected ? "default" : "secondary"}
                                        size="sm"
                                        className="relative overflow-hidden min-w-24 h-11 sm:h-8"
                                        disabled={!exists || !available}
                                        aria-label={isOos ? `${name}, sold out` : undefined}
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
                                        {oosOverlay}
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
