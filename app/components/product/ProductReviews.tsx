/**
 * @fileoverview ProductReviews — Customer review display for product detail pages
 *
 * @description
 * Reads `customer_review` metaobjects linked to the product via the
 * `custom.reviews` metafield (list.metaobject_reference). Renders an
 * aggregate summary + a responsive grid of individual review cards.
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

// =============================================================================
// SUB-COMPONENTS
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
// TYPES
// =============================================================================

export type ReviewNode = {
    reviewerName: {value: string} | null;
    rating: {value: string} | null;
    reviewTitle: {value: string} | null;
    body: {value: string} | null;
    date: {value: string} | null;
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ProductReviews({reviews}: {reviews: ReviewNode[]}) {
    if (!reviews.length) return null;

    const ratings = reviews.map(r => parseRating(r.rating?.value));
    const avg = ratings.reduce((s, r) => s + r, 0) / ratings.length;
    const roundedAvg = Math.round(avg * 10) / 10;

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
                    {/* Aggregate badge */}
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

            {/* Review cards grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {reviews.map((review, i) => {
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
                    // Composite key: reviewer + date + index — no stable ID from Storefront API metaobject fields
                    const reviewKey = `${name}-${review.date?.value ?? ""}-${i}`;

                    return (
                        <article
                            key={reviewKey}
                            className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-sm"
                            style={{
                                animationDelay: `${i * 50}ms`,
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
                                <p className="text-sm font-semibold leading-snug text-foreground">
                                    {title}
                                </p>
                            )}

                            {/* Body */}
                            {body && (
                                <p className="text-sm leading-relaxed text-muted-foreground flex-1">
                                    {body}
                                </p>
                            )}

                            {/* Reviewer */}
                            <div className="flex items-center gap-2 mt-auto pt-3 border-t border-border">
                                <div
                                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary"
                                    aria-hidden="true"
                                >
                                    {initials || "?"}
                                </div>
                                <span className="text-xs font-medium text-foreground truncate">
                                    {name}
                                </span>
                            </div>
                        </article>
                    );
                })}
            </div>
        </section>
    );
}
