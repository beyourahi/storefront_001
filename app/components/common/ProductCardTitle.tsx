import {useMemo} from "react";
import {parseProductTitle} from "~/lib/product";

type ProductCardTitleProps = {
    productTitle: string;
    viewMode?: string;
    searchMode?: boolean;
};

export const ProductCardTitle = ({productTitle, viewMode = "grid3", searchMode = false}: ProductCardTitleProps) => {
    const {primary, secondary} = useMemo(() => parseProductTitle(productTitle), [productTitle]);

    const titleFontSize = useMemo(() => {
        if (searchMode) {
            switch (viewMode) {
                case "grid1":
                    return {
                        primary: "text-lg sm:text-xl lg:text-xl",
                        secondary: "text-sm sm:text-base lg:text-base"
                    };
                case "grid2":
                    return {
                        primary: "text-base sm:text-lg lg:text-lg",
                        secondary: "text-xs sm:text-sm lg:text-sm"
                    };
                case "grid3":
                    return {
                        primary: "text-base lg:text-sm",
                        secondary: "text-xs lg:text-xs"
                    };
                case "grid4":
                    return {
                        primary: "text-sm sm:text-base lg:text-sm",
                        secondary: "text-xs lg:text-[11px]"
                    };
                default:
                    return {
                        primary: "text-base lg:text-sm",
                        secondary: "text-xs lg:text-xs"
                    };
            }
        }

        switch (viewMode) {
            case "grid1":
                return {
                    primary: "text-lg sm:text-xl lg:text-2xl",
                    secondary: "text-sm sm:text-base lg:text-lg"
                };
            case "grid2":
                return {
                    primary: "text-base sm:text-lg lg:text-xl",
                    secondary: "text-xs sm:text-sm lg:text-base"
                };
            case "grid3":
                return {
                    primary: "text-base lg:text-base",
                    secondary: "text-xs lg:text-sm"
                };
            case "grid4":
                return {
                    primary: "text-sm sm:text-base lg:text-base",
                    secondary: "text-xs lg:text-xs"
                };
            default:
                return {
                    primary: "text-base lg:text-base",
                    secondary: "text-xs lg:text-sm"
                };
        }
    }, [viewMode, searchMode]);

    return (
        <div>
            <h3 className={`text-foreground font-serif font-semibold ${titleFontSize.primary}`}>{primary}</h3>
            {secondary && <h3 className={`text-foreground opacity-50 font-serif font-normal ${titleFontSize.secondary}`}>{secondary}</h3>}
        </div>
    );
};
