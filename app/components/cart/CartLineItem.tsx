import type {CartLineUpdateInput} from "@shopify/hydrogen/storefront-api-types";
import {CartForm, Image, type OptimisticCartLine, OptimisticInput, useOptimisticData} from "@shopify/hydrogen";
import {formatShopifyMoney} from "~/lib/currency-formatter";
import type {CartApiQueryFragment} from "storefrontapi.generated";
import {Link, useFetcher} from "react-router";
import {Trash2, Minus, Plus, AlertTriangle, XCircle} from "lucide-react";
import {useEffect, useState} from "react";
import {getCartLineKey, useCartLineMutating, useCartMutationPending} from "~/lib/cart-utils";
import {Button} from "~/components/ui/button";
import {Spinner} from "~/components/ui/spinner";
import {Alert, AlertDescription} from "~/components/ui/alert";
import {useCartDrawer} from "~/hooks/useCartDrawer";
import {parseProductTitle} from "~/lib/product";
import {cn} from "~/lib/utils";
import {ProductImagePlaceholder} from "~/components/ProductImagePlaceholder";
import {PriceLoadingIndicator} from "~/components/common/PriceLoadingIndicator";

type CartLine = OptimisticCartLine<CartApiQueryFragment>;


export function CartLineItem({line}: {line: CartLine}) {
    const {id, merchandise, quantity, cost} = line;
    const {product, image, title: variantTitle, quantityAvailable} = merchandise;
    const {close} = useCartDrawer();
    const fetcher = useFetcher({key: getCartLineKey([id])});
    const isMutating = useCartMutationPending();
    const optimisticData = useOptimisticData<{action?: string}>(id);
    const isRemoving = optimisticData?.action === "remove";
    const [showError, setShowError] = useState(false);
    const [showWarning, setShowWarning] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [warningMessage, setWarningMessage] = useState("");

    const {primary: titlePrimary, secondary: titleSecondary} = parseProductTitle(product.title);
    const maxQuantity = Math.min(999, quantityAvailable || 999);

    // Optimistic lines from useOptimisticCart have no `cost` field by design.
    // Cart Suggestions is inside the already-open drawer, so the optimistic line
    // renders immediately before the server response arrives — compute cost from
    // merchandise.price * quantity to prevent the crash.
    const optimisticCost =
        !cost && line.isOptimistic
            ? {
                  totalAmount: {
                      amount: String(parseFloat(merchandise.price?.amount ?? "0") * quantity),
                      currencyCode: merchandise.price?.currencyCode ?? "USD"
                  }
              }
            : undefined;
    const effectiveCost = cost ?? optimisticCost;

    // Child lines have a parentRelationship pointing to their parent cart line
    const parentRelationship = (line as any).parentRelationship as
        | {
              parent: {
                  id: string;
                  merchandise: {title: string; product: {title: string; handle: string}} | null;
              };
          }
        | null
        | undefined;
    const isChildLine = !!parentRelationship;
    const parentProductTitle =
        parentRelationship?.parent?.merchandise?.product?.title ?? parentRelationship?.parent?.merchandise?.title;

    useEffect(() => {
        if (fetcher.state === "idle" && fetcher.data) {
            const {errors, warnings} = fetcher.data;

            if (errors?.length) {
                const firstError = errors[0];
                const message =
                    firstError.code === "MERCHANDISE_LINE_TRANSFORMERS_RUN_ERROR"
                        ? "A promotion couldn't be applied to this item. Please try again."
                        : firstError.message;
                setErrorMessage(message);
                setShowError(true);
                setShowWarning(false);
                const timer = setTimeout(() => setShowError(false), 5000);
                return () => clearTimeout(timer);
            }

            if (warnings?.length) {
                setWarningMessage(warnings[0].message);
                setShowWarning(true);
                setShowError(false);
                const timer = setTimeout(() => setShowWarning(false), 5000);
                return () => clearTimeout(timer);
            }
        }
    }, [fetcher.state, fetcher.data]);

    return (
        <div
            className={cn("relative flex flex-col gap-4 py-4", isChildLine && "ml-6 pl-4")}
            role="group"
            aria-labelledby={`cart-item-${id}`}
            style={{display: isRemoving ? "none" : undefined}}
        >
            {isChildLine && parentProductTitle && (
                <p className="text-muted-foreground text-xs">Add-on for: {parentProductTitle}</p>
            )}
            <div className="flex gap-4">
                <CartLineImage
                    image={image}
                    altText={image?.altText || product.title}
                    handle={product.handle}
                    onNavigate={close}
                    small={isChildLine}
                />

                <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                        <CartLineDetails
                            id={id}
                            handle={product.handle}
                            titlePrimary={titlePrimary}
                            titleSecondary={titleSecondary}
                            variantTitle={variantTitle}
                            onNavigate={close}
                        />
                        <CartLineRemoveButton lineId={id} productTitle={product.title} disabled={!!line.isOptimistic || isMutating} />
                    </div>

                    <div className="flex items-center justify-between">
                        {isChildLine ? (
                            <span className="text-muted-foreground text-xs">Qty: {quantity}</span>
                        ) : (
                            <CartLineQuantity
                                lineId={id}
                                quantity={quantity}
                                maxQuantity={maxQuantity}
                                productTitle={product.title}
                                disabled={!!line.isOptimistic || isMutating}
                            />
                        )}
                        <CartLinePricing cost={effectiveCost} quantity={quantity} lineId={id} />
                    </div>
                </div>
            </div>

            {showError && (
                <Alert variant="destructive" className="mt-2">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
            )}

            {showWarning && (
                <Alert className="mt-2 border-0 bg-[var(--cart-warning-bg)] text-[var(--cart-warning-fg)]">
                    <AlertTriangle className="h-4 w-4 text-[var(--cart-warning-icon)]" />
                    <AlertDescription>{warningMessage}</AlertDescription>
                </Alert>
            )}
        </div>
    );
}

function CartLineImage({
    image,
    altText,
    handle,
    onNavigate,
    small = false
}: {
    image?: {url: string; altText?: string | null} | null;
    altText: string;
    handle: string;
    onNavigate: () => void;
    small?: boolean;
}) {
    const size = small ? 48 : 64;
    return (
        <div className="shrink-0">
            <Link to={`/products/${handle}`} prefetch="viewport" className="block" onClick={onNavigate}>
                {image ? (
                    <Image
                        alt={altText}
                        aspectRatio="1/1"
                        data={image}
                        height={size}
                        width={size}
                        loading="lazy"
                        className={cn(
                            "motion-image rounded-sm object-cover hover:scale-[1.03]",
                            small ? "size-12" : "size-16"
                        )}
                    />
                ) : (
                    <ProductImagePlaceholder
                        compact
                        className={cn("rounded-sm", small ? "size-12" : "size-16")}
                    />
                )}
            </Link>
        </div>
    );
}

function CartLineDetails({
    id,
    handle,
    titlePrimary,
    titleSecondary,
    variantTitle,
    onNavigate
}: {
    id: string;
    handle: string;
    titlePrimary: string;
    titleSecondary: string | null;
    variantTitle: string;
    onNavigate: () => void;
}) {
    return (
        <div>
            <Link
                to={`/products/${handle}`}
                prefetch="viewport"
                className="motion-link block hover:opacity-80"
                onClick={onNavigate}
                aria-describedby={`cart-item-details-${id}`}
            >
                <h4 id={`cart-item-${id}`} className="text-foreground text-sm font-medium">
                    {titlePrimary}
                </h4>
                {titleSecondary && <h4 className="opacity-50 text-xs font-normal">{titleSecondary}</h4>}
            </Link>
            {variantTitle !== "Default Title" && <p className="text-muted-foreground text-sm">{variantTitle}</p>}
        </div>
    );
}

function CartLinePricing({cost, quantity, lineId}: {cost: CartLine["cost"] | undefined; quantity: number; lineId: string}) {
    const totalAmount = cost?.totalAmount;
    const isMutating = useCartLineMutating(lineId);
    if (!totalAmount) return null;
    const perItemAmount = (parseFloat(totalAmount.amount) / quantity).toFixed(2);

    return (
        <div className="text-right">
            <div
                className="text-foreground font-mono text-base font-bold tracking-tight tabular-nums antialiased sm:text-base flex items-center justify-end"
                aria-label="Line total"
            >
                {isMutating ? <PriceLoadingIndicator /> : formatShopifyMoney(totalAmount)}
            </div>
            <div
                className={cn(
                    "text-muted-foreground gap-2 text-xs sm:text-sm flex items-baseline justify-end",
                    quantity > 1 && !isMutating ? "opacity-100" : "opacity-0"
                )}
            >
                <span className="font-mono font-medium tracking-tight tabular-nums" aria-label="Price per item">
                    {formatShopifyMoney({amount: perItemAmount, currencyCode: totalAmount.currencyCode})}
                </span>
                <span>each</span>
            </div>
        </div>
    );
}

function CartLineQuantity({
    lineId,
    quantity,
    maxQuantity,
    productTitle,
    disabled
}: {
    lineId: string;
    quantity: number;
    maxQuantity: number;
    productTitle: string;
    disabled: boolean;
}) {
    const prevQuantity = Math.max(0, quantity - 1);
    const nextQuantity = quantity + 1;
    const canDecrease = quantity > 1 && !disabled;
    const canIncrease = !disabled && quantity < maxQuantity;

    return (
        <div className={cn("flex w-fit items-center overflow-hidden rounded-lg", disabled && "opacity-50")}>
            <CartLineUpdateButton lines={[{id: lineId, quantity: prevQuantity}]}>
                <Button
                    type="submit"
                    disabled={!canDecrease}
                    className={cn("rounded-r-none border-0", !canDecrease && "cursor-not-allowed")}
                    aria-label={`Decrease quantity to ${quantity - 1}`}
                >
                    <Minus className="h-4 w-4" />
                </Button>
            </CartLineUpdateButton>

            <div className="relative">
                {disabled && (
                    <div className="bg-background border-input absolute inset-0 flex items-center justify-center border-0">
                        <Spinner className="h-4 w-4" />
                    </div>
                )}
                <div
                    className={cn(
                        "flex h-10 w-10 items-center justify-center border-0 text-sm font-medium",
                        "bg-background text-foreground",
                        disabled && "opacity-50"
                    )}
                    aria-label={`Quantity for ${productTitle}`}
                >
                    {quantity}
                </div>
            </div>

            <CartLineUpdateButton lines={[{id: lineId, quantity: nextQuantity}]}>
                <Button
                    type="submit"
                    disabled={!canIncrease}
                    className={cn("rounded-l-none border-0", !canIncrease && "cursor-not-allowed")}
                    aria-label={`Increase quantity to ${quantity + 1}`}
                >
                    <Plus className="h-4 w-4" />
                </Button>
            </CartLineUpdateButton>
        </div>
    );
}

function CartLineRemoveButton({
    lineId,
    productTitle,
    disabled
}: {
    lineId: string;
    productTitle: string;
    disabled: boolean;
}) {
    return (
        <CartForm
            fetcherKey={getCartLineKey([lineId])}
            route="/cart"
            action={CartForm.ACTIONS.LinesRemove}
            inputs={{lineIds: [lineId]}}
        >
            <OptimisticInput id={lineId} data={{action: "remove"}} />
            <Button
                type="submit"
                variant="ghost"
                size="sm"
                className={cn(
                    "group h-8 w-8 rounded-md p-0 sleek",
                    "text-destructive bg-destructive/10 hover:text-destructive hover:bg-destructive/20",
                    disabled && "cursor-wait opacity-50"
                )}
                disabled={disabled}
                aria-label={`Remove ${productTitle} from cart`}
            >
                <Trash2 className="sleek h-4 w-4 group-hover:scale-110" />
            </Button>
        </CartForm>
    );
}

function CartLineUpdateButton({children, lines}: {children: React.ReactNode; lines: CartLineUpdateInput[]}) {
    const lineIds = lines.map(line => line.id);

    return (
        <CartForm
            fetcherKey={getCartLineKey(lineIds)}
            route="/cart"
            action={CartForm.ACTIONS.LinesUpdate}
            inputs={{lines}}
        >
            <OptimisticInput id={lines[0].id} data={{action: "update", quantity: lines[0].quantity}} />
            {children}
        </CartForm>
    );
}
