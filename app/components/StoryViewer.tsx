import {useState, useEffect, useCallback, useRef} from "react";
import {Link} from "react-router";
import {ChevronLeft, ChevronRight} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type StoryProduct = {
    id: string;
    handle: string;
    title: string;
    availableForSale: boolean;
    featuredImage: {url: string; altText: string | null; width: number | null; height: number | null} | null;
    priceRange: {minVariantPrice: {amount: string; currencyCode: string}};
    vendor: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMoney(m: {amount: string; currencyCode: string}): string {
    try {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: m.currencyCode,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(parseFloat(m.amount));
    } catch {
        return `${m.currencyCode} ${m.amount}`;
    }
}

function cdnImg(url: string, width = 800): string {
    try {
        const u = new URL(url);
        u.searchParams.set("width", String(width));
        u.searchParams.set("crop", "center");
        return u.toString();
    } catch {
        return url;
    }
}

// ─── Component ────────────────────────────────────────────────────────────────

const STORY_DURATION = 5000;

interface StoryViewerProps {
    products: StoryProduct[];
}

/**
 * Full-screen cinematic story viewer component.
 * Feature 30 — Story-style shopping.
 * Auto-advances every 5 seconds with smooth progress indicator.
 * Keyboard: ArrowLeft / ArrowRight. Mobile: tap zones (left = prev, right = next).
 */
export function StoryViewer({products}: StoryViewerProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const total = products.length;

    const goNext = useCallback(() => {
        setActiveIndex(prev => (prev >= total - 1 ? 0 : prev + 1));
        setProgress(0);
    }, [total]);

    const goPrev = useCallback(() => {
        setActiveIndex(prev => (prev <= 0 ? total - 1 : prev - 1));
        setProgress(0);
    }, [total]);

    const goTo = useCallback(
        (index: number) => {
            setActiveIndex(Math.max(0, Math.min(total - 1, index)));
            setProgress(0);
        },
        [total]
    );

    useEffect(() => {
        if (total === 0) return;
        const TICK = 33;
        progressRef.current = setInterval(() => {
            setProgress(prev => {
                const next = prev + TICK / STORY_DURATION;
                return next >= 1 ? 1 : next;
            });
        }, TICK);
        intervalRef.current = setInterval(goNext, STORY_DURATION);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (progressRef.current) clearInterval(progressRef.current);
        };
    }, [activeIndex, goNext, total]);

    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.key === "ArrowRight") goNext();
            if (e.key === "ArrowLeft") goPrev();
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [goNext, goPrev]);

    if (total === 0) {
        return (
            <div className="stories-empty">
                <p>No stories available right now.</p>
                <Link to="/collections/all" className="stories-empty__link">
                    Browse products
                </Link>
            </div>
        );
    }

    const active = products[activeIndex];
    const imgUrl = active.featuredImage ? cdnImg(active.featuredImage.url, 800) : null;

    return (
        <div className="stories-root">
            {/* Background image fill */}
            {imgUrl && (
                <div
                    key={active.id}
                    className="stories-bg"
                    style={{backgroundImage: `url(${imgUrl})`}}
                    aria-hidden="true"
                />
            )}
            <div className="stories-grain" aria-hidden="true" />
            <div className="stories-vignette" aria-hidden="true" />

            {/* Segmented progress bar */}
            <div className="stories-progress" role="progressbar" aria-label={`Story ${activeIndex + 1} of ${total}`}>
                {products.map((p, i) => (
                    <button
                        key={p.id}
                        className="stories-progress__segment-wrap"
                        onClick={() => goTo(i)}
                        aria-label={`Go to story ${i + 1}: ${p.title}`}
                        type="button"
                    >
                        <div className="stories-progress__segment">
                            <div
                                className="stories-progress__fill"
                                style={{
                                    width: i < activeIndex ? "100%" : i === activeIndex ? `${progress * 100}%` : "0%"
                                }}
                            />
                        </div>
                    </button>
                ))}
            </div>

            {/* Bubble navigation */}
            <nav className="stories-bubbles" aria-label="Story navigation">
                <div className="stories-bubbles__inner">
                    {products.map((p, i) => (
                        <button
                            key={p.id}
                            className={`stories-bubble ${i === activeIndex ? "stories-bubble--active" : ""}`}
                            onClick={() => goTo(i)}
                            aria-label={p.title}
                            aria-current={i === activeIndex ? "true" : undefined}
                            type="button"
                        >
                            <div className="stories-bubble__ring" aria-hidden="true" />
                            <div className="stories-bubble__img-wrap">
                                {p.featuredImage ? (
                                    <img
                                        src={cdnImg(p.featuredImage.url, 80)}
                                        alt={p.featuredImage.altText ?? p.title}
                                        className="stories-bubble__img"
                                        loading="lazy"
                                        decoding="async"
                                    />
                                ) : (
                                    <div className="stories-bubble__fallback" />
                                )}
                            </div>
                            <span className="stories-bubble__label">{p.title}</span>
                        </button>
                    ))}
                </div>
            </nav>

            {/* Tap navigation zones (mobile) */}
            <div className="stories-nav-zones" aria-hidden="true">
                <button
                    className="stories-nav-zone stories-nav-zone--prev"
                    onClick={goPrev}
                    tabIndex={-1}
                    type="button"
                    aria-label="Previous story"
                />
                <button
                    className="stories-nav-zone stories-nav-zone--next"
                    onClick={goNext}
                    tabIndex={-1}
                    type="button"
                    aria-label="Next story"
                />
            </div>

            {/* Arrow buttons (desktop) */}
            <div className="stories-arrows">
                <button className="stories-arrow stories-arrow--prev" onClick={goPrev} aria-label="Previous story" type="button">
                    <ChevronLeft strokeWidth={2} />
                </button>
                <button className="stories-arrow stories-arrow--next" onClick={goNext} aria-label="Next story" type="button">
                    <ChevronRight strokeWidth={2} />
                </button>
            </div>

            {/* Product info card */}
            <div className="stories-card" key={active.id}>
                {active.vendor && <p className="stories-card__vendor">{active.vendor}</p>}
                <h2 className="stories-card__title">{active.title}</h2>
                <p className="stories-card__price">{formatMoney(active.priceRange.minVariantPrice)}</p>
                <div className="stories-card__actions">
                    <Link to={`/products/${active.handle}`} className="stories-card__cta">
                        Shop Now
                    </Link>
                    <span className="stories-card__counter">
                        {activeIndex + 1} / {total}
                    </span>
                </div>
            </div>

            <style>{STORIES_STYLES}</style>
        </div>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const STORIES_STYLES = `
    .stories-root {
        position: relative;
        width: 100%;
        height: 100dvh;
        overflow: hidden;
        background: oklch(0.10 0.008 250);
        color: #fff;
        display: flex;
        flex-direction: column;
        isolation: isolate;
        user-select: none;
    }
    .stories-bg {
        position: absolute;
        inset: 0;
        background-size: cover;
        background-position: center top;
        background-repeat: no-repeat;
        z-index: 0;
        animation: stories-bg-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    @keyframes stories-bg-in {
        from { opacity: 0; transform: scale(1.04); }
        to   { opacity: 1; transform: scale(1); }
    }
    .stories-grain {
        position: absolute;
        inset: 0;
        z-index: 1;
        pointer-events: none;
        opacity: 0.065;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
        background-repeat: repeat;
    }
    .stories-vignette {
        position: absolute;
        inset: 0;
        z-index: 2;
        pointer-events: none;
        background: linear-gradient(
            to bottom,
            oklch(0.10 0.008 250 / 0.55) 0%,
            transparent 22%,
            transparent 44%,
            oklch(0.07 0.005 250 / 0.82) 100%
        );
    }
    .stories-progress {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        z-index: 20;
        display: flex;
        gap: 3px;
        padding: 14px 14px 0;
    }
    .stories-progress__segment-wrap {
        flex: 1;
        height: 20px;
        display: flex;
        align-items: center;
        background: none;
        border: none;
        padding: 6px 0;
        cursor: pointer;
    }
    .stories-progress__segment {
        width: 100%;
        height: 2.5px;
        background: rgba(255,255,255,0.28);
        border-radius: 2px;
        overflow: hidden;
    }
    .stories-progress__fill {
        height: 100%;
        background: #ffffff;
        border-radius: 2px;
        transition: width 0.033s linear;
    }
    .stories-bubbles {
        position: absolute;
        top: 44px;
        left: 0;
        right: 0;
        z-index: 20;
        padding: 8px 14px 4px;
    }
    .stories-bubbles__inner {
        display: flex;
        gap: 12px;
        overflow-x: auto;
        scrollbar-width: none;
        -ms-overflow-style: none;
        padding-bottom: 4px;
    }
    .stories-bubbles__inner::-webkit-scrollbar { display: none; }
    .stories-bubble {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 5px;
        background: none;
        border: none;
        cursor: pointer;
        flex-shrink: 0;
        padding: 0;
    }
    .stories-bubble__ring {
        position: absolute;
        inset: -3px;
        border-radius: 50%;
        border: 2px solid rgba(255,255,255,0.25);
        transition: border-color 220ms ease;
    }
    .stories-bubble--active .stories-bubble__ring {
        border-color: var(--brand-primary);
    }
    .stories-bubble__img-wrap {
        position: relative;
        width: 42px;
        height: 42px;
        border-radius: 50%;
        overflow: hidden;
        border: 2px solid rgba(255,255,255,0.2);
        transition: border-color 220ms ease;
    }
    .stories-bubble--active .stories-bubble__img-wrap {
        border-color: var(--brand-primary);
    }
    .stories-bubble__img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
    }
    .stories-bubble__fallback {
        width: 100%;
        height: 100%;
        background: rgba(255,255,255,0.15);
    }
    .stories-bubble__label {
        font-size: 0.5625rem;
        color: rgba(255,255,255,0.7);
        text-align: center;
        max-width: 48px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        letter-spacing: 0.02em;
        line-height: 1.3;
    }
    .stories-bubble--active .stories-bubble__label { color: #fff; }
    .stories-nav-zones {
        position: absolute;
        inset: 0;
        z-index: 15;
        display: flex;
        pointer-events: none;
    }
    .stories-nav-zone {
        flex: 1;
        height: 100%;
        background: none;
        border: none;
        cursor: pointer;
        pointer-events: all;
        -webkit-tap-highlight-color: transparent;
    }
    .stories-arrows {
        position: absolute;
        top: 50%;
        left: 0;
        right: 0;
        z-index: 25;
        display: flex;
        justify-content: space-between;
        padding: 0 12px;
        transform: translateY(-50%);
        pointer-events: none;
    }
    .stories-arrow {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: rgba(255,255,255,0.12);
        border: 1px solid rgba(255,255,255,0.18);
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        pointer-events: all;
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        transition: background 160ms ease, transform 120ms ease;
        -webkit-tap-highlight-color: transparent;
    }
    .stories-arrow svg { width: 20px; height: 20px; }
    .stories-arrow:hover { background: rgba(255,255,255,0.22); }
    .stories-arrow:active { transform: scale(0.93); }
    @media (max-width: 479px) { .stories-arrows { display: none; } }
    .stories-card {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 20;
        padding: 1.75rem 1.25rem 2rem;
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
        animation: stories-card-in 0.45s cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    @keyframes stories-card-in {
        from { opacity: 0; transform: translateY(12px); }
        to   { opacity: 1; transform: translateY(0); }
    }
    @media (min-width: 640px) {
        .stories-card { padding: 2.5rem 2rem 2.5rem; max-width: 480px; }
    }
    .stories-card__vendor {
        font-size: 0.6875rem;
        font-weight: 600;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: rgba(255,255,255,0.55);
    }
    .stories-card__title {
        font-size: clamp(1.375rem, 4vw, 2rem);
        font-weight: 800;
        line-height: 1.15;
        letter-spacing: -0.025em;
        color: #ffffff;
        text-shadow: 0 2px 16px rgba(0,0,0,0.4);
    }
    .stories-card__price {
        font-size: 1.0625rem;
        font-weight: 500;
        color: rgba(255,255,255,0.85);
        letter-spacing: -0.005em;
    }
    .stories-card__actions {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-top: 0.75rem;
    }
    .stories-card__cta {
        display: inline-flex;
        align-items: center;
        padding: 0.6875rem 1.625rem;
        background: var(--brand-primary);
        color: var(--brand-primary-foreground);
        border-radius: var(--radius-pill-raw);
        font-size: 0.875rem;
        font-weight: 700;
        text-decoration: none;
        letter-spacing: 0.01em;
        transition: background 160ms ease, transform 120ms ease;
        -webkit-tap-highlight-color: transparent;
    }
    .stories-card__cta:hover { background: var(--brand-primary-hover); }
    .stories-card__cta:active { transform: scale(0.96); }
    .stories-card__counter {
        font-size: 0.75rem;
        color: rgba(255,255,255,0.42);
        letter-spacing: 0.04em;
        font-variant-numeric: tabular-nums;
    }
    .stories-empty {
        min-height: 100dvh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        background: oklch(0.10 0.008 250);
        color: rgba(255,255,255,0.7);
    }
    .stories-empty__link {
        color: var(--brand-primary);
        text-decoration: underline;
    }
`;
