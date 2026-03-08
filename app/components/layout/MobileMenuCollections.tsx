import {Link} from "react-router";
import {ShoppingCart, Tag, Sparkles} from "lucide-react";
import {cn} from "~/lib/utils";
import {getCollectionIcon} from "~/lib/collection-icons";
import {specialCollectionIcons} from "~/lib/navigation-icons";

type CollectionCardData = {
    id: string;
    title: string;
    handle: string;
    image?: {url: string; altText: string | null} | null;
    productCount: number;
};

type DiscountStats = {
    count: number;
    maxPercentage: number;
};

type MobileMenuCollectionsProps = {
    collections: CollectionCardData[];
    specialCollections: CollectionCardData[];
    currentPath: string;
    discountStats: DiscountStats;
    onLinkClick: () => void;
};

export const MobileMenuCollections = ({
    collections,
    specialCollections,
    currentPath,
    discountStats,
    onLinkClick
}: MobileMenuCollectionsProps) => {
    return (
        <>
            <div>
                <nav className="">
                    <Link
                        to="/collections/all-products"
                        onClick={onLinkClick}
                        className={cn(
                            "mobile-nav-link group sleek flex items-center gap-4 rounded-md px-4 py-3 hover:shadow-md active:scale-[0.98]",
                            currentPath === "/collections/all-products"
                                ? "bg-primary/10 text-primary ring-primary/20 font-semibold ring-1"
                                : "hover:bg-accent hover:text-accent-foreground"
                        )}
                    >
                        <div className="group/icon relative h-12 w-12 shrink-0 overflow-visible">
                            <div className="absolute inset-0 scale-100 animate-spin" style={{animationDuration: "8s"}}>
                                <div
                                    className="bg-primary/80 absolute h-1.5 w-1.5 animate-pulse rounded-full blur-[0.5px]"
                                    style={{top: 0, left: "50%", transform: "translateX(-50%)"}}
                                />
                                <div
                                    className="bg-primary/60 absolute h-1.5 w-1.5 animate-pulse rounded-full blur-[0.5px]"
                                    style={{
                                        top: "50%",
                                        right: 0,
                                        transform: "translateY(-50%)"
                                    }}
                                />
                                <div
                                    className="bg-primary/40 absolute h-1.5 w-1.5 animate-pulse rounded-full blur-[0.5px]"
                                    style={{
                                        bottom: 0,
                                        left: "50%",
                                        transform: "translateX(-50%)"
                                    }}
                                />
                                <div
                                    className="bg-accent/60 absolute h-1.5 w-1.5 animate-pulse rounded-full blur-[0.5px]"
                                    style={{
                                        top: "50%",
                                        left: 0,
                                        transform: "translateY(-50%)"
                                    }}
                                />
                            </div>

                            <div
                                className="absolute inset-1 scale-110 animate-spin"
                                style={{
                                    animationDuration: "12s",
                                    animationDirection: "reverse"
                                }}
                            >
                                <div
                                    className="bg-primary/30 absolute h-1 w-1 animate-pulse rounded-full"
                                    style={{top: "10%", right: "20%"}}
                                />
                                <div
                                    className="bg-accent/40 absolute h-1 w-1 animate-pulse rounded-full"
                                    style={{bottom: "10%", left: "20%"}}
                                />
                            </div>

                            <div className="from-accent/10 via-secondary/15 to-accent/5 group-hover/icon:from-primary/20 group-hover/icon:via-primary/30 group-hover/icon:to-primary/15 group-hover/icon:shadow-primary/25 relative h-full w-full overflow-hidden rounded-lg bg-gradient-to-br transition-all duration-500 group-hover/icon:scale-110 group-hover/icon:shadow-lg">
                                <div className="via-primary/15 absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent to-transparent transition-transform duration-1200 group-hover/icon:translate-x-full" />
                                <div className="from-primary/10 via-primary/20 to-primary/5 absolute inset-0 bg-gradient-to-br opacity-80" />
                                <div
                                    className="border-ring/40 absolute inset-0 animate-spin rounded-lg border border-dashed"
                                    style={{animationDuration: "10s"}}
                                />
                                <ShoppingCart
                                    className="text-primary absolute inset-0 m-auto h-6 w-6 drop-shadow-sm transition-all duration-300 group-hover/icon:scale-110 group-hover/icon:rotate-6"
                                    style={{animation: "float 2.5s ease-in-out infinite"}}
                                />
                                <div
                                    className="bg-primary-foreground/60 absolute top-1 right-1 h-1 w-1 animate-ping rounded-full"
                                    style={{animationDelay: "0.5s"}}
                                />
                                <div
                                    className="bg-primary/60 absolute bottom-1 left-1 h-1 w-1 animate-ping rounded-full"
                                    style={{animationDelay: "1.2s"}}
                                />
                            </div>

                            <div
                                className="bg-primary text-primary-foreground absolute -top-1 -left-3 animate-bounce rounded-full px-2 py-1 text-xs font-bold shadow-md"
                                style={{animationDelay: "0.3s"}}
                            >
                                ALL
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-foreground text-sm font-bold">Shop All</span>
                            <span className="text-muted-foreground text-xs">Explore everything</span>
                        </div>
                    </Link>
                </nav>
            </div>

            {discountStats.count > 0 && (
                <div>
                    <nav className="">
                        <Link
                            to="/sale"
                            onClick={onLinkClick}
                            className={cn(
                                "mobile-nav-link group sleek flex items-center gap-4 rounded-md px-4 py-3 hover:shadow-md active:scale-[0.98]",
                                currentPath === "/sale"
                                    ? "bg-primary/10 text-primary ring-primary/20 font-semibold ring-1"
                                    : "hover:bg-accent hover:text-accent-foreground"
                            )}
                        >
                            <div className="group/icon relative h-12 w-12 shrink-0 overflow-visible">
                                <div className="bg-discount-bg/20 absolute inset-0 scale-100 animate-ping rounded-full" />
                                <div className="bg-discount-icon-bg/15 absolute inset-0 scale-110 animate-ping rounded-full" />

                                <div className="from-discount-icon-bg/90 via-discount-bg to-accent/60 group-hover/icon:shadow-discount-icon-bg/30 relative h-full w-full overflow-hidden rounded-lg bg-gradient-to-br transition-all duration-500 group-hover/icon:scale-110 group-hover/icon:shadow-lg">
                                    <div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-1000 group-hover/icon:translate-x-full" />
                                    <div
                                        className="border-discount-text/60 absolute inset-0 animate-spin rounded-lg border-2 border-dashed"
                                        style={{animationDuration: "6s"}}
                                    />
                                    <Tag className="absolute inset-0 m-auto h-6 w-6 animate-pulse text-white drop-shadow-sm transition-all duration-300 group-hover/icon:scale-110 group-hover/icon:rotate-12" />
                                </div>

                                <div className="bg-primary text-primary-foreground absolute -top-1 -left-3 animate-bounce rounded-full px-2 py-1 text-xs font-bold shadow-md">
                                    SALE
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sale-text text-sm font-bold">Special Offers</span>
                                <span className="text-sale-text/80 text-xs">
                                    {discountStats.count} {discountStats.count === 1 ? "deal" : "deals"} available
                                </span>
                            </div>
                        </Link>
                    </nav>
                </div>
            )}

            {collections.length > 0 && (
                <div>
                    <nav className="">
                        {collections.map(collection => {
                            const IconComponent = getCollectionIcon(collection);
                            return (
                                <Link
                                    key={collection.handle}
                                    to={`/collections/${collection.handle}`}
                                    onClick={onLinkClick}
                                    className={cn(
                                        "mobile-nav-link group sleek flex items-center gap-4 rounded-md px-4 py-3 active:scale-[0.98]",
                                        currentPath === `/collections/${collection.handle}`
                                            ? "bg-primary/10 text-primary ring-primary/20 font-semibold ring-1"
                                            : "hover:bg-accent hover:text-accent-foreground"
                                    )}
                                >
                                    <div className="bg-muted relative h-10 w-10 shrink-0 overflow-hidden rounded-md">
                                        {collection.image?.url ? (
                                            <img
                                                src={collection.image.url}
                                                alt={collection.title}
                                                width={40}
                                                height={40}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <IconComponent className="text-muted-foreground absolute inset-0 m-auto h-5 w-5" />
                                        )}
                                    </div>
                                    <span className="text-sm font-medium">{collection.title}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            )}

            {specialCollections.length > 0 && (
                <div>
                    <nav className="">
                        {specialCollections.map(collection => {
                            const SpecialIcon = specialCollectionIcons[collection.handle] || Sparkles;
                            return (
                                <Link
                                    key={collection.handle}
                                    to={`/collections/${collection.handle}`}
                                    onClick={onLinkClick}
                                    className={cn(
                                        "mobile-nav-link group sleek flex items-center gap-4 rounded-md px-4 py-3 active:scale-[0.98]",
                                        currentPath === `/collections/${collection.handle}`
                                            ? "bg-primary/10 text-primary ring-primary/20 font-semibold ring-1"
                                            : "hover:bg-accent hover:text-accent-foreground"
                                    )}
                                >
                                    <div className="from-primary/20 to-primary/10 relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-gradient-to-br">
                                        {collection.image?.url ? (
                                            <img
                                                src={collection.image.url}
                                                alt={collection.title}
                                                width={40}
                                                height={40}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <SpecialIcon className="text-primary absolute inset-0 m-auto h-5 w-5" />
                                        )}
                                    </div>
                                    <span className="text-sm font-medium">{collection.title}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            )}
        </>
    );
};
