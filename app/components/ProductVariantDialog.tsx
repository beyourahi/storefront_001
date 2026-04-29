import {useCallback, useEffect, useMemo, useRef, useState, type ReactNode} from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {useFetcher} from "react-router";
import {CartForm, Image} from "@shopify/hydrogen";
import {
    AlertTriangle,
    CalendarClock,
    Check,
    CreditCard,
    Minus,
    Plus,
    ShoppingCart,
    X
} from "lucide-react";
import {Button} from "~/components/ui/button";
import {ButtonSpinner} from "~/components/ui/button-spinner";
import {formatShopifyMoney, getZeroPrice} from "~/lib/currency-formatter";
import {selectBestVariant, parseProductTitle} from "~/lib/product";
import {isPreorderProduct} from "~/lib/product/preorder-utils";
import type {ShopifyProduct, ShopifyProductVariant} from "~/lib/types/product-card";
import {ProductImagePlaceholder} from "~/components/ProductImagePlaceholder";
import {cn} from "~/lib/utils";
import {useLockBodyScroll} from "~/lib/LenisProvider";
import {CheckoutKitEmbed} from "~/components/checkout/CheckoutKitEmbed";

const productCache = new Map<string, ShopifyProduct>();

type CartMutationResponse = {
    cart?: {
        checkoutUrl?: string | null;
    } | null;
    errors?: Array<{message: string}> | null;
    warnings?: Array<{message: string}> | null;
};

interface ProductVariantDialogProps {
    productHandle: string;
    onSuccess?: () => void;
    autoAddSingleVariant?: boolean;
    disabled?: boolean;
    children: ReactNode;
}

export function ProductVariantDialog({
    productHandle,
    onSuccess,
    autoAddSingleVariant = false,
    disabled = false,
    children
}: ProductVariantDialogProps) {
    const triggerFetcher = useFetcher<CartMutationResponse>();
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [fetchedProduct, setFetchedProduct] = useState<ShopifyProduct | null>(null);
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [addToCartState, setAddToCartState] = useState<"idle" | "adding" | "success" | "returning">("idle");
    const fetchControllerRef = useRef<AbortController | null>(null);
    const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const triggerWasSubmittingRef = useRef(false);

    const currentProduct = fetchedProduct;

    useEffect(() => {
        return () => {
            if (fetchControllerRef.current) {
                fetchControllerRef.current.abort();
            }
            if (successTimerRef.current) {
                clearTimeout(successTimerRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (triggerFetcher.state !== "idle") {
            triggerWasSubmittingRef.current = true;
            return;
        }

        if (!triggerWasSubmittingRef.current) {
            return;
        }

        triggerWasSubmittingRef.current = false;
        setIsAddingToCart(false);

        if (triggerFetcher.data?.errors?.length) {
            setAddToCartState("idle");
            return;
        }

        setAddToCartState("success");
        onSuccess?.();

        successTimerRef.current = setTimeout(() => {
            setAddToCartState("idle");
            successTimerRef.current = null;
        }, 1500);
    }, [onSuccess, triggerFetcher.data, triggerFetcher.state]);

    const fetchProduct = async () => {
        const cachedProduct = productCache.get(productHandle);

        if (cachedProduct) {
            setFetchedProduct(cachedProduct);
            await handleProductAfterLoad(cachedProduct);
            return;
        }

        if (fetchControllerRef.current) {
            fetchControllerRef.current.abort();
        }

        const controller = new AbortController();
        fetchControllerRef.current = controller;
        setIsLoading(true);
        setFetchError(null);

        try {
            const response = await fetch(`/api/products/${productHandle}`, {
                signal: controller.signal
            });

            const data = (await response.json()) as {product?: ShopifyProduct; error?: string};

            if (!response.ok || !data.product) {
                setFetchError(data.error || "Product not found");
                if (autoAddSingleVariant) {
                    setOpen(true);
                }
                return;
            }

            productCache.set(productHandle, data.product);
            setFetchedProduct(data.product);
            await handleProductAfterLoad(data.product);
        } catch (error) {
            if (error instanceof Error && error.name === "AbortError") {
                return;
            }

            setFetchError("Unable to load product options");

            if (autoAddSingleVariant) {
                setOpen(true);
            }
        } finally {
            if (!controller.signal.aborted) {
                setIsLoading(false);
            }

            if (fetchControllerRef.current === controller) {
                fetchControllerRef.current = null;
            }
        }
    };

    const handleProductAfterLoad = async (product: ShopifyProduct) => {
        const productVariants = product.variants.edges.map(edge => edge.node);
        const productHasMultipleVariants = hasProductMultipleVariants(productVariants);

        if (autoAddSingleVariant && !productHasMultipleVariants) {
            autoAddToCart(productVariants, product);
            return;
        }

        setOpen(true);
    };

    const autoAddToCart = (productVariants: ShopifyProductVariant[], product: ShopifyProduct) => {
        const bestVariant = selectBestVariant(
            productVariants.filter(variant => variant.availableForSale).length > 0
                ? productVariants.filter(variant => variant.availableForSale)
                : productVariants
        );

        if (!bestVariant) {
            return;
        }

        if (successTimerRef.current) {
            clearTimeout(successTimerRef.current);
            successTimerRef.current = null;
        }

        setIsAddingToCart(true);
        setAddToCartState("adding");

        void triggerFetcher.submit(
            {
                cartFormInput: JSON.stringify({
                    action: CartForm.ACTIONS.LinesAdd,
                    inputs: {
                        lines: [
                            {
                                merchandiseId: bestVariant.id,
                                quantity: 1,
                                selectedVariant: {
                                    ...bestVariant,
                                    product: {id: product.id, title: product.title, handle: product.handle}
                                }
                            }
                        ]
                    }
                })
            },
            {method: "POST", action: "/cart"}
        );
    };

    const handleButtonClick = async () => {
        if (disabled || isAddingToCart || isLoading) {
            return;
        }

        if (fetchError) {
            setFetchError(null);
        }

        if (currentProduct) {
            await handleProductAfterLoad(currentProduct);
            return;
        }

        await fetchProduct();
    };

    const triggerDisabled =
        disabled || isLoading || isAddingToCart || addToCartState === "success" || addToCartState === "adding";

    return (
        <>
            <Button
                type="button"
                variant="outline"
                onClick={(e) => {
                    e.stopPropagation();
                    void handleButtonClick();
                }}
                disabled={triggerDisabled}
                className={cn(
                    "sleek !border-foreground/20 !bg-card !text-card-foreground hover:!bg-muted hover:!text-card-foreground hover:!border-foreground/40 inline-flex h-10 w-full shrink-0 items-center justify-center gap-2 rounded-md !border-2 px-4 text-sm font-medium whitespace-nowrap !opacity-100 shadow-xs outline-none hover:!scale-[1.02] hover:!shadow-md focus-visible:ring-[3px] active:!scale-[0.98]",
                    addToCartState === "success" &&
                        "!border-success !bg-success !text-success-foreground hover:!border-success hover:!bg-success/90",
                    addToCartState === "adding" && "cursor-wait",
                    triggerDisabled && addToCartState !== "success" && addToCartState !== "adding"
                        ? "disabled:pointer-events-none"
                        : ""
                )}
            >
                {isLoading || addToCartState === "adding" ? (
                    <ButtonSpinner />
                ) : fetchError ? (
                    <>
                        <AlertTriangle className="h-3 w-3" />
                        <span className="hidden sm:inline">TRY AGAIN</span>
                        <span className="sm:hidden">RETRY</span>
                    </>
                ) : addToCartState === "success" ? (
                    <>
                        <div className="animate-pulse">
                            <Check className="h-3 w-3" />
                        </div>
                        <span className="hidden sm:inline">ADDED!</span>
                        <span className="sm:hidden">ADDED</span>
                    </>
                ) : addToCartState === "returning" ? (
                    <>
                        <div className="animate-pulse">
                            <ShoppingCart className="h-3 w-3" />
                        </div>
                        {children}
                    </>
                ) : (
                    children
                )}
            </Button>

            {currentProduct ? (
                <ProductVariantDialogContent
                    product={currentProduct}
                    open={open}
                    onOpenChange={setOpen}
                    onSuccess={onSuccess}
                />
            ) : null}
        </>
    );
}

function ProductVariantDialogContent({
    product,
    open,
    onOpenChange,
    onSuccess
}: {
    product: ShopifyProduct;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}) {
    useLockBodyScroll(open);

    const addFetcher = useFetcher<CartMutationResponse>();
    const buyNowFetcher = useFetcher<CartMutationResponse>();
    const [selectedVariant, setSelectedVariant] = useState<ShopifyProductVariant | null>(null);
    const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
    const [quantity, setQuantity] = useState(1);
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [isBuyingNow, setIsBuyingNow] = useState(false);
    const [addToCartState, setAddToCartState] = useState<"idle" | "adding" | "success" | "returning">("idle");
    const [buyNowState, setBuyNowState] = useState<"idle" | "adding" | "redirecting">("idle");
    // Checkout URL resolved after the buyNow fetcher completes — passed to
    // CheckoutKitEmbed with autoOpen so the popup launches without full-page navigation.
    const [buyNowCheckoutUrl, setBuyNowCheckoutUrl] = useState<string | null>(null);
    const addSuccessTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const addWasSubmittingRef = useRef(false);
    const buyNowWasSubmittingRef = useRef(false);

    const allVariants = useMemo(() => product.variants.edges.map(edge => edge.node), [product.variants.edges]);
    const availableVariants = useMemo(() => allVariants.filter(variant => variant.availableForSale), [allVariants]);
    const productImages = useMemo(() => product.images.edges.map(edge => edge.node), [product.images.edges]);
    const hasRealVariants = useMemo(() => hasProductMultipleVariants(allVariants), [allVariants]);
    const hasRealOptions = useMemo(() => hasRealVariants && product.options.length > 0, [hasRealVariants, product.options.length]);
    const {primary: titlePrimary, secondary: titleSecondary} = useMemo(() => parseProductTitle(product.title), [product.title]);
    const isPreorder = useMemo(() => isPreorderProduct(product), [product]);

    useEffect(() => {
        if (Object.keys(selectedOptions).length > 0 || allVariants.length === 0) {
            return;
        }

        const bestVariant = selectBestVariant(availableVariants.length > 0 ? availableVariants : allVariants);

        if (!bestVariant) {
            return;
        }

        const nextSelectedOptions: Record<string, string> = {};

        for (const option of bestVariant.selectedOptions) {
            nextSelectedOptions[option.name] = option.value;
        }

        setSelectedOptions(nextSelectedOptions);
        setSelectedVariant(bestVariant);
    }, [allVariants, availableVariants, selectedOptions]);

    useEffect(() => {
        if (open) {
            return;
        }

        setAddToCartState("idle");
        setIsAddingToCart(false);
        setBuyNowState("idle");
        setIsBuyingNow(false);
        // Clear the checkout URL so it doesn't re-trigger on next dialog open.
        setBuyNowCheckoutUrl(null);

        if (addSuccessTimerRef.current) {
            clearTimeout(addSuccessTimerRef.current);
            addSuccessTimerRef.current = null;
        }

        if (redirectTimerRef.current) {
            clearTimeout(redirectTimerRef.current);
            redirectTimerRef.current = null;
        }
    }, [open]);

    useEffect(() => {
        return () => {
            if (addSuccessTimerRef.current) {
                clearTimeout(addSuccessTimerRef.current);
            }

            if (redirectTimerRef.current) {
                clearTimeout(redirectTimerRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (addFetcher.state !== "idle") {
            addWasSubmittingRef.current = true;
            return;
        }

        if (!addWasSubmittingRef.current) {
            return;
        }

        addWasSubmittingRef.current = false;
        setIsAddingToCart(false);

        if (addFetcher.data?.errors?.length) {
            setAddToCartState("idle");
            return;
        }

        setAddToCartState("success");
        onSuccess?.();

        addSuccessTimerRef.current = setTimeout(() => {
            setAddToCartState("idle");
            addSuccessTimerRef.current = null;
        }, 1500);
    }, [addFetcher.data, addFetcher.state, onSuccess]);

    useEffect(() => {
        if (buyNowFetcher.state !== "idle") {
            buyNowWasSubmittingRef.current = true;
            return;
        }

        if (!buyNowWasSubmittingRef.current) {
            return;
        }

        buyNowWasSubmittingRef.current = false;

        if (buyNowFetcher.data?.errors?.length) {
            setBuyNowState("idle");
            setIsBuyingNow(false);
            return;
        }

        setBuyNowState("redirecting");

        redirectTimerRef.current = setTimeout(() => {
            const checkoutUrl = buyNowFetcher.data?.cart?.checkoutUrl;

            if (checkoutUrl) {
                // Store the URL so CheckoutKitEmbed can open the popup.
                // The embed's auto-open effect fires once buyNowCheckoutUrl is set.
                setBuyNowCheckoutUrl(checkoutUrl);
                redirectTimerRef.current = null;
                return;
            }

            // No checkout URL returned (unexpected) — fall back to idle.
            setBuyNowState("idle");
            setIsBuyingNow(false);
            redirectTimerRef.current = null;
        }, 500);
    }, [buyNowFetcher.data, buyNowFetcher.state]);

    // Note: when buyNowCheckoutUrl is set, CheckoutKitEmbed with autoOpen=true
    // handles opening the popup automatically — no additional effect needed here.

    const activeVariant = selectedVariant ?? allVariants[0];
    const currentPrice = useMemo(() => {
        if (!activeVariant) {
            return {price: getZeroPrice(product.priceRange.minVariantPrice.currencyCode), onSale: false};
        }

        const price = formatShopifyMoney(activeVariant.price);
        const compareAtPrice = activeVariant.compareAtPrice ? formatShopifyMoney(activeVariant.compareAtPrice) : undefined;
        const onSale = Boolean(
            compareAtPrice &&
                activeVariant.compareAtPrice &&
                parseFloat(activeVariant.compareAtPrice.amount) > parseFloat(activeVariant.price.amount)
        );

        return {price, compareAtPrice, onSale};
    }, [activeVariant, product.priceRange.minVariantPrice.currencyCode]);

    const discountPercentage = useMemo(() => {
        if (!selectedVariant?.compareAtPrice?.amount || !selectedVariant?.price?.amount) {
            return 0;
        }
        const originalPrice = parseFloat(selectedVariant.compareAtPrice.amount);
        const salePrice = parseFloat(selectedVariant.price.amount);

        if (originalPrice <= salePrice) {
            return 0;
        }

        return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
    }, [selectedVariant]);

    const findMatchingVariant = useCallback((options: Record<string, string>) => {
        return (
            allVariants.find(variant => variant.selectedOptions.every(option => options[option.name] === option.value)) ??
            null
        );
    }, [allVariants]);

    const selectOption = useCallback((optionName: string, value: string) => {
        const nextSelectedOptions = {...selectedOptions, [optionName]: value};
        setSelectedOptions(nextSelectedOptions);
        setSelectedVariant(findMatchingVariant(nextSelectedOptions));
    }, [selectedOptions, findMatchingVariant]);

    const getAvailableValuesForOption = useCallback((optionName: string) => {
        const option = product.options.find(item => item.name === optionName);

        if (!option) {
            return [];
        }

        return option.values.filter(value => {
            const nextOptions = {...selectedOptions, [optionName]: value};
            const matchingVariant = findMatchingVariant(nextOptions);
            return Boolean(matchingVariant?.availableForSale);
        });
    }, [product.options, selectedOptions, findMatchingVariant]);

    const selectVariant = useCallback((variant: ShopifyProductVariant) => {
        setSelectedVariant(variant);
    }, []);

    const decreaseQuantity = useCallback(() => {
        setQuantity(currentQuantity => (currentQuantity > 1 ? currentQuantity - 1 : currentQuantity));
    }, []);

    const increaseQuantity = useCallback(() => {
        const maxQuantity = selectedVariant?.quantityAvailable || 1;
        setQuantity(currentQuantity => (currentQuantity < maxQuantity ? currentQuantity + 1 : currentQuantity));
    }, [selectedVariant?.quantityAvailable]);

    const handleAddToCart = useCallback(() => {
        if (!selectedVariant || isAddingToCart) {
            return;
        }

        if (addSuccessTimerRef.current) {
            clearTimeout(addSuccessTimerRef.current);
            addSuccessTimerRef.current = null;
        }

        setIsAddingToCart(true);
        setAddToCartState("adding");

        void addFetcher.submit(
            {
                cartFormInput: JSON.stringify({
                    action: CartForm.ACTIONS.LinesAdd,
                    inputs: {
                        lines: [
                            {
                                merchandiseId: selectedVariant.id,
                                quantity,
                                selectedVariant: {
                                    ...selectedVariant,
                                    product: {id: product.id, title: product.title, handle: product.handle}
                                }
                            }
                        ]
                    }
                })
            },
            {method: "POST", action: "/cart"}
        );
    }, [selectedVariant, isAddingToCart, quantity, addFetcher, product.id, product.title, product.handle]);

    const handleBuyNow = useCallback(() => {
        if (!selectedVariant || isBuyingNow || isAddingToCart) {
            return;
        }

        if (redirectTimerRef.current) {
            clearTimeout(redirectTimerRef.current);
            redirectTimerRef.current = null;
        }

        setIsBuyingNow(true);
        setBuyNowState("adding");

        void buyNowFetcher.submit(
            {
                cartFormInput: JSON.stringify({
                    action: CartForm.ACTIONS.LinesAdd,
                    inputs: {
                        lines: [
                            {
                                merchandiseId: selectedVariant.id,
                                quantity,
                                selectedVariant: {
                                    ...selectedVariant,
                                    product: {id: product.id, title: product.title, handle: product.handle}
                                }
                            }
                        ]
                    }
                })
            },
            {method: "POST", action: "/cart"}
        );
    }, [selectedVariant, isBuyingNow, isAddingToCart, quantity, buyNowFetcher, product.id, product.title, product.handle]);

    return (
        <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="bg-background/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-[var(--z-nested-overlay)] backdrop-blur-sm" />
                <DialogPrimitive.Content
                    className={cn(
                        "bg-background fixed top-[50%] left-[50%] z-[var(--z-nested-modal)] h-auto w-[92vw] max-w-[380px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-lg border-0 p-0 shadow-2xl",
                        "max-h-[calc(100dvh-2rem)]",
                        "data-[state=open]:animate-in data-[state=closed]:animate-out",
                        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
                        "sm:max-w-[480px] md:w-[700px] md:max-w-2xl lg:w-[900px] xl:w-[1100px] 2xl:w-[1300px]"
                    )}
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                >
                    <DialogPrimitive.Title className="sr-only">{product.title}</DialogPrimitive.Title>
                    <DialogPrimitive.Description className="sr-only">
                        Select a variant and quantity, then add this product to the cart or continue to checkout.
                    </DialogPrimitive.Description>
                    <div className="bg-background flex h-full flex-col lg:flex-row">
                    <div className="border-border/10 hidden max-h-[55vh] flex-shrink-0 border-r lg:block lg:w-2/5">
                        {productImages.length > 0 ? (
                            <div className="h-full overflow-x-hidden overflow-y-auto p-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                <div className="space-y-3">
                                    {productImages.map((image, index) => (
                                        <div
                                            key={image.id ?? `${image.url}-${index}`}
                                            className="relative aspect-square w-full overflow-hidden rounded-lg shadow-md"
                                        >
                                            <Image
                                                data={{url: image.url, altText: image.altText || `${product.title} - Image ${index + 1}`}}
                                                sizes="(min-width: 1024px) 40vw, 80vw"
                                                aspectRatio="1/1"
                                                loading={index === 0 ? "eager" : "lazy"}
                                                className="sleek h-full w-full object-cover hover:scale-105"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <ProductImagePlaceholder aspectRatio="square" className="h-full w-full rounded-none" />
                        )}
                    </div>

                    <div className="relative flex min-h-0 w-full flex-col lg:w-3/5">
                        <DialogPrimitive.Close
                            className="sleek bg-background/90 hover:bg-background absolute top-6 right-6 z-20 rounded-full p-2 opacity-90 shadow-lg backdrop-blur-sm hover:scale-105 hover:opacity-100 disabled:pointer-events-none"
                            aria-label="Close"
                        >
                            <X className="h-4 w-4" />
                        </DialogPrimitive.Close>

                        <div className="flex flex-1 flex-col p-4">
                            <div className="flex-1 overflow-y-auto">
                                {discountPercentage ? (
                                    <div className="mb-1.5">
                                        <div className="bg-discount-bg text-discount-text border-discount-icon-bg inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold">
                                            -{discountPercentage}%
                                        </div>
                                    </div>
                                ) : null}

                                <div className="mb-8 sm:mb-10">
                                    <div className="flex gap-4 lg:block">
                                        <div className="flex-shrink-0 overflow-hidden rounded-lg shadow-md lg:hidden">
                                            {productImages.length > 0 ? (
                                                <div className="relative h-20 w-20">
                                                    <Image
                                                        data={{url: productImages[0].url, altText: productImages[0].altText || product.title}}
                                                        sizes="80px"
                                                        aspectRatio="1/1"
                                                        loading="eager"
                                                        className="h-full w-full object-cover"
                                                    />
                                                </div>
                                            ) : (
                                                <ProductImagePlaceholder compact className="h-20 w-20" />
                                            )}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="mb-1 sm:mb-1.5">
                                                <h2 className="text-foreground text-base leading-tight font-semibold tracking-tight 2xl:text-lg">
                                                    {titlePrimary}
                                                </h2>
                                                {titleSecondary ? (
                                                    <h3 className="text-muted-foreground mt-1 text-xs font-semibold 2xl:text-sm">
                                                        {titleSecondary}
                                                    </h3>
                                                ) : null}
                                            </div>

                                            <div className="flex items-baseline gap-2 sm:gap-3">
                                                <span className="text-foreground font-mono text-sm font-bold tracking-tight lg:text-base">
                                                    {currentPrice.price}
                                                </span>
                                                {currentPrice.compareAtPrice ? (
                                                    <span className="text-muted-foreground font-mono text-sm line-through lg:text-base">
                                                        {currentPrice.compareAtPrice}
                                                    </span>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {hasRealOptions ? (
                                    <div className="mb-5 space-y-2.5 sm:mb-6 sm:space-y-3">
                                        {product.options.map(option => (
                                            <div key={option.id}>
                                                <h3 className="text-foreground mb-0.5 text-sm font-semibold tracking-wide sm:mb-1">
                                                    {option.name}
                                                </h3>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    {getAvailableValuesForOption(option.name).map(value => {
                                                        const isSelected = selectedOptions[option.name] === value;

                                                        return (
                                                            <Button
                                                                key={value}
                                                                type="button"
                                                                variant={isSelected ? "default" : "outline"}
                                                                size="sm"
                                                                onClick={() => selectOption(option.name, value)}
                                                            >
                                                                {value}
                                                            </Button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}

                                        {selectedVariant && !selectedVariant.availableForSale ? (
                                            <div className="bg-destructive/10 border-destructive/20 flex animate-pulse items-center gap-3 rounded-lg border-2 p-4 shadow-sm">
                                                <AlertTriangle className="text-destructive h-5 w-5 flex-shrink-0" />
                                                <p className="text-destructive text-sm font-semibold">
                                                    This combination is currently out of stock.
                                                </p>
                                            </div>
                                        ) : null}
                                    </div>
                                ) : hasRealVariants ? (
                                    <div className="mb-5 sm:mb-6">
                                        <h3 className="text-foreground mb-0.5 text-sm font-semibold tracking-wide sm:mb-1">
                                            Options
                                        </h3>
                                        <div className="flex flex-wrap items-center gap-2">
                                            {availableVariants
                                                .filter(variant => variant.title !== "Default Title")
                                                .map(variant => (
                                                    <Button
                                                        key={variant.id}
                                                        type="button"
                                                        variant={selectedVariant?.id === variant.id ? "default" : "outline"}
                                                        size="sm"
                                                        onClick={() => selectVariant(variant)}
                                                    >
                                                        {variant.selectedOptions[0]?.value !== "Default Title"
                                                            ? variant.selectedOptions[0]?.value
                                                            : variant.title}
                                                    </Button>
                                                ))}
                                        </div>
                                    </div>
                                ) : null}

                                <div className="mb-8">
                                    <h3 className="text-foreground mb-0.5 text-sm font-semibold tracking-wide sm:mb-1">
                                        Quantity
                                    </h3>
                                    <div className="flex w-fit items-center overflow-hidden rounded-lg">
                                        <Button
                                            type="button"
                                            className="rounded-r-none border-r-0"
                                            onClick={decreaseQuantity}
                                            disabled={quantity <= 1}
                                        >
                                            <Minus className="h-4 w-4" />
                                        </Button>
                                        <div className="bg-background text-foreground flex h-10 w-10 items-center justify-center text-sm font-medium">
                                            {quantity}
                                        </div>
                                        <Button
                                            type="button"
                                            className="rounded-l-none border-l-0"
                                            onClick={increaseQuantity}
                                            disabled={quantity >= (selectedVariant?.quantityAvailable || 1)}
                                        >
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div className="border-border/10 flex-shrink-0 space-y-1.5 border-t pt-2 sm:space-y-2">
                                <Button
                                    type="button"
                                    onClick={handleAddToCart}
                                    className={cn(
                                        "sleek cta-primary-emphasis h-12 w-full shadow-lg hover:shadow-xl active:scale-[0.98] sm:h-12",
                                        addToCartState === "success"
                                            ? "border-success bg-success text-success-foreground hover:border-success hover:bg-success/90"
                                            : "",
                                        addToCartState === "adding" ? "cursor-wait" : ""
                                    )}
                                    disabled={!selectedVariant || isAddingToCart}
                                >
                                    {addToCartState === "adding" ? (
                                        <ButtonSpinner />
                                    ) : addToCartState === "success" ? (
                                        <>
                                            <div className="animate-pulse">
                                                <Check className="mr-2 h-4 w-4" />
                                            </div>
                                            ADDED!
                                        </>
                                    ) : addToCartState === "returning" ? (
                                        <>
                                            <div className="animate-pulse">
                                                {isPreorder ? (
                                                    <CalendarClock className="mr-1 h-4 w-4 font-semibold" />
                                                ) : (
                                                    <ShoppingCart className="mr-1 h-4 w-4 font-semibold" />
                                                )}
                                            </div>
                                            <span className="font-semibold">
                                                {isPreorder ? "PRE ORDER" : "ADD TO CART"}
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            {isPreorder ? (
                                                <CalendarClock className="mr-2 h-4 w-4" />
                                            ) : (
                                                <ShoppingCart className="mr-2 h-4 w-4" />
                                            )}
                                            {isPreorder ? "PRE ORDER" : "ADD TO CART"}
                                        </>
                                    )}
                                </Button>

                                {!isPreorder ? (
                                    <>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={handleBuyNow}
                                            className={cn(
                                                "sleek h-10 w-full font-medium active:scale-[0.98] sm:h-10",
                                                buyNowState === "adding" || buyNowState === "redirecting"
                                                    ? "cursor-wait"
                                                    : ""
                                            )}
                                            disabled={!selectedVariant || isBuyingNow || isAddingToCart}
                                        >
                                            {buyNowState === "adding" || buyNowState === "redirecting" ? (
                                                <ButtonSpinner />
                                            ) : (
                                                <>
                                                    <CreditCard className="mr-2 h-4 w-4" />
                                                    BUY NOW
                                                </>
                                            )}
                                        </Button>

                                        {/*
                                         * CheckoutKitEmbed for Buy Now flow.
                                         * Rendered hidden once the buyNow fetcher resolves with a checkoutUrl.
                                         * autoOpen=true causes the popup to open automatically on mount.
                                         * The visible trigger above remains the user-facing button; this embed
                                         * only serves as the Checkout Kit popup host.
                                         */}
                                        {buyNowCheckoutUrl ? (
                                            <CheckoutKitEmbed
                                                checkoutUrl={buyNowCheckoutUrl}
                                                mode="popup"
                                                autoOpen={true}
                                                className="sr-only"
                                                onComplete={() => {
                                                    setBuyNowCheckoutUrl(null);
                                                }}
                                            >
                                                {/* Hidden — popup is opened programmatically via autoOpen. */}
                                                <span>Buy Now</span>
                                            </CheckoutKitEmbed>
                                        ) : null}
                                    </>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </div>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}

function hasProductMultipleVariants(variants: ShopifyProductVariant[]) {
    if (variants.length === 0) {
        return false;
    }

    const realVariants = variants.filter(variant => {
        const hasRealTitle = variant.title && variant.title !== "Default Title";
        const hasRealOptions = variant.selectedOptions.some(option => option.value && option.value !== "Default Title");

        return hasRealTitle || hasRealOptions;
    });

    return realVariants.length > 1;
}
