/**
 * @fileoverview ProductReviews — Count-aware review layout for product detail pages
 *
 * @description
 * Reads `customer_review` metaobjects linked to the product via the
 * `custom.reviews` metafield (list.metaobject_reference). Renders an
 * aggregate summary + a layout that adapts intelligently to the review count:
 *
 *   solo     (1)   — centered featured card; editorial, not sparse
 *   pair     (2)   — balanced two-column grid; no orphan space
 *   trio     (3)   — equal 3-col on tablet; asymmetric featured on desktop
 *   carousel (4+)  — Embla carousel with accessible navigation and dot indicators
 *
 * The layout variant is derived from `reviews.length` in a single function
 * (getLayoutVariant). No thresholds are hardcoded in markup.
 * Review count is known at SSR time, so there is no layout shift.
 *
 * Fields expected per review node (from PRODUCT_FRAGMENT):
 *   reviewerName  — single_line_text_field
 *   rating        — rating type (JSON: {"scale_min":"1.0","scale_max":"5.0","value":"4.0"})
 *   reviewTitle   — single_line_text_field
 *   body          — multi_line_text_field
 *   date          — date field (ISO string "YYYY-MM-DD")
 *
 * Wrap this component in <AnimatedSection> at the call site.
 */

import {useState, useEffect} from "react";
import {cn} from "~/lib/utils";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselPrevious,
    CarouselNext,
    type CarouselApi
} from "~/components/ui/carousel";

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Parse Shopify's rating field value. The Storefront API returns it as either:
 *  - JSON string: {"scale_min":"1.0","scale_max":"5.0","value":"4.0"}
 *  - Plain number string: "4" (fallback)
 */
function parseRating(raw: string | null | undefined): number {
    if (!raw) return 0;
    try {
        const parsed = JSON.parse(raw) as {value?: string};
        return parseFloat(parsed.value ?? "0");
    } catch {
        return parseFloat(raw) || 0;
    }
}

function formatReviewDate(iso: string | null | undefined): string {
    if (!iso) return "";
    try {
        return new Intl.DateTimeFormat("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric"
        }).format(new Date(iso + "T00:00:00")); // force local midnight to avoid TZ-off-by-one
    } catch {
        return iso;
    }
}

function getReviewKey(review: ReviewNode, index: number): string {
    return `${review.reviewerName?.value ?? "anon"}-${review.date?.value ?? ""}-${index}`;
}

// =============================================================================
// TYPES
// =============================================================================

export type ReviewNode = {
    reviewerName: {value: string} | null;
    rating: {value: string} | null;
    reviewTitle: {value: string} | null;
    body: {value: string} | null;
    date: {value: string} | null;
};

/** Layout variant — determined solely by review count in getLayoutVariant(). */
type ReviewLayoutVariant = "solo" | "pair" | "trio" | "carousel";

/**
 * Single point of truth for layout variant selection.
 * No thresholds appear anywhere else in this component.
 */
function getLayoutVariant(count: number): ReviewLayoutVariant {
    if (count === 1) return "solo";
    if (count === 2) return "pair";
    if (count === 3) return "trio";
    return "carousel";
}

// =============================================================================
// STAR ROW
// =============================================================================

function StarRow({rating, max = 5, size = 14}: {rating: number; max?: number; size?: number}) {
    const filled = Math.round(rating);
    return (
        <div
            className="flex items-center gap-0.5"
            role="img"
            aria-label={`${filled} out of ${max} stars`}
        >
            {Array.from({length: max}, (_, i) => (
                <svg
                    key={i}
                    width={size}
                    height={size}
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                >
                    <path
                        d="M10 1.5L12.245 6.5L17.5 7.3L13.75 11L14.745 16.5L10 13.75L5.255 16.5L6.25 11L2.5 7.3L7.755 6.5L10 1.5Z"
                        fill={i < filled ? "var(--brand-accent)" : "none"}
                        stroke={i < filled ? "var(--brand-accent)" : "var(--border-strong)"}
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            ))}
        </div>
    );
}

// =============================================================================
// RATING BAR
// Renders one row of the rating distribution breakdown.
// Matches the storefront_002 sidebar pattern — star label, single star,
// filled progress bar, and a right-aligned count.
// =============================================================================

function RatingBar({label, count, total}: {label: string; count: number; total: number}) {
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    return (
        <div className="flex items-center gap-3 text-sm">
            <span className="w-4 shrink-0 text-right text-muted-foreground">{label}</span>
            <StarRow rating={parseInt(label, 10)} max={1} size={12} />
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{width: `${pct}%`, background: "var(--brand-accent)"}}
                />
            </div>
            <span className="w-5 shrink-0 text-right text-muted-foreground">{count}</span>
        </div>
    );
}

// =============================================================================
// REVIEW CARD
// Individual card — structure and internal styling unchanged from original.
// The className prop lets layout variants control sizing (h-full, flex-1, etc.)
// without touching the card's visual design.
// =============================================================================

function ReviewCard({
    review,
    index,
    className
}: {
    review: ReviewNode;
    index: number;
    className?: string;
}) {
    const rating = parseRating(review.rating?.value);
    const name = review.reviewerName?.value ?? "Anonymous";
    const title = review.reviewTitle?.value;
    const body = review.body?.value;
    const date = formatReviewDate(review.date?.value);
    const initials = name
        .split(" ")
        .slice(0, 2)
        .map(s => s[0]?.toUpperCase() ?? "")
        .join("");

    return (
        <article
            className={cn(
                "flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-sm",
                className
            )}
            style={{
                animationDelay: `${index * 50}ms`,
                animationFillMode: "both"
            }}
        >
            {/* Rating + date */}
            <div className="flex items-center justify-between gap-2">
                <StarRow rating={rating} size={14} />
                {date && (
                    <time
                        dateTime={review.date?.value ?? ""}
                        className="text-xs text-muted-foreground shrink-0"
                    >
                        {date}
                    </time>
                )}
            </div>

            {/* Title */}
            {title && (
                <p className="text-sm font-semibold leading-snug text-foreground">{title}</p>
            )}

            {/* Body */}
            {body && (
                <p className="text-sm leading-relaxed text-muted-foreground flex-1">{body}</p>
            )}

            {/* Reviewer */}
            <div className="flex items-center gap-2 mt-auto pt-3 border-t border-border">
                <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary"
                    aria-hidden="true"
                >
                    {initials || "?"}
                </div>
                <span className="text-xs font-medium text-foreground truncate">{name}</span>
            </div>
        </article>
    );
}

// =============================================================================
// LAYOUT: SOLO (1 review)
// Centered, max-w-2xl card — feels editorial and intentional, not lonely.
// A large decorative quotation mark anchors the card visually.
// =============================================================================

function ReviewLayoutSolo({reviews}: {reviews: ReviewNode[]}) {
    return (
        <div className="relative mx-auto max-w-2xl">
            {/* Decorative quotation mark — visual anchor so the lone card reads as a featured testimonial */}
            <span
                className="pointer-events-none absolute -top-4 -left-2 select-none text-7xl font-bold leading-none text-muted-foreground/15 sm:-left-4 sm:-top-6 sm:text-8xl"
                aria-hidden="true"
            >
                &#8220;
            </span>
            <ReviewCard review={reviews[0]} index={0} />
        </div>
    );
}

// =============================================================================
// LAYOUT: PAIR (2 reviews)
// Balanced two-column grid on sm+; single-column stack on mobile.
// No orphan space — exactly fills its row at every breakpoint.
// =============================================================================

function ReviewLayoutPair({reviews}: {reviews: ReviewNode[]}) {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {reviews.map((review, i) => (
                <ReviewCard key={getReviewKey(review, i)} review={review} index={i} />
            ))}
        </div>
    );
}

// =============================================================================
// LAYOUT: TRIO (3 reviews)
// Mobile:  1-column stack
// Tablet (md+): 3-column equal grid
// Desktop (lg+): asymmetric featured — first review spans full column height,
//                second and third stack in the adjacent column.
//
// Two discrete renderings (mobile/tablet hidden at lg, desktop hidden below lg)
// avoid conflicting Tailwind grid/flex class combinations across breakpoints.
// =============================================================================

function ReviewLayoutTrio({reviews}: {reviews: ReviewNode[]}) {
    return (
        <>
            {/* Mobile + tablet: responsive equal grid — hidden on large screens */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:hidden">
                {reviews.map((review, i) => (
                    <ReviewCard key={getReviewKey(review, i)} review={review} index={i} />
                ))}
            </div>

            {/* Desktop: asymmetric featured layout — hidden below lg */}
            {/* Left: featured first card stretches to match the combined height of the two right cards */}
            {/* Right: two equal-height cards stacked */}
            <div className="hidden lg:flex lg:gap-4">
                <div className="flex-1">
                    <ReviewCard review={reviews[0]} index={0} className="h-full" />
                </div>
                <div className="flex flex-1 flex-col gap-4">
                    <ReviewCard review={reviews[1]} index={1} className="flex-1" />
                    <ReviewCard review={reviews[2]} index={2} className="flex-1" />
                </div>
            </div>
        </>
    );
}

// =============================================================================
// LAYOUT: CAROUSEL (4+ reviews)
// Embla carousel — reuses ~/components/ui/carousel primitives (no new dependency).
//
// Slide sizing per breakpoint:
//   mobile (< sm):  1 card per view (basis-full)
//   tablet (sm–lg): 2 cards per view (sm:basis-1/2) with slight peek
//   desktop (lg+):  3 cards per view (lg:basis-1/3)
//
// Navigation: prev/next controls + dot indicators centred below the track.
//   - Controls use aria-label for screen reader support
//   - Arrow keys are handled by the Carousel wrapper (Embla's keyboard plugin)
//   - Dots scroll to the corresponding snap position on click
//
// Dot count is derived from Embla's scroll snap list (responsive — fewer snaps
// at wider viewports). Initialized to 0 on SSR; populated after hydration.
// =============================================================================

function ReviewLayoutCarousel({reviews}: {reviews: ReviewNode[]}) {
    const [api, setApi] = useState<CarouselApi>();
    // Snap count changes with viewport (Embla recomputes on resize via reInit).
    // Initialised to 0 to avoid SSR/hydration mismatch — dots render after mount.
    const [snapCount, setSnapCount] = useState(0);
    const [currentSnap, setCurrentSnap] = useState(0);

    useEffect(() => {
        if (!api) return;
        const update = () => {
            setSnapCount(api.scrollSnapList().length);
            setCurrentSnap(api.selectedScrollSnap());
        };
        update();
        api.on("select", update);
        api.on("reInit", update); // fires when Embla recomputes layout on resize
        return () => {
            api.off("select", update);
            api.off("reInit", update);
        };
    }, [api]);

    return (
        <Carousel
            setApi={setApi}
            opts={{loop: false, align: "start"}}
            className="w-full"
        >
            <CarouselContent className="-ml-4">
                {reviews.map((review, i) => (
                    <CarouselItem
                        key={getReviewKey(review, i)}
                        // Responsive basis: 1 card on mobile, 2 on sm, 3 on lg
                        className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3"
                    >
                        <ReviewCard review={review} index={i} />
                    </CarouselItem>
                ))}
            </CarouselContent>

            {/* Controls row — prev button, dot indicators, next button */}
            <div className="mt-6 flex items-center justify-center gap-4">
                {/* Override default absolute positioning so controls sit inline in the flow */}
                <CarouselPrevious
                    className="static top-auto left-auto translate-y-0 size-9"
                    aria-label="Show previous reviews"
                />

                {/* Dot indicators — one per Embla scroll snap (responsive count) */}
                {snapCount > 1 && (
                    <div
                        className="flex items-center gap-1.5"
                        role="tablist"
                        aria-label="Review carousel position"
                    >
                        {Array.from({length: snapCount}, (_, i) => (
                            <button
                                key={i}
                                type="button"
                                role="tab"
                                aria-selected={i === currentSnap}
                                aria-label={`Go to slide group ${i + 1} of ${snapCount}`}
                                onClick={() => api?.scrollTo(i)}
                                className={cn(
                                    "h-1.5 rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                    i === currentSnap
                                        ? "w-6 bg-foreground"
                                        : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                                )}
                            />
                        ))}
                    </div>
                )}

                <CarouselNext
                    className="static top-auto right-auto translate-y-0 size-9"
                    aria-label="Show next reviews"
                />
            </div>
        </Carousel>
    );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ProductReviews({reviews}: {reviews: ReviewNode[]}) {
    if (!reviews.length) return null;

    const ratings = reviews.map(r => parseRating(r.rating?.value));
    const avg = ratings.reduce((s, r) => s + r, 0) / ratings.length;
    const roundedAvg = Math.round(avg * 10) / 10;

    // Rating distribution — one bucket per integer star value
    const distribution: Record<string, number> = {"5": 0, "4": 0, "3": 0, "2": 0, "1": 0};
    ratings.forEach(r => {
        const bucket = String(Math.round(r));
        if (bucket in distribution) distribution[bucket]++;
    });

    // Single point of truth: layout variant derived from count, used exactly once.
    const variant = getLayoutVariant(reviews.length);

    return (
        <section
            className="mx-auto max-w-[2000px] px-2 md:px-4 py-12 md:py-16"
            aria-labelledby="reviews-heading"
        >
            {/* Divider */}
            <div className="mb-10 h-px w-full bg-border" aria-hidden="true" />

            {/* Header */}
            <div className="mb-8 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex items-center gap-4">
                    <h2
                        id="reviews-heading"
                        className="text-xl font-semibold tracking-tight text-foreground md:text-2xl"
                    >
                        Customer Reviews
                    </h2>
                    {/* Aggregate rating badge */}
                    <div className="flex items-center gap-2 rounded-full px-3 py-1 bg-muted">
                        <StarRow rating={roundedAvg} size={13} />
                        <span className="text-xs font-medium text-foreground">
                            {roundedAvg.toFixed(1)}
                        </span>
                    </div>
                </div>
                <p className="text-sm text-muted-foreground">
                    {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
                </p>
            </div>

            {variant === "carousel" ? (
                /* ── CAROUSEL (4+ reviews): horizontal summary bar above the track ── */
                <div>
                    <div
                        className="flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-8 p-6 rounded-xl border border-border bg-card mb-8"
                        aria-label="Rating summary"
                    >
                        {/* Average score */}
                        <div className="flex items-center gap-4 shrink-0">
                            <span className="text-5xl font-bold leading-none tracking-tight text-foreground">
                                {roundedAvg.toFixed(1)}
                            </span>
                            <div className="flex flex-col gap-1">
                                <StarRow rating={roundedAvg} size={18} />
                                <span className="text-xs text-muted-foreground">
                                    out of 5 · {reviews.length} reviews
                                </span>
                            </div>
                        </div>
                        {/* Vertical divider (desktop only) */}
                        <div
                            className="hidden sm:block w-px self-stretch shrink-0 bg-border"
                            aria-hidden="true"
                        />
                        {/* Distribution bars */}
                        <div className="flex-1 flex flex-col gap-2">
                            {["5", "4", "3", "2", "1"].map(star => (
                                <RatingBar
                                    key={star}
                                    label={star}
                                    count={distribution[star] ?? 0}
                                    total={reviews.length}
                                />
                            ))}
                        </div>
                    </div>
                    <ReviewLayoutCarousel reviews={reviews} />
                </div>
            ) : (
                /* ── GRID LAYOUTS (1–3 reviews): sidebar on desktop ── */
                <div className="flex flex-col gap-10 lg:flex-row lg:gap-14 xl:gap-18">
                    {/* Sidebar — aggregate score + star distribution */}
                    <aside
                        className="shrink-0 lg:w-56 xl:w-64"
                        aria-label="Rating summary"
                    >
                        <div className="rounded-xl border border-border bg-card p-6 flex flex-col gap-5">
                            <div className="flex flex-col items-start gap-2">
                                <span className="text-5xl font-bold leading-none tracking-tight text-foreground">
                                    {roundedAvg.toFixed(1)}
                                </span>
                                <StarRow rating={roundedAvg} size={18} />
                                <span className="text-xs text-muted-foreground mt-0.5">
                                    out of 5
                                </span>
                            </div>
                            <div className="flex flex-col gap-2.5">
                                {["5", "4", "3", "2", "1"].map(star => (
                                    <RatingBar
                                        key={star}
                                        label={star}
                                        count={distribution[star] ?? 0}
                                        total={reviews.length}
                                    />
                                ))}
                            </div>
                        </div>
                    </aside>

                    {/* Review cards */}
                    <div className="flex-1 min-w-0">
                        {variant === "solo" && <ReviewLayoutSolo reviews={reviews} />}
                        {variant === "pair" && <ReviewLayoutPair reviews={reviews} />}
                        {variant === "trio" && <ReviewLayoutTrio reviews={reviews} />}
                    </div>
                </div>
            )}
        </section>
    );
}
