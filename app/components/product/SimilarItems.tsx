import {ProductCard} from "~/components/display/ProductCard";
import {SkeletonGrid} from "~/components/common/SkeletonGrid";
import {fromStorefrontNode} from "~/lib/product/product-card-normalizers";

type SimilarItemsProps = {
    isLoading?: boolean;
    products: any[];
};

export const SimilarItems = ({isLoading = false, products}: SimilarItemsProps) => {
    if (!isLoading && (!products || products.length === 0)) return null;

    return (
        <section className="py-10 lg:py-16" aria-label="Similar items">
            <div className="mx-auto max-w-[2000px] px-2 md:px-4">
                {/* Header — minimal ruled label, understated catalog feel */}
                <div className="mb-6 md:mb-10">
                    <div
                        className="pb-3"
                        style={{borderBottom: "1px solid var(--border-subtle)"}}
                    >
                        <p
                            className="text-[0.6rem] font-semibold tracking-[0.18em] uppercase mb-1"
                            style={{color: "var(--text-subtle)"}}
                        >
                            You may also like
                        </p>
                        <h2
                            className="text-base font-medium tracking-tight md:text-lg"
                            style={{color: "var(--text-secondary)"}}
                        >
                            Similar styles
                        </h2>
                    </div>
                </div>

                {/* Content — skeleton or 2/3/4 responsive grid */}
                {isLoading ? (
                    <SkeletonGrid layout="product-grid" count={4} />
                ) : (
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:gap-3 lg:grid-cols-4">
                        {products.map(product => (
                            <ProductCard
                                key={product.id}
                                product={fromStorefrontNode(product)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};
