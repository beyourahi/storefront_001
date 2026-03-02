import {ProductGridLayout} from "~/components/layout/ProductGridLayout";
import {ProductCard} from "~/components/display/ProductCard";
import {CollectionPagination} from "~/components/custom/CollectionPagination";
import {cn} from "~/lib/utils";

type ProductData = {
    id: string;
    handle: string;
    title: string;
    description: string;
    tags: string[];
    vendor: string;
    productType: string;
    availableForSale: boolean;
    options: Array<{id: string; name: string; values: string[]}>;
    variants: {edges: Array<{node: any}>};
    images: {edges: Array<{node: {id?: string; url: string; altText: string | null; width?: number; height?: number}}>};
    priceRange: {
        minVariantPrice: {amount: string; currencyCode: string};
        maxVariantPrice: {amount: string; currencyCode: string};
    };
    seo: {title: string | null; description: string | null};
};

type PaginationInfo = {
    currentPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    nextCursor: string | null;
    previousCursor: string | null;
};

type ProductsGridSectionProps = {
    products: ProductData[];
    isLoading?: boolean;
    className?: string;
    preserveOrder?: boolean;
    pagination?: PaginationInfo | null;
    sortLabel?: string;
};

export const ProductsGridSection = ({
    products,
    isLoading,
    className = "py-3",
    preserveOrder = false,
    pagination = null,
    sortLabel = "Price: Low to High"
}: ProductsGridSectionProps) => {
    // Products are pre-sorted by loader
    // preserveOrder kept for backwards compatibility but always treated as true
    const displayProducts = products;

    const showPagination = pagination && (pagination.hasNextPage || pagination.hasPreviousPage);

    return (
        <>
            <div className={cn("mx-auto max-w-[2000px] px-2 md:px-4", className)}>
                <div className="mb-4 flex items-center justify-between gap-4">
                    <p className="text-muted-foreground text-sm">
                        Showing {displayProducts.length} {displayProducts.length === 1 ? "product" : "products"}
                    </p>

                    {showPagination && pagination && (
                        <div className="hidden lg:block">
                            <CollectionPagination
                                currentPage={pagination.currentPage}
                                hasNextPage={pagination.hasNextPage}
                                hasPreviousPage={pagination.hasPreviousPage}
                                nextCursor={pagination.nextCursor}
                                previousCursor={pagination.previousCursor}
                                inline={true}
                            />
                        </div>
                    )}

                    <p className="text-muted-foreground text-sm">{sortLabel}</p>
                </div>
            </div>

            <section className="bg-background pb-16">
                <div className="mx-auto max-w-[2000px] px-2 md:px-4">
                    <ProductGridLayout
                        products={displayProducts}
                        isLoading={isLoading}
                        renderProduct={product => <ProductCard product={product as ProductData} />}
                    />
                </div>
            </section>
        </>
    );
};
