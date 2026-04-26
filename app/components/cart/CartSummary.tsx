import {CartForm} from "@shopify/hydrogen";
import type {OptimisticCart} from "@shopify/hydrogen";
import type {CartApiQueryFragment} from "storefrontapi.generated";
import {useEffect, useRef, useState, useCallback} from "react";
import {useFetcher, useRouteLoaderData} from "react-router";
import type {RootLoader} from "~/root";
import {appendAiAttribution} from "~/lib/ai-attribution";
import {CART_FETCHER_KEY, useCartMutationPending} from "~/lib/cart-utils";
import {FileText, Check, Cloud, CreditCard, Trash2, AlertTriangle} from "lucide-react";
import {toast} from "sonner";
import {Button} from "~/components/ui/button";
import {Dialog, DialogContent, DialogTitle, DialogTrigger} from "~/components/ui/dialog";
import {AlertDialog, AlertDialogContent, AlertDialogTitle} from "~/components/ui/alert-dialog";
import {Textarea} from "~/components/ui/textarea";
import {ButtonSpinner} from "~/components/ui/button-spinner";
import {PriceLoadingIndicator} from "~/components/common/PriceLoadingIndicator";
import {useIsMobile} from "~/hooks/useIsMobile";
import {cn} from "~/lib/utils";
import {formatShopifyMoney} from "~/lib/currency-formatter";

type Cart = OptimisticCart<CartApiQueryFragment>;


export function CartSummary({cart}: {cart: Cart}) {
    const totalAmount = cart.cost?.subtotalAmount;
    const noteValue = cart.note;
    const productCount = cart.lines?.nodes?.length ?? 0;
    const checkoutUrl = cart.checkoutUrl;
    const lineIds = (cart.lines?.nodes ?? []).map(line => line.id);
    return (
        <div className="bg-background shrink-0 rounded-l-2xl px-4 py-4 md:px-6">
            <div className="space-y-4">
                <CartOrderNote noteValue={noteValue} />

                <div className="space-y-3">
                    <div className="flex gap-2">
                        <CartCheckoutActions
                            checkoutUrl={checkoutUrl}
                            totalAmount={totalAmount}
                            productCount={productCount}
                        />
                        <CartClearConfirmation
                            productCount={productCount}
                            totalAmount={totalAmount}
                            lineIds={lineIds}
                            cart={cart}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

function CartOrderNote({noteValue}: {noteValue?: string | null}) {
    const isMobile = useIsMobile();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [mobileNoteValue, setMobileNoteValue] = useState(noteValue || "");
    const [showSavedConfirmation, setShowSavedConfirmation] = useState(false);
    const [noteButtonState, setNoteButtonState] = useState<"idle" | "adding" | "updating" | "added" | "updated">(
        "idle"
    );
    const noteFetcher = useFetcher({key: "note-update"});
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isUpdatingNote = noteFetcher.state !== "idle";

    useEffect(() => {
        setMobileNoteValue(noteValue || "");
    }, [noteValue]);

    useEffect(() => {
        if (noteFetcher.state === "idle" && noteFetcher.data) {
            const {errors} = noteFetcher.data;
            if (errors?.length) {
                toast.error(`Note: ${errors[0].message}`);
            }
        }
    }, [noteFetcher.state, noteFetcher.data]);

    useEffect(() => {
        if (isMobile && (noteButtonState === "added" || noteButtonState === "updated")) {
            const timer = setTimeout(() => {
                setDialogOpen(false);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [isMobile, noteButtonState]);

    useEffect(() => {
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
            if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
        };
    }, []);

    const submitNote = useCallback(
        (note: string) => {
            const formData = new FormData();
            formData.append(
                "cartFormInput",
                JSON.stringify({
                    action: CartForm.ACTIONS.NoteUpdate,
                    inputs: {}
                })
            );
            formData.append("note", note);
            void noteFetcher.submit(formData, {method: "POST", action: "/cart"});
        },
        [noteFetcher]
    );

    const handleDesktopNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
        setShowSavedConfirmation(false);

        debounceRef.current = setTimeout(() => {
            submitNote(value);
            setShowSavedConfirmation(true);
            savedTimerRef.current = setTimeout(() => {
                setShowSavedConfirmation(false);
            }, 1500);
        }, 800);
    };

    const handleMobileNoteSubmit = () => {
        const hasExisting = noteValue?.trim();
        setNoteButtonState(hasExisting ? "updating" : "adding");
        submitNote(mobileNoteValue);
        setTimeout(() => {
            setNoteButtonState(hasExisting ? "updated" : "added");
            setTimeout(() => {
                setNoteButtonState("idle");
            }, 1500);
        }, 500);
    };

    return (
        <div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger
                    className={cn(
                        "sleek bg-secondary text-secondary-foreground ring-offset-background",
                        "focus-visible:ring-ring inline-flex w-full items-center justify-start gap-2",
                        "rounded-md px-0 py-2 pl-4 text-sm font-normal",
                        "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                        "disabled:pointer-events-none disabled:opacity-50"
                    )}
                >
                    <FileText className="h-4 w-4 shrink-0" />
                    {noteValue?.trim() ? (
                        <div className="flex min-w-0 flex-1 items-center gap-1.5 pr-4">
                            <span className="shrink-0">Edit note</span>
                            <span className="text-muted-foreground shrink-0">&middot;</span>
                            <span className="text-muted-foreground truncate text-xs">{noteValue.trim()}</span>
                        </div>
                    ) : (
                        <span>Add order note</span>
                    )}
                </DialogTrigger>

                <DialogContent
                    overlayClassName="bg-overlay-dark z-[var(--z-nested-overlay)] backdrop-blur-md"
                    className="border-0 bg-background/95 z-[var(--z-nested-modal)] shadow-2xl backdrop-blur-sm sm:max-w-[500px]"
                    showCloseButton={true}
                >
                    <DialogTitle>Order Note</DialogTitle>
                    <div className="mt-4">
                        <div className="relative">
                            <Textarea
                                id="cart-note-dialog"
                                placeholder="Add a note for your order"
                                defaultValue={isMobile ? undefined : noteValue || ""}
                                value={isMobile ? mobileNoteValue : undefined}
                                onChange={isMobile ? e => setMobileNoteValue(e.target.value) : handleDesktopNoteChange}
                                disabled={isUpdatingNote}
                                className="cart-note-textarea max-h-[240px] min-h-[120px] resize-none overflow-y-auto pr-10 rounded-md"
                                style={
                                    isMobile
                                        ? {
                                              fontSize: "16px",
                                              transform: "scale(0.875)",
                                              transformOrigin: "left top",
                                              width: "calc(100% / 0.875)",
                                              marginBottom: "calc(-80px * 0.125)"
                                          }
                                        : undefined
                                }
                            />
                            {isUpdatingNote ? (
                                <div
                                    className="sleek text-muted-foreground absolute top-3 right-3"
                                    aria-label="Saving note"
                                >
                                    <Cloud className="h-4 w-4 animate-pulse" />
                                </div>
                            ) : showSavedConfirmation ? (
                                <div
                                    className="text-success sleek absolute top-3 right-3"
                                    aria-label="Note saved"
                                >
                                    <Check className="h-4 w-4" />
                                </div>
                            ) : null}
                        </div>
                        {!isMobile ? (
                            <p className="text-muted-foreground mt-2 text-xs">
                                Your note will be automatically saved as you type.
                            </p>
                        ) : (
                            <div className="mt-3">
                                <Button
                                    onClick={handleMobileNoteSubmit}
                                    disabled={noteButtonState !== "idle"}
                                    size="sm"
                                    className={cn(
                                        "w-full",
                                        (noteButtonState === "added" || noteButtonState === "updated") &&
                                            "bg-success text-success-foreground hover:bg-success/90"
                                    )}
                                >
                                    {noteButtonState === "adding" ? (
                                        <ButtonSpinner />
                                    ) : noteButtonState === "added" ? (
                                        <>
                                            <div className="animate-pulse">
                                                <Check className="mr-2 h-4 w-4" />
                                            </div>
                                            Added!
                                        </>
                                    ) : noteButtonState === "updating" ? (
                                        <ButtonSpinner />
                                    ) : noteButtonState === "updated" ? (
                                        <>
                                            <div className="animate-pulse">
                                                <Check className="mr-2 h-4 w-4" />
                                            </div>
                                            Updated!
                                        </>
                                    ) : (
                                        <>
                                            <FileText className="mr-2 h-4 w-4" />
                                            {noteValue?.trim() ? "Update Note" : "Add Note"}
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function CartCheckoutActions({
    checkoutUrl,
    totalAmount,
    productCount
}: {
    checkoutUrl?: string;
    totalAmount?: Cart["cost"]["subtotalAmount"] | null;
    productCount: number;
}) {
    const isMobile = useIsMobile();
    const isMutating = useCartMutationPending();
    const rootData = useRouteLoaderData<RootLoader>("root");

    if (!checkoutUrl) return null;

    const taggedCheckoutUrl = rootData?.aiAttribution
        ? appendAiAttribution(checkoutUrl, rootData.aiAttribution)
        : checkoutUrl;

    return (
        <a
            href={taggedCheckoutUrl}
            target="_self"
            aria-disabled={isMutating || undefined}
            onClick={isMutating ? e => e.preventDefault() : undefined}
            className={cn(
                "cta-primary-emphasis inline-flex items-center justify-center gap-2 font-bold",
                "bg-primary text-primary-foreground hover:bg-primary/90 rounded-md",
                productCount > 1 ? "flex-1" : "w-full",
                isMobile ? "h-14 py-6" : "h-12",
                isMutating && "pointer-events-none opacity-50 cursor-not-allowed"
            )}
        >
            <CreditCard className="h-4 w-4" />
            Checkout{totalAmount ? " - " : ""}
            {totalAmount && (isMutating ? <PriceLoadingIndicator className="ml-0.5" /> : formatShopifyMoney(totalAmount))}
        </a>
    );
}

function CartClearConfirmation({
    productCount,
    totalAmount,
    lineIds,
    cart
}: {
    productCount: number;
    totalAmount?: Cart["cost"]["subtotalAmount"] | null;
    lineIds: string[];
    cart: Cart;
}) {
    const isMobile = useIsMobile();
    const isMutating = useCartMutationPending();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [isHolding, setIsHolding] = useState(false);
    const [holdProgress, setHoldProgress] = useState(0);
    const holdTimerRef = useRef<number | null>(null);
    const backupRef = useRef<Cart["lines"]["nodes"] | null>(null);
    const undoFetcher = useFetcher({key: "cart-undo"});

    const formatAmount = totalAmount ? formatShopifyMoney(totalAmount) : "";

    const getConfirmationMessage = () => {
        const totalAmountNum = totalAmount ? parseFloat(totalAmount.amount) : 0;
        if (totalAmountNum > 100) {
            return `Are you sure? You're about to remove ${formatAmount} worth of items.`;
        } else if (productCount > 5) {
            return `Remove all ${productCount} items from your cart?`;
        }
        return "Clear your entire selection?";
    };

    const startHolding = () => {
        setIsHolding(true);
        setHoldProgress(0);
        const startTime = Date.now();
        const duration = 1500;

        const updateProgress = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min((elapsed / duration) * 100, 100);
            setHoldProgress(progress);

            if (progress >= 100) {
                confirmClear();
                return;
            }
            holdTimerRef.current = requestAnimationFrame(updateProgress);
        };
        holdTimerRef.current = requestAnimationFrame(updateProgress);
    };

    const stopHolding = () => {
        if (holdTimerRef.current !== null) {
            cancelAnimationFrame(holdTimerRef.current);
            holdTimerRef.current = null;
        }
        setIsHolding(false);
        setHoldProgress(0);
    };

    const confirmClear = () => {
        setDialogOpen(false);
        setIsHolding(false);
        setHoldProgress(0);

        backupRef.current = cart.lines?.nodes ?? null;

        toast("Cart cleared", {
            duration: 5000,
            action: {
                label: "Undo",
                onClick: handleUndo
            }
        });
    };

    const handleUndo = () => {
        const backup = backupRef.current;
        if (!backup || backup.length === 0) return;

        const linesToAdd = backup.map(line => ({
            merchandiseId: line.merchandise.id,
            quantity: line.quantity
        }));

        const formData = new FormData();
        formData.append(
            "cartFormInput",
            JSON.stringify({
                action: CartForm.ACTIONS.LinesAdd,
                inputs: {lines: linesToAdd}
            })
        );
        void undoFetcher.submit(formData, {method: "POST", action: "/cart"});
        backupRef.current = null;
    };

    if (productCount <= 1) return null;

    return (
        <>
            <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <AlertDialogContent
                    overlayClassName="bg-overlay-dark backdrop-blur-md"
                    className="border-0 bg-background/95 shadow-2xl backdrop-blur-sm sm:max-w-[420px]"
                >
                    <AlertDialogTitle className="flex items-center gap-2">
                        <div className="bg-destructive/20 flex h-10 w-10 items-center justify-center rounded-full">
                            <AlertTriangle className="text-destructive h-5 w-5" />
                        </div>
                        Clear Cart
                    </AlertDialogTitle>

                    <div className="mt-4 space-y-4">
                        <p className="text-muted-foreground text-sm">{getConfirmationMessage()}</p>

                        <div className="bg-muted/50 rounded-lg p-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Items to remove:</span>
                                <span className="font-medium">{productCount}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Total value:</span>
                                <span className="font-semibold">{totalAmount && formatShopifyMoney(totalAmount)}</span>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1 border-0">
                                Keep Items
                            </Button>

                            <CartForm
                                fetcherKey={CART_FETCHER_KEY}
                                route="/cart"
                                action={CartForm.ACTIONS.LinesRemove}
                                inputs={{lineIds}}
                            >
                                <Button type="submit" variant="destructive" className="flex-1" onClick={confirmClear} disabled={isMutating}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Clear All
                                </Button>
                            </CartForm>
                        </div>
                    </div>
                </AlertDialogContent>
            </AlertDialog>

            <div className="relative">
                <Button
                    variant="destructive"
                    size={isMobile ? "lg" : "default"}
                    onClick={() => setDialogOpen(true)}
                    onMouseDown={startHolding}
                    onMouseUp={stopHolding}
                    onMouseLeave={stopHolding}
                    onTouchStart={startHolding}
                    onTouchEnd={stopHolding}
                    className={cn(
                        "group relative shrink-0 overflow-hidden sleek hover:scale-105 active:scale-95",
                        isMobile ? "h-14 px-4 py-6" : "h-12 px-4"
                    )}
                >
                    {isHolding && (
                        <div
                            className="bg-destructive-foreground/20 absolute inset-0 transition-all duration-75"
                            style={{width: `${holdProgress}%`}}
                        />
                    )}

                    <div className="relative z-10 flex items-center justify-center">
                        <Trash2 className="sleek h-4 w-4 group-hover:scale-110 group-active:rotate-12" />
                    </div>

                    {!isHolding && (
                        <div className="bg-popover text-popover-foreground pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 transform rounded px-2 py-1 text-xs whitespace-nowrap opacity-0 shadow-md sleek group-hover:opacity-100 group-focus-visible:opacity-100">
                            Hold or click to clear
                        </div>
                    )}
                </Button>
            </div>
        </>
    );
}
