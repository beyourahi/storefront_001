import {Link} from "react-router";
import {Package, X, ShoppingBag} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type MoneyV2 = {amount: string; currencyCode: string};

export type CompareProduct = {
    id: string;
    title: string;
    handle: string;
    vendor: string | null;
    productType: string;
    availableForSale: boolean;
    featuredImage: {url: string; altText: string | null; width: number | null; height: number | null} | null;
    priceRange: {
        minVariantPrice: MoneyV2;
        maxVariantPrice: MoneyV2;
    };
    compareAtPriceRange: {minVariantPrice: MoneyV2} | null;
    variants: {
        nodes: Array<{id: string; price: MoneyV2; availableForSale: boolean}>;
    };
};

type CompareRow = {
    label: string;
    render: (p: CompareProduct) => React.ReactNode;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMoney(m: MoneyV2): string {
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

function cartAddUrl(product: CompareProduct): string {
    const variant = product.variants.nodes[0];
    if (!variant) return `/products/${product.handle}`;
    const numericId = variant.id.split("/").pop() ?? "";
    return `/cart/${numericId}:1`;
}

// ─── Row definitions ──────────────────────────────────────────────────────────

const ROWS: CompareRow[] = [
    {
        label: "Price",
        render: p => {
            const min = p.priceRange.minVariantPrice;
            const max = p.priceRange.maxVariantPrice;
            const same = min.amount === max.amount;
            return (
                <span className="compare-price">
                    {same ? formatMoney(min) : `${formatMoney(min)} – ${formatMoney(max)}`}
                </span>
            );
        }
    },
    {
        label: "Brand",
        render: p => <span className="compare-cell-text">{p.vendor || "—"}</span>
    },
    {
        label: "Type",
        render: p => <span className="compare-cell-text">{p.productType || "—"}</span>
    },
    {
        label: "Availability",
        render: p => (
            <span
                className={`compare-availability ${p.availableForSale ? "compare-availability--in" : "compare-availability--out"}`}
            >
                <span className="compare-availability-dot" />
                {p.availableForSale ? "In Stock" : "Out of Stock"}
            </span>
        )
    }
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function RemoveButton({productId, onRemove}: {productId: string; onRemove?: (id: string) => void}) {
    function handleRemove() {
        if (onRemove) {
            onRemove(productId);
            return;
        }
        if (typeof window === "undefined") return;
        const url = new URL(window.location.href);
        const remaining = url.searchParams.getAll("ids").filter(id => id !== productId);
        url.searchParams.delete("ids");
        remaining.forEach(id => url.searchParams.append("ids", id));
        window.location.href = url.toString();
    }

    return (
        <button
            onClick={handleRemove}
            className="compare-remove-btn"
            aria-label="Remove from comparison"
            title="Remove"
            type="button"
        >
            <X strokeWidth={2} className="compare-remove-btn__icon" />
            Remove
        </button>
    );
}

export function CompareEmptyState() {
    return (
        <div className="compare-empty">
            <div className="compare-empty__inner">
                <div className="compare-empty__icon-wrap">
                    <Package className="compare-empty__icon" strokeWidth={1.25} />
                </div>
                <h1 className="compare-empty__heading">Add products to compare</h1>
                <p className="compare-empty__body">
                    Select at least two products to see a side-by-side comparison of their details.
                </p>
                <Link to="/collections/all" className="compare-empty__link">
                    Browse collection
                </Link>
            </div>
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface CompareTableProps {
    products: CompareProduct[];
    onRemove?: (productId: string) => void;
}

/**
 * Side-by-side product comparison table.
 * Feature 20 — Help me choose comparison.
 * CSS class-based design matching storefront_001 editorial/catalog aesthetic.
 */
export function CompareTable({products, onRemove}: CompareTableProps) {
    const colCount = products.length;

    return (
        <div className="compare-page" style={{"--col-count": colCount} as React.CSSProperties}>
            <div className="compare-scroll-wrapper">
                <table className="compare-table">
                    <thead className="compare-thead">
                        <tr>
                            <th className="compare-th compare-th--label" aria-label="Attribute" />
                            {products.map((p, i) => (
                                <th key={p.id} className="compare-th compare-th--product">
                                    <div className="compare-product-header">
                                        <div className="compare-product-img-wrap">
                                            {p.featuredImage ? (
                                                <img
                                                    src={`${p.featuredImage.url}&width=240&height=280&crop=center`}
                                                    alt={p.featuredImage.altText ?? p.title}
                                                    width={240}
                                                    height={280}
                                                    className="compare-product-img"
                                                    loading={i === 0 ? "eager" : "lazy"}
                                                    decoding="async"
                                                />
                                            ) : (
                                                <div className="compare-product-img-placeholder">
                                                    <Package
                                                        className="compare-product-img-placeholder__icon"
                                                        strokeWidth={1}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        <div className="compare-product-meta">
                                            <Link
                                                to={`/products/${p.handle}`}
                                                className="compare-product-title"
                                                title={`View ${p.title}`}
                                            >
                                                {p.title}
                                            </Link>
                                            <RemoveButton productId={p.id} onRemove={onRemove} />
                                        </div>
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody>
                        {ROWS.map(row => (
                            <tr key={row.label} className="compare-tr">
                                <td className="compare-td compare-td--label">{row.label}</td>
                                {products.map(p => (
                                    <td key={p.id} className="compare-td compare-td--value">
                                        {row.render(p)}
                                    </td>
                                ))}
                            </tr>
                        ))}

                        <tr className="compare-tr compare-tr--cta">
                            <td className="compare-td compare-td--label" />
                            {products.map(p => (
                                <td key={p.id} className="compare-td compare-td--cta">
                                    <div className="compare-cta-cell">
                                        <Link to={`/products/${p.handle}`} className="compare-cta-product-link">
                                            View product
                                        </Link>
                                        {p.availableForSale && (
                                            <Link to={cartAddUrl(p)} className="compare-cta-add-btn">
                                                <ShoppingBag className="compare-cta-add-btn__icon" strokeWidth={1.5} />
                                                Add to cart
                                            </Link>
                                        )}
                                    </div>
                                </td>
                            ))}
                        </tr>
                    </tbody>
                </table>
            </div>

            <style>{COMPARE_STYLES}</style>
        </div>
    );
}

// ─── URL helper ───────────────────────────────────────────────────────────────

/**
 * Hook to manage compare URL params — add/remove product IDs while preserving others.
 * Uses window.location.href for navigation to match storefront_001's full-page pattern.
 */
export function useCompareNavigation() {
    function removeProduct(productId: string) {
        if (typeof window === "undefined") return;
        const url = new URL(window.location.href);
        const remaining = url.searchParams.getAll("ids").filter(id => id !== productId);
        url.searchParams.delete("ids");
        remaining.forEach(id => url.searchParams.append("ids", id));
        window.location.href = url.toString();
    }

    return {removeProduct};
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const COMPARE_STYLES = `
    .compare-page {
        min-height: 100dvh;
        background: var(--surface-canvas);
        color: var(--text-primary);
        padding-bottom: 4rem;
    }
    .compare-empty {
        min-height: 80dvh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2rem;
    }
    .compare-empty__inner {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1.25rem;
        text-align: center;
        max-width: 440px;
    }
    .compare-empty__icon-wrap {
        width: 72px;
        height: 72px;
        border: 1.5px solid var(--border-subtle);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--surface-muted);
    }
    .compare-empty__icon { width: 32px; height: 32px; color: var(--text-subtle); }
    .compare-empty__heading {
        font-size: clamp(1.4rem, 3vw, 2rem);
        font-weight: 700;
        letter-spacing: -0.025em;
        color: var(--text-primary);
        line-height: 1.2;
    }
    .compare-empty__body {
        font-size: 0.9375rem;
        color: var(--text-secondary);
        line-height: 1.6;
    }
    .compare-empty__link {
        display: inline-flex;
        align-items: center;
        padding: 0.6875rem 1.75rem;
        background: var(--brand-primary);
        color: var(--brand-primary-foreground);
        border-radius: var(--radius-pill-raw);
        font-size: 0.875rem;
        font-weight: 600;
        letter-spacing: 0.01em;
        text-decoration: none;
        transition: background 180ms ease;
    }
    .compare-empty__link:hover { background: var(--brand-primary-hover); }
    .compare-scroll-wrapper {
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        padding: 0 1rem 2rem;
    }
    @media (min-width: 768px) {
        .compare-scroll-wrapper { padding: 0 1.5rem 3rem; }
    }
    .compare-table {
        width: 100%;
        border-collapse: collapse;
        min-width: calc(280px * var(--col-count, 2) + 200px);
    }
    .compare-thead {
        position: sticky;
        top: 0;
        z-index: 10;
        background: oklch(from var(--surface-canvas) l c h / 0.92);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border-bottom: 1.5px solid var(--border-subtle);
    }
    .compare-th {
        padding: 1.25rem 1rem;
        text-align: left;
        font-weight: 600;
        font-size: 0.8125rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--text-subtle);
    }
    .compare-th--label { width: 160px; min-width: 140px; }
    .compare-th--product {
        min-width: 280px;
        max-width: 340px;
        width: calc((100% - 160px) / var(--col-count, 2));
        vertical-align: bottom;
        padding: 1.5rem 1rem 1.25rem;
    }
    .compare-product-header { display: flex; flex-direction: column; gap: 0.875rem; }
    .compare-product-img-wrap {
        aspect-ratio: 6 / 7;
        border-radius: var(--radius-lg-raw);
        overflow: hidden;
        background: var(--surface-muted);
        max-width: 240px;
    }
    .compare-product-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
        transition: transform var(--motion-duration-image) var(--motion-ease-emphasized);
    }
    .compare-product-img:hover { transform: scale(1.03); }
    .compare-product-img-placeholder {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--surface-muted);
    }
    .compare-product-img-placeholder__icon { width: 40px; height: 40px; color: var(--text-subtle); }
    .compare-product-meta { display: flex; flex-direction: column; gap: 0.375rem; }
    .compare-product-title {
        font-size: 0.9375rem;
        font-weight: 700;
        color: var(--text-primary);
        text-decoration: none;
        line-height: 1.3;
        letter-spacing: -0.01em;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }
    .compare-product-title:hover { color: var(--brand-primary); }
    .compare-remove-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
        padding: 0.25rem 0;
        font-size: 0.75rem;
        color: var(--text-subtle);
        background: none;
        border: none;
        cursor: pointer;
        letter-spacing: 0.01em;
        transition: color 140ms ease;
    }
    .compare-remove-btn:hover { color: oklch(0.55 0.2 25); }
    .compare-remove-btn__icon { width: 12px; height: 12px; }
    .compare-tr { border-bottom: 1px solid var(--border-subtle); }
    .compare-tr:last-child { border-bottom: none; }
    .compare-td { padding: 1.125rem 1rem; vertical-align: middle; font-size: 0.9375rem; }
    .compare-td--label {
        font-size: 0.75rem;
        font-weight: 600;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--text-subtle);
        white-space: nowrap;
    }
    .compare-td--value { color: var(--text-primary); }
    .compare-price { font-size: 1.0625rem; font-weight: 700; color: var(--text-primary); letter-spacing: -0.015em; }
    .compare-cell-text { color: var(--text-secondary); }
    .compare-availability { display: inline-flex; align-items: center; gap: 0.4375rem; font-size: 0.875rem; font-weight: 500; }
    .compare-availability--in { color: oklch(0.48 0.14 155); }
    .compare-availability--out { color: var(--text-subtle); }
    .compare-availability-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; background: currentColor; }
    .compare-tr--cta { border-top: 1.5px solid var(--border-subtle); }
    .compare-td--cta { padding-top: 1.5rem; padding-bottom: 1.5rem; }
    .compare-cta-cell { display: flex; flex-direction: column; gap: 0.5rem; align-items: flex-start; }
    .compare-cta-product-link {
        display: inline-flex;
        align-items: center;
        padding: 0.5625rem 1.25rem;
        border: 1.5px solid var(--border-strong);
        border-radius: var(--radius-pill-raw);
        font-size: 0.8125rem;
        font-weight: 600;
        color: var(--text-primary);
        text-decoration: none;
        letter-spacing: 0.01em;
        transition: border-color 140ms ease, background 140ms ease;
        white-space: nowrap;
    }
    .compare-cta-product-link:hover {
        border-color: var(--brand-primary);
        background: var(--brand-primary-subtle);
        color: var(--brand-primary);
    }
    .compare-cta-add-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.4375rem;
        padding: 0.5625rem 1.25rem;
        background: var(--brand-primary);
        color: var(--brand-primary-foreground);
        border-radius: var(--radius-pill-raw);
        font-size: 0.8125rem;
        font-weight: 600;
        text-decoration: none;
        letter-spacing: 0.01em;
        transition: background 140ms ease;
        white-space: nowrap;
    }
    .compare-cta-add-btn:hover { background: var(--brand-primary-hover); }
    .compare-cta-add-btn__icon { width: 14px; height: 14px; }
`;
