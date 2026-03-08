import {Suspense, useState} from "react";
import {Link, useLocation, useRouteLoaderData, Await} from "react-router";
import {AlignLeft, Search as SearchIcon, ShoppingCart, User} from "lucide-react";
import {Button} from "~/components/ui/button";
import {cn} from "~/lib/utils";
import {NAVIGATION_LINKS} from "~/lib/navigation";
import {useCartDrawer} from "~/hooks/useCartDrawer";
import {useSearchController} from "~/hooks/useSearchController";
import {WishlistCount} from "~/components/WishlistCount";
import {MobileMenu} from "~/components/layout/MobileMenu";
import {useSiteSettings} from "~/lib/site-content-context";
import type {RootLoader} from "~/root";

type CollectionCardData = {
    id: string;
    title: string;
    handle: string;
    description: string;
    image?: {url: string; altText: string | null} | null;
    productCount: number;
};

type NavbarProps = {
    shopName: string;
    collections?: CollectionCardData[];
};

const NAVBAR_ICON_INTERACTION_CLASSES =
    "motion-interactive motion-press hover:bg-transparent active:bg-transparent hover:text-primary active:text-primary active:scale-[var(--motion-press-scale)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50";

export const Navbar = ({shopName, collections}: NavbarProps) => {
    const {pathname: currentPath} = useLocation();
    const data = useRouteLoaderData<RootLoader>("root");
    const {brandName, brandLogo} = useSiteSettings();
    const displayBrandName = brandName?.trim() || shopName;

    const {open: openCart} = useCartDrawer();
    const {openSearch} = useSearchController();

    const [showMobileMenu, setShowMobileMenu] = useState(false);

    const isWishlistActive =
        currentPath === "/account/wishlist" ||
        currentPath.startsWith("/account/wishlist/") ||
        currentPath === "/wishlist" ||
        currentPath.startsWith("/wishlist/");
    const isAccountActive = (currentPath === "/account" || currentPath.startsWith("/account/")) && !isWishlistActive;

    const toggleMobileMenu = () => {
        setShowMobileMenu(prev => !prev);
    };

    const closeMobileMenu = () => {
        setShowMobileMenu(false);
    };

    return (
        <>
            <header
                className={cn(
                    "bg-background/95 supports-backdrop-filter:bg-background/60 sleek fixed backdrop-blur main-nav z-50 w-full",
                    "top-(--announcement-height)"
                )}
            >
                <div className="relative mx-auto flex h-16 max-w-[2000px] items-center lg:h-20 lg:px-1">
                    <div className="flex lg:hidden">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 pr-16 pl-6"
                            onClick={toggleMobileMenu}
                            aria-expanded={showMobileMenu}
                            aria-haspopup="dialog"
                            aria-controls="mobile-menu"
                        >
                            <AlignLeft size={22} />
                            <span className="sr-only">Toggle menu</span>
                        </Button>
                    </div>

                    <nav className="hidden items-center lg:flex">
                        {NAVIGATION_LINKS.map(link => (
                            <Link
                                key={link.href}
                                to={link.href}
                                className={cn(
                                    "hover:text-primary sleek px-3 py-2 text-sm font-semibold",
                                    "motion-link",
                                    currentPath === link.href
                                        ? "text-primary cool-active-underline"
                                        : "text-foreground/80 cool-underline"
                                )}
                            >
                                {link.label}
                            </Link>
                        ))}
                        {data?.hasBlog && (
                            <Link
                                to="/blogs"
                                className={cn(
                                    "hover:text-primary sleek px-3 py-2 text-sm font-semibold",
                                    "motion-link",
                                    currentPath === "/blogs" || currentPath.startsWith("/blogs/")
                                        ? "text-primary cool-active-underline"
                                        : "text-foreground/80 cool-underline"
                                )}
                            >
                                Blog
                            </Link>
                        )}
                    </nav>

                    <div className="absolute left-1/2 -translate-x-1/2">
                        <Link
                            to="/"
                            className="motion-link text-primary flex items-center space-x-2 px-2 py-2 hover:opacity-80 md:px-4"
                        >
                            {brandLogo?.url ? (
                                <img
                                    src={brandLogo.url}
                                    alt={brandLogo.altText ?? displayBrandName}
                                    width={brandLogo.width ?? undefined}
                                    height={brandLogo.height ?? undefined}
                                    className="h-8 w-auto object-contain lg:h-10"
                                    loading="eager"
                                    fetchPriority="high"
                                    decoding="async"
                                />
                            ) : (
                                <span className="font-serif text-base font-bold whitespace-nowrap uppercase lg:text-lg">
                                    {displayBrandName}
                                </span>
                            )}
                        </Link>
                    </div>

                    <div className="ml-auto flex items-center gap-2">
                        <div className="hidden lg:block">
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn("h-10 w-10 text-foreground/80", NAVBAR_ICON_INTERACTION_CLASSES)}
                                onClick={event => openSearch(event.currentTarget)}
                            >
                                <SearchIcon size={22} />
                                <span className="sr-only">Search</span>
                            </Button>
                        </div>

                        <div className="hidden lg:block">
                            <WishlistCount
                                iconSize={22}
                                className={cn(
                                    isWishlistActive ? "text-primary" : "text-foreground/80",
                                    NAVBAR_ICON_INTERACTION_CLASSES
                                )}
                            />
                        </div>

                        <div className="hidden lg:block">
                            <Link to="/account">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn(
                                        "h-10 w-10",
                                        isAccountActive ? "text-primary" : "text-foreground/80",
                                        NAVBAR_ICON_INTERACTION_CLASSES
                                    )}
                                >
                                    <User size={22} />
                                    <span className="sr-only">Account</span>
                                </Button>
                            </Link>
                        </div>

                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                                "relative h-10 w-10 max-lg:pr-6 max-lg:pl-16 text-foreground/80",
                                NAVBAR_ICON_INTERACTION_CLASSES
                            )}
                            onClick={openCart}
                        >
                            <ShoppingCart size={22} />
                            <Suspense fallback={null}>
                                <Await resolve={data?.cart}>
                                    {cart => {
                                        const totalQuantity = cart?.totalQuantity ?? 0;
                                        if (totalQuantity <= 0) return null;
                                        return (
                                            <>
                                                <span className="bg-primary absolute -top-0.5 right-0.5 h-4 w-4 animate-ping rounded-full lg:-top-1 lg:-right-1 lg:h-5 lg:w-5" />
                                                <span className="bg-primary text-primary-foreground absolute -top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full font-mono text-xs lg:-top-1 lg:-right-1 lg:h-5 lg:w-5">
                                                    {totalQuantity}
                                                </span>
                                            </>
                                        );
                                    }}
                                </Await>
                            </Suspense>
                            <span className="sr-only">Shopping cart</span>
                        </Button>
                    </div>
                </div>
            </header>

            <MobileMenu
                show={showMobileMenu}
                onClose={closeMobileMenu}
                collections={collections}
                shopName={displayBrandName}
            />
        </>
    );
};
