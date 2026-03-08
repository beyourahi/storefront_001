import {Link} from "react-router";
import {useWishlist} from "~/lib/wishlist-context";
import {HiOutlineHeart} from "react-icons/hi";
import {cn} from "~/lib/utils";

export const WishlistCountInline = ({className}: {className?: string}) => {
    const {count} = useWishlist();
    if (count === 0) return null;
    return (
        <span className={cn("tabular-nums text-[0.75em] opacity-70", className)}>({count > 99 ? "99+" : count})</span>
    );
};

interface WishlistCountProps {
    className?: string;
    iconSize?: number;
}

export const WishlistCount = ({className, iconSize = 24}: WishlistCountProps) => {
    const {count} = useWishlist();

    const ariaLabel = count > 0 ? `${count} items in wishlist` : "Wishlist";

    return (
        <Link
            to="/account/wishlist"
            className={cn("relative inline-flex items-center justify-center rounded-lg p-2", className)}
            aria-label={ariaLabel}
        >
            <HiOutlineHeart style={{width: iconSize, height: iconSize}} className="text-current" />
            {count > 0 && (
                <span
                    className="bg-wishlist-active text-wishlist-active-foreground animate-in fade-in zoom-in absolute right-0 top-0 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1 text-xs font-semibold transition-all duration-200"
                    aria-hidden="true"
                >
                    {count > 99 ? "99+" : count}
                </span>
            )}
        </Link>
    );
};
