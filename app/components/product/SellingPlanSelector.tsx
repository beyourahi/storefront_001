import {useLocation, useNavigate} from "react-router";
import {cn} from "~/lib/utils";
import type {ProductFragment} from "storefrontapi.generated";

export type SellingPlanFragment = NonNullable<
    ProductFragment["sellingPlanGroups"]
>["nodes"][number]["sellingPlans"]["nodes"][number];

export type EnrichedSellingPlan = SellingPlanFragment & {
    isSelected: boolean;
    url: string;
    groupName: string;
};

type SellingPlanSelectorProps = {
    sellingPlanGroups: ProductFragment["sellingPlanGroups"];
    selectedSellingPlan: SellingPlanFragment | null;
    selectedVariant: ProductFragment["selectedOrFirstAvailableVariant"];
    className?: string;
};

/**
 * Subscription / selling-plan picker for the PDP.
 * Filters the product's `sellingPlanGroups` to only the plans that are available
 * for the *currently selected variant* (via `sellingPlanAllocations`), so unavailable
 * plans are never shown for a given size/color selection.
 * Each plan gets a pre-computed URL (current pathname + `selling_plan` param) so
 * selection triggers a `navigate(plan.url, {replace: true})` rather than a fetcher call.
 */
export const SellingPlanSelector = ({
    sellingPlanGroups,
    selectedSellingPlan,
    selectedVariant,
    className
}: SellingPlanSelectorProps) => {
    const navigate = useNavigate();
    const {search, pathname} = useLocation();

    const availablePlanIds =
        selectedVariant?.sellingPlanAllocations?.nodes.map(allocation => allocation.sellingPlan.id) ?? [];

    const params = new URLSearchParams(search);
    const availablePlans = !sellingPlanGroups?.nodes
        ? []
        : sellingPlanGroups.nodes.flatMap(group =>
              group.sellingPlans.nodes
                  .filter(plan => availablePlanIds.includes(plan.id))
                  .map(plan => {
                      params.set("selling_plan", plan.id);
                      return {
                          ...plan,
                          groupName: group.name,
                          isSelected: selectedSellingPlan?.id === plan.id,
                          url: `${pathname}?${params.toString()}`
                      } as EnrichedSellingPlan;
                  })
          );

    const handlePlanSelect = (plan: EnrichedSellingPlan) => {
        void navigate(plan.url, {
            replace: true,
            preventScrollReset: true
        });
    };

    if (availablePlans.length === 0) return null;

    return (
        <div className={cn("space-y-2", className)}>
            <p className="text-sm font-medium text-muted-foreground">Delivery Frequency</p>
            <div className="flex flex-wrap gap-2">
                {availablePlans.map(plan => {
                    const optionLabel = plan.options.map(opt => opt.value).join(" ");

                    return (
                        <button
                            key={plan.id}
                            type="button"
                            onClick={() => handlePlanSelect(plan)}
                            className={cn(
                                "inline-flex min-h-10 select-none items-center justify-center rounded-full border-2 px-3 sm:px-4 py-1.5 text-base sm:text-lg font-medium transition-all duration-200",
                                "active:scale-95",
                                plan.isSelected
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                            )}
                        >
                            {optionLabel || plan.name}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

