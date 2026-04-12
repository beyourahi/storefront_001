import {useState, useEffect, useMemo, useCallback} from "react";
import {useFetcher} from "react-router";
import {CartForm} from "@shopify/hydrogen";
import {Loader2, Share2} from "lucide-react";
import {cn} from "~/lib/utils";
import {formatShopifyMoney} from "~/lib/currency-formatter";
import {QuantitySelector} from "~/components/QuantitySelector";
import {Badge} from "~/components/ui/badge";
import {Dialog, DialogContent, DialogHeader, DialogTitle} from "~/components/ui/dialog";
import {ColorSwatch} from "~/components/ui/color-swatch";
import {isColorOption, getSwatchFromColorName, hasColorMapping} from "~/lib/color-name-map";
import {WishlistButton} from "~/components/WishlistButton";
import {toast} from "sonner";
import {filterDisplayTags, getButtonLabel} from "~/lib/product-tags";
import {parseProductTitle} from "~/lib/product";
import {OUT_OF_STOCK_LABEL} from "~/lib/product/product-card-utils";

interface QuickAddVariant {
    id: string;
    availableForSale: boolean;
    title?: string;
    selectedOptions?: Array<{name: string; value: string}>;
    price: {amount: string; currencyCode: string};
    compareAtPrice?: {amount: string; currencyCode: string} | null;
}

interface QuickAddImage {
    id?: string | null;
    url: string;
    altText?: string | null;
    width?: number | null;
    height?: number | null;
}

interface QuickAddProduct {
    id: string;
    title: string;
    handle: string;
    tags?: string[];
    featuredImage?: QuickAddImage | null;
    images?: {nodes: QuickAddImage[]};
    priceRange: {
        minVariantPrice: {amount: string; currencyCode: string};
        maxVariantPrice: {amount: string; currencyCode: string};
    };
    variants: {nodes: QuickAddVariant[]};
}

interface QuickAddDialogProps {
    product: QuickAddProduct;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function QuickAddDialog({product, open, onOpenChange}: QuickAddDialogProps) {
    const [quantity, setQuantity] = useState(1);
    const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

    const displayTags = filterDisplayTags(product.tags);
    const buttonLabel = getButtonLabel(product.tags, "Get it now");

    const availableVariants = useMemo(
        () => product.variants.nodes.filter(v => v.availableForSale),
        [product.variants.nodes]
    );

    const productImages: QuickAddImage[] =
        product.images?.nodes && product.images.nodes.length > 0
            ? product.images.nodes
            : product.featuredImage
              ? [product.featuredImage]
              : [];

    const handleShare = useCallback(async () => {
        const productUrl = `${window.location.origin}/products/${product.handle}`;
        if (navigator.share) {
            try {
                await navigator.share({title: product.title, url: productUrl});
                return;
            } catch {
                // fall through to clipboard
            }
        }
        try {
            await navigator.clipboard.writeText(productUrl);
            toast.success("Link copied to clipboard!");
        } catch {
            toast.error("Failed to copy link");
        }
    }, [product.handle, product.title]);

    useEffect(() => {
        if (open && availableVariants.length > 0 && !selectedVariantId) {
            setSelectedVariantId(availableVariants[0].id);
        }
    }, [open, availableVariants, selectedVariantId]);

    useEffect(() => {
        if (!open) {
            setQuantity(1);
            setSelectedVariantId(null);
        }
    }, [open]);

    const selectedVariant = product.variants.nodes.find(v => v.id === selectedVariantId);
    const optionGroups = groupVariantsByOption(product.variants.nodes);
    const currentSelections = getSelectedOptionsFromVariant(selectedVariant);
    const {primary, secondary} = parseProductTitle(product.title);

    const stopPropagation = useCallback((e: React.MouseEvent | React.PointerEvent) => e.stopPropagation(), []);
    const handleCartSuccess = useCallback(() => onOpenChange(false), [onOpenChange]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="md:max-w-3xl p-2 overflow-hidden"
                showCloseButton={false}
                onClick={stopPropagation}
                onPointerDown={stopPropagation}
            >
                <div className="flex flex-col md:flex-row h-[60dvh]">
                    {productImages.length > 0 && (
                        <div
                            className="w-full md:w-1/2 shrink-0 h-full overflow-y-auto overscroll-contain [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                            data-lenis-prevent
                        >
                            <div className="flex flex-col gap-2">
                                {productImages.map((image, index) => (
                                    <div
                                        key={image.id || index}
                                        className="relative w-full overflow-hidden bg-muted/50 rounded-lg"
                                    >
                                        <div className="aspect-4/5 w-full">
                                            <img
                                                src={image.url}
                                                alt={image.altText || `${product.title} - Image ${index + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex-1 p-4 sm:p-6 flex flex-col overflow-y-auto" data-lenis-prevent>
                        <DialogHeader className="text-left pr-10">
                            <DialogTitle className="font-sans text-2xl sm:text-3xl font-medium leading-snug text-primary mb-0">
                                <span>{primary}</span>
                                {secondary && <span>, {secondary}</span>}
                            </DialogTitle>
                            {displayTags.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-1">
                                    {displayTags.map((tag: string) => (
                                        <Badge
                                            key={tag}
                                            variant="outline"
                                            className="text-sm border text-primary font-semibold px-2.5 uppercase"
                                        >
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            )}
                            <div className="flex items-center gap-3 mt-1">
                                <span className="font-mono tabular-nums text-base text-primary">
                                    {selectedVariant ? (
                                        formatShopifyMoney(selectedVariant.price)
                                    ) : (
                                        <>
                                            {formatShopifyMoney(product.priceRange.minVariantPrice)}
                                            {product.priceRange.minVariantPrice.amount !==
                                                product.priceRange.maxVariantPrice.amount && (
                                                <>
                                                    {" - "}
                                                    {formatShopifyMoney(product.priceRange.maxVariantPrice)}
                                                </>
                                            )}
                                        </>
                                    )}
                                </span>
                            </div>
                        </DialogHeader>

                        <div className="flex-1 mt-4 space-y-4">
                            {optionGroups.map(group => {
                                const isColor = isColorOption(group.name);
                                return (
                                    <div key={group.name} className="flex flex-wrap gap-2">
                                        {group.values.map(value => {
                                            const isSelected = currentSelections[group.name] === value.value;
                                            const variant = findVariantByOptions(product.variants.nodes, {
                                                ...currentSelections,
                                                [group.name]: value.value
                                            });
                                            const isAvailable = variant?.availableForSale ?? false;
                                            const swatchData = isColor
                                                ? getSwatchFromColorName(value.value)
                                                : undefined;
                                            const hasSwatchData = isColor && hasColorMapping(value.value);

                                            const buttonClasses = cn(
                                                "inline-flex min-h-10 select-none items-center justify-center gap-2 rounded-full border-2 px-3 sm:px-4 py-1.5 text-base sm:text-lg font-medium sleek hover:scale-[1.02] hover:shadow-md active:scale-[0.98]",
                                                isSelected
                                                    ? "border-primary bg-primary text-primary-foreground"
                                                    : "border-primary text-primary hover:bg-primary hover:text-primary-foreground",
                                                !isAvailable && "opacity-50 cursor-not-allowed"
                                            );

                                            const optionContent =
                                                hasSwatchData && swatchData ? (
                                                    <span className="inline-flex items-center gap-2">
                                                        <ColorSwatch
                                                            color={swatchData.color}
                                                            name={value.value}
                                                            size="sm"
                                                            selected={isSelected}
                                                        />
                                                        <span>{value.value}</span>
                                                    </span>
                                                ) : (
                                                    <span>{value.value}</span>
                                                );

                                            return (
                                                <button
                                                    key={value.value}
                                                    type="button"
                                                    disabled={!isAvailable}
                                                    onClick={() => {
                                                        if (variant && isAvailable) {
                                                            setSelectedVariantId(variant.id);
                                                        }
                                                    }}
                                                    className={buttonClasses}
                                                >
                                                    {optionContent}
                                                </button>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>

                        {selectedVariant && selectedVariant.availableForSale ? (
                            <div className="mt-6 pt-4 space-y-3">
                                <div className="flex items-center justify-between gap-3">
                                    <QuantitySelector
                                        quantity={quantity}
                                        onQuantityChange={setQuantity}
                                        min={1}
                                        max={10}
                                    />
                                    <div className="flex items-center gap-2">
                                        <WishlistButton productId={product.id} />
                                        <button
                                            type="button"
                                            onClick={() => void handleShare()}
                                            className="flex min-h-10 min-w-10 select-none items-center justify-center rounded-full border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground active:scale-95"
                                            aria-label="Share product"
                                        >
                                            <Share2 className="size-5" />
                                        </button>
                                    </div>
                                </div>
                                <QuickAddCartButton
                                    variant={selectedVariant}
                                    quantity={quantity}
                                    buttonLabel={buttonLabel}
                                    onSuccess={handleCartSuccess}
                                />
                            </div>
                        ) : availableVariants.length === 0 ? (
                            <div className="mt-6 pt-4">
                                <div className="w-full min-h-12 inline-flex items-center justify-center rounded-full border-2 border-muted bg-muted/50 px-3 sm:px-4 py-2 text-lg font-medium text-muted-foreground">
                                    {OUT_OF_STOCK_LABEL}
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function QuickAddCartButton({
    variant,
    quantity,
    onSuccess,
    buttonLabel
}: {
    variant: QuickAddVariant;
    quantity: number;
    onSuccess: () => void;
    buttonLabel: string;
}) {
    const fetcher = useFetcher({key: "cart-mutation"});
    const isLoading = fetcher.state !== "idle";

    useEffect(() => {
        if (fetcher.state === "idle" && fetcher.data) onSuccess();
    }, [fetcher.state, fetcher.data, onSuccess]);

    const handleAddToCart = useCallback(() => {
        if (isLoading || !variant.availableForSale) return;
        void fetcher.submit(
            {
                cartFormInput: JSON.stringify({
                    action: CartForm.ACTIONS.LinesAdd,
                    inputs: {lines: [{merchandiseId: variant.id, quantity}]}
                })
            },
            {method: "POST", action: "/cart"}
        );
    }, [fetcher, isLoading, variant.availableForSale, variant.id, quantity]);

    return (
        <button
            type="button"
            onClick={handleAddToCart}
            disabled={isLoading || !variant.availableForSale}
            className={cn(
                "w-full min-h-12 inline-flex select-none items-center justify-between gap-4 rounded-full border-2 border-primary bg-transparent px-3 sm:px-4 py-2 text-lg font-medium text-primary sleek",
                "hover:bg-primary hover:text-primary-foreground active:bg-primary active:text-primary-foreground",
                (isLoading || !variant.availableForSale) && "opacity-50 cursor-not-allowed"
            )}
        >
            <span className="flex items-center gap-2">
                {formatShopifyMoney(variant.price)}
                {variant.compareAtPrice &&
                    parseFloat(variant.compareAtPrice.amount) > parseFloat(variant.price.amount) && (
                        <s className="text-sm opacity-60">{formatShopifyMoney(variant.compareAtPrice)}</s>
                    )}
            </span>
            <span className="flex items-center gap-2">
                {isLoading && <Loader2 className="size-5 animate-spin" />}
                {variant.availableForSale ? buttonLabel : OUT_OF_STOCK_LABEL}
            </span>
        </button>
    );
}

function groupVariantsByOption(
    variants: QuickAddVariant[]
): Array<{name: string; values: Array<{value: string; variantId: string; hasAvailableVariant: boolean}>}> {
    const optionMap = new Map<string, Map<string, {variantId: string; hasAvailableVariant: boolean}>>();

    for (const variant of variants) {
        if (!variant.selectedOptions) continue;
        for (const option of variant.selectedOptions) {
            if (!optionMap.has(option.name)) optionMap.set(option.name, new Map());
            const existing = optionMap.get(option.name)!.get(option.value);
            if (!existing) {
                optionMap.get(option.name)!.set(option.value, {
                    variantId: variant.id,
                    hasAvailableVariant: variant.availableForSale
                });
            } else if (variant.availableForSale && !existing.hasAvailableVariant) {
                optionMap.get(option.name)!.set(option.value, {
                    variantId: variant.id,
                    hasAvailableVariant: true
                });
            }
        }
    }

    const result: Array<{
        name: string;
        values: Array<{value: string; variantId: string; hasAvailableVariant: boolean}>;
    }> = [];

    for (const [name, values] of optionMap) {
        const availableValues = Array.from(values.entries())
            .filter(([, info]) => info.hasAvailableVariant)
            .map(([value, info]) => ({value, variantId: info.variantId, hasAvailableVariant: info.hasAvailableVariant}));
        if (availableValues.length > 0) result.push({name, values: availableValues});
    }

    return result;
}

function getSelectedOptionsFromVariant(variant: QuickAddVariant | undefined): Record<string, string> {
    if (!variant?.selectedOptions) return {};
    const selections: Record<string, string> = {};
    for (const option of variant.selectedOptions) selections[option.name] = option.value;
    return selections;
}

function findVariantByOptions(
    variants: QuickAddVariant[],
    selections: Record<string, string>
): QuickAddVariant | undefined {
    return variants.find(variant => {
        if (!variant.selectedOptions) return false;
        for (const option of variant.selectedOptions) {
            if (selections[option.name] && selections[option.name] !== option.value) return false;
        }
        return true;
    });
}
