import {SkeletonGrid} from "~/components/common/SkeletonGrid";
import {MasonryImageGrid} from "~/components/gallery/MasonryImageGrid";
import type {GalleryImageData, GalleryPageInfo} from "~/lib/gallery";

type GalleryMasonrySectionProps = {
    productImages: GalleryImageData[];
    pageInfo: GalleryPageInfo;
    isLoading?: boolean;
};

export const GalleryMasonrySection = ({productImages, pageInfo, isLoading}: GalleryMasonrySectionProps) => {
    const showContent = !isLoading && productImages && productImages.length > 0;

    return (
        <section className="bg-background pt-8 pb-16">
            <div className="mx-auto max-w-[2000px] px-2 md:px-4">
                {isLoading ? (
                    <SkeletonGrid layout="masonry" count={20} />
                ) : showContent ? (
                    <MasonryImageGrid initialImages={productImages} pageInfo={pageInfo} />
                ) : (
                    <div className="py-16 text-center">
                        <div className="mb-4 text-6xl">📸</div>
                        <h3 className="text-foreground mb-2 text-xl font-semibold">No images found</h3>
                        <p className="text-muted-foreground">
                            Product images will appear here once products are available.
                        </p>
                    </div>
                )}
            </div>
        </section>
    );
};
