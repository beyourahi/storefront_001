import {useEffect} from "react";

export function useSearchKeyboard(onOpen: () => void) {
    useEffect(() => {
        const handleKeydown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                onOpen();
            }
        };

        document.addEventListener("keydown", handleKeydown);
        return () => document.removeEventListener("keydown", handleKeydown);
    }, [onOpen]);
}

export function getKeyboardShortcutLabel(): string {
    if (typeof navigator === "undefined") return "Ctrl+K";
    const isMac = navigator.platform?.toLowerCase().includes("mac") ?? false;
    return isMac ? "⌘K" : "Ctrl+K";
}
