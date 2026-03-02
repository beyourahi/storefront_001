import {useMemo} from "react";
import {useLocation} from "react-router";
import {cn} from "~/lib/utils";
import {Breadcrumbs} from "~/components/common/Breadcrumbs";

type PageBreadcrumbsProps = {
    customTitle?: string;
    className?: string;
};

const generateBreadcrumbItems = (pathname: string): Array<{label: string; href?: string}> => {
    const segments = pathname.split("/").filter(Boolean);
    const items: Array<{label: string; href?: string}> = [];

    let currentPath = "";
    for (const [index, segment] of segments.entries()) {
        currentPath += `/${segment}`;
        const label = segment
            .split("-")
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
        const isLast = index === segments.length - 1;
        items.push({label, href: isLast ? undefined : currentPath});
    }

    return items;
};

export const PageBreadcrumbs = ({customTitle, className = ""}: PageBreadcrumbsProps) => {
    const location = useLocation();

    const breadcrumbItems = useMemo(() => {
        const items = generateBreadcrumbItems(location.pathname);

        if (customTitle && items.length > 0) {
            items[items.length - 1] = {
                ...items[items.length - 1],
                label: customTitle,
                href: undefined
            };
        }

        return items;
    }, [location.pathname, customTitle]);

    if (breadcrumbItems.length === 0) return null;

    return (
        <div className={cn("px-2 pt-4 pb-2 md:px-4", className)}>
            <Breadcrumbs items={breadcrumbItems} className="mx-auto max-w-[2000px]" />
        </div>
    );
};
