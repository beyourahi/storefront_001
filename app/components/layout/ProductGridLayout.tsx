import {Skeleton} from "~/components/ui/skeleton";

type ProductCardData = {
    id: string;
    handle: string;
    title: string;
};

type ProductGridLayoutProps = {
    products: ProductCardData[];
    isLoading?: boolean;
    showSkeleton?: boolean;
    renderProduct: (product: ProductCardData) => React.ReactNode;
};

export const ProductGridLayout = ({
    products,
    isLoading = false,
    showSkeleton = true,
    renderProduct
}: ProductGridLayoutProps) => {
    if (isLoading && showSkeleton) {
        return (
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-4">
                {Array.from({length: 12}, (_, i) => (
                    <div key={i} className="space-y-3">
                        <Skeleton className="aspect-[3/4] w-full rounded-lg" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </div>
                ))}
            </div>
        );
    }

    if (products.length === 0) {
        return (
            <div className="py-12 text-center">
                <div className="mb-4 text-6xl">&#128717;</div>
                <h3 className="mb-2 text-xl font-semibold">No products found</h3>
                <p className="text-muted-foreground">Try browsing other collections.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-4">
            {products.map(product => (
                <div key={product.id}>{renderProduct(product)}</div>
            ))}
        </div>
    );
};
