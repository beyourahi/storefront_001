import {useState, useMemo} from "react";
import {MapPin, ExternalLink, Navigation} from "lucide-react";
import {Button} from "~/components/ui/button";
import {useShopLocation} from "~/lib/site-content-context";

type LocationPair = {
    embedUrl: string;
    shareLink: string;
    label: string;
};

const buildPairs = (embedUrls: string[], shareLinks: string[]): LocationPair[] => {
    const len = Math.min(embedUrls.length, shareLinks.length);
    const pairs: LocationPair[] = [];
    for (let i = 0; i < len; i++) {
        const embed = embedUrls[i];
        const share = shareLinks[i];
        if (embed && share) {
            pairs.push({
                embedUrl: embed,
                shareLink: share,
                // "Store A", "Store B", … — letter derived from index
                label: `Store ${String.fromCharCode(65 + i)}`
            });
        }
    }
    return pairs;
};

/**
 * Embeds Google Maps iframe(s) for physical store locations. For multi-location
 * merchants, zips `embedUrls` and `shareLinks` arrays by position via `buildPairs`
 * and labels each store alphabetically ("Store A", "Store B", …) using
 * `String.fromCharCode(65 + i)`. A tab-switcher swaps the active iframe and
 * the "Get directions" link without re-mounting.
 */
export const ShopLocation = () => {
    const {embedUrls, shareLinks} = useShopLocation();
    const pairs = useMemo(() => buildPairs(embedUrls, shareLinks), [embedUrls, shareLinks]);
    const [activeIndex, setActiveIndex] = useState(0);

    if (pairs.length === 0) return null;

    const active = pairs[Math.min(activeIndex, pairs.length - 1)];
    const isMulti = pairs.length > 1;

    return (
        <section className="bg-[--surface-canvas] py-16 lg:py-24">
            <div className="mx-auto max-w-7xl px-4 md:px-8">
                {/* ── Header ─────────────────────────────────────────────── */}
                <div className="mb-10">
                    <p className="mb-3 text-xs font-semibold tracking-[0.2em] uppercase text-[--text-subtle]">
                        Find Us
                    </p>
                    <h2 className="mb-3 font-serif text-3xl font-bold text-[--text-primary] md:text-4xl">
                        {isMulti ? "Our Locations" : "Visit Our Store"}
                    </h2>
                    <p className="max-w-xl text-base text-[--text-secondary]">
                        {isMulti
                            ? "We have multiple locations ready to serve you. Select a store below to see it on the map."
                            : "Come see us in person — our team is here to help you find exactly what you're looking for."}
                    </p>
                </div>

                <div className="border-t border-[--border-subtle] mb-10" />

                {/* ── Tab Switcher (multi-location only) ─────────────────── */}
                {isMulti && (
                    <div className="flex flex-wrap gap-2 mb-8" role="tablist" aria-label="Store locations">
                        {pairs.map((pair, i) => {
                            const isActive = i === activeIndex;
                            return (
                                <button
                                    key={pair.label}
                                    role="tab"
                                    aria-selected={isActive}
                                    aria-controls="shop-location-map"
                                    onClick={() => setActiveIndex(i)}
                                    className={[
                                        "min-h-[44px] min-w-[44px] px-5 py-2.5 rounded-full text-sm font-medium transition-colors duration-[--motion-duration-standard]",
                                        isActive
                                            ? "bg-[--brand-primary] text-[--brand-primary-foreground]"
                                            : "bg-[--surface-interactive] text-[--text-secondary] hover:bg-[--surface-muted]"
                                    ].join(" ")}
                                >
                                    <span className="flex items-center gap-2">
                                        <Navigation className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                                        {pair.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* ── Map ────────────────────────────────────────────────── */}
                <div
                    id="shop-location-map"
                    role={isMulti ? "tabpanel" : undefined}
                    aria-label={active.label}
                    className="aspect-[4/3] overflow-hidden rounded-[--radius-xl-raw] border border-[--border-subtle] shadow-[--shadow-md] md:aspect-[16/9]"
                >
                    <iframe
                        src={active.embedUrl}
                        title={`Map — ${active.label}`}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        allowFullScreen
                        className="h-full w-full border-0"
                    />
                </div>

                {/* ── CTA ────────────────────────────────────────────────── */}
                <div className="mt-6 flex justify-center">
                    <Button asChild variant="outline" size="lg">
                        <a
                            href={active.shareLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2"
                        >
                            <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                            Get directions
                            <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden="true" />
                        </a>
                    </Button>
                </div>
            </div>
        </section>
    );
};
