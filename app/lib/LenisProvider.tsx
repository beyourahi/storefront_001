import {createContext, useContext, useEffect, useState, useRef, type ReactNode} from "react";
import {useLocation} from "react-router";
import type Lenis from "lenis";
import {initSmoothScroll} from "./smoothScroll";

interface LenisContextValue {
    lenis: Lenis | null;
    scroll: number;
    stopScroll: () => void;
    startScroll: () => void;
    scrollToTop: (immediate?: boolean) => void;
}

const LenisContext = createContext<LenisContextValue | null>(null);

export function LenisProvider({children}: {children: ReactNode}) {
    const [lenis, setLenis] = useState<Lenis | null>(null);
    const [scroll, setScroll] = useState(0);
    const location = useLocation();
    const prevPathname = useRef(location.pathname);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const lenisInstance = initSmoothScroll();
        setLenis(lenisInstance);

        const handleScroll = (e: Lenis) => {
            setScroll(e.scroll);
        };

        lenisInstance.on("scroll", handleScroll);

        return () => {
            lenisInstance.off("scroll", handleScroll);
            lenisInstance.destroy();
        };
    }, []);

    useEffect(() => {
        if (location.pathname !== prevPathname.current && lenis) {
            lenis.scrollTo(0, {immediate: true});
            prevPathname.current = location.pathname;
        }
    }, [location.pathname, lenis]);

    const stopScroll = () => {
        if (lenis) {
            lenis.stop();
        }
    };

    const startScroll = () => {
        if (lenis) {
            lenis.start();
        }
    };

    const scrollToTop = (immediate = false) => {
        if (lenis) {
            lenis.scrollTo(0, {immediate});
        }
    };

    return (
        <LenisContext.Provider value={{lenis, scroll, stopScroll, startScroll, scrollToTop}}>
            {children}
        </LenisContext.Provider>
    );
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

export function useLockBodyScroll(isLocked: boolean) {
    const {stopScroll, startScroll} = useLenis();

    useEffect(() => {
        if (isLocked) {
            stopScroll();
        } else {
            startScroll();
        }

        return () => {
            if (isLocked) {
                startScroll();
            }
        };
    }, [isLocked, stopScroll, startScroll]);
}
