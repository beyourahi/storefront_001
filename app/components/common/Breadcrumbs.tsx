import {Link} from "react-router";
import {ChevronRight, Home} from "lucide-react";
import {cn} from "~/lib/utils";

type BreadcrumbItem = {
    label: string;
    href?: string;
};

type BreadcrumbsProps = {
    items: BreadcrumbItem[];
    className?: string;
};

export const Breadcrumbs = ({items, className}: BreadcrumbsProps) => {
    if (items.length === 0) return null;

    return (
        <nav
            aria-label="Breadcrumb navigation"
            className={cn("text-muted-foreground flex items-center text-sm", className)}
        >
            <ol className="flex min-w-0 items-center">
                <li className="flex shrink-0 items-center">
                    <Link
                        to="/"
                        className="hover:text-foreground sleek flex items-center"
                        aria-label="Go to homepage"
                    >
                        <Home className="pointer-events-none h-4 w-4" />
                        <span className="sr-only">Home</span>
                    </Link>
                </li>

                {items.map((item, index) => {
                    const isLast = index === items.length - 1;

                    // Last item may grow/shrink to fill remaining space; intermediate items
                    // get a tighter cap so the trailing crumb stays readable.
                    const maxWidthClass = isLast
                        ? "max-w-[16ch] sm:max-w-[28ch] md:max-w-[40ch] lg:max-w-[60ch]"
                        : "max-w-[10ch] sm:max-w-[18ch] md:max-w-[24ch]";

                    return (
                        <li
                            key={item.href || item.label}
                            className={cn("flex min-w-0 items-center", isLast ? "flex-1" : "shrink-0")}
                        >
                            <span className="mx-2 flex shrink-0 items-center" aria-hidden="true">
                                <ChevronRight className="pointer-events-none h-4 w-4" />
                            </span>

                            {isLast || !item.href ? (
                                <span
                                    className={cn("text-foreground block truncate font-medium", maxWidthClass)}
                                    aria-current={isLast ? "page" : undefined}
                                    title={item.label}
                                >
                                    {item.label}
                                </span>
                            ) : (
                                <Link
                                    to={item.href}
                                    className={cn("sleek hover:text-foreground block truncate", maxWidthClass)}
                                    title={item.label}
                                >
                                    {item.label}
                                </Link>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
};
