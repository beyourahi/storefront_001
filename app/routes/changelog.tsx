import {getSeoMeta} from "@shopify/hydrogen";
import {useState, useMemo, useEffect} from "react";
import {useLoaderData} from "react-router";
import {Search} from "lucide-react";
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
            description:
                "See what's new. We're constantly improving your shopping experience — here's a plain-language look at everything we've shipped.",
            url: buildCanonicalUrl("/changelog", siteUrl)
        }) ?? []),
        ...getRequiredSocialMeta("website", brandName)
    ];
};

// ── Loader ────────────────────────────────────────────────────────────────────

// Module-level cache — persists within a Worker isolate to reduce API calls.
let _ghCountCache: {value: number; ts: number} | null = null;

export const loader = async ({}: Route.LoaderArgs) => {
    // Fetch total git commit count via the Link-header pagination trick:
    // per_page=1 triggers a Link header whose rel="last" page number equals the total.
    const token = "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";
    let commitCount: number | null = null;
    const now = Date.now();
    if (_ghCountCache && now - _ghCountCache.ts < 3_600_000) {
        commitCount = _ghCountCache.value;
    } else {
        try {
            const headers: Record<string, string> = {
                Accept: "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28",
                "User-Agent": "storefront_001/1.0"
            };
            if (token) headers.Authorization = `Bearer ${token}`;
            const res = await fetch("https://api.github.com/repos/beyourahi/storefront_001/commits?per_page=1", {
                headers
            });
            if (res.ok) {
                const match = (res.headers.get("link") ?? "").match(/<[^>]*[?&]page=(\d+)[^>]*>;\s*rel="last"/);
                if (match) {
                    commitCount = parseInt(match[1], 10);
                    _ghCountCache = {value: commitCount, ts: now};
                }
            }
        } catch {
            // Non-critical — page renders without the count
        }
    }
    return {entries: CHANGELOG_ENTRIES, commitCount};
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

interface DateGroup {
    date: string;
    entries: ChangelogEntry[];
}

/**
 * Groups an ordered array of entries by their `date` field, preserving
 * insertion order (newest-first, as CHANGELOG_ENTRIES is authored).
 */
function groupEntriesByDate(entries: ChangelogEntry[]): DateGroup[] {
    const map = new Map<string, ChangelogEntry[]>();
    for (const entry of entries) {
        const existing = map.get(entry.date);
        if (existing) existing.push(entry);
        else map.set(entry.date, [entry]);
    }
    return Array.from(map.entries()).map(([date, groupEntries]) => ({date, entries: groupEntries}));
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
                {/* Metadata: category badge only — date lives in the sticky group header */}
                <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span
                        className={cn(
                            "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                            getCategoryBadgeClasses(entry.category)
                        )}
                    >
                        {entry.category}
                    </span>
                </div>

                {/* Headline — font-serif for premium feel */}
                <h3 className="mb-2 font-serif text-base sm:text-lg font-semibold leading-snug text-foreground">
                    {entry.headline}
                </h3>

                {/* Summary — pre-truncated, no toggle */}
                <p className="text-sm leading-relaxed text-muted-foreground">{truncateSummary(entry.summary)}</p>

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
            <h2 className="mb-2 text-xl font-semibold">{hasFilters ? "No updates found" : "Nothing here yet"}</h2>
            <p className="max-w-sm text-sm text-muted-foreground">
                {hasFilters
                    ? "Try adjusting your filter to find what you're looking for."
                    : "We haven't shipped any notable updates yet. Check back soon!"}
            </p>
        </div>
    );
}

// ── Page Component ────────────────────────────────────────────────────────────

export default function Changelog() {
    const {entries, commitCount} = useLoaderData<typeof loader>();

    const [selectedCategory, setSelectedCategory] = useState<Category>("All");
    const [visibleCount, setVisibleCount] = useState(100);

    // Reset pagination when category changes
    useEffect(() => {
        setVisibleCount(100);
    }, [selectedCategory]);

    const filtered = useMemo(() => {
        if (selectedCategory === "All") return entries;
        return entries.filter(e => e.category === selectedCategory);
    }, [entries, selectedCategory]);

    const visible = filtered.slice(0, visibleCount);
    const hasMore = visibleCount < filtered.length;
    const hasFilters = selectedCategory !== "All";

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Breadcrumb */}
            <div className="px-2 pt-4 pb-2 md:px-4">
                <Breadcrumbs className="mx-auto max-w-[2000px]" items={[{label: "Changelog"}]} />
            </div>

            {/* ── Hero ── */}
            <AnimatedSection animation="fade" threshold={0.08}>
                <section className="py-10">
                    <div className="mx-auto max-w-[2000px] px-2 md:px-4">
                        <div className="flex w-full flex-col items-center justify-center gap-3 text-center xl:gap-5">
                            <GiantText text="Changelog" className={cn("w-full font-black", "lg:w-[60%]")} />
                            <p className="w-full text-xs text-muted-foreground lg:w-[60%] lg:text-sm 2xl:text-base">
                                We&apos;re constantly improving your shopping experience. Here&apos;s what we&apos;ve
                                shipped.
                            </p>
                            {commitCount !== null && (
                                <div className="flex flex-col items-center gap-3">
                                    <div className="flex items-center gap-2.5" aria-hidden="true">
                                        <div className="h-px w-24 bg-gradient-to-r from-transparent to-primary/55" />
                                        <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-primary ring-[3px] ring-primary/20" />
                                        <div className="h-px w-24 bg-gradient-to-l from-transparent to-primary/55" />
                                    </div>
                                    <p className="flex flex-col items-center gap-1.5">
                                        <data
                                            value={commitCount}
                                            className="text-4xl sm:text-5xl font-black tabular-nums tracking-tight text-primary"
                                        >
                                            {commitCount.toLocaleString()}
                                        </data>
                                        <span className="font-mono text-xs tracking-[0.2em] uppercase text-muted-foreground/65">
                                            updates shipped so far
                                        </span>
                                    </p>
                                    <div className="flex items-center gap-2.5" aria-hidden="true">
                                        <div className="h-px w-24 bg-gradient-to-r from-transparent to-primary/55" />
                                        <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-primary ring-[3px] ring-primary/20" />
                                        <div className="h-px w-24 bg-gradient-to-l from-transparent to-primary/55" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </AnimatedSection>

            {/* ── Feed ── */}
            <AnimatedSection animation="slide-up" threshold={0}>
                <div className="mx-auto max-w-5xl px-2 pb-20 md:px-4">
                    {/* ── Category filter chips ── */}
                    <div className="mb-8">
                        <div
                            className="flex flex-wrap justify-center gap-2"
                            role="group"
                            aria-label="Filter by category"
                        >
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setSelectedCategory(cat)}
                                    aria-pressed={selectedCategory === cat}
                                    className={cn(
                                        "rounded-full border px-4 py-2 text-sm font-medium sleek transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
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
                            {/* Timeline — entries grouped by date.
                                Each group owns ONE sticky date header, ONE dot, and ONE continuous vertical
                                line. The sticky header parks below the fixed navbar using --total-header-height.
                                IIFE scopes globalStaggerIndex so animation delays are continuous
                                across all date groups rather than resetting per group. */}
                            <div>
                                {(() => {
                                    let globalStaggerIndex = 0;
                                    return groupEntriesByDate(visible).map(group => {
                                        return (
                                        <div key={group.date} className="mb-10 sm:mb-12 lg:flex">
                                            {/* Mobile sticky date header — full-width, sticks below the navbar.
                                                Uses negative margin to bleed to padding edges so the background
                                                covers content scrolling behind it. Hidden on desktop where the
                                                side column handles date display. */}
                                            <div className="sticky top-(--total-header-height) z-20 -mx-2 bg-background px-2 py-2 md:-mx-4 md:px-4 lg:hidden">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-xs text-muted-foreground">
                                                        <time dateTime={group.date}>{getAbsoluteDate(group.date)}</time>
                                                        {" · "}
                                                        {getRelativeDate(group.date)}
                                                    </span>
                                                    <span className="shrink-0 inline-flex items-center rounded-full border border-border/40 bg-muted/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground/70 tabular-nums">
                                                        {group.entries.length}{" "}
                                                        {group.entries.length === 1 ? "update" : "updates"}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Desktop date column — sticky side column, sticks below the navbar.
                                                self-start prevents flex stretch so the sticky constraint activates
                                                correctly: the element can slide up to top-(--total-header-height)
                                                and releases when the group container's bottom passes it. */}
                                            <div className="hidden lg:flex lg:w-44 lg:shrink-0 lg:flex-col lg:items-end lg:pr-8 lg:pt-1.5 lg:sticky lg:top-(--total-header-height) lg:self-start lg:z-20">
                                                <time
                                                    dateTime={group.date}
                                                    className="text-right text-xs font-mono font-medium leading-tight text-foreground"
                                                >
                                                    {getAbsoluteDate(group.date)}
                                                </time>
                                                <span className="mt-0.5 text-right text-xs text-muted-foreground">
                                                    {getRelativeDate(group.date)}
                                                </span>
                                                <span className="mt-2 inline-flex items-center rounded-full border border-border/40 bg-muted/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground/70 tabular-nums">
                                                    {group.entries.length}{" "}
                                                    {group.entries.length === 1 ? "update" : "updates"}
                                                </span>
                                            </div>

                                            {/* Single vertical line + single dot span the full group */}
                                            <div className="relative flex-1 lg:border-l-2 lg:border-border/40 lg:pl-8">
                                                {/* Timeline dot — once per group */}
                                                <div
                                                    className="hidden lg:block absolute -left-[7px] top-4 h-3 w-3 rounded-full bg-primary ring-4 ring-background"
                                                    aria-hidden="true"
                                                />
                                                <div className="space-y-5 lg:space-y-6">
                                                    {group.entries.map(entry => (
                                                        <ChangelogCard
                                                            key={`${entry.date}-${entry.headline}`}
                                                            entry={entry}
                                                            index={globalStaggerIndex++}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        );
                                    });
                                })()}
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
