import {useState, useEffect, useMemo, useCallback, useRef, type ReactNode} from "react";
import {useFetcher} from "react-router";
import {CartForm, type OptimisticCartLineInput} from "@shopify/hydrogen";
import {type FetcherWithComponents} from "react-router";
import {AlertTriangle, CalendarClock, Check, CreditCard, Minus, Plus, ShoppingCart, X, Loader2} from "lucide-react";
import {Image} from "@shopify/hydrogen";
import {Button} from "~/components/ui/button";
import {Dialog, DialogContent} from "~/components/ui/dialog";
import {ProductPageDiscountIndicator} from "~/components/product/ProductPageDiscountIndicator";
import {formatShopifyMoney, getZeroPrice} from "~/lib/currency-formatter";
import {selectBestVariant} from "~/lib/product/product-card-utils";
import {isPreorderProduct} from "~/lib/product/preorder-utils";
import type {ShopifyProduct, ShopifyProductVariant} from "~/lib/types/product-card";
import {useCartDrawer} from "~/hooks/useCartDrawer";

type VariantDialogCartButtonProps = {
    addToCartState: "idle" | "adding" | "success";
    setAddToCartState: (state: "idle" | "adding" | "success") => void;
    openCartDrawer: () => void;
    onSuccess?: () => void;
    selectedVariant: ShopifyProductVariant | null;
    isPreorder: boolean;
};

const VariantDialogCartButton = ({
    addToCartState,
    setAddToCartState,
    openCartDrawer,
    onSuccess,
    selectedVariant,
    isPreorder
}: VariantDialogCartButtonProps) => {
    const fetcher = useFetcher({key: "variant-dialog-add"});
    const isAdding = fetcher.state !== "idle";

    useEffect(() => {
        if (addToCartState === "idle" && fetcher.state === "submitting") {
            setAddToCartState("adding");
        }
        if (addToCartState === "adding" && fetcher.state === "idle") {
            setAddToCartState("success");
            openCartDrawer();
            onSuccess?.();
            const timer = setTimeout(() => {
                setAddToCartState("idle");
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [fetcher.state, addToCartState, setAddToCartState, openCartDrawer, onSuccess]);

    const Icon = isPreorder ? CalendarClock : ShoppingCart;

    return (
        <Button
            type="submit"
            className={`sleek cta-primary-emphasis h-12 w-full shadow-lg hover:shadow-xl active:scale-[0.98] sm:h-12 ${
                addToCartState === "success" ? "border-green-600 bg-green-600 hover:bg-green-700" : ""
            } ${addToCartState === "adding" ? "cursor-wait" : ""}`}
            disabled={!selectedVariant || isAdding}
        >
            {addToCartState === "adding" ? (
                <>
                    <div className="animate-bounce">
                        <Icon className="mr-2 h-4 w-4" />
                    </div>
                    ADDING TO CART...
                </>
            ) : addToCartState === "success" ? (
                <>
                    <div className="animate-pulse">
                        <Check className="mr-2 h-4 w-4" />
                    </div>
                    ADDED!
                </>
            ) : (
                <>
                    <Icon className="mr-2 h-4 w-4" />
                    {isPreorder ? "PRE ORDER" : "ADD TO CART"}
                </>
            )}
        </Button>
    );
};

type ProductVariantDialogProps = {
    product?: ShopifyProduct;
    productHandle?: string;
    onSuccess?: () => void;
    autoAddSingleVariant?: boolean;
    children?: ReactNode;
};

export const ProductVariantDialog = ({
    product: initialProduct,
    productHandle,
    onSuccess,
    autoAddSingleVariant = false,
    children
}: ProductVariantDialogProps) => {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [fetchedProduct, setFetchedProduct] = useState<ShopifyProduct | null>(null);
    const [selectedVariant, setSelectedVariant] = useState<ShopifyProductVariant | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
    const [addToCartState, setAddToCartState] = useState<"idle" | "adding" | "success">("idle");
    const fetchControllerRef = useRef<AbortController | null>(null);
    const productCacheRef = useRef<Map<string, ShopifyProduct>>(new Map());
    const {open: openCartDrawer} = useCartDrawer();

    const currentProduct = initialProduct || fetchedProduct;
    const handle = productHandle || initialProduct?.handle;

    const productImages = useMemo(() => currentProduct?.images?.edges?.map(edge => edge.node) || [], [currentProduct]);
    const allVariants = useMemo(() => currentProduct?.variants?.edges?.map(edge => edge.node) || [], [currentProduct]);
    const availableVariants = useMemo(() => allVariants.filter(v => v.availableForSale), [allVariants]);

    const hasMultipleVariants = useMemo(() => {
        if (allVariants.length === 0) return false;
        const realVariants = allVariants.filter(variant => {
            const hasRealTitle = variant.title && variant.title !== "Default Title";
            const hasRealOptions = variant.selectedOptions?.some(
                option => option.value && option.value !== "Default Title"
            );
            return hasRealTitle || hasRealOptions;
        });
        return realVariants.length > 1;
    }, [allVariants]);

    const isPreorder = useMemo(() => (currentProduct ? isPreorderProduct(currentProduct) : false), [currentProduct]);

    const titleParts = useMemo(() => currentProduct?.title.trim().split(" + ") || [""], [currentProduct]);

    const currentPrice = useMemo(() => {
        if (!currentProduct) return {price: getZeroPrice(), onSale: false};

        const variant = selectedVariant || allVariants[0];
        if (variant) {
            const price = formatShopifyMoney(variant.price);
            const compareAtPrice = variant.compareAtPrice ? formatShopifyMoney(variant.compareAtPrice) : undefined;
            const onSale = Boolean(
                compareAtPrice &&
                variant.compareAtPrice &&
                parseFloat(variant.compareAtPrice.amount) > parseFloat(variant.price.amount)
            );
            return {price, compareAtPrice, onSale};
        }
        return {price: getZeroPrice(), onSale: false};
    }, [currentProduct, selectedVariant, allVariants]);

    const discountPercentage = useMemo(() => {
        if (selectedVariant?.compareAtPrice && selectedVariant.price) {
            const originalPrice = parseFloat(selectedVariant.compareAtPrice.amount);
            const salePrice = parseFloat(selectedVariant.price.amount);
            if (originalPrice > salePrice) {
                return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
            }
        }
        return 0;
    }, [selectedVariant]);

    useEffect(() => {
        if (currentProduct && Object.keys(selectedOptions).length === 0 && allVariants.length > 0) {
            const bestVariant = selectBestVariant(availableVariants.length > 0 ? availableVariants : allVariants);
            if (bestVariant) {
                const newSelectedOptions: Record<string, string> = {};
                bestVariant.selectedOptions.forEach(option => {
                    newSelectedOptions[option.name] = option.value;
                });
                setSelectedOptions(newSelectedOptions);
                setSelectedVariant(bestVariant);
            }
        }
    }, [currentProduct, allVariants, availableVariants, selectedOptions]);

    useEffect(() => {
        if (!open) {
            setAddToCartState("idle");
        }
    }, [open]);

    const findMatchingVariant = useCallback(
        (options: Record<string, string>): ShopifyProductVariant | null => {
            return (
                allVariants.find(variant =>
                    variant.selectedOptions.every(option => options[option.name] === option.value)
                ) || null
            );
        },
        [allVariants]
    );

    const selectOption = useCallback(
        (optionName: string, value: string) => {
            const newSelectedOptions = {...selectedOptions, [optionName]: value};
            setSelectedOptions(newSelectedOptions);
            const matchingVariant = findMatchingVariant(newSelectedOptions);
            setSelectedVariant(matchingVariant);
        },
        [selectedOptions, findMatchingVariant]
    );

    const getAvailableValuesForOption = useCallback(
        (optionName: string): string[] => {
            if (!currentProduct) return [];
            const option = currentProduct.options?.find(opt => opt.name === optionName);
            if (!option) return [];

            return option.values.filter(value => {
                const testOptions = {...selectedOptions, [optionName]: value};
                const matchingVariant = findMatchingVariant(testOptions);
                return matchingVariant && matchingVariant.availableForSale;
            });
        },
        [currentProduct, selectedOptions, findMatchingVariant]
    );

    const fetchProduct = useCallback(async () => {
        if (!handle) {
            setFetchError("No product handle available");
            return;
        }

        const cached = productCacheRef.current.get(handle);
        if (cached) {
            setFetchedProduct(cached);
            if (autoAddSingleVariant) {
                setOpen(true);
            } else {
                setOpen(true);
            }
            return;
        }

        if (fetchControllerRef.current) {
            fetchControllerRef.current.abort();
        }

        fetchControllerRef.current = new AbortController();
        setIsLoading(true);
        setFetchError(null);

        try {
            const response = await fetch(`/api/products/${handle}`, {
                signal: fetchControllerRef.current.signal
            });
            const data = (await response.json()) as {product?: ShopifyProduct; error?: string};

            if (response.ok && data.product) {
                setFetchedProduct(data.product);
                productCacheRef.current.set(handle, data.product);
                setOpen(true);
            } else {
                setFetchError(data.error || "Product not found");
            }
        } catch (err) {
            if (err instanceof Error && err.name === "AbortError") return;
            setFetchError("Unable to load product options");
            if (autoAddSingleVariant) setOpen(true);
        } finally {
            setIsLoading(false);
            fetchControllerRef.current = null;
        }
    }, [handle, autoAddSingleVariant]);

    const handleButtonClick = useCallback(async () => {
        if (fetchError) setFetchError(null);
        if (currentProduct) {
            setOpen(true);
        } else {
            await fetchProduct();
        }
    }, [fetchError, currentProduct, fetchProduct]);

    const lines = selectedVariant ? [{merchandiseId: selectedVariant.id, quantity, selectedVariant}] : [];

    return (
        <>
            <Button
                variant="outline"
                onClick={() => void handleButtonClick()}
                disabled={isLoading || !!fetchError}
                className="sleek !border-foreground/20 !bg-card !text-card-foreground hover:!bg-muted hover:!text-card-foreground hover:!border-foreground/40 inline-flex h-10 w-full shrink-0 items-center justify-center gap-2 rounded-md !border-2 px-6 text-sm font-medium whitespace-nowrap !opacity-100 shadow-xs outline-none hover:!scale-[1.02] hover:!shadow-md focus-visible:ring-[3px] active:!scale-[0.98]"
            >
                {isLoading ? (
                    <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span className="hidden sm:inline">LOADING...</span>
                        <span className="sm:hidden">LOADING</span>
                    </>
                ) : fetchError ? (
                    <>
                        <AlertTriangle className="h-3 w-3" />
                        <span className="hidden sm:inline">TRY AGAIN</span>
                        <span className="sm:hidden">RETRY</span>
                    </>
                ) : (
                    children
                )}
            </Button>

            {currentProduct && (
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogContent className="!fixed !top-[50%] !left-[50%] !h-auto !w-[92vw] !max-w-[380px] !-translate-x-1/2 !-translate-y-1/2 overflow-hidden rounded-lg border-0 p-0 shadow-2xl sm:!max-w-[480px] md:!w-[700px] md:!max-w-2xl lg:!w-[900px] xl:!w-[1100px] 2xl:!w-[1300px]">
                        <div className="bg-background flex h-full flex-col lg:flex-row">
                            {productImages.length > 0 && (
                                <div className="border-border/10 hidden max-h-[55vh] shrink-0 border-r lg:block lg:w-2/5">
                                    <div className="scrollbar-hide h-full overflow-x-hidden overflow-y-auto p-3">
                                        <div className="space-y-3">
                                            {productImages.map((image, index) => (
                                                <div
                                                    key={image.id ?? `${image.url}-${index}`}
                                                    className="relative aspect-square w-full overflow-hidden rounded-lg shadow-md"
                                                >
                                                    <Image
                                                        data={{
                                                            url: image.url,
                                                            altText:
                                                                image.altText ||
                                                                `${currentProduct.title} - Image ${index + 1}`
                                                        }}
                                                        className="sleek h-full w-full object-cover hover:scale-105"
                                                        sizes="400px"
                                                        loading={index === 0 ? "eager" : "lazy"}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="relative flex min-h-0 w-full flex-col lg:w-3/5">
                                <button
                                    className="sleek bg-background/90 hover:bg-background absolute top-6 right-6 z-20 rounded-full opacity-90 shadow-lg backdrop-blur-sm hover:scale-105 hover:opacity-100 focus:outline-none"
                                    onClick={() => setOpen(false)}
                                >
                                    <X className="h-4 w-4 sm:h-4 sm:w-4" />
                                    <span className="sr-only">Close</span>
                                </button>

                                <div className="flex flex-1 flex-col p-4">
                                    <div className="flex-1 overflow-y-auto">
                                        {discountPercentage > 0 && (
                                            <div className="mb-1.5">
                                                <ProductPageDiscountIndicator discountPercentage={discountPercentage} />
                                            </div>
                                        )}

                                        <div className="mb-8 sm:mb-10">
                                            <div className="flex gap-4 lg:block">
                                                {productImages.length > 0 && (
                                                    <div className="shrink-0 lg:hidden">
                                                        <div className="relative h-20 w-20 overflow-hidden rounded-lg shadow-md">
                                                            <Image
                                                                data={{
                                                                    url: productImages[0].url,
                                                                    altText:
                                                                        productImages[0].altText || currentProduct.title
                                                                }}
                                                                className="h-full w-full object-cover"
                                                                sizes="80px"
                                                                loading="eager"
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="min-w-0 flex-1">
                                                    <div className="mb-1 sm:mb-1.5">
                                                        <h2 className="text-foreground text-base leading-tight font-semibold tracking-tight 2xl:text-lg">
                                                            {titleParts[0]}
                                                        </h2>
                                                        {titleParts[1] && (
                                                            <h3 className="opacity-50 mt-1 text-xs font-normal">
                                                                {titleParts[1]}
                                                            </h3>
                                                        )}
                                                    </div>

                                                    <div className="flex items-baseline gap-2 sm:gap-3">
                                                        <span className="text-foreground font-mono text-sm font-bold tracking-tight lg:text-base">
                                                            {currentPrice.price}
                                                        </span>
                                                        {currentPrice.compareAtPrice && (
                                                            <span className="text-muted-foreground font-mono text-sm line-through lg:text-base">
                                                                {currentPrice.compareAtPrice}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {hasMultipleVariants &&
                                            currentProduct.options &&
                                            currentProduct.options.length > 0 && (
                                                <div className="mb-5 space-y-2.5 sm:mb-6 sm:space-y-3">
                                                    {currentProduct.options.map(option => (
                                                        <div key={option.id}>
                                                            <h3 className="text-foreground mb-0.5 text-sm font-semibold tracking-wide sm:mb-1 sm:text-sm">
                                                                {option.name}
                                                            </h3>
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                {getAvailableValuesForOption(option.name).map(value => {
                                                                    const isSelected =
                                                                        selectedOptions[option.name] === value;
                                                                    return (
                                                                        <Button
                                                                            key={value}
                                                                            variant={isSelected ? "default" : "outline"}
                                                                            size="sm"
                                                                            onClick={() =>
                                                                                selectOption(option.name, value)
                                                                            }
                                                                        >
                                                                            {value}
                                                                        </Button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    ))}

                                                    {selectedVariant && !selectedVariant.availableForSale && (
                                                        <div className="bg-destructive/10 border-destructive/20 flex animate-pulse items-center gap-3 rounded-lg border-2 p-4 shadow-sm">
                                                            <AlertTriangle className="text-destructive h-5 w-5 shrink-0" />
                                                            <p className="text-destructive text-sm font-semibold">
                                                                This combination is currently out of stock.
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                        <div className="mb-8">
                                            <h3 className="text-foreground mb-0.5 text-sm font-semibold tracking-wide sm:mb-1 sm:text-sm">
                                                Quantity
                                            </h3>
                                            <div className="flex w-fit items-center overflow-hidden rounded-lg">
                                                <Button
                                                    className="rounded-r-none border-r-0"
                                                    onClick={() => quantity > 1 && setQuantity(quantity - 1)}
                                                    disabled={quantity <= 1}
                                                >
                                                    <Minus className="h-4 w-4" />
                                                </Button>
                                                <div className="bg-background text-foreground flex h-10 w-10 items-center justify-center text-sm font-medium">
                                                    {quantity}
                                                </div>
                                                <Button
                                                    className="rounded-l-none border-l-0"
                                                    onClick={() => {
                                                        const maxQty = selectedVariant?.quantityAvailable || 1;
                                                        if (quantity < maxQty) setQuantity(quantity + 1);
                                                    }}
                                                    disabled={quantity >= (selectedVariant?.quantityAvailable || 1)}
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-border/10 shrink-0 space-y-1.5 border-t pt-2 sm:space-y-2">
                                        <CartForm
                                            fetcherKey="variant-dialog-add"
                                            route="/cart"
                                            inputs={{lines: lines as OptimisticCartLineInput[]}}
                                            action={CartForm.ACTIONS.LinesAdd}
                                        >
                                            <VariantDialogCartButton
                                                addToCartState={addToCartState}
                                                setAddToCartState={setAddToCartState}
                                                openCartDrawer={openCartDrawer}
                                                onSuccess={onSuccess}
                                                selectedVariant={selectedVariant}
                                                isPreorder={isPreorder}
                                            />
                                        </CartForm>

                                        {!isPreorder && (
                                            <CartForm
                                                fetcherKey="variant-dialog-buy"
                                                route="/cart"
                                                inputs={{lines: lines as OptimisticCartLineInput[]}}
                                                action={CartForm.ACTIONS.LinesAdd}
                                            >
                                                {(fetcher: FetcherWithComponents<any>) => (
                                                    <>
                                                        <input type="hidden" name="redirectTo" value="__checkout_url__" />
                                                        <Button
                                                            type="submit"
                                                            variant="outline"
                                                            className={`sleek h-10 w-full font-medium active:scale-[0.98] sm:h-10 ${fetcher.state !== "idle" ? "cursor-wait" : ""}`}
                                                            disabled={!selectedVariant || fetcher.state !== "idle"}
                                                        >
                                                            {fetcher.state !== "idle" ? (
                                                                <>
                                                                    <div className="animate-spin">
                                                                        <CreditCard className="mr-2 h-4 w-4" />
                                                                    </div>
                                                                    PROCESSING...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <CreditCard className="mr-2 h-4 w-4" />
                                                                    BUY NOW
                                                                </>
                                                            )}
                                                        </Button>
                                                    </>
                                                )}
                                            </CartForm>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </>
    );
};
