import {Link} from "react-router";
import {useWishlist} from "~/lib/wishlist-context";
import {Heart} from "lucide-react";
import {cn} from "~/lib/utils";

export const WishlistCountInline = ({className}: {className?: string}) => {
    const {count, isHydrated} = useWishlist();
    if (!isHydrated || count === 0) return null;
    return (
        <span className={cn("tabular-nums text-[0.75em] opacity-70", className)}>({count > 99 ? "99+" : count})</span>
    );
};

interface WishlistCountProps {
    className?: string;
    iconSize?: number;
}

export const WishlistCount = ({className, iconSize = 24}: WishlistCountProps) => {
    const {count, isHydrated} = useWishlist();

    const ariaLabel = count > 0 ? `${count} items in wishlist` : "Wishlist";

    return (
        <Link
            to="/account/wishlist"
            className={cn("relative inline-flex h-10 w-10 items-center justify-center rounded-lg", className)}
            aria-label={ariaLabel}
        >
            <Heart style={{width: iconSize, height: iconSize}} className="text-current" />
            {isHydrated && count > 0 && (
                <span
                    className="sleek bg-wishlist-active text-wishlist-active-foreground animate-in fade-in zoom-in absolute right-0 top-0 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1 text-xs font-semibold"
                    aria-hidden="true"
                >
                    {count > 99 ? "99+" : count}
                </span>
            )}
        </Link>
    );
};
