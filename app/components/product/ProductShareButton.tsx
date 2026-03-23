import {useState, useMemo} from "react";
import {Share} from "lucide-react";
import type {ProductFragment} from "storefrontapi.generated";
import {Button} from "~/components/ui/button";
import {ProductShareDialog} from "~/components/product/ProductShareDialog";

type ProductShareButtonProps = {
    product: Pick<ProductFragment, "id" | "title" | "handle" | "description" | "images">;
    selectedVariant: ProductFragment["selectedOrFirstAvailableVariant"];
    variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
    size?: "default" | "sm" | "lg" | "icon";
    showText?: boolean;
    position?: "inline" | "floating";
    shopName?: string;
};

export const ProductShareButton = ({
    product,
    selectedVariant,
    variant = "outline",
    size = "default",
    showText = true,
    position = "inline",
    shopName
}: ProductShareButtonProps) => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const buttonClass = useMemo(() => {
        let baseClasses =
            "sleek hover:bg-accent/80 hover:border-primary/30 hover:scale-[1.02] hover:shadow-sm";

        if (position === "floating") {
            baseClasses += " fixed bottom-6 right-6 z-50 shadow-lg hover:shadow-xl";
        }

        return baseClasses;
    }, [position]);

    const iconSize = useMemo(() => {
        switch (size) {
            case "sm":
                return "h-3.5 w-3.5";
            case "lg":
                return "h-5 w-5";
            case "icon":
                return "h-4 w-4";
            default:
                return "h-4 w-4";
        }
    }, [size]);

    return (
        <>
            <Button
                variant={variant}
                size={size}
                className={buttonClass}
                onClick={() => setIsDialogOpen(true)}
                aria-label={showText ? undefined : `Share ${product.title}`}
            >
                <Share className={iconSize} />
                {showText && <span>Share</span>}
            </Button>

            <ProductShareDialog
                product={product}
                variant={selectedVariant}
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                shopName={shopName}
            />
        </>
    );
};
