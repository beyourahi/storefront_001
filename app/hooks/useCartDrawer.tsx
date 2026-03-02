import {createContext, type ReactNode, useContext, useState, useCallback} from "react";

type CartDrawerContextValue = {
    isOpen: boolean;
    open: () => void;
    close: () => void;
    toggle: () => void;
};

const CartDrawerContext = createContext<CartDrawerContextValue | null>(null);

export function CartDrawerProvider({children}: {children: ReactNode}) {
    const [isOpen, setIsOpen] = useState(false);

    const open = useCallback(() => setIsOpen(true), []);
    const close = useCallback(() => setIsOpen(false), []);
    const toggle = useCallback(() => setIsOpen(prev => !prev), []);

    return <CartDrawerContext.Provider value={{isOpen, open, close, toggle}}>{children}</CartDrawerContext.Provider>;
}

export const useCartDrawer = () => {
    const ctx = useContext(CartDrawerContext);
    if (!ctx) throw new Error("useCartDrawer must be used within CartDrawerProvider");
    return ctx;
};
