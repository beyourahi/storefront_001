import * as React from "react";
import {Link, useFetcher} from "react-router";
import {SearchX} from "lucide-react";

/**
 * Empty state shown when a search yields no results.
 * Fetches predictive suggestions via useFetcher to offer alternative queries
 * without blocking the main render. Suggestions render as pill links once loaded.
 */
export function SearchEmptyState({term}: {term: string}) {
    // Fetch predictive suggestions to offer alternative queries when no results are found.
    // Uses useFetcher so the request is non-blocking and doesn't affect the main page render.
    const fetcher = useFetcher<{queries?: {text: string; styledText: string}[]}>();

    React.useEffect(() => {
        if (term) {
            void fetcher.load(`/search?predictive=true&q=${encodeURIComponent(term)}`);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [term]);

    // Show up to 3 alternative suggestions; gracefully shows nothing if fetch is pending or empty
    const suggestions = fetcher.data?.queries?.slice(0, 3) ?? [];

    return (
        <div className="px-4 py-10 text-center sm:py-16">
            <div className="bg-[var(--brand-primary-subtle)] mb-4 inline-flex rounded-full p-4 shadow-sm backdrop-blur-sm">
                <SearchX className="text-primary size-6" />
            </div>
            <h2 className="mb-2 text-2xl font-bold tracking-tight text-foreground sm:mb-3 sm:text-3xl">
                No results found
            </h2>
            <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground sm:max-w-md sm:text-base">
                We couldn&apos;t find anything for &ldquo;{term}&rdquo;.
            </p>
            <p className="mt-2 text-sm text-muted-foreground/80">
                Try a different search term or browse our collections.
            </p>
            {suggestions.length > 0 && (
                <div className="mt-6">
                    <p className="mb-3 text-xs font-medium uppercase tracking-widest text-muted-foreground/70">
                        Try searching for
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                        {suggestions.map(suggestion => (
                            <Link
                                key={suggestion.text}
                                to={`/search?q=${encodeURIComponent(suggestion.text)}`}
                                className="inline-flex items-center rounded-full border border-[var(--brand-primary)]/30 bg-[var(--brand-primary-subtle)] px-4 py-1.5 text-sm font-medium text-[var(--brand-primary)] transition-colors hover:bg-[var(--brand-primary)] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:ring-offset-2"
                            >
                                {suggestion.text}
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
