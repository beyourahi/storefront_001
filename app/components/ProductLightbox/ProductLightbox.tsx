import {useState, useEffect} from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {cn} from "~/lib/utils";
import {useScrollLock} from "~/hooks/useScrollLock";

import {LightboxMedia} from "./LightboxMedia";
import {LightboxThumbnails} from "./LightboxThumbnails";
import {LightboxControls} from "./LightboxControls";
import {useLightboxKeyboard} from "./useLightboxKeyboard";

interface ProductLightboxProps {
    media: any[];
    initialIndex: number;
    isOpen: boolean;
    onClose: () => void;
    availableForSale?: boolean;
}

export function ProductLightbox({media, initialIndex, isOpen, onClose, availableForSale = true}: ProductLightboxProps) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);

    useEffect(() => {
        if (isOpen) setCurrentIndex(initialIndex);
    }, [isOpen, initialIndex]);

    // Videos unmount on navigation (only currentMedia is rendered) so no explicit
    // pause needed — the new video autoPlays on mount via the autoPlay attribute.
    const goToNext = () => setCurrentIndex(prev => (prev + 1) % media.length);
    const goToPrevious = () => setCurrentIndex(prev => (prev - 1 + media.length) % media.length);
    const goToIndex = (index: number) => setCurrentIndex(index);

    useLightboxKeyboard({
        isOpen,
        onNext: goToNext,
        onPrevious: goToPrevious,
        onClose
    });

    useScrollLock(isOpen);

    useEffect(() => {
        if (!isOpen) return;

        const preloadIndexes = [(currentIndex + 1) % media.length, (currentIndex - 1 + media.length) % media.length];

        preloadIndexes.forEach(index => {
            const item = media[index];
            if (item.__typename === "MediaImage" && item.image?.url) {
                const img = new Image();
                img.src = item.image.url;
            }
        });
    }, [isOpen, currentIndex, media]);

    const currentMedia = media[currentIndex];

    if (!currentMedia) {
        return null;
    }

    return (
        <DialogPrimitive.Root open={isOpen} onOpenChange={open => !open && onClose()}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Close asChild>
                    <DialogPrimitive.Overlay
                        className={cn(
                            "fixed inset-0 z-[9999]",
                            "bg-dark/90 backdrop-blur-sm",
                            "data-[state=open]:animate-in data-[state=closed]:animate-out",
                            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
                        )}
                        aria-label="Close lightbox"
                    />
                </DialogPrimitive.Close>

                <DialogPrimitive.Content
                    className={cn(
                        "fixed inset-0 z-[9999]",
                        "flex flex-col",
                        "data-[state=open]:animate-in data-[state=closed]:animate-out",
                        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                        "duration-200"
                    )}
                    onPointerDownOutside={e => e.preventDefault()}
                    aria-label="Product media lightbox"
                >
                    <LightboxControls
                        onClose={onClose}
                        onNext={goToNext}
                        onPrevious={goToPrevious}
                        showNavigation={media.length > 1}
                        currentIndex={currentIndex}
                        totalCount={media.length}
                    />

                    <div
                        className="flex-1 flex items-center justify-center px-4 md:px-8 cursor-pointer"
                        onClick={e => {
                            if (e.target === e.currentTarget) {
                                onClose();
                            }
                        }}
                        onKeyDown={e => {
                            if ((e.key === "Enter" || e.key === " ") && e.target === e.currentTarget) {
                                e.preventDefault();
                                onClose();
                            }
                        }}
                        role="button"
                        tabIndex={-1}
                        aria-label="Click to close lightbox"
                    >
                        <div
                            onClick={e => e.stopPropagation()}
                            onKeyDown={e => e.stopPropagation()}
                            role="presentation"
                        >
                            <LightboxMedia media={currentMedia} />
                        </div>
                    </div>

                    <LightboxThumbnails
                        media={media}
                        currentIndex={currentIndex}
                        onSelect={goToIndex}
                        availableForSale={availableForSale}
                    />
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}
