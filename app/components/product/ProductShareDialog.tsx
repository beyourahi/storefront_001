import {useState, useEffect, useMemo} from "react";
import {useLocation} from "react-router";
import {Image} from "@shopify/hydrogen";
import type {ProductFragment} from "storefrontapi.generated";
import {parseProductTitle} from "~/lib/product";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription} from "~/components/ui/dialog";
import {SharePlatformButton} from "~/components/product/SharePlatformButton";
import {createShareData, getSocialSharePlatforms, createShareAnalytics, trackShareEvent} from "~/lib/social-share";

type ProductShareDialogProps = {
    product: Pick<ProductFragment, "id" | "title" | "handle" | "description" | "images">;
    variant: ProductFragment["selectedOrFirstAvailableVariant"];
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    shopName?: string;
};

/**
 * Share sheet for a product. Constructs `shareData` (URL, title, price) from the
 * selected variant and delegates to `SharePlatformButton` for each platform.
 * The "copy link" platform is rendered separately — full-width below the 2-column
 * social grid — to match its distinct UX (clipboard action vs external link).
 * Image fades in from a shimmer placeholder to avoid flash when the dialog reopens
 * with the same product image still in cache.
 */
export const ProductShareDialog = ({
    product,
    variant,
    open = false,
    onOpenChange,
    shopName
}: ProductShareDialogProps) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    const location = useLocation();

    useEffect(() => {
        if (open) {
            setImageLoaded(false);
        }
    }, [open]);

    const currentUrl = typeof window !== "undefined" ? window.location.href : `${location.pathname}`;
    const shareData = useMemo(
        () => createShareData(product, variant, currentUrl, shopName),
        [product, variant, currentUrl, shopName]
    );
    const platforms = useMemo(() => getSocialSharePlatforms(), []);
    const firstImage = product.images?.nodes?.[0];
    const {primary, secondary} = useMemo(() => parseProductTitle(product.title), [product.title]);

    const handleShare = (platformId: string) => {
        const analytics = createShareAnalytics(platformId, product.id, product.handle);
        void trackShareEvent(analytics);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sleek max-w-md">
                <DialogHeader className="space-y-3">
                    <DialogTitle className="text-lg font-semibold">Share Product</DialogTitle>
                    <DialogDescription className="sr-only">
                        Share {product.title} with your friends and family
                    </DialogDescription>

                    <div className="bg-accent/20 space-y-3 rounded-lg p-4">
                        <div className="flex gap-3">
                            {firstImage && (
                                <div
                                    className="relative shrink-0 overflow-hidden rounded-md"
                                    style={{width: 80, height: 80}}
                                >
                                    {!imageLoaded && <div className="bg-muted absolute inset-0 animate-pulse" />}
                                    <Image
                                        src={firstImage.url}
                                        alt={firstImage.altText || product.title}
                                        width={80}
                                        height={80}
                                        className={`object-cover ${imageLoaded ? "opacity-100" : "opacity-0"}`}
                                        onLoad={() => setImageLoaded(true)}
                                    />
                                </div>
                            )}

                            <div className="min-w-0 flex-1">
                                <h3 className="text-foreground text-left text-sm leading-5 font-medium">{primary}</h3>
                                {secondary && (
                                    <p className="text-muted-foreground text-left text-xs font-medium">{secondary}</p>
                                )}
                                {shareData.price && (
                                    <p className="text-muted-foreground mt-1 text-left text-xs">{shareData.price}</p>
                                )}
                                {shopName && <p className="text-muted-foreground text-left text-xs">by {shopName}</p>}
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-3">
                        <h4 className="text-muted-foreground text-sm font-medium">Share on social media</h4>
                        <div className="grid grid-cols-2 gap-2">
                            {platforms
                                .filter(p => p.id !== "copy")
                                .map(platform => (
                                    <SharePlatformButton
                                        key={platform.id}
                                        platform={platform}
                                        shareData={shareData}
                                        onShare={handleShare}
                                    />
                                ))}
                        </div>
                        {platforms
                            .filter(p => p.id === "copy")
                            .map(platform => (
                                <SharePlatformButton
                                    key={platform.id}
                                    platform={platform}
                                    shareData={shareData}
                                    onShare={handleShare}
                                />
                            ))}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
