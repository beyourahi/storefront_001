import {Image} from "@shopify/hydrogen";
import type {HeroMedia} from "~/lib/metaobject-parsers";

interface PromotionalBannerProps {
    media: HeroMedia | null | undefined;
    className?: string;
}

const isVideoMedia = (media: HeroMedia): media is HeroMedia & {mediaType: "video"} => {
    return media.mediaType === "video";
};

export function PromotionalBanner({media, className = ""}: PromotionalBannerProps) {
    if (!media || !media.url) {
        return null;
    }

    return (
        <section className={`w-full ${className}`}>
            {isVideoMedia(media) ? <VideoMedia media={media} /> : <ImageMedia media={media} />}
        </section>
    );
}

function VideoMedia({media}: {media: Extract<HeroMedia, {mediaType: "video"}>}) {
    return (
        <div className="w-full">
            <video autoPlay loop muted playsInline className="w-full h-auto object-contain">
                <source src={media.url} type="video/mp4" />
                Your browser does not support the video tag.
            </video>
        </div>
    );
}

function ImageMedia({media}: {media: Extract<HeroMedia, {mediaType: "image"}>}) {
    const imageData = {
        url: media.url,
        altText: media.altText || "Promotional banner",
        width: media.width || 1920,
        height: media.height || 640
    };

    return (
        <div className="w-full">
            <Image data={imageData} className="w-full h-auto object-contain" sizes="100vw" loading="lazy" />
        </div>
    );
}
