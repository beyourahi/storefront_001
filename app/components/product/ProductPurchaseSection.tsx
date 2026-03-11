import {useMemo} from "react";
import type {MappedProductOptions} from "@shopify/hydrogen";
import {PriceDisplay} from "~/components/product/PriceDisplay";
import {OptionSelector} from "~/components/product/OptionSelector";
import {QuantitySelector} from "~/components/product/QuantitySelector";
import {ShoppingSummary} from "~/components/product/ShoppingSummary";
import {AddToCartButton} from "~/components/product/AddToCartButton";
import {BuyNowButton} from "~/components/product/BuyNowButton";
import {SellingPlanSelector, type SellingPlanFragment} from "~/components/product/SellingPlanSelector";

type ProductPurchaseSectionProps = {
    product: any;
    selectedVariant: any;
    productOptions: MappedProductOptions[];
    selectedSellingPlan?: SellingPlanFragment | null;
    quantity: number;
    onQuantityChange: (qty: number) => void;
    discountPercentage?: number;
    isLoading?: boolean;
    isVariantTransitioning?: boolean;
    sizeChartButton?: React.ReactNode;
};

export const ProductPurchaseSection = ({
    product,
    selectedVariant,
    productOptions,
    selectedSellingPlan,
    quantity,
    onQuantityChange,
    discountPercentage,
    isLoading = false,
    isVariantTransitioning = false,
    sizeChartButton
}: ProductPurchaseSectionProps) => {
    const isPreorder =
        product?.tags?.some((tag: string) => tag.toLowerCase() === "preorder" || tag.toLowerCase() === "pre-order") ??
        false;

    const maxQuantity = selectedVariant?.quantityAvailable ? Math.min(999, selectedVariant.quantityAvailable) : 999;

    const lines = useMemo(
        () =>
            selectedVariant
                ? [
                      {
                          merchandiseId: selectedVariant.id,
                          quantity,
                          selectedVariant,
                          sellingPlanId: selectedSellingPlan?.id
                      }
                  ]
                : [],
        [selectedVariant, quantity, selectedSellingPlan?.id]
    );

    const isDisabled = !selectedVariant || isVariantTransitioning || isLoading;

    return (
        <div className="space-y-6 lg:col-span-3 lg:space-y-6 lg:py-8" data-mobile-purchase-section>
            <div className="space-y-4">
                {isLoading ? (
                    <>
                        <PriceDisplay selectedVariant={null} isLoading={true} />
                        <QuantitySelector quantity={1} onQuantityChange={() => {}} disabled={true} />
                        <ShoppingSummary
                            product={product}
                            selectedVariant={null}
                            quantity={1}
                            isVariantTransitioning={true}
                            isLoading={true}
                        />
                    </>
                ) : (
                    <>
                        <PriceDisplay
                            selectedVariant={selectedVariant}
                            discountPercentage={discountPercentage}
                        />

                        <OptionSelector productOptions={productOptions} />

                        {sizeChartButton && <div>{sizeChartButton}</div>}

                        <SellingPlanSelector
                            sellingPlanGroups={product.sellingPlanGroups}
                            selectedSellingPlan={selectedSellingPlan ?? null}
                            selectedVariant={selectedVariant}
                        />

                        <QuantitySelector
                            quantity={quantity}
                            onQuantityChange={onQuantityChange}
                            disabled={isVariantTransitioning}
                            max={maxQuantity}
                        />

                        <ShoppingSummary
                            product={product}
                            selectedVariant={selectedVariant}
                            quantity={quantity}
                            isVariantTransitioning={isVariantTransitioning}
                            isLoading={isLoading}
                        />

                        <div className="hidden flex-col gap-2 lg:flex">
                            <AddToCartButton lines={lines} disabled={isDisabled} isPreorder={isPreorder} />
                            {!isPreorder && <BuyNowButton lines={lines} disabled={isDisabled} />}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
