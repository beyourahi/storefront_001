import {useState} from "react";
import {Link, useNavigate, useLocation} from "react-router";
import {CartForm, type MappedProductOptions, type OptimisticCartLineInput, Money} from "@shopify/hydrogen";
import type {FetcherWithComponents} from "react-router";
import {cn} from "~/lib/utils";
import type {ProductFragment} from "storefrontapi.generated";
import {Minus, Plus} from "lucide-react";
import {ColorSwatch} from "~/components/ui/color-swatch";
import {getSpecialTags} from "~/lib/product-tags";

interface ProductHeroMobileProps {
    productOptions: MappedProductOptions[];
    selectedVariant: ProductFragment["selectedOrFirstAvailableVariant"];
    selectedSellingPlan?: {id: string} | null;
    title: string;
    id?: string;
    sizeChartButton?: React.ReactNode;
    tags?: string[];
}

export function ProductHeroMobile({
    productOptions,
    selectedVariant,
    selectedSellingPlan,
    title,
    id = "product-hero-mobile",
    sizeChartButton,
    tags
}: ProductHeroMobileProps) {
    const navigate = useNavigate();
    const {search} = useLocation();
    const [quantity, setQuantity] = useState(1);

    const filteredOptions = productOptions
        .map(option => ({
            ...option,
            optionValues: option.optionValues.filter(value => value.available)
        }))
        .filter(option => option.optionValues.length > 0);

    const isSubscriptionMode = new URLSearchParams(search).has("selling_plan");
    const displayPrice = selectedVariant?.price;

    const cartLines: OptimisticCartLineInput[] = selectedVariant
        ? [
              {
                  merchandiseId: selectedVariant.id,
                  quantity,
                  selectedVariant,
                  ...(isSubscriptionMode && selectedSellingPlan ? {sellingPlanId: selectedSellingPlan.id} : {})
              }
          ]
        : [];

    const {badgeTypes} = getSpecialTags(tags || []);
    const isPreorder = badgeTypes.includes("preorder");

    const getButtonText = () => {
        if (!selectedVariant?.availableForSale) return "Sold out";
        if (isSubscriptionMode && !selectedSellingPlan) return "Select frequency";
        if (isSubscriptionMode) return "Subscribe";
        return isPreorder ? "Pre Order" : "Get it Now";
    };

    return (
        <section
            id={id}
            className="md:hidden flex flex-col bg-primary px-3 sm:px-4 pb-8 sm:pb-10 pt-6 sm:pt-8 overflow-y-auto"
        >
            <h1 className="font-serif text-2xl sm:text-3xl text-primary-foreground mb-6">{title}</h1>

            {sizeChartButton && <div className="mb-4">{sizeChartButton}</div>}

            {filteredOptions.length > 0 && (
                <div className="space-y-3 mb-8">
                    {filteredOptions.map(option => (
                        <div key={option.name} className="flex flex-wrap gap-3">
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

                                const hasSwatchData = swatch && (swatch.color || swatch.image);
                                const swatchImageUrl =
                                    swatch?.image && typeof swatch.image === "object" && "url" in swatch.image
                                        ? (swatch.image as {url: string}).url
                                        : typeof swatch?.image === "string"
                                          ? swatch.image
                                          : null;

                                const pillClasses = cn(
                                    "inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-4 py-2 text-base font-medium transition-all duration-200",
                                    "active:scale-95",
                                    selected
                                        ? "bg-primary-foreground text-primary"
                                        : "bg-transparent border-2 border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10",
                                    exists && available ? "cursor-pointer" : "opacity-50 cursor-not-allowed"
                                );

                                const optionContent = hasSwatchData ? (
                                    <span className="inline-flex items-center gap-2">
                                        <ColorSwatch
                                            color={swatch?.color}
                                            image={swatchImageUrl}
                                            name={name}
                                            size="sm"
                                            selected={selected}
                                            onPrimaryBackground={true}
                                        />
                                        <span>{name}</span>
                                    </span>
                                ) : (
                                    <span>{name}</span>
                                );

                                if (isDifferentProduct) {
                                    return (
                                        <Link
                                            key={option.name + name}
                                            prefetch="viewport"
                                            preventScrollReset
                                            replace
                                            to={`/products/${handle}?${variantUriQuery}`}
                                            className={pillClasses}
                                        >
                                            {optionContent}
                                        </Link>
                                    );
                                }

                                return (
                                    <button
                                        key={option.name + name}
                                        type="button"
                                        disabled={!exists || !available}
                                        className={pillClasses}
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
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </div>
            )}

            <MobileQuantitySelector quantity={quantity} onQuantityChange={setQuantity} min={1} max={10} />

            <div className="mt-4">
                <CartForm
                    fetcherKey="cart-mutation"
                    route="/cart"
                    inputs={{lines: cartLines}}
                    action={CartForm.ACTIONS.LinesAdd}
                >
                    {(fetcher: FetcherWithComponents<any>) => {
                        const isDisabled =
                            !selectedVariant ||
                            !selectedVariant.availableForSale ||
                            (isSubscriptionMode && !selectedSellingPlan) ||
                            fetcher.state !== "idle";

                        return (
                            <button
                                type="submit"
                                disabled={isDisabled}
                                className={cn(
                                    "w-full min-h-14 inline-flex items-center justify-between gap-4 rounded-full bg-primary-foreground px-4 py-3 text-base font-medium text-primary transition-all duration-200",
                                    "hover:bg-primary-foreground/90 active:scale-[0.98]",
                                    isDisabled && "opacity-60 cursor-not-allowed"
                                )}
                            >
                                <span className="font-medium">{displayPrice && <Money data={displayPrice} />}</span>
                                <span className="whitespace-nowrap">{getButtonText()}</span>
                            </button>
                        );
                    }}
                </CartForm>
            </div>
        </section>
    );
}

function MobileQuantitySelector({
    quantity,
    onQuantityChange,
    min = 1,
    max
}: {
    quantity: number;
    onQuantityChange: (quantity: number) => void;
    min?: number;
    max?: number;
}) {
    const handleDecrement = () => {
        if (quantity > min) {
            onQuantityChange(quantity - 1);
        }
    };

    const handleIncrement = () => {
        if (max === undefined || quantity < max) {
            onQuantityChange(quantity + 1);
        }
    };

    const canDecrement = quantity > min;
    const canIncrement = max === undefined || quantity < max;

    return (
        <div className="inline-flex w-fit items-center justify-between rounded-full bg-primary-foreground">
            <button
                type="button"
                onClick={handleDecrement}
                disabled={!canDecrement}
                className={cn(
                    "flex min-h-12 items-center justify-center px-4 py-2 text-primary rounded-l-full transition-colors active:bg-primary/10",
                    canDecrement ? "cursor-pointer" : "opacity-40 cursor-not-allowed"
                )}
                aria-label="Decrease quantity"
            >
                <Minus className="size-5" />
            </button>
            <span className="min-w-10 px-2 text-lg font-medium text-primary text-center tabular-nums">{quantity}</span>
            <button
                type="button"
                onClick={handleIncrement}
                disabled={!canIncrement}
                className={cn(
                    "flex min-h-12 items-center justify-center px-4 py-2 text-primary rounded-r-full transition-colors active:bg-primary/10",
                    canIncrement ? "cursor-pointer" : "opacity-40 cursor-not-allowed"
                )}
                aria-label="Increase quantity"
            >
                <Plus className="size-5" />
            </button>
        </div>
    );
}
