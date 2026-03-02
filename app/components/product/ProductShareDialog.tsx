import {useState, useEffect, useMemo} from "react";
import {useLocation} from "react-router";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription} from "~/components/ui/dialog";
import {SharePlatformButton} from "~/components/product/SharePlatformButton";
import {createShareData, getSocialSharePlatforms, createShareAnalytics, trackShareEvent} from "~/lib/social-share";

type ShopifyMoney = {amount: string; currencyCode: string};

type ShopifyProductImage = {
    id: string;
    url: string;
    altText: string | null;
    width: number;
    height: number;
};

type ProductShareDialogProduct = {
    id: string;
    title: string;
    handle: string;
    description: string;
    tags: string[];
    vendor: string;
    productType: string;
    availableForSale: boolean;
    options: Array<{id: string; name: string; values: string[]}>;
    variants: {edges: Array<{node: any}>};
    images: {edges: Array<{node: ShopifyProductImage}>};
    priceRange: {
        minVariantPrice: ShopifyMoney;
        maxVariantPrice: ShopifyMoney;
    };
    seo: {title: string | null; description: string | null};
};

type ProductShareDialogProps = {
    product: ProductShareDialogProduct;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    shopName?: string;
};

export const ProductShareDialog = ({product, open = false, onOpenChange, shopName}: ProductShareDialogProps) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    const location = useLocation();

    useEffect(() => {
        if (open) {
            setImageLoaded(false);
        }
    }, [open]);

    const currentUrl = typeof window !== "undefined" ? window.location.href : `${location.pathname}`;
    const shareData = useMemo(() => createShareData(product, currentUrl, shopName), [product, currentUrl, shopName]);
    const platforms = useMemo(() => getSocialSharePlatforms(), []);
    const firstImage = product.images?.edges?.[0]?.node;
    const titleParts = useMemo(() => product.title.trim().split(" + "), [product.title]);

    const handleShare = (platformId: string) => {
        const analytics = createShareAnalytics(platformId, product);
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
                                    className="relative flex-shrink-0 overflow-hidden rounded-md"
                                    style={{width: 80, height: 80}}
                                >
                                    {!imageLoaded && <div className="bg-muted absolute inset-0 animate-pulse" />}
                                    <img
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
                                <h3 className="text-foreground text-left text-sm leading-5 font-medium">
                                    {titleParts[0]}
                                </h3>
                                {titleParts[1] && (
                                    <p className="text-muted-foreground text-left text-xs font-medium">
                                        {titleParts[1]}
                                    </p>
                                )}
                                <p className="text-muted-foreground mt-1 text-left text-xs">
                                    {shareData.price} {shareData.currency}
                                </p>
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
