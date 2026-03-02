import {Link, useRouteLoaderData} from "react-router";
import {cn} from "~/lib/utils";
import {NAVIGATION_LINKS} from "~/lib/navigation";
import {navigationIcons} from "~/lib/navigation-icons";
import type {RootLoader} from "~/root";

type MobileMenuNavigationProps = {
    currentPath: string;
    onLinkClick: () => void;
};

export const MobileMenuNavigation = ({currentPath, onLinkClick}: MobileMenuNavigationProps) => {
    const data = useRouteLoaderData<RootLoader>("root");

    const filteredNavigationLinks = NAVIGATION_LINKS.filter(
        link =>
            link.href !== "/collections" &&
            link.href !== "/gallery" &&
            link.href !== "/contact" &&
            link.href !== "/collections/all-products"
    );

    const hasBlog = data?.hasBlog;

    if (filteredNavigationLinks.length === 0 && !hasBlog) return null;

    const BlogIcon = navigationIcons["/blogs"];
    const isBlogActive = currentPath === "/blogs" || currentPath.startsWith("/blogs/");

    return (
        <nav className="space-y-2.5">
            {filteredNavigationLinks.map(link => {
                const IconComponent = navigationIcons[link.href];
                const isActive = currentPath === link.href;

                return (
                    <Link
                        key={link.href}
                        to={link.href}
                        onClick={onLinkClick}
                        aria-current={isActive ? "page" : undefined}
                        className={cn(
                            "mobile-nav-link group sleek flex items-center gap-3 rounded-md px-4 py-4 text-sm font-medium active:scale-[0.98]",
                            isActive
                                ? "bg-primary text-primary-foreground shadow-primary/25 ring-primary/20 scale-[1.02] font-semibold shadow-md ring-2"
                                : "bg-muted text-foreground hover:bg-accent hover:text-accent-foreground hover:shadow-accent/10 hover:shadow-sm"
                        )}
                    >
                        {IconComponent && (
                            <IconComponent
                                className={cn(
                                    "sleek h-4 w-4 group-hover:scale-110",
                                    isActive
                                        ? "text-primary-foreground"
                                        : "text-muted-foreground group-hover:text-accent-foreground"
                                )}
                            />
                        )}
                        <span className={cn("sleek group-hover:translate-x-0.5", isActive ? "drop-shadow-sm" : "")}>
                            {link.label}
                        </span>
                    </Link>
                );
            })}
            {hasBlog && (
                <Link
                    to="/blogs"
                    onClick={onLinkClick}
                    aria-current={isBlogActive ? "page" : undefined}
                    className={cn(
                        "mobile-nav-link group sleek flex items-center gap-3 rounded-md px-4 py-4 text-sm font-medium active:scale-[0.98]",
                        isBlogActive
                            ? "bg-primary text-primary-foreground shadow-primary/25 ring-primary/20 scale-[1.02] font-semibold shadow-md ring-2"
                            : "bg-muted text-foreground hover:bg-accent hover:text-accent-foreground hover:shadow-accent/10 hover:shadow-sm"
                    )}
                >
                    {BlogIcon && (
                        <BlogIcon
                            className={cn(
                                "sleek h-4 w-4 group-hover:scale-110",
                                isBlogActive
                                    ? "text-primary-foreground"
                                    : "text-muted-foreground group-hover:text-accent-foreground"
                            )}
                        />
                    )}
                    <span className={cn("sleek group-hover:translate-x-0.5", isBlogActive ? "drop-shadow-sm" : "")}>
                        Blog
                    </span>
                </Link>
            )}
        </nav>
    );
};
