import {Image} from "@unpic/react";

type ExternalImageProps = {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    aspectRatio?: number;
    layout?: "constrained" | "fullWidth" | "fixed";
    className?: string;
    loading?: "eager" | "lazy";
    priority?: boolean;
};

export const ExternalImage = ({
    src,
    alt,
    width,
    height,
    aspectRatio: _aspectRatio,
    layout = "constrained",
    className,
    loading = "lazy",
    priority = false
}: ExternalImageProps) => {
    if (layout === "fullWidth") {
        return (
            <Image src={src} alt={alt} layout="fullWidth" className={className} loading={loading} priority={priority} />
        );
    }

    const imgProps = {
        src,
        alt,
        className,
        loading,
        priority,
        layout: layout as "constrained" | "fixed",
        ...(width !== undefined && height !== undefined
            ? {width, height}
            : {width: width || 400, height: height || 400})
    };

    return <Image {...imgProps} />;
};
