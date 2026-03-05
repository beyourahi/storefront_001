import {useEffect, useMemo, useState} from "react";
import {useFetcher, useNavigate} from "react-router";
import {Dialog, DialogContent, DialogTitle} from "~/components/ui/dialog";
import {Command, CommandList} from "~/components/ui/command";
import {debounce} from "~/lib/debounce";
import {filterPolicies} from "~/lib/search-utils";
import {SearchInput} from "~/components/layout/search/SearchInput";
import {SearchResults} from "~/components/layout/search/SearchResults";
import {SearchDefaultView} from "~/components/layout/search/SearchDefaultView";
import {useSearchController} from "~/hooks/useSearchController";
import {useRecentSearches} from "~/hooks/useRecentSearches";
import {useLockBodyScroll} from "~/lib/LenisProvider";
import type {PopularProduct} from "~/root";

type MenuCollection = {
    id: string;
    title: string;
    handle: string;
    image?: {url: string; altText?: string | null} | null;
};

type PredictiveSearchData = {
    type: "predictive";
    term: string;
    result: {
        total: number;
        items: {
            products: Array<{
                id: string;
                title: string;
                handle: string;
                availableForSale: boolean;
                selectedOrFirstAvailableVariant?: {
                    image?: {url: string; altText: string | null} | null;
                    price?: {amount: string; currencyCode: string} | null;
                    compareAtPrice?: {amount: string; currencyCode: string} | null;
                } | null;
            }>;
            collections: Array<{
                id: string;
                title: string;
                handle: string;
                image?: {url: string; altText: string | null} | null;
            }>;
            articles: Array<{
                id: string;
                title: string;
                handle: string;
                image?: {url: string; altText: string | null} | null;
                blog?: {handle: string; title: string} | null;
            }>;
            pages: Array<{
                id: string;
                title: string;
                handle: string;
            }>;
            queries: Array<{
                text: string;
            }>;
        };
    };
};

type SearchOverlayProps = {
    shopName?: string;
    collections?: MenuCollection[];
    popularSearchTerms?: string[];
    popularProducts?: PopularProduct[];
};

export const SearchOverlay = ({shopName, collections = [], popularSearchTerms = [], popularProducts = []}: SearchOverlayProps) => {
    const navigate = useNavigate();
    const fetcher = useFetcher<PredictiveSearchData>();
    const {open, openSearch, closeSearch, setOpen, restoreTriggerFocus} = useSearchController();
    const {recentSearches, addSearch, clearSearches} = useRecentSearches();

    useLockBodyScroll(open);

    const [query, setQuery] = useState("");

    useEffect(() => {
        const handleKeydown = (event: KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
                event.preventDefault();
                const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
                openSearch(trigger);
            }
        };

        document.addEventListener("keydown", handleKeydown);
        return () => document.removeEventListener("keydown", handleKeydown);
    }, [openSearch]);

    useEffect(() => {
        if (!open) {
            setQuery("");
        }
    }, [open]);

    const debouncedFetch = useMemo(
        () =>
            debounce((searchQuery: string) => {
                if (!searchQuery.trim()) return;
                void fetcher.load(`/search?predictive=true&limit=10&q=${encodeURIComponent(searchQuery)}`);
            }, 300),
        [fetcher]
    );

    const handleQueryChange = (value: string) => {
        setQuery(value);
        if (value.trim()) {
            debouncedFetch(value);
        }
    };

    const predictiveItems = fetcher.data?.type === "predictive" ? fetcher.data.result.items : null;

    const filteredProducts = (predictiveItems?.products ?? []).slice(0, 5).map(product => {
        const variant = product.selectedOrFirstAvailableVariant;
        const price = variant?.price;

        return {
            id: product.id,
            title: product.title,
            handle: product.handle,
            priceRange: price
                ? {
                      minVariantPrice: price,
                      maxVariantPrice: price
                  }
                : undefined,
            variants: {
                edges: [
                    {
                        node: {
                            compareAtPrice: variant?.compareAtPrice ?? null
                        }
                    }
                ]
            },
            images: {
                edges: variant?.image
                    ? [
                          {
                              node: {
                                  url: variant.image.url,
                                  altText: variant.image.altText
                              }
                          }
                      ]
                    : []
            }
        };
    });

    const filteredCollections = (predictiveItems?.collections ?? []).slice(0, 5);
    const filteredArticles = (predictiveItems?.articles ?? []).slice(0, 5);
    const filteredPages = (predictiveItems?.pages ?? []).slice(0, 5);
    const filteredSuggestions = (predictiveItems?.queries ?? []).slice(0, 5);
    const filteredPolicies = filterPolicies(query);

    const featuredCollections = collections
        .filter(collection => !["all", "all-collections", "frontpage"].includes(collection.handle.toLowerCase()))
        .slice(0, 6);

    const isLoading = fetcher.state !== "idle";

    const handleClose = () => {
        closeSearch();
        restoreTriggerFocus();
    };

    const handleOpenChange = (nextOpen: boolean) => {
        setOpen(nextOpen);
        if (!nextOpen) {
            handleClose();
        }
    };

    const navigateTo = (path: string, termForHistory?: string) => {
        if (termForHistory) {
            addSearch(termForHistory);
        }
        void navigate(path);
        handleClose();
    };

    const handleSubmit = () => {
        const trimmed = query.trim();
        if (!trimmed) return;
        navigateTo(`/search?q=${encodeURIComponent(trimmed)}`, trimmed);
    };

    const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Escape") {
            event.preventDefault();
            handleClose();
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent
                className="border-primary/20 ring-primary/10 gap-0 overflow-hidden border-2 p-0 shadow-2xl ring-1 sm:max-w-[750px] md:max-w-[750px] sm:rounded-xl"
                overlayClassName="bg-overlay-dark backdrop-blur-md"
                showCloseButton={false}
            >
                <DialogTitle className="pointer-events-none sr-only">Search</DialogTitle>

                <Command className="bg-background relative overflow-hidden">
                    <SearchInput
                        placeholder={shopName ? `Search ${shopName}` : "Search"}
                        query={query}
                        onSubmit={handleSubmit}
                        onQueryChange={handleQueryChange}
                        onKeyDown={handleInputKeyDown}
                    />

                    <CommandList className="max-h-[400px] overflow-auto" data-lenis-prevent>
                        <SearchResults
                            query={query}
                            loading={isLoading}
                            filteredProducts={filteredProducts}
                            filteredCollections={filteredCollections}
                            filteredArticles={filteredArticles}
                            filteredPages={filteredPages}
                            filteredSuggestions={filteredSuggestions}
                            filteredPolicies={filteredPolicies}
                            onProductClick={product => navigateTo(`/products/${product.handle}`, query.trim())}
                            onCollectionClick={collection => navigateTo(`/collections/${collection.handle}`, query.trim())}
                            onArticleClick={article =>
                                navigateTo(`/blogs/${article.blog?.handle ?? "news"}/${article.handle}`, query.trim())
                            }
                            onPageClick={page => navigateTo(`/pages/${page.handle}`, query.trim())}
                            onSuggestionClick={suggestion =>
                                navigateTo(`/search?q=${encodeURIComponent(suggestion.text)}`, suggestion.text)
                            }
                            onPolicyClick={policy => navigateTo(policy.href, query.trim())}
                        />

                        {!query && (
                            <SearchDefaultView
                                featuredCollections={featuredCollections}
                                recentSearches={recentSearches}
                                popularSearches={popularSearchTerms}
                                popularProducts={popularProducts}
                                onSuggestionClick={term => {
                                    setQuery(term);
                                    addSearch(term);
                                    void fetcher.load(`/search?predictive=true&limit=10&q=${encodeURIComponent(term)}`);
                                }}
                                onClearRecent={clearSearches}
                                onClose={handleClose}
                            />
                        )}
                    </CommandList>
                </Command>
            </DialogContent>
        </Dialog>
    );
};
