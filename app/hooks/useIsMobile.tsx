import {useState, useEffect} from "react";

/**
 * Returns `true` when the viewport is narrower than `breakpoint` pixels.
 * Uses `window.matchMedia` so the listener fires only at the boundary,
 * not on every pixel change. Defaults to `false` before hydration.
 *
 * @param breakpoint - Viewport width in pixels below which the device is
 *                     considered mobile (default: 1024, matching Tailwind `lg`)
 */
export const useIsMobile = (breakpoint = 1024) => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
        const onChange = (e: MediaQueryListEvent | MediaQueryList) => setIsMobile(e.matches);
        onChange(mql);
        mql.addEventListener("change", onChange);
        return () => mql.removeEventListener("change", onChange);
    }, [breakpoint]);

    return isMobile;
};
