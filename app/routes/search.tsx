import * as React from "react";
import {Link, useLoaderData, useNavigate, useRouteError, isRouteErrorResponse, useRouteLoaderData, useSearchParams, useFetcher} from "react-router";
import type {Route} from "./+types/search";
import {Analytics, Image, getSeoMeta} from "@shopify/hydrogen";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "~/components/ui/tabs";
import {Button} from "~/components/ui/button";
import {Alert, AlertDescription} from "~/components/ui/alert";
import {Badge} from "~/components/ui/badge";
import {Skeleton} from "~/components/ui/skeleton";
import {InfiniteScrollGrid} from "~/components/sections/InfiniteScrollGrid";
import {SortFilterBar} from "~/components/collection/SortFilterBar";
import {SEARCH_SORT_OPTIONS, SEARCH_DEFAULT_SORT, getSearchSortOption} from "~/lib/sort-filter-helpers";
import {AnimatedSection} from "~/components/sections/AnimatedSection";
import {ViewOptionsSelector, type LayoutMode} from "~/components/search/ViewOptionsSelector";
import {ProductPrice} from "~/components/search/ProductPrice";
import {DiscountBadge} from "~/components/DiscountBadge";
import {parseProductTitle} from "~/lib/product";
import {useRecentSearches} from "~/hooks/useRecentSearches";
import {getGridClassName, type GridColumns} from "~/lib/gridColumns";
import {urlWithTrackingParams} from "~/lib/search/url-with-tracking";
import {sortWithPinnedFirst} from "~/lib/product-tags";
import {ProductCardTitle} from "~/components/common/ProductCardTitle";
import {STORE_FORMAT_LOCALE} from "~/lib/store-locale";
const FALLBACK_THEME_PRODUCT_IMAGE_ASPECT_RATIO: "portrait" | "landscape" | "square" = "portrait";
const FALLBACK_POPULAR_SEARCHES = ["new arrivals", "best sellers", "gift ideas", "on sale", "trending now"];
import {cn} from "~/lib/utils";
import type {RootLoader} from "~/root";
import {Search, SearchX, AlertCircle, Package, FolderOpen, Newspaper, Clock, TrendingUp, Calendar} from "lucide-react";
import {isAgentRequest} from "~/lib/agentic/agent-request";
import {toUcpProductPage, toUcpProduct} from "~/lib/agentic/catalog-shapes";
import {SearchEmptyState} from "~/components/search/SearchEmptyState";
import {useAgentSurface} from "~/lib/agent-surface-context";

export const meta: Route.MetaFunction = ({data}) => {
    const term = data && typeof data === "object" && "term" in data ? (data as {term: string}).term : "";
    const title = term ? `Search results for "${term}"` : "Search";

    return (
        getSeoMeta({
            title,
            description: "Search our collection of products, collections, and articles.",
            robots: {noIndex: true, noFollow: false}
        }) ?? []
    );
};

export type SearchCollection = {
    __typename: "Collection";
    id: string;
    handle: string;
    title: string;
    description: string;
    image: {
        id: string;
        url: string;
        altText: string | null;
        width: number;
        height: number;
    } | null;
};

export type SearchArticle = {
    __typename: "Article";
    id: string;
    handle: string;
    title: string;
    trackingParameters: string | null;
    excerpt: string | null;
    publishedAt: string;
    image: {
        id: string;
        url: string;
        altText: string | null;
        width: number;
        height: number;
    } | null;
    blog: {
        handle: string;
        title: string;
    };
};

export type SearchProduct = {
    __typename: "Product";
    id: string;
    handle: string;
    title: string;
    trackingParameters: string | null;
    availableForSale: boolean;
    featuredImage: {
        id: string;
        altText: string | null;
        url: string;
        width: number;
        height: number;
    } | null;
    priceRange: {
        minVariantPrice: {
            amount: string;
            currencyCode: string;
        };
        maxVariantPrice: {
            amount: string;
            currencyCode: string;
        };
    };
    compareAtPriceRange: {
        minVariantPrice: {
            amount: string;
            currencyCode: string;
        };
    };
    variants: {
        nodes: Array<{
            id: string;
            title: string;
            availableForSale: boolean;
            price: {
                amount: string;
                currencyCode: string;
            };
            compareAtPrice: {
                amount: string;
                currencyCode: string;
            } | null;
        }>;
    };
};

type CategorizedSearchResult = {
    type: "categorized";
    term: string;
    error?: string;
    products: {
        nodes: SearchProduct[];
        pageInfo: {hasNextPage: boolean; endCursor: string | null};
        totalCount: number;
    };
    collections: {
        nodes: SearchCollection[];
        totalCount: number;
    };
    articles: {
        nodes: SearchArticle[];
        pageInfo: {hasNextPage: boolean; endCursor: string | null};
        totalCount: number;
    };
};

type PredictiveSearchResult = {
    type: "predictive";
    term: string;
    result: {
        total: number;
        items: {
            products: Array<{
                __typename: "Product";
                id: string;
                title: string;
                handle: string;
                availableForSale: boolean;
                trackingParameters: string | null;
                selectedOrFirstAvailableVariant: {
                    id: string;
                    image: {
                        url: string;
                        altText: string | null;
                        width: number;
                        height: number;
                    } | null;
                    price: {
                        amount: string;
                        currencyCode: string;
                    };
                    compareAtPrice: {
                        amount: string;
                        currencyCode: string;
                    } | null;
                } | null;
            }>;
            collections: Array<{
                __typename: "Collection";
                id: string;
                title: string;
                handle: string;
                image: {
                    url: string;
                    altText: string | null;
                    width: number;
                    height: number;
                } | null;
                trackingParameters: string | null;
                products: {nodes: Array<{id: string; availableForSale: boolean}>};
            }>;
            pages: Array<{
                __typename: "Page";
                id: string;
                title: string;
                handle: string;
                trackingParameters: string | null;
            }>;
            articles: Array<{
                __typename: "Article";
                id: string;
                title: string;
                handle: string;
                trackingParameters: string | null;
                blog: {handle: string};
                image: {
                    url: string;
                    altText: string | null;
                    width: number;
                    height: number;
                } | null;
            }>;
            queries: Array<{
                __typename: "SearchQuerySuggestion";
                text: string;
                styledText: string;
                trackingParameters: string | null;
            }>;
        };
    };
};

type FetcherResult = {
    products: SearchProduct[] | SearchArticle[];
    pageInfo: {hasNextPage: boolean; endCursor: string | null};
};

export async function loader({request, context}: Route.LoaderArgs) {
    const url = new URL(request.url);
    const isPredictive = url.searchParams.has("predictive");
    const isFetcherRequest = url.searchParams.has("index");
    const fetchType = url.searchParams.get("fetchType");
    const isAgent = isAgentRequest(request);

    if (isFetcherRequest && !isPredictive) {
        if (fetchType === "articles") {
            return await fetchMoreArticles({request, context});
        }
        return await fetchMoreProducts({request, context});
    }

    if (isPredictive) {
        const predictiveData = await predictiveSearch({request, context}).catch((error: Error) => {
            console.error(error);
            return {type: "predictive" as const, term: "", result: getEmptyPredictiveSearchResult()};
        });

        // Agent path: return UCP-shaped products without styledText/UI noise
        if (isAgent) {
            const products = predictiveData.result?.items?.products ?? [];
            const storeUrl = getStoreUrl(context.env);
            const ucpProducts = products.map((p: any) => toUcpProduct(p, storeUrl));
            return new Response(JSON.stringify({products: ucpProducts}), {
                headers: {
                    "Content-Type": "application/x-ucp+json",
                    "Cache-Control": "no-store"
                }
            });
        }

        return predictiveData;
    }

    // Regular search — run first so we can branch on agent before returning UI data
    const searchData = await regularSearch({request, context}).catch((error: Error) => {
        console.error(error);
        return {
            type: "categorized" as const,
            term: "",
            error: error.message,
            products: {nodes: [], pageInfo: {hasNextPage: false, endCursor: null}, totalCount: 0},
            collections: {nodes: [], totalCount: 0},
            articles: {nodes: [], pageInfo: {hasNextPage: false, endCursor: null}, totalCount: 0}
        } satisfies CategorizedSearchResult;
    });

    // Agent path: return UCP-shaped product page, skipping UI rendering overhead
    if (isAgent) {
        const term = String(url.searchParams.get("q") ?? "").trim();
        if (!term) {
            return new Response(
                JSON.stringify({products: [], pageInfo: {hasNextPage: false, endCursor: null}}),
                {headers: {"Content-Type": "application/x-ucp+json", "Cache-Control": "no-store"}}
            );
        }
        const productsConnection = searchData.products;
        const storeUrl = getStoreUrl(context.env);
        const ucpPage = toUcpProductPage(productsConnection, storeUrl);
        return new Response(JSON.stringify(ucpPage), {
            headers: {
                "Content-Type": "application/x-ucp+json",
                "Cache-Control": "no-store"
            }
        });
    }

    return searchData;
}

export default function SearchPage() {
    const data = useLoaderData<typeof loader>();
    const rootData = useRouteLoaderData<RootLoader>("root");
    const navigate = useNavigate();
    const {recentSearchEntries, addSearch, clearSearches} = useRecentSearches();

    const [activeTab, setActiveTab] = React.useState("products");
    const [productsGridColumns, setProductsGridColumns] = React.useState<GridColumns>(3);
    const [productsLayoutMode, setProductsLayoutMode] = React.useState<LayoutMode>("grid");
    const [collectionsGridColumns, setCollectionsGridColumns] = React.useState<GridColumns>(3);
    const [collectionsLayoutMode, setCollectionsLayoutMode] = React.useState<LayoutMode>("grid");
    const [articlesGridColumns, setArticlesGridColumns] = React.useState<GridColumns>(3);
    const [articlesLayoutMode, setArticlesLayoutMode] = React.useState<LayoutMode>("grid");

    const searchInputRef = React.useRef<HTMLInputElement | null>(null);
    const agentSurface = useAgentSurface();

    React.useEffect(() => {
        const savedProductsGrid = localStorage.getItem("search-products-grid-columns");
        const savedProductsLayout = localStorage.getItem("search-products-layout-mode");
        const savedCollectionsGrid = localStorage.getItem("search-collections-grid-columns");
        const savedCollectionsLayout = localStorage.getItem("search-collections-layout-mode");
        const savedArticlesGrid = localStorage.getItem("search-articles-grid-columns");
        const savedArticlesLayout = localStorage.getItem("search-articles-layout-mode");

        if (savedProductsGrid && ["2", "3", "4"].includes(savedProductsGrid)) {
            setProductsGridColumns(Number(savedProductsGrid) as GridColumns);
        }
        if (savedProductsLayout === "grid" || savedProductsLayout === "list") {
            setProductsLayoutMode(savedProductsLayout);
        }

        if (savedCollectionsGrid && ["2", "3", "4"].includes(savedCollectionsGrid)) {
            setCollectionsGridColumns(Number(savedCollectionsGrid) as GridColumns);
        }
        if (savedCollectionsLayout === "grid" || savedCollectionsLayout === "list") {
            setCollectionsLayoutMode(savedCollectionsLayout);
        }

        if (savedArticlesGrid && ["2", "3", "4"].includes(savedArticlesGrid)) {
            setArticlesGridColumns(Number(savedArticlesGrid) as GridColumns);
        }
        if (savedArticlesLayout === "grid" || savedArticlesLayout === "list") {
            setArticlesLayoutMode(savedArticlesLayout);
        }
    }, []);

    if (!data || typeof data !== "object") {
        return null;
    }

    if ("type" in data && data.type !== "categorized") {
        return null;
    }

    const categorized = data as CategorizedSearchResult;
    const {term, error, products, collections, articles} = categorized;
    const totalResults = products.totalCount + collections.totalCount + articles.totalCount;

    // Agent path: machine-readable list with JSON-LD, no tabs/carousels.
    if (agentSurface.isAgent) {
        return <AgentSearchResults term={term} products={products.nodes} />;
    }

    const menuCollections = rootData?.menuCollections ?? [];
    const featuredCollections = menuCollections
        .filter(
            (collection: {id: string; handle: string; title: string; image?: unknown}) =>
                !["all", "all-collections", "frontpage"].includes(collection.handle.toLowerCase())
        )
        .slice(0, 6);
    const popularSearches = rootData?.popularSearchTerms?.length
        ? rootData.popularSearchTerms
        : FALLBACK_POPULAR_SEARCHES;

    const handleGridColumnsChange = (columns: GridColumns) => {
        if (activeTab === "products") {
            setProductsGridColumns(columns);
            localStorage.setItem("search-products-grid-columns", String(columns));
        } else if (activeTab === "collections") {
            setCollectionsGridColumns(columns);
            localStorage.setItem("search-collections-grid-columns", String(columns));
        } else {
            setArticlesGridColumns(columns);
            localStorage.setItem("search-articles-grid-columns", String(columns));
        }
    };

    const handleLayoutModeChange = (mode: LayoutMode) => {
        if (activeTab === "products") {
            setProductsLayoutMode(mode);
            localStorage.setItem("search-products-layout-mode", mode);
        } else if (activeTab === "collections") {
            setCollectionsLayoutMode(mode);
            localStorage.setItem("search-collections-layout-mode", mode);
        } else {
            setArticlesLayoutMode(mode);
            localStorage.setItem("search-articles-layout-mode", mode);
        }
    };

    const currentGridColumns =
        activeTab === "products"
            ? productsGridColumns
            : activeTab === "collections"
              ? collectionsGridColumns
              : articlesGridColumns;
    const currentLayoutMode =
        activeTab === "products"
            ? productsLayoutMode
            : activeTab === "collections"
              ? collectionsLayoutMode
              : articlesLayoutMode;

    const handleSuggestionClick = (searchTerm: string) => {
        addSearch(searchTerm);
        void navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const value = searchInputRef.current?.value?.trim() ?? "";
        if (!value) {
            void navigate("/search", {replace: true});
            return;
        }
        addSearch(value);
        void navigate(`/search?q=${encodeURIComponent(value)}`);
    };

    return (
        <div className="mb-4 min-h-screen px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16 3xl:mx-auto 3xl:max-w-[1600px] 3xl:px-12">
            <AnimatedSection animation="fade" threshold={0.08}>
                <header className="pt-(--total-header-height) pb-6 sm:pb-8 md:pb-12 lg:pb-16">
                    <h1 className="m-0 font-serif text-3xl font-medium text-primary tracking-tight sm:text-4xl md:text-6xl lg:text-7xl xl:text-8xl 2xl:text-9xl">
                        / Search
                    </h1>
                </header>
            </AnimatedSection>

            <AnimatedSection animation="slide-up" threshold={0.1}>
                <form
                    onSubmit={handleSubmit}
                    className="mb-6 max-w-4xl sm:mb-8 md:mb-10 lg:mb-12 xl:max-w-5xl 2xl:max-w-6xl"
                >
                    <div className="relative flex items-center gap-3">
                        <input
                            ref={searchInputRef}
                            defaultValue={term}
                            name="q"
                            type="search"
                            placeholder="Search..."
                            className={cn(
                                "w-full border-0 border-b-2 border-[var(--border-strong)] bg-transparent",
                                "py-3 text-base font-sans text-primary outline-none transition-colors duration-300 placeholder:text-primary/40",
                                "focus:border-primary sm:py-4 sm:text-lg md:text-xl lg:text-2xl"
                            )}
                        />
                    </div>
                </form>
            </AnimatedSection>

            {error && (
                <Alert variant="destructive" className="mb-8 max-w-2xl">
                    <AlertCircle className="size-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {!term ? (
                <AnimatedSection animation="fade" threshold={0.1}>
                    <SearchPageInitialState
                        recentSearchEntries={recentSearchEntries}
                        collections={featuredCollections}
                        popularSearches={popularSearches}
                        onClearRecent={clearSearches}
                        onSuggestionClick={handleSuggestionClick}
                    />
                </AnimatedSection>
            ) : totalResults === 0 ? (
                <AnimatedSection animation="fade" threshold={0.1}>
                    <SearchEmptyState term={term} />
                </AnimatedSection>
            ) : (
                <AnimatedSection animation="slide-up" threshold={0.12}>
                    <div className="space-y-6">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <div className="mb-6 flex flex-col gap-4">
                                <div className="flex items-center justify-between gap-4">
                                    <TabsList className="h-auto shrink-0 gap-1 overflow-x-auto bg-transparent p-0 sm:gap-1.5 md:gap-2">
                                        <TabsTrigger
                                            value="products"
                                            className={cn(
                                                "rounded-full border-2 border-primary",
                                                "min-h-9 px-2 py-1 text-sm font-medium whitespace-nowrap transition-all sm:min-h-10 sm:px-3 sm:py-1.5 md:min-h-11 md:px-4 md:py-2 md:text-base",
                                                "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
                                                "data-[state=inactive]:bg-transparent data-[state=inactive]:text-primary"
                                            )}
                                        >
                                            <Package className="mr-1.5 hidden size-4 sm:inline-block" />
                                            <span>Products</span>
                                            <span className="ml-1 text-sm opacity-80">({products.totalCount})</span>
                                        </TabsTrigger>

                                        <TabsTrigger
                                            value="collections"
                                            className={cn(
                                                "rounded-full border-2 border-primary",
                                                "min-h-9 px-2 py-1 text-sm font-medium whitespace-nowrap transition-all sm:min-h-10 sm:px-3 sm:py-1.5 md:min-h-11 md:px-4 md:py-2 md:text-base",
                                                "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
                                                "data-[state=inactive]:bg-transparent data-[state=inactive]:text-primary"
                                            )}
                                        >
                                            <FolderOpen className="mr-1.5 hidden size-4 sm:inline-block" />
                                            <span>Collections</span>
                                            <span className="ml-1 text-sm opacity-80">({collections.totalCount})</span>
                                        </TabsTrigger>

                                        <TabsTrigger
                                            value="articles"
                                            className={cn(
                                                "rounded-full border-2 border-primary",
                                                "min-h-9 px-2 py-1 text-sm font-medium whitespace-nowrap transition-all sm:min-h-10 sm:px-3 sm:py-1.5 md:min-h-11 md:px-4 md:py-2 md:text-base",
                                                "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
                                                "data-[state=inactive]:bg-transparent data-[state=inactive]:text-primary"
                                            )}
                                        >
                                            <Newspaper className="mr-1.5 hidden size-4 sm:inline-block" />
                                            <span>Articles</span>
                                            <span className="ml-1 text-sm opacity-80">({articles.totalCount})</span>
                                        </TabsTrigger>
                                    </TabsList>

                                    <div className="hidden shrink-0 md:block">
                                        <ViewOptionsSelector
                                            gridColumns={currentGridColumns}
                                            onGridColumnsChange={handleGridColumnsChange}
                                            layoutMode={currentLayoutMode}
                                            onLayoutModeChange={handleLayoutModeChange}
                                            showSortOptions={false}
                                        />
                                    </div>
                                </div>

                                <div className="md:hidden">
                                    <ViewOptionsSelector
                                        gridColumns={currentGridColumns}
                                        onGridColumnsChange={handleGridColumnsChange}
                                        layoutMode={currentLayoutMode}
                                        onLayoutModeChange={handleLayoutModeChange}
                                        showSortOptions={false}
                                    />
                                </div>
                            </div>

                            <TabsContent value="products" className="mt-0">
                                <SearchProductsTab
                                    products={products}
                                    term={term}
                                    gridColumns={productsGridColumns}
                                    layoutMode={productsLayoutMode}
                                />
                            </TabsContent>

                            <TabsContent value="collections" className="mt-0">
                                <SearchCollectionsTab
                                    collections={collections}
                                    gridColumns={collectionsGridColumns}
                                    layoutMode={collectionsLayoutMode}
                                />
                            </TabsContent>

                            <TabsContent value="articles" className="mt-0">
                                <SearchArticlesTab
                                    articles={articles}
                                    term={term}
                                    gridColumns={articlesGridColumns}
                                    layoutMode={articlesLayoutMode}
                                />
                            </TabsContent>
                        </Tabs>
                    </div>
                </AnimatedSection>
            )}

            <Analytics.SearchView
                data={{
                    searchTerm: term,
                    searchResults: {total: totalResults, items: {products, collections, articles}}
                }}
            />
        </div>
    );
}

function SearchPageInitialState({
    recentSearchEntries,
    collections,
    popularSearches,
    onClearRecent,
    onSuggestionClick
}: {
    recentSearchEntries: import("~/hooks/useRecentSearches").RecentSearchEntry[];
    collections: Array<{
        id: string;
        handle: string;
        title: string;
        productsCount: number;
        image?: {url: string; altText?: string | null} | null;
    }>;
    popularSearches: string[];
    onClearRecent: () => void;
    onSuggestionClick: (term: string) => void;
}) {
    const hasContent = recentSearchEntries.length > 0 || popularSearches.length > 0 || collections.length > 0;

    if (!hasContent) {
        return (
            <div className="px-4 py-10 text-center sm:py-16">
                <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-muted/50 sm:mb-6 sm:h-16 sm:w-16">
                    <Search className="size-6 text-muted-foreground sm:size-8" />
                </div>
                <h2 className="mb-2 font-serif text-xl text-primary sm:mb-3 sm:text-2xl md:text-3xl">
                    Start searching
                </h2>
                <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground sm:max-w-md sm:text-base">
                    Enter a search term to discover products, collections, and articles.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8 sm:space-y-12">
            {recentSearchEntries.length > 0 && (
                <section>
                    <div className="mb-4 flex items-center justify-between sm:mb-5">
                        <h3 className="text-muted-foreground flex items-center gap-2 text-sm font-medium tracking-wider uppercase">
                            <Clock className="size-4" />
                            Recent Searches
                        </h3>
                        <Button variant="ghost" size="sm" onClick={onClearRecent} className="text-sm">
                            Clear all
                        </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 sm:gap-3">
                        {recentSearchEntries.map(entry => (
                            <button
                                type="button"
                                key={entry.term}
                                onClick={() => onSuggestionClick(entry.term)}
                                className={cn(
                                    "group sleek flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-sm",
                                    "border-[var(--border-strong)] bg-background hover:bg-accent hover:border-primary/40"
                                )}
                                aria-label={`Search again for ${entry.term}`}
                            >
                                {entry.image ? (
                                    <span className="bg-muted relative inline-flex size-8 shrink-0 overflow-hidden rounded-full">
                                        <Image
                                            data={{url: entry.image, altText: null}}
                                            width={32}
                                            height={32}
                                            loading="lazy"
                                            className="h-full w-full object-cover"
                                            aria-hidden="true"
                                        />
                                    </span>
                                ) : (
                                    <span
                                        className="bg-muted text-muted-foreground inline-flex size-8 shrink-0 items-center justify-center rounded-full"
                                        aria-hidden="true"
                                    >
                                        <Search className="size-3.5" />
                                    </span>
                                )}
                                <span className="truncate max-w-[20ch]">{entry.term}</span>
                            </button>
                        ))}
                    </div>
                </section>
            )}

            {popularSearches.length > 0 && (
                <section>
                    <h3 className="text-muted-foreground mb-4 flex items-center gap-2 text-sm font-medium tracking-wider uppercase sm:mb-5">
                        <TrendingUp className="size-4" />
                        Popular Searches
                    </h3>
                    <div className="flex flex-wrap gap-2 sm:gap-3">
                        {popularSearches.map(searchTerm => (
                            <Button
                                key={searchTerm}
                                variant="outline"
                                size="sm"
                                onClick={() => onSuggestionClick(searchTerm)}
                                className="border-[var(--border-strong)] text-sm"
                            >
                                {searchTerm}
                            </Button>
                        ))}
                    </div>
                </section>
            )}

            {collections.length > 0 && (
                <section>
                    <h3 className="text-muted-foreground mb-5 text-sm font-medium tracking-wider uppercase sm:mb-6">
                        Explore Collections
                    </h3>
                    <div className="grid grid-cols-2 gap-2 sm:gap-responsive sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                        {collections.map(collection => (
                            <Link key={collection.id} to={`/collections/${collection.handle}`} prefetch="viewport" className="group">
                                <div className="bg-muted/50 mb-2 aspect-square overflow-hidden rounded-xl sm:mb-3 sm:rounded-2xl">
                                    {collection.image ? (
                                        <Image
                                            data={collection.image}
                                            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                                            loading="lazy"
                                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="from-primary/5 to-primary/20 flex h-full w-full items-center justify-center bg-linear-to-br">
                                            <span className="font-serif text-2xl text-primary/30 sm:text-3xl md:text-4xl">
                                                {collection.title.charAt(0)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <p className="line-clamp-1 text-sm font-medium text-primary transition-colors group-hover:text-primary/70 sm:text-base">
                                    {collection.title}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {collection.productsCount} {collection.productsCount === 1 ? "product" : "products"}
                                </p>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            <div className="border-border/50 py-6 text-center sm:py-8">
                <p className="text-sm text-muted-foreground sm:text-base">
                    Type above to search for products, collections, or articles
                </p>
            </div>
        </div>
    );
}

function SearchProductsTab({
    products,
    term,
    gridColumns,
    layoutMode
}: {
    products: CategorizedSearchResult["products"];
    term: string;
    gridColumns: GridColumns;
    layoutMode: LayoutMode;
}) {
    const [searchParams] = useSearchParams();
    const currentSort = searchParams.get("sort") ?? SEARCH_DEFAULT_SORT;

    if (products.nodes.length === 0) {
        return (
            <div className="px-4 py-8 text-center sm:py-12">
                <div className="bg-[var(--brand-primary-subtle)] mx-auto mb-4 inline-flex rounded-full p-4 shadow-sm backdrop-blur-sm">
                    <Package className="text-primary size-6" />
                </div>
                <p className="text-sm text-muted-foreground sm:text-base">No products found for &ldquo;{term}&rdquo;</p>
            </div>
        );
    }

    const resourcesClassName = getGridClassName(gridColumns, layoutMode);

    return (
        <>
            <SortFilterBar
                currentSort={currentSort}
                totalProducts={products.totalCount}
                options={SEARCH_SORT_OPTIONS}
                defaultSortValue={SEARCH_DEFAULT_SORT}
            />
            <InfiniteScrollGrid<SearchProduct>
            key={`search-products-${layoutMode}-${gridColumns}`}
            initialProducts={products.nodes}
            pageInfo={{
                hasNextPage: products.pageInfo.hasNextPage,
                endCursor: products.pageInfo.endCursor
            }}
            resourcesClassName={resourcesClassName}
            fetcherKey={`search-products-${term}`}
            showSkeletons={true}
            skeletonCount={gridColumns === 2 ? 2 : gridColumns === 3 ? 3 : 4}
            endMessage="You've seen all results"
            fetchType="products"
        >
            {({node: product, index}) => (
                <SearchProductItem
                    key={product.id}
                    product={product}
                    term={term}
                    loading={index < 12 ? "eager" : undefined}
                    variant={layoutMode === "list" ? "list" : "card"}
                    index={index}
                    gridColumns={gridColumns}
                />
            )}
        </InfiniteScrollGrid>
        </>
    );
}

function SearchProductItem({
    product,
    term,
    loading,
    variant = "card",
    index = 0,
    gridColumns = 3
}: {
    product: SearchProduct;
    term: string;
    loading?: "eager" | "lazy";
    variant?: "card" | "list";
    index?: number;
    gridColumns?: GridColumns;
}) {
    const productUrl = urlWithTrackingParams({
        baseUrl: `/products/${product.handle}`,
        trackingParams: product.trackingParameters,
        term
    });

    const image = product.featuredImage;
    const {primary, secondary} = parseProductTitle(product.title);
    const staggerDelay = Math.min(index, 11) * 40;

    const currentPrice = parseFloat(product.priceRange.minVariantPrice.amount);
    const compareAtPrice = parseFloat(product.compareAtPriceRange.minVariantPrice.amount);
    const hasDiscount = Number.isFinite(compareAtPrice) && compareAtPrice > currentPrice;
    const discountPercentage = hasDiscount ? Math.round((1 - currentPrice / compareAtPrice) * 100) : 0;
    const hasSecondPart = !!secondary;
    const aspectRatioClass =
        FALLBACK_THEME_PRODUCT_IMAGE_ASPECT_RATIO === "portrait"
            ? "aspect-[4/5]"
            : FALLBACK_THEME_PRODUCT_IMAGE_ASPECT_RATIO === "landscape"
              ? "aspect-[16/9]"
              : "aspect-square";
    const priceStyles = "font-mono font-bold tabular-nums tracking-tight antialiased";
    const viewMode = `grid${gridColumns}` as "grid2" | "grid3" | "grid4";

    if (variant === "list") {
        return (
            <Link
                to={productUrl}
                prefetch="viewport"
                className={cn(
                    "group flex items-center gap-4 border-b border-border/50 py-4 pl-4 no-underline transition-colors hover:bg-muted/30",
                    "animate-product-fade-in"
                )}
                style={{animationDelay: `${staggerDelay}ms`}}
            >
                <div className="relative h-[100px] w-20 shrink-0 overflow-hidden rounded-2xl bg-muted/50 md:h-[120px] md:w-24">
                    {hasDiscount && (
                        <DiscountBadge percentage={discountPercentage} className="top-1 left-1 px-1.5 py-0 text-xs" />
                    )}
                    {image ? (
                        <Image
                            alt={image.altText || product.title}
                            data={image}
                            loading={loading}
                            sizes="96px"
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                    ) : (
                        <div className="h-full w-full bg-muted/50" />
                    )}
                </div>

                <div className="min-w-0 flex-1">
                    <h3 className="truncate font-serif text-base font-semibold leading-snug text-foreground md:text-lg">
                        <span>{primary}</span>
                        {secondary && <span className="text-muted-foreground">, {secondary}</span>}
                    </h3>
                    <div className="mt-1 font-mono font-bold tabular-nums tracking-tight antialiased text-foreground text-sm md:text-base">
                        <ProductPrice
                            price={product.priceRange.minVariantPrice}
                            maxPrice={product.priceRange.maxVariantPrice}
                        />
                    </div>
                </div>
            </Link>
        );
    }

    return (
        <div
            className={cn("sleek group product-card overflow-hidden rounded-lg animate-product-fade-in")}
            style={{animationDelay: `${staggerDelay}ms`}}
        >
            <div className={`relative ${aspectRatioClass} overflow-hidden rounded-b-lg bg-muted/50`}>
                {hasDiscount && (
                    <div className="absolute top-1 left-1 z-10 sm:top-1.5 sm:left-1.5">
                        <DiscountBadge percentage={discountPercentage} position="inline" />
                    </div>
                )}
                <Link to={productUrl} prefetch="viewport" className="block h-full w-full">
                    {image ? (
                        <Image
                            alt={image.altText || product.title}
                            aspectRatio={
                                FALLBACK_THEME_PRODUCT_IMAGE_ASPECT_RATIO === "portrait"
                                    ? "4/5"
                                    : FALLBACK_THEME_PRODUCT_IMAGE_ASPECT_RATIO === "landscape"
                                      ? "16/9"
                                      : "1/1"
                            }
                            data={image}
                            loading={loading}
                            sizes="(min-width: 45em) 400px, 100vw"
                            className="sleek product-image h-full w-full rounded-lg object-cover"
                        />
                    ) : (
                        <div className="bg-background flex h-full w-full items-center justify-center rounded-lg">
                            <div className="text-muted-foreground text-center">
                                <div className="mb-1 text-2xl sm:mb-2 sm:text-4xl">📦</div>
                                <p className="text-xs sm:text-sm">Product Image</p>
                            </div>
                        </div>
                    )}
                </Link>
            </div>

            <Link
                to={productUrl}
                prefetch="viewport"
                className={cn(
                    "block no-underline sleek group-hover:text-primary",
                    hasSecondPart ? "space-y-2 sm:space-y-3" : "space-y-0.5 sm:space-y-1",
                    "py-3 sm:py-4"
                )}
            >
                <ProductCardTitle productTitle={product.title} viewMode={viewMode} searchMode={true} />
                <div className="flex items-baseline gap-2 sm:gap-2.5">
                    <span className={cn("text-foreground text-sm md:text-base", priceStyles)}>
                        <ProductPrice
                            price={product.priceRange.minVariantPrice}
                            maxPrice={product.priceRange.maxVariantPrice}
                        />
                    </span>
                    {hasDiscount && (
                        <span
                            className={cn(
                                "text-muted-foreground line-through opacity-75 text-sm md:text-base",
                                priceStyles
                            )}
                        >
                            {new Intl.NumberFormat(STORE_FORMAT_LOCALE, {
                                style: "currency",
                                currency: product.compareAtPriceRange.minVariantPrice.currencyCode
                            }).format(parseFloat(product.compareAtPriceRange.minVariantPrice.amount))}
                        </span>
                    )}
                </div>
            </Link>
        </div>
    );
}

function SearchCollectionsTab({
    collections,
    gridColumns,
    layoutMode
}: {
    collections: CategorizedSearchResult["collections"];
    gridColumns: GridColumns;
    layoutMode: LayoutMode;
}) {
    if (collections.nodes.length === 0) {
        return (
            <div className="px-4 py-8 text-center text-muted-foreground sm:py-12">
                <FolderOpen className="mx-auto mb-3 size-10 opacity-50 sm:mb-4 sm:size-12" />
                <p className="text-sm sm:text-base">No collections found</p>
            </div>
        );
    }

    const resourcesClassName = getGridClassName(gridColumns, layoutMode);

    return (
        <div className={resourcesClassName}>
            {collections.nodes.map((collection, index) => (
                <SearchCollectionCard
                    key={collection.id}
                    collection={collection}
                    index={index}
                    variant={layoutMode === "list" ? "list" : "card"}
                />
            ))}
        </div>
    );
}

function SearchCollectionCard({
    collection,
    index,
    variant = "card"
}: {
    collection: SearchCollection;
    index: number;
    variant?: "card" | "list";
}) {
    const staggerDelay = Math.min(index, 11) * 40;

    if (variant === "list") {
        return (
            <Link
                to={`/collections/${collection.handle}`}
                prefetch="viewport"
                className={cn(
                    "group flex items-center gap-4 border-b border-border/50 py-4 no-underline transition-colors hover:bg-muted/30 md:gap-6",
                    "animate-product-fade-in"
                )}
                style={{animationDelay: `${staggerDelay}ms`}}
            >
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-muted/50 md:h-24 md:w-24">
                    {collection.image ? (
                        <Image
                            alt={collection.image.altText || collection.title}
                            data={collection.image}
                            sizes="96px"
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                    ) : (
                        <div className="from-primary/5 to-primary/20 flex h-full w-full items-center justify-center bg-linear-to-br">
                            <span className="font-serif text-2xl text-primary/30">{collection.title.charAt(0)}</span>
                        </div>
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <h3 className="truncate font-serif text-base font-semibold text-foreground md:text-lg">
                        {collection.title}
                    </h3>
                    {collection.description && (
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{collection.description}</p>
                    )}
                </div>
            </Link>
        );
    }

    return (
        <Link
            to={`/collections/${collection.handle}`}
            prefetch="viewport"
            className="sleek group bg-card collection-card block overflow-hidden rounded-lg animate-product-fade-in"
            style={{animationDelay: `${staggerDelay}ms`}}
        >
            <div className="bg-muted relative aspect-square w-full overflow-hidden">
                {collection.image ? (
                    <Image
                        alt={collection.image.altText || collection.title}
                        data={collection.image}
                        sizes="(min-width: 768px) 25vw, 50vw"
                        className="sleek h-full w-full object-cover xl:group-hover:scale-110"
                    />
                ) : (
                    <div className="from-primary/5 to-primary/20 sleek flex h-full w-full items-center justify-center bg-linear-to-br xl:group-hover:scale-110">
                        <span className="font-serif text-3xl text-primary/30 md:text-4xl">
                            {collection.title.charAt(0)}
                        </span>
                    </div>
                )}

                <div className="pointer-events-none absolute inset-0 flex items-end justify-center p-1 xl:p-2">
                    <div className="sleek bg-card/70 border-border/20 w-full rounded-lg border p-3 shadow-lg backdrop-blur-sm group-hover:shadow-xl sm:p-4">
                        <h3 className="sleek text-card-foreground text-sm leading-tight font-bold sm:text-base">
                            {collection.title}
                        </h3>
                        {collection.description && (
                            <p className="text-muted-foreground mt-1 text-xs leading-relaxed line-clamp-2">
                                {collection.description}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
}

function SearchArticlesTab({
    articles,
    term,
    gridColumns,
    layoutMode
}: {
    articles: CategorizedSearchResult["articles"];
    term: string;
    gridColumns: GridColumns;
    layoutMode: LayoutMode;
}) {
    if (articles.nodes.length === 0) {
        return (
            <div className="px-4 py-8 text-center text-muted-foreground sm:py-12">
                <Newspaper className="mx-auto mb-3 size-10 opacity-50 sm:mb-4 sm:size-12" />
                <p className="text-sm sm:text-base">No articles found for &ldquo;{term}&rdquo;</p>
            </div>
        );
    }

    const resourcesClassName = getGridClassName(gridColumns, layoutMode);

    return (
        <InfiniteScrollGrid<SearchArticle>
            key={`search-articles-${layoutMode}-${gridColumns}`}
            initialProducts={articles.nodes}
            pageInfo={{
                hasNextPage: articles.pageInfo.hasNextPage,
                endCursor: articles.pageInfo.endCursor
            }}
            resourcesClassName={resourcesClassName}
            fetcherKey={`search-articles-${term}`}
            showSkeletons={true}
            skeletonCount={gridColumns === 2 ? 2 : gridColumns === 3 ? 3 : 4}
            endMessage="You've seen all results"
            fetchType="articles"
        >
            {({node: article, index}) => (
                <SearchArticleCard
                    key={article.id}
                    article={article}
                    term={term}
                    index={index}
                    variant={layoutMode === "list" ? "list" : "card"}
                />
            )}
        </InfiniteScrollGrid>
    );
}

function SearchArticleCard({
    article,
    term,
    index,
    variant = "card"
}: {
    article: SearchArticle;
    term: string;
    index: number;
    variant?: "card" | "list";
}) {
    const articleUrl = urlWithTrackingParams({
        baseUrl: `/blogs/${article.blog.handle}/${article.handle}`,
        trackingParams: article.trackingParameters,
        term
    });

    const staggerDelay = Math.min(index, 11) * 40;
    const publishDate = new Date(article.publishedAt).toLocaleDateString(STORE_FORMAT_LOCALE, {
        year: "numeric",
        month: "short",
        day: "numeric"
    });

    if (variant === "list") {
        return (
            <Link
                to={articleUrl}
                prefetch="viewport"
                className={cn(
                    "group flex items-center gap-4 border-b border-border/50 py-4 no-underline transition-colors hover:bg-muted/30 md:gap-6",
                    "animate-product-fade-in"
                )}
                style={{animationDelay: `${staggerDelay}ms`}}
            >
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-muted/50 md:h-24 md:w-24">
                    {article.image ? (
                        <Image
                            alt={article.image.altText || article.title}
                            data={article.image}
                            sizes="96px"
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                    ) : (
                        <div className="from-primary/5 to-primary/20 flex h-full w-full items-center justify-center bg-linear-to-br">
                            <Newspaper className="size-6 text-primary/30" />
                        </div>
                    )}
                </div>

                <div className="min-w-0 flex-1">
                    <h3 className="truncate font-serif text-base font-semibold text-foreground md:text-lg">
                        {article.title}
                    </h3>
                    {article.excerpt && (
                        <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{article.excerpt}</p>
                    )}
                    <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="size-3" />
                        <span>{publishDate}</span>
                        <span className="text-border">•</span>
                        <span>{article.blog.title}</span>
                    </div>
                </div>
            </Link>
        );
    }

    return (
        <div
            className="sleek group block overflow-hidden rounded-lg animate-product-fade-in"
            style={{animationDelay: `${staggerDelay}ms`}}
        >
            <div className="relative aspect-[4/3] overflow-hidden rounded-b-lg bg-muted/50">
                <Link to={articleUrl} prefetch="viewport" className="block h-full w-full">
                    {article.image ? (
                        <Image
                            alt={article.image.altText || article.title}
                            data={article.image}
                            sizes="(min-width: 45em) 400px, 100vw"
                            className="sleek h-full w-full object-cover"
                        />
                    ) : (
                        <div className="from-primary/5 to-primary/20 flex h-full w-full items-center justify-center bg-linear-to-br">
                            <Newspaper className="size-12 text-primary/30" />
                        </div>
                    )}
                </Link>
            </div>

            <Link to={articleUrl} prefetch="viewport" className="block no-underline py-3 sm:py-4 space-y-1.5">
                <h3 className="line-clamp-2 font-serif font-semibold text-base leading-snug text-foreground">
                    {article.title}
                </h3>
                {article.excerpt && <p className="line-clamp-2 text-sm text-muted-foreground">{article.excerpt}</p>}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="size-3" />
                    <span>{publishDate}</span>
                    <span className="text-border">•</span>
                    <span>{article.blog.title}</span>
                </div>
            </Link>
        </div>
    );
}

export function ErrorBoundary() {
    const error = useRouteError();

    let statusCode = 500;
    let message: string | undefined;

    if (isRouteErrorResponse(error)) {
        statusCode = error.status;
        message = error.data?.message ?? error.data;
    } else if (error instanceof Error) {
        message = error.message;
    }

    return (
        <div className="mb-4 min-h-screen px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16 3xl:mx-auto 3xl:max-w-[1600px] 3xl:px-12">
            <div className="flex flex-col items-center justify-center py-24 text-center sm:py-32">
                <div className="bg-[var(--brand-primary-subtle)] mb-4 rounded-full p-4 shadow-sm backdrop-blur-sm">
                    <AlertCircle className="text-primary size-8" />
                </div>
                <div className="mb-4 inline-flex items-center">
                    <Badge variant="outline" className="px-4 py-1.5 text-xs font-medium">
                        Error {statusCode}
                    </Badge>
                </div>
                <h1 className="mb-3 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                    Search Unavailable
                </h1>
                <p className="mx-auto mb-2 max-w-md text-base leading-relaxed text-muted-foreground">
                    {message || "Something went wrong while loading search."}
                </p>
                <div className="bg-muted/50 border-border mt-4 inline-block rounded-full border px-4 py-2">
                    <p className="text-muted-foreground text-xs">
                        Code: <span className="font-mono font-medium">{statusCode}</span>
                    </p>
                </div>
            </div>
        </div>
    );
}

const SEARCH_PRODUCT_FRAGMENT = `#graphql
  fragment SearchProduct on Product {
    __typename
    handle
    id
    title
    trackingParameters
    availableForSale
    featuredImage {
      id
      altText
      url
      width
      height
    }
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
      maxVariantPrice {
        amount
        currencyCode
      }
    }
    compareAtPriceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    variants(first: 5) {
      nodes {
        id
        title
        availableForSale
        quantityAvailable
        price {
          amount
          currencyCode
        }
        compareAtPrice {
          amount
          currencyCode
        }
      }
    }
  }
` as const;

const SEARCH_ARTICLE_FRAGMENT = `#graphql
  fragment SearchArticle on Article {
    __typename
    handle
    id
    title
    trackingParameters
    excerpt(truncateAt: 150)
    publishedAt
    image {
      id
      url
      altText
      width
      height
    }
    blog {
      handle
      title
    }
  }
` as const;

const PAGE_INFO_FRAGMENT = `#graphql
  fragment PageInfoFragment on PageInfo {
    hasNextPage
    endCursor
  }
` as const;

const SEARCH_COLLECTION_FRAGMENT = `#graphql
  fragment SearchCollection on Collection {
    __typename
    id
    handle
    title
    description
    image {
      id
      url
      altText
      width
      height
    }
    products(first: 1) {
      nodes {
        id
        availableForSale
      }
    }
  }
` as const;

const SEARCH_COLLECTIONS_QUERY = `#graphql
  query SearchCollections(
    $country: CountryCode
    $language: LanguageCode
    $query: String!
    $first: Int!
  ) @inContext(country: $country, language: $language) {
    collections(query: $query, first: $first, sortKey: RELEVANCE) {
      nodes {
        ...SearchCollection
      }
      totalCount
    }
  }
  ${SEARCH_COLLECTION_FRAGMENT}
` as const;

const SEARCH_QUERY = `#graphql
  query RegularSearch(
    $country: CountryCode
    $language: LanguageCode
    $term: String!
    $productFirst: Int!
    $productAfter: String
    $articleFirst: Int!
    $articleAfter: String
    $sortKey: SearchSortKeys!
    $reverse: Boolean!
  ) @inContext(country: $country, language: $language) {
    products: search(
      query: $term
      types: [PRODUCT]
      first: $productFirst
      after: $productAfter
      sortKey: $sortKey
      reverse: $reverse
      unavailableProducts: SHOW
    ) {
      nodes {
        ... on Product {
          ...SearchProduct
        }
      }
      pageInfo {
        ...PageInfoFragment
      }
      totalCount
    }
    articles: search(
      query: $term
      types: [ARTICLE]
      first: $articleFirst
      after: $articleAfter
    ) {
      nodes {
        ... on Article {
          ...SearchArticle
        }
      }
      pageInfo {
        ...PageInfoFragment
      }
      totalCount
    }
  }
  ${SEARCH_PRODUCT_FRAGMENT}
  ${SEARCH_ARTICLE_FRAGMENT}
  ${PAGE_INFO_FRAGMENT}
` as const;

const SEARCH_PRODUCTS_QUERY = `#graphql
  query SearchProducts(
    $country: CountryCode
    $language: LanguageCode
    $term: String!
    $first: Int!
    $after: String
    $sortKey: SearchSortKeys!
    $reverse: Boolean!
  ) @inContext(country: $country, language: $language) {
    products: search(
      query: $term
      types: [PRODUCT]
      first: $first
      after: $after
      sortKey: $sortKey
      reverse: $reverse
      unavailableProducts: SHOW
    ) {
      nodes {
        ... on Product {
          ...SearchProduct
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
  ${SEARCH_PRODUCT_FRAGMENT}
` as const;

const SEARCH_ARTICLES_QUERY = `#graphql
  query SearchArticles(
    $country: CountryCode
    $language: LanguageCode
    $term: String!
    $first: Int!
    $after: String
  ) @inContext(country: $country, language: $language) {
    articles: search(
      query: $term
      types: [ARTICLE]
      first: $first
      after: $after
    ) {
      nodes {
        ... on Article {
          ...SearchArticle
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
  ${SEARCH_ARTICLE_FRAGMENT}
` as const;

const PREDICTIVE_SEARCH_ARTICLE_FRAGMENT = `#graphql
  fragment PredictiveArticle on Article {
    __typename
    id
    title
    handle
    blog {
      handle
    }
    image {
      url
      altText
      width
      height
    }
    trackingParameters
  }
` as const;

const PREDICTIVE_SEARCH_COLLECTION_FRAGMENT = `#graphql
  fragment PredictiveCollection on Collection {
    __typename
    id
    title
    handle
    image {
      url
      altText
      width
      height
    }
    trackingParameters
    products(first: 1) {
      nodes {
        id
        availableForSale
      }
    }
  }
` as const;

const PREDICTIVE_SEARCH_PAGE_FRAGMENT = `#graphql
  fragment PredictivePage on Page {
    __typename
    id
    title
    handle
    trackingParameters
  }
` as const;

const PREDICTIVE_SEARCH_PRODUCT_FRAGMENT = `#graphql
  fragment PredictiveProduct on Product {
    __typename
    id
    title
    handle
    availableForSale
    trackingParameters
    selectedOrFirstAvailableVariant(
      selectedOptions: []
      ignoreUnknownOptions: true
      caseInsensitiveMatch: true
    ) {
      id
      image {
        url
        altText
        width
        height
      }
      price {
        amount
        currencyCode
      }
      compareAtPrice {
        amount
        currencyCode
      }
    }
  }
` as const;

const PREDICTIVE_SEARCH_QUERY_FRAGMENT = `#graphql
  fragment PredictiveQuery on SearchQuerySuggestion {
    __typename
    text
    styledText
    trackingParameters
  }
` as const;

const PREDICTIVE_SEARCH_QUERY = `#graphql
  query PredictiveSearch(
    $country: CountryCode
    $language: LanguageCode
    $limit: Int!
    $limitScope: PredictiveSearchLimitScope!
    $term: String!
    $types: [PredictiveSearchType!]
  ) @inContext(country: $country, language: $language) {
    predictiveSearch(
      limit: $limit
      limitScope: $limitScope
      query: $term
      types: $types
      unavailableProducts: SHOW
    ) {
      articles {
        ...PredictiveArticle
      }
      collections {
        ...PredictiveCollection
      }
      pages {
        ...PredictivePage
      }
      products {
        ...PredictiveProduct
      }
      queries {
        ...PredictiveQuery
      }
    }
  }
  ${PREDICTIVE_SEARCH_ARTICLE_FRAGMENT}
  ${PREDICTIVE_SEARCH_COLLECTION_FRAGMENT}
  ${PREDICTIVE_SEARCH_PAGE_FRAGMENT}
  ${PREDICTIVE_SEARCH_PRODUCT_FRAGMENT}
  ${PREDICTIVE_SEARCH_QUERY_FRAGMENT}
` as const;

function escapeSearchTerm(term: string): string {
    return term.replace(/[:\\()"'*-]/g, "\\$&");
}

function buildCollectionsQuery(term: string): string {
    const trimmedTerm = term.trim();
    if (!trimmedTerm) return "";

    const escapedTerm = escapeSearchTerm(trimmedTerm);
    return `title:${escapedTerm}*`;
}

async function fetchCollections(
    dataAdapter: Route.LoaderArgs["context"]["dataAdapter"],
    term: string
): Promise<{nodes: SearchCollection[]; totalCount: number}> {
    const emptyResult = {nodes: [], totalCount: 0};

    const query = buildCollectionsQuery(term);
    if (!query) return emptyResult;

    try {
        const result = await dataAdapter.query(SEARCH_COLLECTIONS_QUERY, {
            variables: {
                query,
                first: 20
            }
        });

        const {collections} = result as {
            collections: {
                nodes: Array<SearchCollection>;
                totalCount: number | string;
            };
        };

        return {
            nodes: collections.nodes,
            totalCount: Number(collections.totalCount)
        };
    } catch (error) {
        console.error("Collections search failed:", error);
        return emptyResult;
    }
}

async function regularSearch({
    request,
    context
}: Pick<Route.LoaderArgs, "request" | "context">): Promise<CategorizedSearchResult> {
    const {dataAdapter} = context;
    const url = new URL(request.url);
    const term = String(url.searchParams.get("q") || "");

    if (!term.trim()) {
        return {
            type: "categorized",
            term: "",
            products: {
                nodes: [],
                pageInfo: {hasNextPage: false, endCursor: null},
                totalCount: 0
            },
            collections: {
                nodes: [],
                totalCount: 0
            },
            articles: {
                nodes: [],
                pageInfo: {hasNextPage: false, endCursor: null},
                totalCount: 0
            }
        };
    }

    const emptyFallback: CategorizedSearchResult = {
        type: "categorized",
        term,
        products: {nodes: [], pageInfo: {hasNextPage: false, endCursor: null}, totalCount: 0},
        collections: {nodes: [], totalCount: 0},
        articles: {nodes: [], pageInfo: {hasNextPage: false, endCursor: null}, totalCount: 0}
    };

    // SearchSortKeys only supports PRICE and RELEVANCE — use search-specific lookup
    const searchSortOption = getSearchSortOption(url.searchParams.get("sort"));

    try {
        const [searchResult, collectionsResult] = await Promise.all([
            dataAdapter.query(SEARCH_QUERY, {
                variables: {
                    term,
                    productFirst: 24,
                    articleFirst: 12,
                    sortKey: searchSortOption.sortKey,
                    reverse: searchSortOption.reverse
                },
                cache: dataAdapter.CacheShort()
            }),
            fetchCollections(dataAdapter, term)
        ]);

        const {products, articles, errors} = searchResult as {
            products: CategorizedSearchResult["products"];
            articles: CategorizedSearchResult["articles"];
            errors?: Array<{message: string}>;
        };

        const error = errors ? errors.map(({message}) => message).join(", ") : undefined;
        const sortedProducts = sortWithPinnedFirst(products.nodes as SearchProduct[]);

        return {
            type: "categorized",
            term,
            error,
            products: {
                nodes: sortedProducts,
                pageInfo: {
                    hasNextPage: products.pageInfo.hasNextPage,
                    endCursor: products.pageInfo.endCursor ?? null
                },
                totalCount: Number(products.totalCount || 0)
            },
            collections: collectionsResult,
            articles: {
                nodes: articles.nodes as SearchArticle[],
                pageInfo: {
                    hasNextPage: articles.pageInfo.hasNextPage,
                    endCursor: articles.pageInfo.endCursor ?? null
                },
                totalCount: Number(articles.totalCount || 0)
            }
        };
    } catch (error) {
        console.error("Search query failed:", error);
        return {
            ...emptyFallback,
            error: "Search is temporarily unavailable. Please try again."
        };
    }
}

async function fetchMoreProducts({
    request,
    context
}: Pick<Route.LoaderArgs, "request" | "context">): Promise<FetcherResult> {
    const {dataAdapter} = context;
    const url = new URL(request.url);
    const term = String(url.searchParams.get("q") || "");
    const cursor = url.searchParams.get("cursor");

    // Sort param is preserved in fetch URL by InfiniteScrollGrid via useSearchParams
    const searchSortOption = getSearchSortOption(url.searchParams.get("sort"));

    const {products} = (await dataAdapter.query(SEARCH_PRODUCTS_QUERY, {
        variables: {
            term,
            first: 24,
            after: cursor,
            sortKey: searchSortOption.sortKey,
            reverse: searchSortOption.reverse
        },
        cache: dataAdapter.CacheShort()
    })) as {
        products: {
            nodes: SearchProduct[];
            pageInfo: {hasNextPage: boolean; endCursor: string | null};
        };
    };

    const sortedProducts = sortWithPinnedFirst(products.nodes);

    return {
        products: sortedProducts,
        pageInfo: {
            hasNextPage: products.pageInfo.hasNextPage,
            endCursor: products.pageInfo.endCursor
        }
    };
}

async function fetchMoreArticles({
    request,
    context
}: Pick<Route.LoaderArgs, "request" | "context">): Promise<FetcherResult> {
    const {dataAdapter} = context;
    const url = new URL(request.url);
    const term = String(url.searchParams.get("q") || "");
    const cursor = url.searchParams.get("cursor");

    const {articles} = (await dataAdapter.query(SEARCH_ARTICLES_QUERY, {
        variables: {
            term,
            first: 12,
            after: cursor
        }
    })) as {
        articles: {
            nodes: SearchArticle[];
            pageInfo: {hasNextPage: boolean; endCursor: string | null};
        };
    };

    return {
        products: articles.nodes,
        pageInfo: {
            hasNextPage: articles.pageInfo.hasNextPage,
            endCursor: articles.pageInfo.endCursor
        }
    };
}

function getEmptyPredictiveSearchResult() {
    return {
        total: 0,
        items: {
            articles: [],
            collections: [],
            products: [],
            pages: [],
            queries: []
        }
    };
}

/**
 * Derives the store's public origin URL from environment variables.
 * Used to build absolute product URLs in UCP responses for agent consumers.
 */
function getStoreUrl(env: { PUBLIC_STORE_DOMAIN?: string }): string {
    const domain = env.PUBLIC_STORE_DOMAIN;
    return domain ? `https://${domain}` : "";
}

async function predictiveSearch({
    request,
    context
}: Pick<Route.LoaderArgs, "request" | "context">): Promise<PredictiveSearchResult> {
    const {dataAdapter} = context;
    const url = new URL(request.url);
    const term = String(url.searchParams.get("q") || "").trim();
    const limit = Number(url.searchParams.get("limit") || 10);

    if (!term) {
        return {
            type: "predictive",
            term,
            result: getEmptyPredictiveSearchResult()
        } as PredictiveSearchResult;
    }

    try {
        const {predictiveSearch: items, errors} = (await dataAdapter.query(PREDICTIVE_SEARCH_QUERY, {
            variables: {
                limit,
                limitScope: "EACH",
                term
            }
        })) as {
            predictiveSearch: PredictiveSearchResult["result"]["items"] | null;
            errors?: Array<{message: string}>;
        };

        if (errors || !items) {
            console.error("Predictive search failed:", errors?.map(e => e.message).join(", ") ?? "No data returned");
            return {
                type: "predictive",
                term,
                result: getEmptyPredictiveSearchResult()
            } as PredictiveSearchResult;
        }

        const filteredItems = {
            ...items,
            collections: items.collections.filter(collection =>
                collection.products?.nodes?.some(product => product.availableForSale)
            )
        };

        const total = Object.values(filteredItems).reduce((acc, item) => acc + item.length, 0);

        return {
            type: "predictive",
            term,
            result: {
                items: filteredItems,
                total
            }
        };
    } catch (error) {
        console.error("Predictive search query failed:", error);
        return {
            type: "predictive",
            term,
            result: getEmptyPredictiveSearchResult()
        } as PredictiveSearchResult;
    }
}

function AgentSearchResults({term, products}: {term: string; products: SearchProduct[]}) {
    const scriptRef = React.useRef<HTMLScriptElement | null>(null);

    React.useEffect(() => {
        const jsonLd = {
            "@context": "https://schema.org",
            "@type": "ItemList",
            "name": term ? `Search results for "${term}"` : "Search Results",
            "numberOfItems": products.length,
            "itemListElement": products.map((p, i) => ({
                "@type": "ListItem",
                "position": i + 1,
                "item": {
                    "@type": "Product",
                    "name": p.title,
                    "url": `/products/${p.handle}`,
                    ...(p.featuredImage?.url ? {image: p.featuredImage.url} : {}),
                    "offers": {
                        "@type": "Offer",
                        "price": p.priceRange.minVariantPrice.amount,
                        "priceCurrency": p.priceRange.minVariantPrice.currencyCode,
                        "availability": p.availableForSale
                            ? "https://schema.org/InStock"
                            : "https://schema.org/OutOfStock"
                    }
                }
            }))
        };

        const existing = document.getElementById("agent-search-ld");
        if (existing) existing.remove();

        const el = document.createElement("script");
        el.id = "agent-search-ld";
        el.type = "application/ld+json";
        el.textContent = JSON.stringify(jsonLd);
        document.head.appendChild(el);
        scriptRef.current = el;

        return () => {
            scriptRef.current?.remove();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [products.length, term]);

    return (
        <div className="min-h-screen bg-background font-mono text-foreground">
            <div className="mx-auto max-w-2xl px-4 py-10">
                {/* Header */}
                <div className="mb-8 flex items-center gap-2 border-b border-border pb-4">
                    <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                        Agent Search Results
                    </span>
                    {term && (
                        <span className="ml-auto text-[11px] text-muted-foreground">
                            &ldquo;{term}&rdquo; &mdash; {products.length} products
                        </span>
                    )}
                </div>

                {products.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No products found.</p>
                ) : (
                    <div className="border border-border">
                        <div className="grid grid-cols-12 border-b border-border bg-muted/30 px-3 py-1.5">
                            <span className="col-span-7 text-[10px] uppercase tracking-widest text-muted-foreground">Product</span>
                            <span className="col-span-3 text-right text-[10px] uppercase tracking-widest text-muted-foreground">Price</span>
                            <span className="col-span-2 text-right text-[10px] uppercase tracking-widest text-muted-foreground">Stock</span>
                        </div>
                        {products.map(p => (
                            <div
                                key={p.id}
                                className="grid grid-cols-12 items-center border-b border-border/50 px-3 py-2.5 last:border-b-0"
                            >
                                <div className="col-span-7 min-w-0 pr-3">
                                    <div className="truncate text-xs font-medium">{p.title}</div>
                                    <div className="truncate text-[10px] text-muted-foreground">{p.handle}</div>
                                </div>
                                <div className="col-span-3 text-right text-xs tabular-nums">
                                    {p.priceRange.minVariantPrice.amount !== p.priceRange.maxVariantPrice.amount
                                        ? `${p.priceRange.minVariantPrice.amount}–${p.priceRange.maxVariantPrice.amount}`
                                        : p.priceRange.minVariantPrice.amount}{" "}
                                    <span className="text-[9px] text-muted-foreground">
                                        {p.priceRange.minVariantPrice.currencyCode}
                                    </span>
                                </div>
                                <div className="col-span-2 text-right text-[10px]">
                                    {p.availableForSale ? (
                                        <span className="text-foreground">yes</span>
                                    ) : (
                                        <span className="text-muted-foreground/50">no</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
