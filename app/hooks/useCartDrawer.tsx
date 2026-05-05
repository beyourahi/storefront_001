/**
 * Cart drawer open/close state managed via React context.
 *
 * The drawer closes automatically on route navigation to prevent stale states
 * when the user navigates away mid-session. Wrap the app (or the relevant
 * layout) in `CartDrawerProvider`, then call `useCartDrawer()` in any
 * descendant to open, close, or toggle the cart aside.
 */
import {createContext, type ReactNode, useContext, useState, useCallback, useMemo, useEffect} from "react";
import {useLocation} from "react-router";

type CartDrawerContextValue = {
    isOpen: boolean;
    open: () => void;
    close: () => void;
    toggle: () => void;
};

const CartDrawerContext = createContext<CartDrawerContextValue | null>(null);

/** Provider that owns cart drawer open/close state. Mount once per layout. */
export function CartDrawerProvider({children}: {children: ReactNode}) {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();

    const open = useCallback(() => setIsOpen(true), []);
    const close = useCallback(() => setIsOpen(false), []);
    const toggle = useCallback(() => setIsOpen(prev => !prev), []);

    // Close the cart drawer on route changes to prevent stale fetcher opens
    useEffect(() => {
        setIsOpen(false);
    }, [location.pathname]);

    const value = useMemo(() => ({isOpen, open, close, toggle}), [isOpen, open, close, toggle]);

    return <CartDrawerContext.Provider value={value}>{children}</CartDrawerContext.Provider>;
}

/** Access cart drawer state. Must be used within `CartDrawerProvider`. */
export const useCartDrawer = () => {
    const ctx = useContext(CartDrawerContext);
    if (!ctx) throw new Error("useCartDrawer must be used within CartDrawerProvider");
    return ctx;
};
