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
            className={cn("text-muted-foreground flex items-center space-x-1 text-sm", className)}
        >
            <ol className="flex items-center space-x-1">
                <li className="flex items-center">
                    <Link to="/" className="hover:text-foreground flex items-center sleek focus:outline-none" aria-label="Go to homepage">
                        <Home className="pointer-events-none h-4 w-4" />
                        <span className="sr-only">Home</span>
                    </Link>
                </li>

                {items.map((item, index) => {
                    const isLast = index === items.length - 1;

                    return (
                        <li key={item.href || item.label} className="flex items-center">
                            <span className="mx-2 flex items-center" aria-hidden="true">
                                <ChevronRight className="pointer-events-none h-4 w-4" />
                            </span>

                            {isLast || !item.href ? (
                                <span className="text-foreground font-medium" aria-current={isLast ? "page" : undefined}>
                                    {item.label}
                                </span>
                            ) : (
                                <Link to={item.href} className="sleek hover:text-foreground focus:outline-none">
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
