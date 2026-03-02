import {CommandEmpty} from "~/components/ui/command";
import {SearchProductGroup} from "~/components/layout/search/SearchProductGroup";
import {SearchCollectionGroup} from "~/components/layout/search/SearchCollectionGroup";
import {SearchPolicyGroup} from "~/components/layout/search/SearchPolicyGroup";
import {SearchArticleGroup} from "~/components/layout/search/SearchArticleGroup";
import {SearchPageGroup} from "~/components/layout/search/SearchPageGroup";
import {SearchSuggestionGroup} from "~/components/layout/search/SearchSuggestionGroup";

type ShopifyMoney = {
    amount: string;
    currencyCode: string;
};

type SearchProduct = {
    id: string;
    title: string;
    handle: string;
    priceRange?: {
        minVariantPrice: ShopifyMoney;
        maxVariantPrice?: ShopifyMoney;
    };
    variants?: {
        edges: {node: {compareAtPrice: ShopifyMoney | null}}[];
    };
    images?: {
        edges: {node: {url: string; altText: string | null}}[];
    };
};

type SearchCollection = {
    id: string;
    title: string;
    handle: string;
    image?: {url: string; altText: string | null} | null;
};

type SearchArticle = {
    id: string;
    title: string;
    handle: string;
    image?: {url: string; altText: string | null} | null;
    blog?: {handle: string; title: string} | null;
};

type SearchPage = {
    id: string;
    title: string;
    handle: string;
};

type SearchSuggestion = {
    text: string;
};

type PolicyItem = {
    id: string;
    title: string;
    description: string;
    href: string;
};

type SearchResultsProps = {
    query: string;
    loading?: boolean;
    filteredProducts: SearchProduct[];
    filteredCollections: SearchCollection[];
    filteredArticles: SearchArticle[];
    filteredPages: SearchPage[];
    filteredSuggestions: SearchSuggestion[];
    filteredPolicies: PolicyItem[];
    onProductClick: (product: SearchProduct, event?: React.MouseEvent) => void;
    onCollectionClick: (collection: SearchCollection, event?: React.MouseEvent) => void;
    onArticleClick: (article: SearchArticle, event?: React.MouseEvent) => void;
    onPageClick: (page: SearchPage, event?: React.MouseEvent) => void;
    onSuggestionClick: (suggestion: SearchSuggestion, event?: React.MouseEvent) => void;
    onPolicyClick: (policy: PolicyItem, event?: React.MouseEvent) => void;
};

const LoadingDots = () => (
    <div className="flex flex-col items-center justify-center gap-3">
        <div className="flex items-center justify-center gap-1">
            <div className="bg-primary animate-pulse h-4 w-4 rounded-full search-dot-1" />
            <div className="bg-primary animate-pulse h-4 w-4 rounded-full search-dot-2" />
            <div className="bg-primary animate-pulse h-4 w-4 rounded-full search-dot-3" />
        </div>
        <p className="text-muted-foreground select-none text-sm font-medium tracking-wide">Searching...</p>
    </div>
);

export const SearchResults = ({
    query,
    loading = false,
    filteredProducts,
    filteredCollections,
    filteredArticles,
    filteredPages,
    filteredSuggestions,
    filteredPolicies,
    onProductClick,
    onCollectionClick,
    onArticleClick,
    onPageClick,
    onSuggestionClick,
    onPolicyClick
}: SearchResultsProps) => {
    const hasResults =
        filteredProducts.length > 0 ||
        filteredCollections.length > 0 ||
        filteredArticles.length > 0 ||
        filteredPages.length > 0 ||
        filteredSuggestions.length > 0 ||
        filteredPolicies.length > 0;

    if (!query.trim()) return null;

    if (loading || !hasResults) {
        return (
            <CommandEmpty className="py-8">
                {loading ? (
                    <LoadingDots />
                ) : (
                    <div className="text-muted-foreground text-sm">
                        No results found for &quot;{query}&quot;.
                        <br />
                        <span className="text-xs">Try a different search term.</span>
                    </div>
                )}
            </CommandEmpty>
        );
    }

    return (
        <>
            {filteredSuggestions.length > 0 && (
                <SearchSuggestionGroup suggestions={filteredSuggestions} onSuggestionClick={onSuggestionClick} />
            )}

            {filteredCollections.length > 0 && (
                <SearchCollectionGroup collections={filteredCollections} onCollectionClick={onCollectionClick} />
            )}

            {filteredPages.length > 0 && <SearchPageGroup pages={filteredPages} onPageClick={onPageClick} />}

            {filteredArticles.length > 0 && (
                <SearchArticleGroup articles={filteredArticles} onArticleClick={onArticleClick} />
            )}

            {filteredPolicies.length > 0 && (
                <SearchPolicyGroup policies={filteredPolicies} onPolicyClick={onPolicyClick} />
            )}

            {filteredProducts.length > 0 && (
                <SearchProductGroup products={filteredProducts} onProductClick={onProductClick} />
            )}
        </>
    );
};
