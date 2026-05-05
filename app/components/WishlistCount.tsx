import {Link} from "react-router";
import {useWishlist} from "~/lib/wishlist-context";
import {Heart} from "lucide-react";
import {cn} from "~/lib/utils";

/**
 * Inline parenthetical count "(3)" appended to a "Wishlist" nav label.
 * Renders nothing until hydrated or when the count is zero, preventing flicker.
 * Caps at "99+" to avoid layout shifts for large wishlists.
 */
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

/**
 * Navbar wishlist icon with an animated badge count. Links to `/account/wishlist`.
 * Badge only renders after hydration to avoid a mismatch between SSR (no count)
 * and client (localStorage count). Caps at "99+".
 */
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
