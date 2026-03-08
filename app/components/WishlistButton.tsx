import {useState} from "react";
import {useWishlist} from "~/lib/wishlist-context";
import {HiHeart, HiOutlineHeart} from "react-icons/hi";
import {cva, type VariantProps} from "class-variance-authority";
import {usePointerCapabilities} from "~/hooks/usePointerCapabilities";
import {cn} from "~/lib/utils";

const wishlistButtonVariants = cva(
    "motion-interactive motion-press inline-flex select-none items-center justify-center rounded-full hover:scale-110 active:scale-[var(--motion-press-scale)]",
    {
        variants: {
            size: {
                sm: "h-8 w-8 p-1",
                md: "h-10 w-10 p-2",
                lg: "h-12 w-12 p-2.5"
            }
        },
        defaultVariants: {
            size: "md"
        }
    }
);

interface WishlistButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof wishlistButtonVariants> {
    productId: string;
    showLabel?: boolean;
    className?: string;
}

export const WishlistButton = ({productId, size, showLabel = false, className, ...props}: WishlistButtonProps) => {
    const {isWishlisted, toggleItem} = useWishlist();
    const {canHover} = usePointerCapabilities();
    const [isAnimating, setIsAnimating] = useState(false);

    const wishlisted = isWishlisted(productId);

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();

        toggleItem(productId);

        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 300);
    };

    const label = wishlisted ? "Remove from wishlist" : "Add to wishlist";

    return (
        <button
            type="button"
            onClick={handleClick}
            className={cn(wishlistButtonVariants({size}), !canHover && "hover:scale-100", className)}
            aria-label={label}
            aria-pressed={wishlisted}
            title={label}
            {...props}
        >
            <span className={cn("motion-image", isAnimating && "scale-125")}>
                {wishlisted ? (
                    <HiHeart
                        className={cn(
                            "motion-interactive",
                            size === "sm" && "h-5 w-5",
                            size === "md" && "h-6 w-6",
                            size === "lg" && "h-7 w-7",
                            "fill-wishlist-active text-wishlist-active"
                        )}
                    />
                ) : (
                    <HiOutlineHeart
                        className={cn(
                            "motion-interactive",
                            size === "sm" && "h-5 w-5",
                            size === "md" && "h-6 w-6",
                            size === "lg" && "h-7 w-7",
                            canHover ? "text-muted-foreground hover:text-foreground" : "text-muted-foreground"
                        )}
                    />
                )}
            </span>
            {showLabel && <span className="ml-2 text-sm font-medium">{wishlisted ? "Saved" : "Save"}</span>}
        </button>
    );
};
