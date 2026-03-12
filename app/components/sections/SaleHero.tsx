import {useMemo} from "react";
import {Link} from "react-router";
import {Tag, ArrowRight} from "lucide-react";

interface SaleHeroProps {
    totalCount: number;
    maxDiscount: number;
    products: Array<{maxDiscountPercentage: number}>;
}

export const SaleHero = ({totalCount, maxDiscount, products}: SaleHeroProps) => {
    // Calculate average savings with useMemo for performance
    const avgSavings = useMemo(() => {
        if (products.length === 0) return 0;
        const total = products.reduce((sum, p) => sum + p.maxDiscountPercentage, 0);
        return Math.round(total / products.length);
    }, [products]);

    return (
        <section className="bg-background py-8">
            <div className="mx-auto max-w-[2000px] px-2 md:px-4">
                <div className="text-center">
                    {totalCount > 0 ? (
                        <>
                            {/* Populated State: Title + Description + Badges */}
                            <h1 className="text-foreground mb-2 font-serif text-4xl font-bold md:text-5xl">
                                Save Up to {maxDiscount}% Off
                            </h1>
                            <p className="text-muted-foreground mx-auto max-w-3xl font-serif text-lg">
                                Limited-time offers with exceptional value.
                            </p>

                            {/* Information Badges */}
                            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                                {/* Product Count Badge */}
                                <div className="bg-muted/50 rounded-full px-3 py-1 text-xs">
                                    <span className="text-primary font-semibold">{totalCount}</span>{" "}
                                    <span className="text-muted-foreground">
                                        {totalCount === 1 ? "Product" : "Products"}
                                    </span>
                                </div>

                                {/* Max Discount Badge */}
                                <div className="bg-muted/50 rounded-full px-3 py-1 text-xs">
                                    <span className="text-primary font-semibold">Up to {maxDiscount}%</span>{" "}
                                    <span className="text-muted-foreground">Off</span>
                                </div>

                                {/* Average Savings Badge (conditional) */}
                                {avgSavings > 0 && (
                                    <div className="bg-muted/50 rounded-full px-3 py-1 text-xs">
                                        <span className="text-primary font-semibold">{avgSavings}%</span>{" "}
                                        <span className="text-muted-foreground">Avg Savings</span>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Empty State: Icon + Message + CTA */}
                            <div className="flex flex-col items-center justify-center py-8">
                                <Tag
                                    className="text-muted-foreground/50 mb-4 size-12"
                                    strokeWidth={1.5}
                                    aria-hidden="true"
                                />
                                <h1 className="text-foreground mb-2 font-serif text-4xl font-bold md:text-5xl">
                                    No Discounts Available
                                </h1>
                                <p className="text-muted-foreground mx-auto max-w-3xl font-serif text-lg">
                                    Check back soon for special offers and deals, or explore our full collection of
                                    premium products.
                                </p>
                                <Link
                                    to="/collections/all"
                                    className="sleek group mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                                >
                                    Browse All Products
                                    <ArrowRight className="sleek size-4 group-hover:translate-x-0.5" aria-hidden="true" />
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </section>
    );
};
