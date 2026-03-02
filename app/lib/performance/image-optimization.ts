export interface ImageLoadingConfig {
    loading: "eager" | "lazy";
    priority: boolean;
    fetchPriority?: "high" | "low" | "auto";
}

export const getImageLoadingConfig = (
    isAboveFold: boolean,
    isHero: boolean = false,
    index: number = 0
): ImageLoadingConfig => {
    if (isHero || (isAboveFold && index <= 2)) {
        return {
            loading: "eager",
            priority: true,
            fetchPriority: "high"
        };
    }

    if (isAboveFold && index <= 6) {
        return {
            loading: "eager",
            priority: false,
            fetchPriority: "auto"
        };
    }

    return {
        loading: "lazy",
        priority: false,
        fetchPriority: "auto"
    };
};

export const getCarouselImageConfig = (index: number): ImageLoadingConfig => {
    if (index === 0) {
        return {
            loading: "eager",
            priority: true,
            fetchPriority: "high"
        };
    }

    if (index <= 2) {
        return {
            loading: "eager",
            priority: false,
            fetchPriority: "auto"
        };
    }

    return {
        loading: "lazy",
        priority: false,
        fetchPriority: "auto"
    };
};

export const getGridImageConfig = (index: number, itemsPerRow: number = 4): ImageLoadingConfig => {
    const firstRowItems = itemsPerRow;
    const secondRowItems = itemsPerRow * 2;

    if (index < firstRowItems) {
        return {
            loading: "eager",
            priority: index < 2,
            fetchPriority: index < 2 ? "high" : "auto"
        };
    }

    if (index < secondRowItems) {
        return {
            loading: "eager",
            priority: false,
            fetchPriority: "auto"
        };
    }

    return {
        loading: "lazy",
        priority: false,
        fetchPriority: "auto"
    };
};

export const getOptimalImageSizes = (breakpoints: {mobile?: number; tablet?: number; desktop?: number}) => {
    const {mobile = 100, tablet = 50, desktop = 25} = breakpoints;

    return `(max-width: 640px) ${mobile}vw, (max-width: 1024px) ${tablet}vw, ${desktop}vw`;
};

export const createResponsiveSizes = (
    mobileColumns: number = 1,
    tabletColumns: number = 2,
    desktopColumns: number = 4
): string => {
    const mobileWidth = Math.floor(100 / mobileColumns);
    const tabletWidth = Math.floor(100 / tabletColumns);
    const desktopWidth = Math.floor(100 / desktopColumns);

    return `(max-width: 640px) ${mobileWidth}vw, (max-width: 1024px) ${tabletWidth}vw, ${desktopWidth}vw`;
};
