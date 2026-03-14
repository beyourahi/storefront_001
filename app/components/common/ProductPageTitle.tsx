import {useMemo} from "react";
import {parseProductTitle} from "~/lib/product";

type ProductPageTitleProps = {
    title: string;
};

export const ProductPageTitle = ({title}: ProductPageTitleProps) => {
    const {primary, secondary} = useMemo(() => parseProductTitle(title), [title]);

    return (
        <div className="lg:col-span-2">
            <h1 className="font-serif text-2xl font-bold tracking-tight sm:text-2xl">{primary}</h1>
            {secondary && <h3 className="opacity-50 3xl:text-base font-serif text-sm font-normal">{secondary}</h3>}
        </div>
    );
};
