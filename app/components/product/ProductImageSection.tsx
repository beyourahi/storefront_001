import {useMemo} from "react";
import {Skeleton} from "~/components/ui/skeleton";
const FALLBACK_THEME_PRODUCT_IMAGE_ASPECT_RATIO: "portrait" | "landscape" | "square" = "portrait";
import {ProductImageCarousel} from "~/components/product/ProductImageCarousel";

type ProductImage = {
    id: string;
    url: string;
    altText?: string | null;
};

type ProductImageSectionProps = {
    isLoading?: boolean;
    productImages: ProductImage[];
    product: {
        title: string;
        handle: string;
    };
    onSale?: boolean;
};

export const ProductImageSection = ({
    isLoading = false,
    productImages,
    product,
    onSale = false
}: ProductImageSectionProps) => {
    const aspectRatioClass = useMemo(() => {
        switch (FALLBACK_THEME_PRODUCT_IMAGE_ASPECT_RATIO as string) {
            case "portrait":
                return "aspect-[4/5]";
            case "landscape":
                return "aspect-[16/9]";
            case "square":
            default:
                return "aspect-square";
        }
    }, []);

    return (
        <div className="lg:col-span-4">
            {isLoading ? (
                <div className="space-y-4">
                    <Skeleton className={`${aspectRatioClass} w-full`} />
                    <div className="grid grid-cols-4 gap-2 xl:gap-4">
                        {Array.from({length: 4}, (_, i) => (
                            <Skeleton key={i} className={aspectRatioClass} />
                        ))}
                    </div>
                </div>
            ) : productImages.length > 0 ? (
                <ProductImageCarousel
                    images={productImages}
                    productTitle={product.title}
                    productHandle={product.handle}
                    onSale={onSale}
                />
            ) : (
                <div className="bg-muted aspect-square overflow-hidden rounded-lg">
                    <div className="from-primary/10 to-secondary/10 flex h-full w-full items-center justify-center bg-gradient-to-br">
                        <div className="text-muted-foreground text-center">
                            <div className="mb-4 text-6xl">📸</div>
                            <p className="text-lg font-medium">Product Image</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
