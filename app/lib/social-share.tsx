import {useState} from "react";
import {Facebook, Link as LinkIcon, X} from "lucide-react";
import {formatShopifyMoney} from "~/lib/currency-formatter";

type ShopifyMoney = {
    amount: string;
    currencyCode: string;
};

type ShopifyImage = {
    id: string;
    url: string;
    altText: string | null;
    width: number;
    height: number;
};

type ShopifyProductSeo = {
    title: string | null;
    description: string | null;
};

type ShopifyProductOption = {
    id: string;
    name: string;
    values: string[];
};

type ShopifySelectedOption = {
    name: string;
    value: string;
};

type ShopifyProductVariant = {
    id: string;
    title: string;
    price: ShopifyMoney;
    compareAtPrice: ShopifyMoney | null;
    selectedOptions: ShopifySelectedOption[];
    availableForSale: boolean;
    quantityAvailable: number | null;
    image: ShopifyImage | null;
};

type ShopifyPriceRange = {
    minVariantPrice: ShopifyMoney;
    maxVariantPrice: ShopifyMoney;
};

type ShopifyProduct = {
    id: string;
    title: string;
    handle: string;
    description: string;
    descriptionHtml?: string;
    tags: string[];
    vendor: string;
    productType: string;
    availableForSale: boolean;
    totalInventory?: number;
    options: ShopifyProductOption[];
    variants: {edges: {node: ShopifyProductVariant}[]};
    images: {edges: {node: ShopifyImage}[]};
    priceRange: ShopifyPriceRange;
    seo: ShopifyProductSeo;
};

export type ShareData = {
    title: string;
    description: string;
    url: string;
    imageUrl?: string;
    price?: string;
    currency?: string;
    shopName?: string;
};

type ShareAnalytics = {
    platform: string;
    productId: string;
    productHandle: string;
    timestamp: number;
    userAgent?: string;
    referrer?: string;
};

export type SocialSharePlatform = {
    id: string;
    name: string;
    icon: React.ComponentType<{className?: string}>;
    color: string;
    url: (shareData: ShareData) => string;
    isNative?: boolean;
    customHandler?: (shareData: ShareData, onSuccess?: () => void, onError?: () => void) => Promise<void>;
};

const WhatsAppIcon = (props: {className?: string}) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className={props.className}
            width="24"
            height="24"
        >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
    );
};

const PinterestIcon = (props: {className?: string}) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className={props.className}
            width="24"
            height="24"
        >
            <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12.017 24c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641 0 12.017 0z" />
        </svg>
    );
};

const XIcon = (props: {className?: string}) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className={props.className}
            width="24"
            height="24"
        >
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
    );
};

export const createShareData = (product: ShopifyProduct, currentUrl: string, shopName?: string): ShareData => {
    const firstImage = product.images?.edges?.[0]?.node;
    const firstVariant = product.variants?.edges?.[0]?.node;
    const titleParts = product.title.trim().split(" + ");
    const mainTitle = titleParts[0];
    const subtitle = titleParts[1];

    return {
        title: mainTitle,
        description:
            product.description ||
            `Check out ${mainTitle}${subtitle ? ` - ${subtitle}` : ""} - Premium quality product available now.`,
        url: currentUrl,
        imageUrl: firstImage?.url,
        price: firstVariant
            ? formatShopifyMoney(firstVariant.price)
            : formatShopifyMoney(product.priceRange.minVariantPrice),
        currency: firstVariant?.price.currencyCode || product.priceRange.minVariantPrice.currencyCode,
        shopName
    };
};

export const generateShareUrl = (baseUrl: string, params: Record<string, string>): string => {
    const url = new URL(baseUrl);
    Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value);
    });
    return url.toString();
};

export const generateShareMessage = (shareData: ShareData): string => {
    return `Checkout the ${shareData.title}${shareData.shopName ? ` by ${shareData.shopName}` : ""} only at ${shareData.price}\n\nProduct Link:\n${shareData.url}`;
};

export const copyToClipboard = async (text: string, onSuccess?: () => void, onError?: () => void): Promise<boolean> => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
        try {
            await navigator.clipboard.writeText(text);
            if (onSuccess) onSuccess();
            return true;
        } catch {
            if (onError) onError();
        }
    }

    if (onError) onError();
    return false;
};

export const isWebShareSupported = (): boolean => {
    return typeof navigator !== "undefined" && "share" in navigator;
};

export const shareViaWebAPI = async (shareData: ShareData): Promise<boolean> => {
    if (!isWebShareSupported()) return false;

    try {
        await navigator.share({
            title: shareData.title || "Product Share",
            text: shareData.description || "Check out this product",
            url: shareData.url || window.location.href
        });
        return true;
    } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
            return false;
        }
        return false;
    }
};

export const trackShareEvent = async (analytics: ShareAnalytics): Promise<void> => {
    try {
        await fetch("/api/share/track", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(analytics)
        });
    } catch (_) {
        void _;
    }
};

export const isMobileDevice = (): boolean => {
    if (typeof window === "undefined") return false;

    return (
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(window.navigator.userAgent) ||
        window.innerWidth <= 768
    );
};

export const openShareWindow = (url: string, title: string = "Share"): void => {
    const width = 600;
    const height = 400;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;

    window.open(url, title, `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`);
};

export const getSocialSharePlatforms = (): SocialSharePlatform[] => {
    return [
        {
            id: "facebook",
            name: "Facebook",
            icon: Facebook,
            color: "rgb(24, 119, 242)",
            url: (shareData: ShareData) =>
                generateShareUrl("https://www.facebook.com/sharer/sharer.php", {
                    u: shareData.url as string,
                    quote: `Checkout the ${shareData.title}${shareData.shopName ? ` by ${shareData.shopName}` : ""} only at ${shareData.price}`
                })
        },
        {
            id: "x",
            name: "X (Twitter)",
            icon: XIcon,
            color: "rgb(0, 0, 0)",
            url: (shareData: ShareData) => {
                const text = `Checkout the ${shareData.title}${shareData.shopName ? ` by ${shareData.shopName}` : ""} only at ${shareData.price}`;
                return generateShareUrl("https://twitter.com/intent/tweet", {
                    text,
                    url: shareData.url as string
                });
            }
        },
        {
            id: "whatsapp",
            name: "WhatsApp",
            icon: WhatsAppIcon,
            color: "rgb(37, 211, 102)",
            url: (shareData: ShareData) => {
                const message = generateShareMessage(shareData);
                const baseUrl = isMobileDevice() ? "whatsapp://send" : "https://wa.me";

                return generateShareUrl(baseUrl, {text: message});
            }
        },
        {
            id: "pinterest",
            name: "Pinterest",
            icon: PinterestIcon,
            color: "rgb(189, 8, 28)",
            url: (shareData: ShareData) =>
                generateShareUrl("https://pinterest.com/pin/create/button/", {
                    url: shareData.url as string,
                    description: `Checkout the ${shareData.title}${shareData.shopName ? ` by ${shareData.shopName}` : ""} only at ${shareData.price}`,
                    media: shareData.imageUrl || ""
                })
        },
        {
            id: "copy",
            name: "Copy Link",
            icon: LinkIcon,
            color: "rgb(107, 114, 128)",
            url: () => "",
            isNative: true,
            customHandler: async (shareData: ShareData, onSuccess?: () => void, onError?: () => void) => {
                const success = await copyToClipboard(shareData.url as string, onSuccess, onError);
                if (!success && !onError) {
                    alert("Failed to copy link. Please copy manually: " + shareData.url);
                }
            }
        }
    ];
};

export const createShareAnalytics = (platform: string, product: ShopifyProduct): ShareAnalytics => {
    return {
        platform,
        productId: product.id,
        productHandle: product.handle,
        timestamp: Date.now(),
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
        referrer: typeof document !== "undefined" ? document.referrer : undefined
    };
};

export const generateArticleShareMessage = (shareData: ShareData): string => {
    const shopPart = shareData.shopName ? ` on ${shareData.shopName}` : "";
    return `${shareData.title}${shopPart}\n\n${shareData.url}`;
};

type ShareDialogProps = {
    url: string;
    title: string;
    onClose: () => void;
};

export const ShareDialog = ({url, title, onClose}: ShareDialogProps) => {
    const [copied, setCopied] = useState(false);

    const shareData: ShareData = {
        title,
        description: title,
        url
    };

    const platforms = getSocialSharePlatforms();

    const handlePlatformClick = async (platform: SocialSharePlatform) => {
        if (platform.customHandler) {
            await platform.customHandler(shareData, () => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            });
            return;
        }
        const shareUrl = platform.url(shareData);
        openShareWindow(shareUrl, platform.name);
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            role="button"
            tabIndex={0}
            onClick={onClose}
            onKeyDown={e => {
                if (e.key === "Enter" || e.key === " ") onClose?.();
            }}
        >
            {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
            <div
                className="w-full max-w-md rounded-lg bg-white p-6"
                role="dialog"
                onClick={e => e.stopPropagation()}
                onKeyDown={e => e.stopPropagation()}
            >
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold">{title}</h2>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div className="grid grid-cols-5 gap-3">
                    {platforms.map(platform => (
                        <button
                            key={platform.id}
                            onClick={() => void handlePlatformClick(platform)}
                            className="flex flex-col items-center gap-2 rounded-lg p-3 transition-colors hover:bg-gray-100"
                        >
                            <platform.icon className="h-6 w-6" />
                            <span className="text-xs">
                                {platform.id === "copy" && copied ? "Copied!" : platform.name}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export const getArticleSharePlatforms = (): SocialSharePlatform[] => {
    return [
        {
            id: "facebook",
            name: "Facebook",
            icon: Facebook,
            color: "rgb(24, 119, 242)",
            url: (shareData: ShareData) =>
                generateShareUrl("https://www.facebook.com/sharer/sharer.php", {
                    u: shareData.url as string,
                    quote: shareData.title
                })
        },
        {
            id: "x",
            name: "X (Twitter)",
            icon: XIcon,
            color: "rgb(0, 0, 0)",
            url: (shareData: ShareData) =>
                generateShareUrl("https://twitter.com/intent/tweet", {
                    text: shareData.title,
                    url: shareData.url as string
                })
        },
        {
            id: "whatsapp",
            name: "WhatsApp",
            icon: WhatsAppIcon,
            color: "rgb(37, 211, 102)",
            url: (shareData: ShareData) => {
                const message = generateArticleShareMessage(shareData);
                const baseUrl = isMobileDevice() ? "whatsapp://send" : "https://wa.me";
                return generateShareUrl(baseUrl, {text: message});
            }
        },
        {
            id: "copy",
            name: "Copy Link",
            icon: LinkIcon,
            color: "rgb(107, 114, 128)",
            url: () => "",
            isNative: true,
            customHandler: async (shareData: ShareData, onSuccess?: () => void, onError?: () => void) => {
                const success = await copyToClipboard(shareData.url as string, onSuccess, onError);
                if (!success && !onError) {
                    alert("Failed to copy link. Please copy manually: " + shareData.url);
                }
            }
        }
    ];
};
