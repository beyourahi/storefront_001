import {XIcon, ChevronLeftIcon, ChevronRightIcon} from "lucide-react";
import {Button} from "~/components/ui/button";

interface LightboxControlsProps {
    onClose: () => void;
    onPrevious: () => void;
    onNext: () => void;
    showNavigation: boolean;
    currentIndex: number;
    totalCount: number;
}

export function LightboxControls({
    onClose,
    onPrevious,
    onNext,
    showNavigation,
    currentIndex,
    totalCount
}: LightboxControlsProps) {
    return (
        <>
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10">
                <span className="text-light text-sm font-medium bg-dark/60 px-3 py-1.5 rounded-full backdrop-blur-sm">
                    {currentIndex + 1} / {totalCount}
                </span>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="sleek bg-dark/60 hover:bg-dark/80 text-light/80 hover:text-light rounded-full backdrop-blur-sm focus-visible:ring-2 focus-visible:ring-light"
                    aria-label="Close lightbox"
                >
                    <XIcon className="size-5" />
                </Button>
            </div>

            {showNavigation && (
                <>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onPrevious}
                        className="sleek absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-dark/60 hover:bg-dark/80 text-light/80 hover:text-light rounded-full backdrop-blur-sm focus-visible:ring-2 focus-visible:ring-light"
                        aria-label="Previous image"
                    >
                        <ChevronLeftIcon className="size-6" />
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onNext}
                        className="sleek absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-dark/60 hover:bg-dark/80 text-light/80 hover:text-light rounded-full backdrop-blur-sm focus-visible:ring-2 focus-visible:ring-light"
                        aria-label="Next image"
                    >
                        <ChevronRightIcon className="size-6" />
                    </Button>
                </>
            )}
        </>
    );
}
