import * as React from "react";
import {Image} from "@shopify/hydrogen";
import {PlayIcon, PauseIcon} from "lucide-react";
import {Button} from "~/components/ui/button";
import {cn} from "~/lib/utils";

interface LightboxMediaProps {
    media: any;
    isVideoPlaying: boolean;
    onVideoPlay: () => void;
    onVideoPause: () => void;
    videoRef: React.RefObject<HTMLVideoElement>;
}

export function LightboxMedia({media, isVideoPlaying, onVideoPlay, onVideoPause, videoRef}: LightboxMediaProps) {
    const togglePlayback = () => {
        if (!videoRef.current) return;

        if (videoRef.current.paused) {
            void videoRef.current.play();
            onVideoPlay();
        } else {
            videoRef.current.pause();
            onVideoPause();
        }
    };

    if (media.__typename === "Video") {
        const mp4Source = media.sources.find((s: any) => s.mimeType === "video/mp4") || media.sources[0];

        if (!mp4Source) {
            return <div className="flex items-center justify-center text-light/70 text-sm">Video unavailable</div>;
        }

        return (
            <div className="relative max-w-full max-h-full animate-scale-fade">
                <video
                    ref={videoRef}
                    src={mp4Source.url}
                    poster={media.previewImage?.url}
                    className={cn(
                        "max-w-full max-h-[calc(100vh-180px)] md:max-h-[calc(100vh-200px)]",
                        "w-auto h-auto object-contain rounded-lg"
                    )}
                    onPlay={onVideoPlay}
                    onPause={onVideoPause}
                    onEnded={onVideoPause}
                    playsInline
                    muted
                    controls={false}
                    aria-label={media.alt || "Product video"}
                >
                    <source src={mp4Source.url} type={mp4Source.mimeType} />
                    Your browser does not support the video tag.
                </video>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={togglePlayback}
                    className={cn(
                        "absolute inset-0 m-auto",
                        "size-16 md:size-20 rounded-full",
                        "bg-dark/60 hover:bg-dark/80 text-light",
                        "transition-opacity duration-200",
                        isVideoPlaying && "opacity-0 hover:opacity-100",
                        "focus-visible:ring-light focus-visible:opacity-100"
                    )}
                    aria-label={isVideoPlaying ? "Pause video" : "Play video"}
                >
                    {isVideoPlaying ? (
                        <PauseIcon className="size-8 md:size-10" />
                    ) : (
                        <PlayIcon className="size-8 md:size-10" />
                    )}
                </Button>
            </div>
        );
    }

    if (media.__typename === "MediaImage" && media.image) {
        return (
            <div className="relative max-w-full max-h-full animate-scale-fade">
                <Image
                    data={media.image}
                    alt={media.alt || media.image.altText || "Product image"}
                    className={cn(
                        "max-w-full max-h-[calc(100vh-180px)] md:max-h-[calc(100vh-200px)]",
                        "w-auto h-auto object-contain rounded-lg"
                    )}
                    sizes="100vw"
                    loading="eager"
                />
            </div>
        );
    }

    return <div className="flex items-center justify-center text-light/70 text-sm">Media unavailable</div>;
}
