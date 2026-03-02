import {useLocation} from "react-router";
import type {SelectedOption} from "@shopify/hydrogen/storefront-api-types";

export const useVariantUrl = (handle: string, selectedOptions?: SelectedOption[]) => {
    const {pathname} = useLocation();

    return getVariantUrl({
        handle,
        pathname,
        searchParams: new URLSearchParams(),
        selectedOptions
    });
};

export const getVariantUrl = ({
    handle,
    pathname,
    searchParams,
    selectedOptions
}: {
    handle: string;
    pathname: string;
    searchParams: URLSearchParams;
    selectedOptions?: SelectedOption[];
}) => {
    const localeRegex = /(\/[a-zA-Z]{2}-[a-zA-Z]{2}\/)/g;
    const match = localeRegex.exec(pathname);
    const isLocalePathname = match && match.length > 0;

    const path = isLocalePathname ? `${match![0]}products/${handle}` : `/products/${handle}`;

    selectedOptions?.forEach(option => {
        searchParams.set(option.name, option.value);
    });

    const searchString = searchParams.toString();

    return path + (searchString ? "?" + searchParams.toString() : "");
};
