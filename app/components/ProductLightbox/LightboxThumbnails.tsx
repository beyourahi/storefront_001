import {useRef, useEffect} from "react";
import {Image} from "@shopify/hydrogen";
import {PlayIcon} from "lucide-react";
import {cn} from "~/lib/utils";

interface LightboxThumbnailsProps {
    media: any[];
    currentIndex: number;
    onSelect: (index: number) => void;
    availableForSale?: boolean;
}

function getThumbnailUrl(item: any): string | null {
    if (item.__typename === "MediaImage" && item.image) {
        return item.image.url;
    }
    if (
        (item.__typename === "Video" || item.__typename === "ExternalVideo" || item.__typename === "Model3d") &&
        item.previewImage
    ) {
        return item.previewImage.url;
    }
    return null;
}

export function LightboxThumbnails({media, currentIndex, onSelect, availableForSale = true}: LightboxThumbnailsProps) {
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
        <div className="px-4 md:px-8" role="tablist" aria-label="Product media thumbnails">
            <div
                className={cn(
                    "flex gap-2 md:gap-3 overflow-x-auto py-2",
                    "scrollbar-hide",
                    "justify-center",
                    "outline-none"
                )}
            >
                {media.map((item, index) => {
                    const thumbnailUrl = getThumbnailUrl(item);
                    const isActive = index === currentIndex;
                    const isVideo = item.__typename === "Video" || item.__typename === "ExternalVideo";
                    const is3d = item.__typename === "Model3d";
                    const typeLabel = is3d ? "3D model" : isVideo ? "video" : "image";

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
                            aria-label={`View ${typeLabel} ${index + 1} of ${media.length}`}
                            className={cn(
                                "relative shrink-0 w-12 h-15 select-none md:w-14 md:h-[70px]",
                                "rounded-md overflow-hidden",
                                "sleek",
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-light",
                                isActive
                                    ? "ring-2 ring-light ring-offset-2 ring-offset-dark/80"
                                    : cn("opacity-60", availableForSale && "hover:opacity-100")
                            )}
                        >
                            {thumbnailUrl ? (
                                <Image
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

                            {is3d && (
                                <div className="absolute inset-0 flex items-center justify-center bg-dark/40">
                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 12 12"
                                        aria-hidden="true"
                                        fill="none"
                                        stroke="white"
                                        strokeWidth="1"
                                        className="md:w-5 md:h-5"
                                    >
                                        <path d="M6 0.5L11 3.25V8.75L6 11.5L1 8.75V3.25L6 0.5Z" />
                                        <path d="M6 0.5V6M6 6L11 3.25M6 6L1 3.25M6 6V11.5" strokeWidth="0.75" />
                                    </svg>
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
