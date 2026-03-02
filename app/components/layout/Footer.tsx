import {Link, useLocation, useRouteLoaderData} from "react-router";
import {FileText, RefreshCw, Shield, Truck, type LucideIcon} from "lucide-react";
import {POLICY_LINKS, DEVELOPER_CONFIG} from "~/lib/navigation";
import {cn} from "~/lib/utils";
import type {RootLoader} from "~/root";

type PolicyAvailability = Record<string, boolean>;

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

export const Footer = ({shopName}: {shopName: string}) => {
    const {pathname} = useLocation();
    const data = useRouteLoaderData<RootLoader>("root");

    const isProductPage = pathname.startsWith("/products/");

    const policyAvailability = (data as Record<string, unknown> | undefined)?.policyAvailability as
        | PolicyAvailability
        | undefined;

    const availablePolicyLinks = POLICY_LINKS.filter(link => policyAvailability?.[link.policyKey] === true);

    return (
        <footer className="bg-background relative">
            <div className="via-primary absolute top-0 right-0 left-0 h-px bg-gradient-to-r from-transparent to-transparent" />

            <div
                className={cn(
                    "mx-auto max-w-[2000px] px-4 pt-6 pb-8 md:px-6 md:pt-8",
                    isProductPage ? "pb-36 lg:pb-8" : ""
                )}
            >
                <div className="flex flex-col space-y-6">
                    {availablePolicyLinks.length > 0 && (
                        <nav className="w-full">
                            <ul className="grid grid-cols-2 gap-3 lg:flex lg:items-center lg:justify-center lg:gap-0 lg:space-x-8">
                                {availablePolicyLinks.map(link => {
                                    const IconComponent = getPolicyIcon(link.policyKey);
                                    return (
                                        <li key={link.href} className="lg:list-item">
                                            <Link
                                                to={link.href}
                                                className={cn(
                                                    "hover:text-primary sleek inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold",
                                                    pathname === link.href
                                                        ? "text-primary cool-active-underline"
                                                        : "text-foreground/80 cool-underline"
                                                )}
                                            >
                                                <IconComponent className="h-3.5 w-3.5 lg:hidden" />
                                                {link.label}
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </nav>
                    )}

                    {availablePolicyLinks.length > 0 && <div className="bg-border/30 h-px lg:hidden" />}

                    <div className="flex flex-col items-center justify-between space-y-3 text-center md:w-full md:flex-row md:space-y-0">
                        <p className="text-muted-foreground/70 text-base font-medium">
                            &copy; <span>{new Date().getFullYear()}</span>{" "}
                            <span className="font-serif">{shopName}</span>. All rights reserved.
                        </p>
                        <a
                            href={DEVELOPER_CONFIG.url}
                            target="_blank"
                            rel="noreferrer"
                            className="group text-muted-foreground/70 text-base font-medium"
                        >
                            <span className="">Designed by</span>{" "}
                            <span className="after:bg-primary group-hover:text-primary sleek relative pb-2 font-semibold after:absolute after:-bottom-0 after:left-1/2 after:h-[2px] after:w-0 after:-translate-x-1/2 after:transition-[width] after:duration-200 group-hover:after:w-[35%]">
                                {DEVELOPER_CONFIG.name}
                            </span>
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
};
