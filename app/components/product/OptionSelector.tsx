import {useNavigate, Link} from "react-router";
import {AlertTriangle} from "lucide-react";
import {Button} from "~/components/ui/button";
import type {MappedProductOptions} from "@shopify/hydrogen";

type OptionSelectorProps = {
    productOptions: MappedProductOptions[];
};

export const OptionSelector = ({productOptions}: OptionSelectorProps) => {
    const navigate = useNavigate();

    // Only show options that have more than one value
    const visibleOptions = productOptions.filter(option => option.optionValues.length > 1);

    if (visibleOptions.length === 0) return null;

    // Check if any selected option is unavailable
    const hasUnavailableSelection = visibleOptions.some(option =>
        option.optionValues.some(value => value.selected && !value.available)
    );

    return (
        <div className="space-y-6">
            {visibleOptions.map(option => {
                // Filter to only show available option values
                const availableValues = option.optionValues.filter(value => value.available || value.selected);

                if (availableValues.length === 0) return null;

                return (
                    <div key={option.name}>
                        <h3 className="text-foreground mb-3 text-sm font-semibold">{option.name}</h3>
                        <div className="flex flex-wrap items-center gap-2">
                            {availableValues.map(value => {
                                const {name, handle, variantUriQuery, selected, available, isDifferentProduct} = value;

                                if (isDifferentProduct) {
                                    return (
                                        <Button
                                            key={option.name + name}
                                            variant={selected ? "default" : "secondary"}
                                            size="sm"
                                            className="min-w-20"
                                            asChild
                                        >
                                            <Link viewTransition
                                                prefetch="viewport"
                                                preventScrollReset
                                                replace
                                                to={`/products/${handle}?${variantUriQuery}`}
                                            >
                                                {name}
                                            </Link>
                                        </Button>
                                    );
                                }

                                return (
                                    <Button
                                        key={option.name + name}
                                        variant={selected ? "default" : "secondary"}
                                        size="sm"
                                        className="min-w-20"
                                        disabled={!available}
                                        onClick={() => {
                                            if (!selected) {
                                                void navigate(`?${variantUriQuery}`, {
                                                    replace: true,
                                                    preventScrollReset: true
                                                });
                                            }
                                        }}
                                    >
                                        {name}
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
