import {createContext, useCallback, useContext, useEffect, useMemo, useState, useRef, type ReactNode} from "react";
import {useLocation} from "react-router";
import type Lenis from "lenis";
import {initSmoothScroll} from "./smoothScroll";

interface LenisContextValue {
    lenis: Lenis | null;
    stopScroll: () => void;
    startScroll: () => void;
    scrollToTop: (immediate?: boolean) => void;
}

const LenisContext = createContext<LenisContextValue | null>(null);

export function LenisProvider({children}: {children: ReactNode}) {
    const [lenis, setLenis] = useState<Lenis | null>(null);
    const lenisRef = useRef<Lenis | null>(null);
    const location = useLocation();
    const prevPathname = useRef(location.pathname);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const lenisInstance = initSmoothScroll();
        lenisRef.current = lenisInstance;
        setLenis(lenisInstance);

        return () => {
            lenisRef.current = null;
            lenisInstance.destroy();
        };
    }, []);

    useEffect(() => {
        if (location.pathname !== prevPathname.current && lenisRef.current) {
            lenisRef.current.scrollTo(0, {immediate: true});
            prevPathname.current = location.pathname;
        }
    }, [location.pathname]);

    const stopScroll = useCallback(() => {
        lenisRef.current?.stop();
    }, []);

    const startScroll = useCallback(() => {
        lenisRef.current?.start();
    }, []);

    const scrollToTop = useCallback((immediate = false) => {
        lenisRef.current?.scrollTo(0, {immediate});
    }, []);

    const contextValue = useMemo(
        () => ({lenis, stopScroll, startScroll, scrollToTop}),
        [lenis, stopScroll, startScroll, scrollToTop]
    );

    return <LenisContext.Provider value={contextValue}>{children}</LenisContext.Provider>;
}

export function useLenis(): LenisContextValue {
    const context = useContext(LenisContext);
    if (!context) {
        throw new Error("useLenis must be used within a LenisProvider");
    }
    return context;
}

export function useLenisScroll(callback: (scroll: number, lenis: Lenis) => void) {
    const {lenis} = useLenis();

    useEffect(() => {
        if (!lenis) return;

        const handleScroll = (e: Lenis) => {
            callback(e.scroll, e);
        };

        lenis.on("scroll", handleScroll);
        return () => {
            lenis.off("scroll", handleScroll);
        };
    }, [lenis, callback]);
}

// Shared counter: lenis.start() is only called when every locker has released.
// This prevents a closed overlay from unlocking scroll while another overlay is open.
let scrollLockCount = 0;

export function useLockBodyScroll(isLocked: boolean) {
    const {stopScroll, startScroll, lenis} = useLenis();

    useEffect(() => {
        if (isLocked) {
            scrollLockCount++;
            stopScroll();
        }

        return () => {
            if (isLocked) {
                scrollLockCount--;
                if (scrollLockCount === 0) {
                    startScroll();
                }
            }
        };
    }, [isLocked, stopScroll, startScroll, lenis]);
}
