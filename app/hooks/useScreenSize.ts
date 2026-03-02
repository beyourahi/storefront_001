import {useState, useEffect} from "react";

export const BREAKPOINTS = {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    "2xl": 1536
} as const;

export type ScreenSize = "mobile" | "tablet" | "desktop";

interface UseScreenSizeReturn {
    screenSize: ScreenSize;
    width: number | null;
    isHydrated: boolean;
}

export function useScreenSize(): UseScreenSizeReturn {
    const [screenSize, setScreenSize] = useState<ScreenSize>("desktop");
    const [width, setWidth] = useState<number | null>(null);
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        const updateScreenSize = () => {
            const w = window.innerWidth;
            setWidth(w);

            if (w < BREAKPOINTS.sm) {
                setScreenSize("mobile");
            } else if (w < BREAKPOINTS.lg) {
                setScreenSize("tablet");
            } else {
                setScreenSize("desktop");
            }
        };

        updateScreenSize();
        setIsHydrated(true);

        window.addEventListener("resize", updateScreenSize);
        return () => window.removeEventListener("resize", updateScreenSize);
    }, []);

    return {screenSize, width, isHydrated};
}
