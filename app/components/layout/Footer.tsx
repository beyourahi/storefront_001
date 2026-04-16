import {Link, useLocation} from "react-router";
import {FileText, RefreshCw, Shield, Truck, type LucideIcon} from "lucide-react";
import {POLICY_LINKS, DEVELOPER_CONFIG} from "~/lib/navigation";
import {useSiteSettings} from "~/lib/site-content-context";
import {NewsletterSignup} from "~/components/common/NewsletterSignup";
import {cn} from "~/lib/utils";

const getPolicyIcon = (policyKey: string): LucideIcon => {
    switch (policyKey) {
        case "privacyPolicy":
            return Shield;
        case "termsOfService":
            return FileText;
        case "shippingPolicy":
            return Truck;
        case "refundPolicy":
            return RefreshCw;
        default:
            return FileText;
    }
};

/** Quick navigation links for the "Shop" column */
const SHOP_LINKS = [
    {href: "/collections/all-products", label: "All Products"},
    {href: "/collections", label: "Collections"},
    {href: "/sale", label: "Sale"},
    {href: "/search", label: "Search"}
] as const;

/** Quick navigation links for the "Company" column */
const COMPANY_LINKS = [
    {href: "/faq", label: "FAQ"},
    {href: "/gallery", label: "Gallery"},
    {href: "/blogs", label: "Blog"}
] as const;

export const Footer = ({shopName}: {shopName: string}) => {
    const {pathname} = useLocation();
    const siteSettings = useSiteSettings();

    const isProductPage = pathname.startsWith("/products/");
    const brandDescription = siteSettings.missionStatement || "";

    return (
        <footer className="bg-background relative">
            {/* Gradient top border */}
            <div className="via-primary absolute top-0 right-0 left-0 h-px bg-gradient-to-r from-transparent to-transparent" />

            {/* id="footer-bottom-bar" is the IntersectionObserver target used by
                 useFooterClearance (app/hooks/useFooterClearance.ts) to lift the
                 floating button stack when this block enters the viewport.
                 The ID covers the full footer content so buttons clear all columns,
                 not just the copyright row. */}
            <div
                id="footer-bottom-bar"
                className={cn(
                    "mx-auto max-w-[2000px] px-4 pt-10 pb-8 md:px-6 lg:pt-14",
                    isProductPage ? "pb-36 lg:pb-8" : ""
                )}
            >
                {/* ── Main Footer Grid ── */}
                <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-5 lg:gap-12">
                    {/* Column 1: Newsletter */}
                    <div className="sm:col-span-2 lg:col-span-2 lg:border-r lg:border-border/30 lg:pr-10">
                        <h3 className="font-serif text-lg font-semibold text-foreground">Stay Connected</h3>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                            {brandDescription
                                ? brandDescription.length > 120
                                    ? brandDescription.slice(0, 120).trim() + "..."
                                    : brandDescription
                                : "Sign up for exclusive offers, new arrivals, and updates."}
                        </p>
                        <div className="mt-4">
                            <NewsletterSignup variant="compact" />
                        </div>
                    </div>

                    {/* Column 2: Shop Links */}
                    <nav aria-label="Shop navigation">
                        <h3 className="font-serif text-lg font-semibold text-foreground">Shop</h3>
                        <ul className="mt-3 space-y-2.5">
                            {SHOP_LINKS.map(link => (
                                <li key={link.href}>
                                    <Link
                                        to={link.href}
                                        className={cn(
                                            "text-sm sleek",
                                            pathname === link.href
                                                ? "text-primary font-medium"
                                                : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {/* Column 3: Company Links */}
                    <nav aria-label="Company navigation">
                        <h3 className="font-serif text-lg font-semibold text-foreground">Company</h3>
                        <ul className="mt-3 space-y-2.5">
                            {COMPANY_LINKS.map(link => (
                                <li key={link.href}>
                                    <Link
                                        to={link.href}
                                        className={cn(
                                            "text-sm sleek",
                                            pathname === link.href
                                                ? "text-primary font-medium"
                                                : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                            <li>
                                <Link
                                    to="/changelog"
                                    className={cn(
                                        "text-sm sleek",
                                        pathname === "/changelog"
                                            ? "text-primary font-medium"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    Changelog
                                </Link>
                            </li>
                        </ul>
                    </nav>

                    {/* Column 4: Legal / Policies */}
                    {POLICY_LINKS.length > 0 && (
                        <nav aria-label="Legal navigation">
                            <h3 className="font-serif text-lg font-semibold text-foreground">Legal</h3>
                            <ul className="mt-3 space-y-2.5">
                                {POLICY_LINKS.map(link => {
                                    const IconComponent = getPolicyIcon(link.policyKey);
                                    return (
                                        <li key={link.href}>
                                            <Link
                                                to={link.href}
                                                className={cn(
                                                    "inline-flex items-center gap-2 text-sm sleek",
                                                    pathname === link.href
                                                        ? "text-primary font-medium"
                                                        : "text-muted-foreground hover:text-foreground"
                                                )}
                                            >
                                                <IconComponent className="h-3.5 w-3.5 shrink-0" />
                                                {link.label}
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </nav>
                    )}
                </div>

                {/* ── Divider ── */}
                <div className="mt-10 h-px bg-gradient-to-r from-transparent via-border to-transparent lg:mt-12" />

                {/* ── Bottom Bar: Copyright + Developer Credit ── */}
                <div className="mt-6 flex flex-col items-center justify-between space-y-3 text-center md:flex-row md:space-y-0">
                    <p className="text-muted-foreground/70 text-sm font-medium">
                        &copy; <span>{new Date().getFullYear()}</span>{" "}
                        <span className="font-serif">{shopName}</span>. All rights reserved.
                    </p>
                    {/* Developer credit — Slash Cut badge (mirrors storefront_002 design).
                         Contrast rationale (bg-background runtime ≈ L 14.5%):
                         text-foreground/90 → ~16:1  ✓ (label)
                         text-foreground/75 → ~13:1  ✓ (slash separator)
                         text-foreground    → ~18:1  ✓ (name)
                         Uses foreground-based tokens (dark surface) mirroring storefront_002's
                         primary-foreground-based tokens (light surface). */}
                    <a
                        href={DEVELOPER_CONFIG.url}
                        target="_blank"
                        rel="noreferrer"
                        className="group motion-link inline-flex items-center rounded-[3px] border border-foreground/30 bg-foreground/[0.03] text-sm transition-[border-color,background-color] duration-[220ms] ease-[var(--motion-ease-standard)] hover:border-foreground/55 hover:bg-foreground/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/50 focus-visible:ring-offset-1 focus-visible:ring-offset-background"
                    >
                        <span className="px-2.5 py-1.5 text-[10px] font-medium uppercase tracking-[0.15em] text-foreground/90 transition-colors duration-[220ms] ease-[var(--motion-ease-standard)] group-hover:text-foreground">
                            Designed by
                        </span>
                        <span
                            aria-hidden="true"
                            className="select-none text-sm font-light text-foreground/75 transition-colors duration-[220ms] ease-[var(--motion-ease-standard)] group-hover:text-foreground"
                        >
                            /
                        </span>
                        <span className="px-2.5 py-1.5 font-semibold text-foreground transition-colors duration-[220ms] ease-[var(--motion-ease-standard)] group-hover:text-foreground">
                            {DEVELOPER_CONFIG.name}
                        </span>
                    </a>
                </div>
            </div>
        </footer>
    );
};
