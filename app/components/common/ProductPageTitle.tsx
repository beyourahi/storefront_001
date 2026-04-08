import {useMemo} from "react";
import {parseProductTitle} from "~/lib/product";

type ProductPageTitleProps = {
    title: string;
    /** Override the heading tag. Defaults to "h1". Use "p" for duplicate/decorative instances that must not create extra H1 elements. */
    as?: "h1" | "p";
    "aria-hidden"?: boolean;
};

export const ProductPageTitle = ({title, as: Tag = "h1", "aria-hidden": ariaHidden}: ProductPageTitleProps) => {
    const {primary, secondary} = useMemo(() => parseProductTitle(title), [title]);

    return (
        <div className="lg:col-span-2">
            <Tag className="font-serif text-3xl font-bold tracking-tight sm:text-3xl" aria-hidden={ariaHidden || undefined}>{primary}</Tag>
            {secondary && <h3 className="opacity-50 3xl:text-lg font-serif text-base font-normal">{secondary}</h3>}
        </div>
    );
};
