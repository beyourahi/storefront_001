import {useCallback, useEffect, useMemo, useRef, useState} from "react";
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

/**
 * Command-palette style search dialog, opened via `useSearchController` or `⌘K`.
 * Predictive results are fetched via `fetcher.load` with a 300ms debounce.
 * The fetcher is stored in a ref (`fetcherRef`) so the debounced function always
 * uses the latest fetcher instance without being recreated each render — recreating
 * it would restart the debounce timer and lose the stable reference.
 * Shows a default view (recent searches, popular terms, collections) when the
 * query is empty; switches to predictive results once the user starts typing.
 */
export const SearchOverlay = ({
    shopName,
    collections = [],
    popularSearchTerms = [],
    popularProducts = []
}: SearchOverlayProps) => {
    const navigate = useNavigate();
    const fetcher = useFetcher<PredictiveSearchData>();
    const {open, openSearch, closeSearch, setOpen, restoreTriggerFocus} = useSearchController();
    const {recentSearchEntries, addSearch, clearSearches} = useRecentSearches();

    // Store fetcher in a ref so the debounced function always uses the latest
    // instance without being recreated every render (which would defeat debounce).
    const fetcherRef = useRef(fetcher);
    fetcherRef.current = fetcher;

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

    // Empty deps: debounce timer is shared across renders; fetcherRef ensures
    // we always call the current fetcher instance without recreating the function.
    const debouncedFetch = useMemo(
        () =>
            debounce((searchQuery: string) => {
                if (!searchQuery.trim()) return;
                void fetcherRef.current.load(`/search?predictive=true&limit=10&q=${encodeURIComponent(searchQuery)}`);
            }, 300),
        []
    );

    const handleQueryChange = useCallback(
        (value: string) => {
            setQuery(value);
            if (value.trim()) {
                debouncedFetch(value);
            }
        },
        [debouncedFetch]
    );

    const predictiveItems = fetcher.data?.type === "predictive" ? fetcher.data.result.items : null;

    const filteredProducts = useMemo(
        () =>
            (predictiveItems?.products ?? []).slice(0, 5).map(product => {
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
            }),
        [predictiveItems]
    );

    const filteredCollections = useMemo(() => (predictiveItems?.collections ?? []).slice(0, 5), [predictiveItems]);
    const filteredArticles = useMemo(() => (predictiveItems?.articles ?? []).slice(0, 5), [predictiveItems]);
    const filteredPages = useMemo(() => (predictiveItems?.pages ?? []).slice(0, 5), [predictiveItems]);
    const filteredSuggestions = useMemo(() => (predictiveItems?.queries ?? []).slice(0, 5), [predictiveItems]);
    const filteredPolicies = useMemo(() => filterPolicies(query), [query]);

    const featuredCollections = useMemo(
        () =>
            collections
                .filter(
                    collection => !["all", "all-collections", "frontpage"].includes(collection.handle.toLowerCase())
                )
                .slice(0, 6),
        [collections]
    );

    const isLoading = fetcher.state !== "idle";

    const handleClose = useCallback(() => {
        closeSearch();
        restoreTriggerFocus();
    }, [closeSearch, restoreTriggerFocus]);

    const handleOpenChange = useCallback(
        (nextOpen: boolean) => {
            setOpen(nextOpen);
            if (!nextOpen) {
                handleClose();
            }
        },
        [setOpen, handleClose]
    );

    const navigateTo = useCallback(
        (path: string, termForHistory?: string, imageForHistory?: string) => {
            if (termForHistory) {
                addSearch(termForHistory, imageForHistory);
            }
            void navigate(path);
            handleClose();
        },
        [addSearch, navigate, handleClose]
    );

    const handleSubmit = useCallback(() => {
        const trimmed = query.trim();
        if (!trimmed) return;
        navigateTo(`/search?q=${encodeURIComponent(trimmed)}`, trimmed);
    }, [query, navigateTo]);

    const handleInputKeyDown = useCallback(
        (event: React.KeyboardEvent<HTMLInputElement>) => {
            if (event.key === "Escape") {
                event.preventDefault();
                handleClose();
            }
        },
        [handleClose]
    );

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
                            onProductClick={product => {
                                const firstImage = product.images?.edges?.[0]?.node?.url;
                                navigateTo(`/products/${product.handle}`, query.trim(), firstImage);
                            }}
                            onCollectionClick={collection =>
                                navigateTo(`/collections/${collection.handle}`, query.trim())
                            }
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
                                recentSearchEntries={recentSearchEntries}
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
