import {getSeoMeta} from "@shopify/hydrogen";
import {useState, useMemo, useEffect} from "react";
import {useLoaderData} from "react-router";
import {Search, ExternalLink} from "lucide-react";
import {Breadcrumbs} from "~/components/common/Breadcrumbs";
import {GiantText} from "~/components/common/GiantText";
import {AnimatedSection} from "~/components/sections/AnimatedSection";
import {cn} from "~/lib/utils";
import {buildCanonicalUrl, getBrandNameFromMatches, getRequiredSocialMeta, getSiteUrlFromMatches} from "~/lib/seo";
import {CHANGELOG_ENTRIES, type ChangelogEntry} from "~/lib/changelog-data";
import type {Route} from "./+types/changelog";

// ── Meta ──────────────────────────────────────────────────────────────────────

export const meta: Route.MetaFunction = ({matches}) => {
    const siteUrl = getSiteUrlFromMatches(matches);
    const brandName = getBrandNameFromMatches(matches);
    return [
        ...(getSeoMeta({
            title: `Changelog | ${brandName}`,
            description: "See what's new. We're constantly improving your shopping experience — here's a plain-language look at everything we've shipped.",
            url: buildCanonicalUrl("/changelog", siteUrl)
        }) ?? []),
        ...getRequiredSocialMeta("website", brandName)
    ];
};

// ── Loader ────────────────────────────────────────────────────────────────────

export const loader = async () => {
    return {entries: CHANGELOG_ENTRIES};
};

// ── Constants & Helpers ───────────────────────────────────────────────────────

const CHANGELOG_AUTHOR = {name: "Rahi Khan", url: "https://beyourahi.com"} as const;

const CATEGORIES = ["All", "New Feature", "Improvement", "Fix", "Maintenance"] as const;
type Category = (typeof CATEGORIES)[number];

function parseLocalDate(dateStr: string): Date {
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day); // local midnight — avoids UTC-offset shift
}

function getRelativeDate(dateStr: string): string {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((today.getTime() - parseLocalDate(dateStr).getTime()) / 86_400_000);
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    const weeks = Math.floor(diffDays / 7);
    if (diffDays < 30) return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;
    const months = Math.floor(diffDays / 30);
    if (diffDays < 365) return `${months} ${months === 1 ? "month" : "months"} ago`;
    const years = Math.floor(diffDays / 365);
    return `${years} ${years === 1 ? "year" : "years"} ago`;
}

function getAbsoluteDate(dateStr: string): string {
    return parseLocalDate(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}

function truncateSummary(text: string, maxLength = 240): string {
    if (text.length <= maxLength) return text;
    const cut = text.lastIndexOf(" ", maxLength);
    return text.slice(0, cut > 0 ? cut : maxLength) + "…";
}

function getCategoryBadgeClasses(category: ChangelogEntry["category"]): string {
    switch (category) {
        case "New Feature":
            return "bg-primary/10 text-primary border-primary/20";
        case "Improvement":
            return "bg-success/10 text-success border-success/20";
        case "Fix":
            return "bg-warning/10 text-warning border-warning/20";
        case "Maintenance":
            return "bg-muted text-muted-foreground border-border";
        default:
            return "bg-muted text-muted-foreground border-border";
    }
}

function getCategoryAccentBorder(category: ChangelogEntry["category"]): string {
    switch (category) {
        case "New Feature":
            return "border-l-primary";
        case "Improvement":
            return "border-l-success";
        case "Fix":
            return "border-l-warning";
        case "Maintenance":
            return "border-l-border";
        default:
            return "border-l-border";
    }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ChangelogCard({entry, index}: {entry: ChangelogEntry; index: number}) {
    return (
        <article
            className={cn(
                "animate-in fade-in group rounded-xl border border-border/50 bg-card",
                "overflow-hidden shadow-xs hover:shadow-md motion-surface",
                "border-l-4",
                getCategoryAccentBorder(entry.category)
            )}
            style={{animationDelay: `${Math.min(index, 7) * 50}ms`}}
        >
            <div className="p-5 sm:p-6">
                {/* Metadata: badge + date */}
                <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span
                        className={cn(
                            "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                            getCategoryBadgeClasses(entry.category)
                        )}
                    >
                        {entry.category}
                    </span>
                    {/* Mobile-only date — desktop date lives in the timeline column */}
                    <span className="text-xs text-muted-foreground lg:hidden">
                        <time dateTime={entry.date}>{getAbsoluteDate(entry.date)}</time>
                        {" · "}{getRelativeDate(entry.date)}
                    </span>
                </div>

                {/* Headline — font-serif for premium feel */}
                <h3 className="mb-2 font-serif text-base sm:text-lg font-semibold leading-snug text-foreground">
                    {entry.headline}
                </h3>

                {/* Summary — pre-truncated, no toggle */}
                <p className="text-sm leading-relaxed text-muted-foreground">
                    {truncateSummary(entry.summary)}
                </p>

                {/* Author attribution */}
                <p className="mt-3 text-xs text-muted-foreground">
                    by{" "}
                    <a
                        href={CHANGELOG_AUTHOR.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-foreground/70 underline underline-offset-2 decoration-foreground/30 hover:text-primary hover:decoration-primary motion-link"
                    >
                        {CHANGELOG_AUTHOR.name}
                    </a>
                </p>
            </div>
        </article>
    );
}

function EmptyState({hasFilters}: {hasFilters: boolean}) {
    return (
        <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <h2 className="mb-2 text-xl font-semibold">
                {hasFilters ? "No updates found" : "Nothing here yet"}
            </h2>
            <p className="max-w-sm text-sm text-muted-foreground">
                {hasFilters
                    ? "Try adjusting your search or filter to find what you're looking for."
                    : "We haven't shipped any notable updates yet. Check back soon!"}
            </p>
        </div>
    );
}

// ── Page Component ────────────────────────────────────────────────────────────

export default function Changelog() {
    const {entries} = useLoaderData<typeof loader>();

    const [searchInput, setSearchInput] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<Category>("All");
    const [visibleCount, setVisibleCount] = useState(100);

    // Debounce search query — 200ms after user stops typing
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchQuery(searchInput);
            setVisibleCount(100);
        }, 200);
        return () => clearTimeout(timer);
    }, [searchInput]);

    // Reset pagination when category changes
    useEffect(() => {
        setVisibleCount(100);
    }, [selectedCategory]);

    const filtered = useMemo(() => {
        let result = entries;

        if (selectedCategory !== "All") {
            result = result.filter(e => e.category === selectedCategory);
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(
                e =>
                    e.headline.toLowerCase().includes(q) ||
                    e.summary.toLowerCase().includes(q) ||
                    e.category.toLowerCase().includes(q)
            );
        }

        return result;
    }, [entries, selectedCategory, searchQuery]);

    const visible = filtered.slice(0, visibleCount);
    const hasMore = visibleCount < filtered.length;
    const hasFilters = selectedCategory !== "All" || searchQuery.trim().length > 0;

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Breadcrumb */}
            <div className="px-2 pt-4 pb-2 md:px-4">
                <Breadcrumbs className="mx-auto max-w-[2000px]" items={[{label: "Changelog"}]} />
            </div>

            {/* ── Hero ── */}
            <AnimatedSection animation="fade" threshold={0.08}>
                <section className="py-8">
                    <div className="mx-auto max-w-[2000px] px-2 md:px-4">
                        <div className="flex w-full flex-col items-center justify-center gap-2 text-center xl:gap-4">
                            <GiantText
                                text="Changelog"
                                className={cn("w-full font-black", "lg:w-[45%]")}
                            />
                            <p className="w-full text-xs text-muted-foreground lg:w-[60%] lg:text-sm 2xl:text-base">
                                We&apos;re constantly improving your shopping experience. Here&apos;s what we&apos;ve shipped.
                            </p>

                            {/* Prominent "Built by" attribution — visually unmissable */}
                            <div className="mt-5 sm:mt-7 flex flex-col items-center gap-1.5">
                                <span className="text-xs uppercase tracking-widest text-muted-foreground">
                                    Built by
                                </span>
                                <a
                                    href={CHANGELOG_AUTHOR.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={cn(
                                        "group flex items-center gap-2 font-serif font-bold",
                                        "text-xl sm:text-2xl lg:text-3xl",
                                        "text-primary hover:text-primary/80",
                                        "border-b-2 border-primary/30 hover:border-primary pb-0.5",
                                        "sleek motion-link"
                                    )}
                                >
                                    {CHANGELOG_AUTHOR.name}
                                    <ExternalLink className="size-4 text-primary/50 group-hover:text-primary/80 sleek" aria-hidden="true" />
                                </a>
                            </div>
                        </div>
                    </div>
                </section>
            </AnimatedSection>

            {/* ── Feed ── */}
            <AnimatedSection animation="slide-up" threshold={0}>
                <div className="mx-auto max-w-[2000px] px-2 pb-20 md:px-4">
                    {/* ── Filters ── */}
                    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center">
                        {/* Search input */}
                        <div className="relative max-w-sm flex-1">
                            <Search
                                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                                aria-hidden="true"
                            />
                            <input
                                type="search"
                                placeholder="Search updates..."
                                value={searchInput}
                                onChange={e => setSearchInput(e.target.value)}
                                aria-label="Search changelog entries"
                                className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                            />
                        </div>

                        {/* Category filter chips */}
                        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setSelectedCategory(cat)}
                                    aria-pressed={selectedCategory === cat}
                                    className={cn(
                                        "rounded-full border px-3 py-1 text-xs font-medium sleek transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                        selectedCategory === cat
                                            ? "border-primary bg-primary text-primary-foreground shadow-sm"
                                            : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
                                    )}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ── Content ── */}
                    {visible.length === 0 ? (
                        <EmptyState hasFilters={hasFilters} />
                    ) : (
                        <>
                            {/* Timeline */}
                            <div className="space-y-5 lg:space-y-6">
                                {visible.map((entry, index) => (
                                    <div key={`${entry.date}-${entry.headline}`} className="lg:flex">
                                        {/* Date column (desktop only) */}
                                        <div className="hidden lg:flex lg:w-44 lg:shrink-0 lg:flex-col lg:items-end lg:pr-8 lg:pt-1.5">
                                            <time
                                                dateTime={entry.date}
                                                className="text-right text-xs font-mono font-medium leading-tight text-foreground"
                                            >
                                                {getAbsoluteDate(entry.date)}
                                            </time>
                                            <span className="mt-0.5 text-right text-xs text-muted-foreground">
                                                {getRelativeDate(entry.date)}
                                            </span>
                                        </div>

                                        {/* Card side — border-l creates the timeline line on desktop */}
                                        <div className="relative flex-1 lg:border-l-2 lg:border-border/40 lg:pl-8">
                                            {/* Timeline dot (desktop only) */}
                                            <div
                                                className="hidden lg:block absolute -left-[7px] top-4 h-3 w-3 rounded-full bg-primary ring-4 ring-background"
                                                aria-hidden="true"
                                            />
                                            <ChangelogCard entry={entry} index={index} />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Load more */}
                            {hasMore && (
                                <div className="mt-10 flex justify-center">
                                    <button
                                        type="button"
                                        onClick={() => setVisibleCount(c => c + 50)}
                                        className="w-full sm:w-auto rounded-md border border-border bg-background px-6 py-2.5 text-sm font-medium text-foreground sleek transition-all duration-150 hover:border-primary/30 hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    >
                                        Load more updates
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </AnimatedSection>
        </div>
    );
}

export {RouteErrorBoundary as ErrorBoundary} from "~/components/RouteErrorBoundary";
