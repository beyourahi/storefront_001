import {useEffect} from "react";

interface UseLightboxKeyboardProps {
    isOpen: boolean;
    onNext: () => void;
    onPrevious: () => void;
    onClose: () => void;
}

export function useLightboxKeyboard({isOpen, onNext, onPrevious, onClose}: UseLightboxKeyboardProps) {
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            switch (event.key) {
                case "ArrowRight":
                    event.preventDefault();
                    onNext();
                    break;

                case "ArrowLeft":
                    event.preventDefault();
                    onPrevious();
                    break;

                case "Escape":
                    event.preventDefault();
                    onClose();
                    break;
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onNext, onPrevious, onClose]);
}
