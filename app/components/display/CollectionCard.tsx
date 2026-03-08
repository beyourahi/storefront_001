import {useEffect, useMemo, useState} from "react";
import {Link} from "react-router";
import {Image} from "@shopify/hydrogen";
import {Gem, Heart, Home, Percent, Shirt, ShoppingBag, Smartphone, Sparkles, Star, Tag, Watch, Zap} from "lucide-react";
const FALLBACK_THEME_CARD_ASPECT_RATIO: "portrait" | "landscape" | "square" = "portrait";
import {usePointerCapabilities} from "~/hooks/usePointerCapabilities";
import {cn} from "~/lib/utils";
import type {CollectionCardData} from "~/lib/types/collections";

type CollectionCardProps = {
    collection: CollectionCardData;
};

export const CollectionCard = ({collection}: CollectionCardProps) => {
    const {canHover} = usePointerCapabilities();
    const productCount = collection.productCount || 0;

    const aspectRatioClass = useMemo(() => {
        switch (FALLBACK_THEME_CARD_ASPECT_RATIO as string) {
            case "portrait":
                return "aspect-[4/5]";
            case "landscape":
                return "aspect-[16/9]";
            case "square":
            default:
                return "aspect-square";
        }
    }, []);

    const isShopAll = collection.handle === "all" && collection.id === "shop-all-special-collection";
    const isSpecialOffers = collection.handle === "discounts" && collection.id === "special-offers-collection";
    const [shopAllImageFailed, setShopAllImageFailed] = useState(false);
    const shopAllImage = isShopAll ? collection.image : null;
    const shouldShowShopAllImage = Boolean(shopAllImage?.url) && !shopAllImageFailed;

    useEffect(() => {
        setShopAllImageFailed(false);
    }, [shopAllImage?.url]);

    const maxDiscountPercentage = useMemo(() => {
        if (!isSpecialOffers) return 0;
        const match = collection.description?.match(/up to (\d+)% off/i);
        return match ? parseInt(match[1]) : 0;
    }, [isSpecialOffers, collection.description]);

    const linkHref = isSpecialOffers
        ? "/sale"
        : isShopAll
          ? "/collections/all-products"
          : `/collections/${collection.handle}`;

    return (
        <Link viewTransition
            to={linkHref}
            prefetch="intent"
            className={cn(
                "sleek bg-card collection-card block overflow-hidden rounded-lg",
                canHover ? "group" : "motion-press active:scale-[var(--motion-press-scale)]"
            )}
        >
            <div className={`bg-muted relative ${aspectRatioClass} w-full overflow-hidden`}>
                {shouldShowShopAllImage && shopAllImage ? (
                    <Image
                        data={{url: shopAllImage.url, altText: shopAllImage.altText || "Shop All Collections"}}
                        className="sleek h-full w-full object-cover xl:group-hover:scale-110"
                        sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, 50vw"
                        onError={() => {
                            setShopAllImageFailed(true);
                        }}
                    />
                ) : isShopAll ? (
                    <div className="sleek from-primary/10 via-accent/15 to-secondary/10 relative h-full w-full overflow-hidden bg-gradient-to-br xl:group-hover:scale-110">
                        <div className="absolute inset-0 opacity-10">
                            <svg viewBox="0 0 100 100" className="h-full w-full">
                                <defs>
                                    <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                                        <path
                                            d="M 10 0 L 0 0 0 10"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="0.5"
                                        />
                                    </pattern>
                                </defs>
                                <rect width="100" height="100" fill="url(#grid)" />
                            </svg>
                        </div>

                        <div className="absolute inset-0">
                            <div className="absolute top-2 right-2 animate-pulse opacity-5 sm:top-4 sm:right-4">
                                <ShoppingBag className="text-primary h-12 w-12 rotate-12 sm:h-16 sm:w-16" />
                            </div>
                            <div className="absolute bottom-2 left-2 animate-pulse opacity-5 delay-1000 sm:bottom-4 sm:left-4">
                                <Star className="text-accent h-10 w-10 -rotate-12 sm:h-12 sm:w-12" />
                            </div>
                        </div>

                        <div className="relative flex h-full items-center justify-center p-4">
                            {/* WCAG 2.1 AA Compliant - Icon box opacities optimized for 3:1 UI component contrast */}
                            {/* Icons with light foreground colors (accent-foreground, secondary-foreground) need higher opacity */}
                            <div className="grid grid-cols-3 gap-3 sm:gap-4">
                                <div className="bg-primary/35 group-hover:bg-primary/45 flex animate-bounce items-center justify-center rounded-xl p-2 transition-all delay-100 duration-500 sm:p-3">
                                    <Shirt className="text-primary h-3 w-3 transition-transform duration-500 group-hover:scale-110 sm:h-4 sm:w-4" />
                                </div>
                                <div className="bg-accent/60 group-hover:bg-accent/70 flex animate-bounce items-center justify-center rounded-xl p-2 transition-all delay-200 duration-500 sm:p-3">
                                    <Watch className="text-accent-foreground h-3 w-3 transition-transform duration-500 group-hover:scale-110 sm:h-4 sm:w-4" />
                                </div>
                                <div className="bg-secondary/60 group-hover:bg-secondary/70 flex animate-bounce items-center justify-center rounded-xl p-2 transition-all delay-300 duration-500 sm:p-3">
                                    <Gem className="text-secondary-foreground h-3 w-3 transition-transform duration-500 group-hover:scale-110 sm:h-4 sm:w-4" />
                                </div>
                                <div className="bg-primary/30 group-hover:bg-primary/40 flex animate-bounce items-center justify-center rounded-xl p-2 transition-all delay-400 duration-500 sm:p-3">
                                    <Smartphone className="text-primary h-3 w-3 transition-transform duration-500 group-hover:scale-110 sm:h-4 sm:w-4" />
                                </div>
                                <div className="from-primary/40 to-accent/40 group-hover:from-primary/50 group-hover:to-accent/50 flex animate-pulse items-center justify-center rounded-xl bg-gradient-to-br p-2 transition-all duration-500 sm:p-3">
                                    <ShoppingBag className="text-primary h-4 w-4 transition-transform duration-500 group-hover:scale-125 group-hover:rotate-12 sm:h-5 sm:w-5" />
                                </div>
                                <div className="bg-accent/60 group-hover:bg-accent/70 flex animate-bounce items-center justify-center rounded-xl p-2 transition-all delay-500 duration-500 sm:p-3">
                                    <Home className="text-accent-foreground h-3 w-3 transition-transform duration-500 group-hover:scale-110 sm:h-4 sm:w-4" />
                                </div>
                                <div className="bg-secondary/55 group-hover:bg-secondary/65 flex animate-bounce items-center justify-center rounded-xl p-2 transition-all delay-600 duration-500 sm:p-3">
                                    <Heart className="text-secondary-foreground h-3 w-3 transition-transform duration-500 group-hover:scale-110 sm:h-4 sm:w-4" />
                                </div>
                                <div className="bg-primary/35 group-hover:bg-primary/45 flex animate-bounce items-center justify-center rounded-xl p-2 transition-all delay-700 duration-500 sm:p-3">
                                    <Sparkles className="text-primary h-3 w-3 transition-transform duration-500 group-hover:scale-110 sm:h-4 sm:w-4" />
                                </div>
                                <div className="bg-accent/60 group-hover:bg-accent/70 flex animate-bounce items-center justify-center rounded-xl p-2 transition-all delay-800 duration-500 sm:p-3">
                                    <Star className="text-accent-foreground h-3 w-3 transition-transform duration-500 group-hover:scale-110 sm:h-4 sm:w-4" />
                                </div>
                            </div>
                        </div>
                    </div>
                ) : isSpecialOffers ? (
                    <div className="from-discount-icon-bg/80 via-discount-bg to-accent/35 sleek relative h-full w-full overflow-hidden bg-gradient-to-br xl:group-hover:scale-110">
                        <div className="absolute inset-0">
                            <div className="absolute top-3 left-3 animate-bounce opacity-20 delay-300 transform-gpu">
                                <Zap className="text-discount-text h-4 w-4 rotate-45 sm:h-5 sm:w-5" />
                            </div>
                            <div className="absolute top-6 right-4 animate-pulse opacity-15 delay-700 transform-gpu">
                                <Star className="text-discount-text h-3 w-3 sm:h-4 sm:w-4" />
                            </div>
                            <div className="absolute bottom-4 left-4 animate-bounce opacity-25 delay-500 transform-gpu">
                                <Sparkles className="text-discount-text h-3 w-3 rotate-12 sm:h-4 sm:w-4" />
                            </div>
                            <div className="absolute right-3 bottom-3 animate-pulse opacity-20 delay-900 transform-gpu">
                                <Percent className="text-sale-text h-4 w-4 -rotate-12 sm:h-5 sm:w-5" />
                            </div>
                        </div>

                        <div className="relative flex h-full items-center justify-center p-4">
                            <div className="relative">
                                <div
                                    className="bg-discount-bg/35 absolute inset-0 scale-150 animate-ping rounded-full delay-0 transform-gpu"
                                    style={{animationDuration: "3s"}}
                                />
                                <div
                                    className="bg-discount-icon-bg/35 absolute inset-0 scale-125 animate-ping rounded-full delay-500 transform-gpu"
                                    style={{animationDuration: "4s"}}
                                />
                                <div
                                    className="bg-accent/30 absolute inset-0 scale-100 animate-ping rounded-full delay-1000 transform-gpu"
                                    style={{animationDuration: "5s"}}
                                />

                                <div className="relative">
                                    <div
                                        className="border-discount-text/40 absolute inset-0 animate-spin rounded-full border-2 border-dashed transform-gpu"
                                        style={{animationDuration: "12s"}}
                                    />
                                    <div className="from-discount-icon-bg/90 to-discount-bg relative flex items-center justify-center rounded-full bg-gradient-to-br p-5 transform-gpu transition-all duration-500 group-hover:shadow-lg sm:p-7">
                                        <Tag className="h-5 w-5 text-white transform-gpu transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12 sm:h-7 sm:w-7" />
                                    </div>
                                </div>

                                {maxDiscountPercentage > 0 && (
                                    <>
                                        <div
                                            className="bg-primary text-primary-foreground absolute -top-2 -right-3 flex animate-bounce items-center justify-center rounded-full px-2 py-1 text-xs font-bold shadow-lg delay-200 transform-gpu sm:text-sm"
                                            style={{animationDuration: "2s"}}
                                        >
                                            -{maxDiscountPercentage}%
                                        </div>
                                        <div
                                            className="bg-discount-text text-background absolute -top-1 -left-2 flex animate-pulse items-center justify-center rounded-full px-2 py-1 text-xs font-bold shadow-md delay-1500 transform-gpu"
                                            style={{animationDuration: "3s"}}
                                        >
                                            HOT
                                        </div>
                                        <div
                                            className="bg-sale-text text-background absolute -bottom-2 -left-3 flex animate-bounce items-center justify-center rounded-full px-2 py-1 text-xs font-bold shadow-md delay-2000 transform-gpu"
                                            style={{animationDuration: "2.5s"}}
                                        >
                                            SALE
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <div
                            className="absolute top-1 left-1 animate-spin opacity-30 transform-gpu"
                            style={{animationDuration: "6s"}}
                        >
                            <Sparkles className="text-discount-text h-2 w-2 sm:h-3 sm:w-3" />
                        </div>
                        <div
                            className="absolute top-1 right-1 animate-spin opacity-30 transform-gpu"
                            style={{animationDuration: "8s", animationDirection: "reverse"}}
                        >
                            <Star className="text-discount-text h-2 w-2 sm:h-3 sm:w-3" />
                        </div>
                    </div>
                ) : collection.image ? (
                    <Image
                        data={{url: collection.image.url, altText: collection.image.altText || collection.title}}
                        className="sleek h-full w-full object-cover xl:group-hover:scale-110"
                        sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, 50vw"
                    />
                ) : (
                    <div className="sleek bg-background flex h-full w-full items-center justify-center xl:group-hover:scale-110">
                        <div className="text-muted-foreground text-center">
                            <div className="pointer-events-none mb-2 text-3xl sm:mb-4 sm:text-6xl">👜</div>
                            <p className="text-sm font-medium sm:text-lg">Collection</p>
                        </div>
                    </div>
                )}

                <div className="pointer-events-none absolute inset-0 flex items-end justify-center p-1 xl:p-2">
                    {/* WCAG 2.1 AA Compliant - Info box opacity increased to 70% for 4.5:1 text contrast */}
                    <div className="sleek bg-card/70 border-border/20 w-full rounded-lg border p-3 shadow-lg backdrop-blur-sm group-hover:shadow-xl sm:p-4">
                        <div className="space-y-2 sm:space-y-3">
                            <div>
                                <div className="flex items-start justify-between gap-2">
                                    <h3 className="sleek text-card-foreground flex-1 text-sm leading-tight font-bold sm:text-base">
                                        {collection.title}
                                    </h3>
                                    <span className="text-muted-foreground hidden shrink-0 text-xs sm:inline 2xl:text-sm">
                                        {productCount} products
                                    </span>
                                </div>
                                <div className="sm:hidden">
                                    <p className="text-muted-foreground text-xs leading-tight">
                                        {productCount} {productCount === 1 ? "product" : "products"}
                                    </p>
                                </div>
                                {collection.description && (
                                    <p className="text-muted-foreground mt-1 text-xs leading-relaxed font-semibold max-sm:hidden max-sm:truncate sm:mt-2 sm:line-clamp-2 2xl:text-sm">
                                        {collection.description}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
};
