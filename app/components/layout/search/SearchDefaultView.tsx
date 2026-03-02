import {Link} from "react-router";
import {ChevronRight, Clock, TrendingUp} from "lucide-react";
import {Button} from "~/components/ui/button";
import type {PopularProduct} from "~/root";
import {formatShopifyMoney} from "~/lib/product/currency";

type FeaturedCollection = {
    id: string;
    title: string;
    handle: string;
    image?: {url: string; altText?: string | null} | null;
};

type SearchDefaultViewProps = {
    featuredCollections: FeaturedCollection[];
    recentSearches: string[];
    popularSearches: string[];
    popularProducts?: PopularProduct[];
    onClose: () => void;
    onNavigate?: () => void;
    onSuggestionClick: (term: string) => void;
    onClearRecent: () => void;
};

const MAX_POPULAR_PRODUCTS = 5;

export const SearchDefaultView = ({
    featuredCollections,
    recentSearches,
    popularSearches,
    popularProducts = [],
    onClose,
    onNavigate,
    onSuggestionClick,
    onClearRecent
}: SearchDefaultViewProps) => {
    const handleLinkClick = () => {
        onClose();
        onNavigate?.();
    };

    const displayedProducts = popularProducts.slice(0, MAX_POPULAR_PRODUCTS);
    const hasMoreProducts = popularProducts.length > MAX_POPULAR_PRODUCTS;

    return (
        <div className="flex flex-col gap-6 p-2">
            {recentSearches.length > 0 && (
                <section>
                    <div className="mb-2 flex items-center justify-between">
                        <h3 className="text-muted-foreground flex items-center gap-2 text-xs font-medium">
                            <Clock className="h-3.5 w-3.5" />
                            Recent Searches
                        </h3>
                        <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={onClearRecent}>
                            Clear
                        </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {recentSearches.map(term => (
                            <button
                                type="button"
                                key={term}
                                className="bg-muted hover:bg-accent rounded-full px-3 py-1.5 text-xs"
                                onClick={() => onSuggestionClick(term)}
                            >
                                {term}
                            </button>
                        ))}
                    </div>
                </section>
            )}

            {popularSearches.length > 0 && (
                <section>
                    <h3 className="text-muted-foreground mb-2 flex items-center gap-2 text-xs font-medium">
                        <TrendingUp className="h-3.5 w-3.5" />
                        Popular Searches
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {popularSearches.map(term => (
                            <button
                                type="button"
                                key={term}
                                className="bg-muted hover:bg-accent rounded-full px-3 py-1.5 text-xs"
                                onClick={() => onSuggestionClick(term)}
                            >
                                {term}
                            </button>
                        ))}
                    </div>
                </section>
            )}

            <div className="flex flex-col lg:flex-row lg:gap-8">
                {displayedProducts.length > 0 && (
                    <div className="flex-1">
                        <div className="text-muted-foreground mb-2 px-1 text-xs font-medium">Popular Products</div>
                        {displayedProducts.map(product => {
                            const firstVariant =
                                product.variants.nodes.find(v => v.availableForSale) ?? product.variants.nodes[0];
                            const compareAtPrice = firstVariant?.compareAtPrice;
                            const hasDiscount =
                                compareAtPrice &&
                                parseFloat(compareAtPrice.amount) >
                                    parseFloat(product.priceRange.minVariantPrice.amount);
                            return (
                                <Link
                                    key={product.id}
                                    to={`/products/${product.handle}`}
                                    className="hover:bg-accent hover:text-accent-foreground relative flex items-center gap-2 rounded-sm px-2 py-2 text-sm outline-hidden"
                                    onClick={handleLinkClick}
                                    data-search-result="true"
                                >
                                    <div className="flex w-full items-center justify-between">
                                        <div className="flex min-w-0 flex-1 items-center gap-3">
                                            {product.featuredImage ? (
                                                <div className="bg-muted relative h-10 w-10 shrink-0 overflow-hidden rounded-sm">
                                                    <img
                                                        src={product.featuredImage.url}
                                                        alt={product.featuredImage.altText ?? product.title}
                                                        className="h-full w-full object-cover"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="bg-muted flex h-10 w-10 shrink-0 items-center justify-center rounded-sm">
                                                    <span className="text-muted-foreground text-xs">&#128230;</span>
                                                </div>
                                            )}
                                            <div className="min-w-0 flex-1">
                                                {(() => {
                                                    const titleParts = product.title.trim().split(" + ");
                                                    return (
                                                        <div className="truncate">
                                                            <p className="text-sm font-medium">{titleParts[0]}</p>
                                                            {titleParts[1] && (
                                                                <p className="opacity-50 text-xs font-normal">
                                                                    {titleParts[1]}
                                                                </p>
                                                            )}
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                        <div className="ml-2 shrink-0 text-right">
                                            <div className="text-primary font-mono text-xs font-medium lg:text-[11px]">
                                                {formatShopifyMoney(product.priceRange.minVariantPrice)}
                                            </div>
                                            {hasDiscount && compareAtPrice && (
                                                <div className="text-muted-foreground font-mono text-xs line-through lg:text-[11px]">
                                                    {formatShopifyMoney(compareAtPrice)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                        {hasMoreProducts && (
                            <div className="px-2 pt-3 pb-2">
                                <Link
                                    to="/collections/all"
                                    className="bg-primary/10 hover:bg-primary/20 border-primary/30 hover:border-primary/50 text-primary group flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all duration-200 hover:scale-[1.02]"
                                    onClick={handleLinkClick}
                                >
                                    View all products
                                    <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                                </Link>
                            </div>
                        )}
                    </div>
                )}

                {featuredCollections.length > 0 && (
                    <div className="flex-1 mt-4 lg:mt-0">
                        <div className="text-muted-foreground mb-2 px-1 text-xs font-medium">Featured Collections</div>
                        {featuredCollections.map(collection => (
                            <Link
                                key={collection.id}
                                to={`/collections/${collection.handle}`}
                                className="hover:bg-accent hover:text-accent-foreground relative flex items-center gap-2 rounded-sm px-2 py-2 text-sm outline-hidden"
                                onClick={handleLinkClick}
                            >
                                <div className="flex w-full items-center gap-3">
                                    {collection.image ? (
                                        <div className="bg-muted relative h-10 w-10 overflow-hidden rounded-sm">
                                            <img
                                                src={collection.image.url}
                                                alt={collection.title}
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                    ) : (
                                        <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-sm">
                                            <span className="text-muted-foreground text-xs">&#128193;</span>
                                        </div>
                                    )}
                                    <span className="text-base font-medium lg:text-sm">{collection.title}</span>
                                </div>
                            </Link>
                        ))}
                        <div className="px-2 pt-3 pb-2">
                            <Link
                                to="/collections"
                                className="bg-primary/10 hover:bg-primary/20 border-primary/30 hover:border-primary/50 text-primary group flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all duration-200 hover:scale-[1.02]"
                                onClick={handleLinkClick}
                            >
                                View all collections
                                <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
