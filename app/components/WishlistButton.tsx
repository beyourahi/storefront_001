import {useState, useEffect, useCallback} from "react";
import {Heart} from "lucide-react";
import {cva, type VariantProps} from "class-variance-authority";
import {usePointerCapabilities} from "~/hooks/usePointerCapabilities";
import {useWishlistSafe} from "~/lib/wishlist-context";
import {cn} from "~/lib/utils";

const wishlistButtonVariants = cva(
    "motion-interactive motion-press inline-flex select-none items-center justify-center rounded-full hover:scale-110 active:scale-[var(--motion-press-scale)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50 disabled:cursor-not-allowed",
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
    /** Enable breathing animation when a parent with `group` class is hovered */
    animateOnParentHover?: boolean;
    className?: string;
}

/**
 * Toggle button for wishlisting a product. Disabled until the wishlist context
 * hydrates from localStorage to prevent flicker. Plays a brief burst-ring
 * animation on click and a glow animation for 2 seconds after adding.
 * Uses `useWishlistSafe` so it renders in contexts outside the full wishlist provider.
 */
export const WishlistButton = ({
    productId,
    size,
    showLabel = false,
    animateOnParentHover = false,
    className,
    ...props
}: WishlistButtonProps) => {
    const {has, toggle, isHydrated} = useWishlistSafe();
    const {canHover} = usePointerCapabilities();
    const [isAnimating, setIsAnimating] = useState(false);
    const [justAdded, setJustAdded] = useState(false);

    const wishlisted = has(productId);

    useEffect(() => {
        if (!isAnimating) return;
        const timer = setTimeout(() => setIsAnimating(false), 360);
        return () => clearTimeout(timer);
    }, [isAnimating]);

    useEffect(() => {
        if (!justAdded) return;
        const timer = setTimeout(() => setJustAdded(false), 2000);
        return () => clearTimeout(timer);
    }, [justAdded]);

    const handleClick = useCallback(
        (e: React.MouseEvent<HTMLButtonElement>) => {
            e.preventDefault();
            e.stopPropagation();

            const wasInWishlist = wishlisted;
            toggle(productId);
            setIsAnimating(true);

            if (!wasInWishlist) {
                setJustAdded(true);
            }
        },
        [wishlisted, toggle, productId]
    );

    const label = wishlisted ? "Remove from wishlist" : "Add to wishlist";

    const iconSizeClass = size === "sm" ? "h-5 w-5" : size === "lg" ? "h-7 w-7" : "h-6 w-6";

    return (
        <button
            type="button"
            onClick={handleClick}
            disabled={!isHydrated}
            className={cn(
                wishlistButtonVariants({size}),
                !canHover && "hover:scale-100",
                isAnimating && "animate-burst-ring",
                className
            )}
            aria-label={label}
            aria-pressed={wishlisted}
            title={label}
            {...props}
        >
            <Heart
                className={cn(
                    iconSizeClass,
                    "motion-image",
                    wishlisted
                        ? "fill-wishlist-active text-wishlist-active"
                        : cn(
                              "fill-transparent",
                              canHover ? "text-muted-foreground hover:text-foreground" : "text-muted-foreground",
                              animateOnParentHover && "group-hover:animate-heart-breathe"
                          ),
                    wishlisted && !isAnimating && "animate-heart-beat",
                    isAnimating && "animate-heart-pop",
                    justAdded && !isAnimating && wishlisted && "animate-heart-glow"
                )}
            />
            {showLabel && <span className="ml-2 text-sm font-medium">{wishlisted ? "Saved" : "Save"}</span>}
        </button>
    );
};
