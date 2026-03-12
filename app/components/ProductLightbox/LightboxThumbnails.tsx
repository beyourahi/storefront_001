import {useRef, useEffect} from "react";
import {PlayIcon} from "lucide-react";
import {cn} from "~/lib/utils";

interface LightboxThumbnailsProps {
    media: any[];
    currentIndex: number;
    onSelect: (index: number) => void;
}

function getThumbnailUrl(item: any): string | null {
    if (item.__typename === "MediaImage" && item.image) {
        return item.image.url;
    }
    if (item.__typename === "Video" && item.previewImage) {
        return item.previewImage.url;
    }
    return null;
}

export function LightboxThumbnails({media, currentIndex, onSelect}: LightboxThumbnailsProps) {
    const thumbnailRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

    useEffect(() => {
        const activeThumb = thumbnailRefs.current.get(currentIndex);
        if (activeThumb) {
            activeThumb.scrollIntoView({
                behavior: "smooth",
                block: "nearest",
                inline: "center"
            });
        }
    }, [currentIndex]);

    return (
        <div className="pt-2 px-4 md:px-8" role="tablist" aria-label="Product media thumbnails">
            <div className={cn("flex gap-2 md:gap-3 overflow-x-auto py-2", "scrollbar-hide", "justify-center")}>
                {media.map((item, index) => {
                    const thumbnailUrl = getThumbnailUrl(item);
                    const isActive = index === currentIndex;
                    const isVideo = item.__typename === "Video";

                    return (
                        <button
                            key={item.id}
                            ref={el => {
                                if (el) {
                                    thumbnailRefs.current.set(index, el);
                                } else {
                                    thumbnailRefs.current.delete(index);
                                }
                            }}
                            onClick={() => onSelect(index)}
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            aria-label={`View ${isVideo ? "video" : "image"} ${index + 1} of ${media.length}`}
                            className={cn(
                                "relative shrink-0 w-12 h-15 select-none md:w-14 md:h-[70px]",
                                "rounded-md overflow-hidden",
                                "sleek",
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-light",
                                isActive
                                    ? "ring-2 ring-light ring-offset-2 ring-offset-dark/80"
                                    : "opacity-60 hover:opacity-100"
                            )}
                        >
                            {thumbnailUrl ? (
                                <img
                                    src={`${thumbnailUrl}&width=128&height=160&crop=center`}
                                    alt=""
                                    className="size-full object-cover"
                                    loading="lazy"
                                />
                            ) : (
                                <div className="size-full bg-muted flex items-center justify-center">
                                    <span className="text-sm text-muted-foreground">{index + 1}</span>
                                </div>
                            )}

                            {isVideo && (
                                <div className="absolute inset-0 flex items-center justify-center bg-dark/40">
                                    <PlayIcon className="size-4 md:size-5 text-light" />
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
