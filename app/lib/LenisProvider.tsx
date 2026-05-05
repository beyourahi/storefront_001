/**
 * React context and hooks for Lenis smooth scroll.
 *
 * `LenisProvider` initialises a Lenis instance on mount, auto-scrolls to the
 * top on route changes, and provides `stop`/`start`/`scrollToTop` helpers.
 * Overlay components should use `useScrollLock` (the ref-counted hook in
 * `hooks/useScrollLock.ts`) rather than calling `stopScroll`/`startScroll`
 * directly, to avoid premature scroll re-enablement when multiple overlays
 * are stacked.
 */
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

/** Access the Lenis context. Must be called within `LenisProvider`. */
export function useLenis(): LenisContextValue {
    const context = useContext(LenisContext);
    if (!context) {
        throw new Error("useLenis must be used within a LenisProvider");
    }
    return context;
}

/**
 * Subscribe to Lenis scroll events. The `callback` receives the current
 * scroll position and the Lenis instance on each frame.
 */
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

/**
 * Lock/unlock Lenis scroll when `isLocked` changes.
 * Ref-counted: scroll only resumes when every caller has unlocked.
 * Prefer `useScrollLock` from `hooks/useScrollLock.ts` for overlay components —
 * this lower-level hook is used by the hook itself.
 */
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
