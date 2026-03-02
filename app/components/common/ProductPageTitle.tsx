import {useMemo} from "react";

type ProductPageTitleProps = {
    title: string;
};

export const ProductPageTitle = ({title}: ProductPageTitleProps) => {
    const parts = useMemo(() => title.trim().split(" + "), [title]);

    return (
        <div className="lg:col-span-2">
            <h1 className="font-serif text-2xl font-bold tracking-tight sm:text-2xl">{parts[0]}</h1>
            {parts[1] && <h3 className="opacity-50 3xl:text-base font-serif text-sm font-normal">{parts[1]}</h3>}
        </div>
    );
};
