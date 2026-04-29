import {useMemo} from "react";
import {useLocation} from "react-router";
import {cn} from "~/lib/utils";
import {Breadcrumbs} from "~/components/common/Breadcrumbs";
import {deriveBreadcrumbsFromPath} from "~/lib/seo-breadcrumbs";

type PageBreadcrumbsProps = {
    customTitle?: string;
    className?: string;
};

export const PageBreadcrumbs = ({customTitle, className = ""}: PageBreadcrumbsProps) => {
    const location = useLocation();

    const breadcrumbItems = useMemo(() => {
        const items = deriveBreadcrumbsFromPath(location.pathname, customTitle);
        return items.map((item, index) => ({
            label: item.name,
            href: index < items.length - 1 ? item.url : undefined
        }));
    }, [location.pathname, customTitle]);

    if (breadcrumbItems.length === 0) return null;

    return (
        <div className={cn("px-2 pt-4 pb-2 md:px-4", className)}>
            <Breadcrumbs items={breadcrumbItems} className="mx-auto max-w-[2000px]" />
        </div>
    );
};
