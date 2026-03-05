import {Link} from "react-router";
import {Images, Mail, User} from "lucide-react";
import {HiOutlineHeart} from "react-icons/hi";
import {cn} from "~/lib/utils";
import {useWishlist} from "~/lib/wishlist-context";

type MobileMenuSettingsProps = {
    currentPath: string;
    onLinkClick: () => void;
};

export const MobileMenuSettings = ({currentPath, onLinkClick}: MobileMenuSettingsProps) => {
    const {count: wishlistCount} = useWishlist();

    const isWishlistActive =
        currentPath === "/account/wishlist" ||
        currentPath.startsWith("/account/wishlist/") ||
        currentPath === "/wishlist" ||
        currentPath.startsWith("/wishlist/");

    const isAccountActive =
        (currentPath === "/account" || currentPath.startsWith("/account/")) && !isWishlistActive;

    return (
        <div className="border-border/40 mt-4 border-t pt-4">
            <nav className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                    <Link
                        to="/account/wishlist"
                        onClick={onLinkClick}
                        className={cn(
                            "mobile-nav-link group sleek flex items-center gap-3 rounded-md px-4 py-4 text-sm font-medium active:scale-[0.98]",
                            isWishlistActive
                                ? "bg-primary text-primary-foreground shadow-primary/25 ring-primary/20 scale-[1.02] font-semibold shadow-md ring-2"
                                : "bg-muted text-foreground hover:bg-accent hover:text-accent-foreground hover:shadow-accent/10 hover:shadow-sm"
                        )}
                    >
                        <div className="relative">
                            <HiOutlineHeart
                                className={cn(
                                    "sleek h-4 w-4 group-hover:scale-110",
                                    isWishlistActive
                                        ? "text-primary-foreground"
                                        : "text-muted-foreground group-hover:text-accent-foreground"
                                )}
                            />
                            {wishlistCount > 0 && (
                                <span className="bg-wishlist-active text-wishlist-active-foreground absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold">
                                    {wishlistCount > 99 ? "99+" : wishlistCount}
                                </span>
                            )}
                        </div>
                        <span
                            className={cn(
                                "sleek group-hover:translate-x-0.5",
                                isWishlistActive ? "drop-shadow-sm" : ""
                            )}
                        >
                            Wishlist
                        </span>
                    </Link>
                    <Link
                        to="/account"
                        onClick={onLinkClick}
                        className={cn(
                            "mobile-nav-link group sleek flex items-center gap-3 rounded-md px-4 py-4 text-sm font-medium active:scale-[0.98]",
                            isAccountActive
                                ? "bg-primary text-primary-foreground shadow-primary/25 ring-primary/20 scale-[1.02] font-semibold shadow-md ring-2"
                                : "bg-muted text-foreground hover:bg-accent hover:text-accent-foreground hover:shadow-accent/10 hover:shadow-sm"
                        )}
                    >
                        <User
                            className={cn(
                                "sleek h-4 w-4 group-hover:scale-110",
                                isAccountActive
                                    ? "text-primary-foreground"
                                    : "text-muted-foreground group-hover:text-accent-foreground"
                            )}
                        />
                        <span
                            className={cn(
                                "sleek group-hover:translate-x-0.5",
                                isAccountActive ? "drop-shadow-sm" : ""
                            )}
                        >
                            Account
                        </span>
                    </Link>
                </div>
                <Link
                    to="/gallery"
                    onClick={onLinkClick}
                    className={cn(
                        "mobile-nav-link group sleek flex items-center gap-3 rounded-md px-4 py-4 text-sm font-medium active:scale-[0.98]",
                        currentPath === "/gallery"
                            ? "bg-primary text-primary-foreground shadow-primary/25 ring-primary/20 scale-[1.02] font-semibold shadow-md ring-2"
                            : "bg-muted text-foreground hover:bg-accent hover:text-accent-foreground hover:shadow-accent/10 hover:shadow-sm"
                    )}
                >
                    <Images
                        className={cn(
                            "sleek h-4 w-4 group-hover:scale-110",
                            currentPath === "/gallery"
                                ? "text-primary-foreground"
                                : "text-muted-foreground group-hover:text-accent-foreground"
                        )}
                    />
                    <span
                        className={cn(
                            "sleek group-hover:translate-x-0.5",
                            currentPath === "/gallery" ? "drop-shadow-sm" : ""
                        )}
                    >
                        Gallery
                    </span>
                </Link>
                <Link
                    to="/contact"
                    onClick={onLinkClick}
                    className={cn(
                        "mobile-nav-link group sleek flex items-center gap-3 rounded-md px-4 py-4 text-sm font-medium active:scale-[0.98]",
                        currentPath === "/contact"
                            ? "bg-primary text-primary-foreground shadow-primary/25 ring-primary/20 scale-[1.02] font-semibold shadow-md ring-2"
                            : "bg-muted text-foreground hover:bg-accent hover:text-accent-foreground hover:shadow-accent/10 hover:shadow-sm"
                    )}
                >
                    <Mail
                        className={cn(
                            "sleek h-4 w-4 group-hover:scale-110",
                            currentPath === "/contact"
                                ? "text-primary-foreground"
                                : "text-muted-foreground group-hover:text-accent-foreground"
                        )}
                    />
                    <span
                        className={cn(
                            "sleek group-hover:translate-x-0.5",
                            currentPath === "/contact" ? "drop-shadow-sm" : ""
                        )}
                    >
                        Contact
                    </span>
                </Link>
            </nav>
        </div>
    );
};
