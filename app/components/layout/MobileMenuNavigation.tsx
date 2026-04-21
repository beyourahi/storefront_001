import {Link} from "react-router";
import {cn} from "~/lib/utils";
import {NAVIGATION_LINKS} from "~/lib/navigation";
import {navigationIcons} from "~/lib/navigation-icons";
import {usePointerCapabilities} from "~/hooks/usePointerCapabilities";

type MobileMenuNavigationProps = {
    currentPath: string;
    onLinkClick: () => void;
};

export const MobileMenuNavigation = ({currentPath, onLinkClick}: MobileMenuNavigationProps) => {
    const {canHover} = usePointerCapabilities();

    const filteredNavigationLinks = NAVIGATION_LINKS.filter(
        link =>
            link.href !== "/collections" &&
            link.href !== "/gallery" &&
            link.href !== "/collections/all-products"
    );

    if (filteredNavigationLinks.length === 0) return null;

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
                            "mobile-nav-link group sleek motion-press flex items-center gap-3 rounded-md px-4 py-4 text-sm font-medium active:scale-[var(--motion-press-scale)]",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:bg-accent",
                            isActive
                                ? "bg-primary text-primary-foreground shadow-primary/25 ring-primary/20 scale-[1.02] font-semibold shadow-md ring-2"
                                : canHover
                                  ? "bg-muted text-foreground hover:bg-accent hover:text-accent-foreground hover:shadow-accent/10 hover:shadow-sm"
                                  : "bg-muted text-foreground active:bg-accent active:text-accent-foreground"
                        )}
                    >
                        {IconComponent && (
                            <IconComponent
                                className={cn(
                                    "sleek h-4 w-4",
                                    canHover ? "group-hover:scale-110" : "group-active:scale-105",
                                    isActive
                                        ? "text-primary-foreground"
                                        : canHover
                                          ? "text-muted-foreground group-hover:text-accent-foreground"
                                          : "text-muted-foreground group-active:text-accent-foreground"
                                )}
                            />
                        )}
                        <span
                            className={cn(
                                "sleek",
                                canHover ? "group-hover:translate-x-0.5" : "group-active:translate-x-0.5",
                                isActive ? "drop-shadow-sm" : ""
                            )}
                        >
                            {link.label}
                        </span>
                    </Link>
                );
            })}
        </nav>
    );
};
