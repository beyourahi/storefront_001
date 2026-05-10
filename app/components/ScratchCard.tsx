import {useEffect, useRef, useState, useCallback} from "react";
import {ArrowUpRight} from "lucide-react";
import {Dialog, DialogContent, DialogDescription, DialogTitle} from "~/components/ui/dialog";
import {Button} from "~/components/ui/button";
import {useSiteSettings} from "~/lib/site-content-context";

const REVEAL_THRESHOLD = 0.6;
const SAMPLE_INTERVAL_MS = 180;
// Slightly larger brush than 002 — the foil here has a denser print pattern,
// so a generous radius keeps the scratch motion feeling effortless.
const BRUSH_RADIUS = 30;

interface ScratchCardProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

/**
 * ScratchCard — storefront_001 "Pressroom Voucher" treatment
 *
 * Visual identity hooks (vs. storefront_002):
 * - Two-line foreground/primary serif title stack mirrors the homepage
 *   "Featured / One product. Full attention." pattern.
 * - Hard offset shadow ("postcard pinned to a board") instead of 002's
 *   soft luxury drop shadow.
 * - Foil canvas reads as a newspaper pressroom voucher: vertical column
 *   rules, four corner labels, one bold sans `SCRATCH` word — distinct
 *   from 002's metallic gradient + dotted halftone, and distinct from the
 *   diagonal stripes the previous 001 treatment used.
 * - Outline pill CTA with `ArrowUpRight` matches the homepage spotlight
 *   "View featured product" affordance verbatim.
 */
export function ScratchCard({open, onOpenChange}: ScratchCardProps) {
    const {discountCode} = useSiteSettings();
    const [revealed, setRevealed] = useState(false);
    const [copied, setCopied] = useState(false);
    const [mounted, setMounted] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const isDrawingRef = useRef(false);
    const lastSampleAtRef = useRef(0);

    // SSR gate — never render canvas on the server
    useEffect(() => setMounted(true), []);

    // Paint the foil layer whenever the dialog opens.
    // Double RAF defers paint until after the Dialog's CSS entry animation has run
    // and the canvas has real dimensions from getBoundingClientRect().
    useEffect(() => {
        if (!open) return;
        const rafId = requestAnimationFrame(() =>
            requestAnimationFrame(() => {
                const canvas = canvasRef.current;
                if (!canvas) return;
                const ctx = canvas.getContext("2d");
                if (!ctx) return;

                const dpr = window.devicePixelRatio || 1;
                const rect = canvas.getBoundingClientRect();
                if (!rect.width || !rect.height) return;
                canvas.width = rect.width * dpr;
                canvas.height = rect.height * dpr;
                ctx.scale(dpr, dpr);

                const cs = getComputedStyle(document.documentElement);
                const fg = cs.getPropertyValue("--color-foreground").trim() || "#1a1a1a";
                const bg = cs.getPropertyValue("--color-background").trim() || "#fff";

                // Layer 1: solid foreground "ink" base — opaque so subsequent
                // translucent layers never let the code text bleed through.
                ctx.fillStyle = fg;
                ctx.fillRect(0, 0, rect.width, rect.height);

                // Layer 2: vertical column rules — newsprint pressroom signature.
                // Fine 1px verticals at 9px spacing read as columns of text from
                // far away and as security paper up close. Distinct from 002's
                // dotted halftone and from any horizontal/diagonal stripe motif.
                ctx.save();
                ctx.fillStyle = bg;
                ctx.globalAlpha = 0.13;
                const colSpacing = 9;
                for (let x = colSpacing; x < rect.width; x += colSpacing) {
                    ctx.fillRect(x, 0, 1, rect.height);
                }
                ctx.restore();

                // Layer 3: top + bottom horizontal hairlines — newspaper rules
                // bracketing the central message band.
                ctx.save();
                ctx.fillStyle = bg;
                ctx.globalAlpha = 0.5;
                ctx.fillRect(18, 22, rect.width - 36, 1);
                ctx.fillRect(18, rect.height - 23, rect.width - 36, 1);
                ctx.restore();

                // Layer 4: four corner labels — masthead-style metadata.
                // Top-left: issue number, top-right: section, bottom-left: edition,
                // bottom-right: usage — quadrant layout is the editorial signature.
                ctx.fillStyle = bg;
                ctx.globalAlpha = 0.78;
                ctx.font = "600 9px ui-sans-serif, system-ui, sans-serif";
                ctx.textBaseline = "middle";

                ctx.textAlign = "left";
                ctx.fillText("Nº 01", 24, 32);
                ctx.fillText("V O L .   E X C L", 24, rect.height - 14);

                ctx.textAlign = "right";
                ctx.fillText("M E M B E R   P E R K", rect.width - 24, 32);
                ctx.fillText("B E A R E R   O N L Y", rect.width - 24, rect.height - 14);

                // Layer 5: hero word — bold sans `SCRATCH`, the unmissable
                // instruction. Sans-serif (vs 002's italic serif `scratch · to · reveal`)
                // gives a punchy headline-poster feel rather than boutique elegance.
                ctx.fillStyle = bg;
                ctx.globalAlpha = 0.96;
                ctx.font = "800 34px ui-sans-serif, system-ui, sans-serif";
                ctx.textAlign = "center";
                ctx.fillText("SCRATCH", rect.width / 2, rect.height / 2 - 4);

                // Layer 6: caption below the hero — three R-words, tracked caps.
                ctx.font = "600 9px ui-sans-serif, system-ui, sans-serif";
                ctx.globalAlpha = 0.72;
                ctx.fillText("R E V E A L   ·   R E D E E M   ·   R E P E A T", rect.width / 2, rect.height / 2 + 20);
                ctx.globalAlpha = 1;

                // Subsequent draws erase foil pixels to expose the code underneath
                ctx.globalCompositeOperation = "destination-out";
            })
        );
        return () => cancelAnimationFrame(rafId);
    }, [open]);

    const sampleClearedRatio = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return 0;
        const ctx = canvas.getContext("2d");
        if (!ctx) return 0;
        const {width, height} = canvas;
        const stride = 8;
        const data = ctx.getImageData(0, 0, width, height).data;
        let cleared = 0;
        let total = 0;
        for (let i = 3; i < data.length; i += 4 * stride) {
            total++;
            if (data[i] === 0) cleared++;
        }
        return cleared / Math.max(total, 1);
    }, []);

    const scratchAt = (clientX: number, clientY: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const rect = canvas.getBoundingClientRect();
        ctx.beginPath();
        ctx.arc(clientX - rect.left, clientY - rect.top, BRUSH_RADIUS, 0, Math.PI * 2);
        ctx.fill();

        const now = performance.now();
        if (now - lastSampleAtRef.current >= SAMPLE_INTERVAL_MS) {
            lastSampleAtRef.current = now;
            if (sampleClearedRatio() >= REVEAL_THRESHOLD) setRevealed(true);
        }
    };

    const onPointerDown = (e: React.PointerEvent) => {
        isDrawingRef.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        scratchAt(e.clientX, e.clientY);
    };
    const onPointerMove = (e: React.PointerEvent) => {
        if (!isDrawingRef.current) return;
        scratchAt(e.clientX, e.clientY);
    };
    const onPointerUp = (e: React.PointerEvent) => {
        isDrawingRef.current = false;
        try {
            e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {
            // Pointer may already be released — releasePointerCapture is best-effort
        }
    };

    const copyCode = async () => {
        if (typeof navigator === "undefined" || !navigator.clipboard) return;
        try {
            await navigator.clipboard.writeText(discountCode);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
        } catch {
            // Clipboard write failed — code is still visible for manual copy
        }
    };

    if (!mounted || !discountCode) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                showCloseButton={false}
                className="sm:max-w-md p-0 gap-0 border-0 bg-transparent shadow-none"
            >
                {/* Outer card — solid hairline border + hard offset shadow.
                    Reads as a postcard pinned to a corkboard, deliberately
                    different from 002's soft glass drop shadow. */}
                <div
                    className="relative rounded-[var(--radius-3xl-raw)] border border-foreground/85 bg-card text-card-foreground"
                    style={{
                        boxShadow: "0.4rem 0.4rem 0 0 oklch(from var(--color-foreground) l c h / 0.88)"
                    }}
                >
                    <div className="px-6 pt-5 pb-6 sm:px-8 sm:pt-6 sm:pb-7">
                        {/* Two-line title stack — foreground line + primary line.
                            Mirrors FeaturedProductSpotlight ("Featured / One product. Full attention.")
                            verbatim, anchoring the dialog inside the storefront's voice. */}
                        <DialogTitle className="font-serif text-2xl font-bold uppercase leading-[1.05] sm:text-3xl">
                            <span className="text-foreground block">Welcome gift,</span>
                            <span className="text-primary block">scratch to redeem</span>
                        </DialogTitle>

                        <DialogDescription className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
                            One discount, hidden under the foil. Reveal it below and we&rsquo;ll tuck it into your next checkout.
                        </DialogDescription>

                        {/* Scratch surface — solid hairline (not dashed), generous height,
                            mid-radius (lg, not the 3xl outer) for nested-surface clarity. */}
                        <div className="relative mt-6 h-32 w-full overflow-hidden rounded-[var(--radius-lg-raw)] border border-foreground/15 bg-muted/40 sm:h-36 md:h-40">
                            <div
                                className={`absolute inset-0 flex flex-col items-center justify-center select-none px-4 ${
                                    revealed ? "animate-scale-fade" : ""
                                }`}
                                aria-live="polite"
                                aria-label={revealed ? `Discount code: ${discountCode}` : undefined}
                            >
                                <span className="text-[0.6rem] font-semibold uppercase tracking-[0.32em] text-muted-foreground mb-2">
                                    Promo code
                                </span>
                                <span
                                    className={`font-mono text-2xl font-bold tracking-[0.16em] text-foreground sm:text-3xl ${
                                        revealed ? "animate-shimmer bg-clip-text" : ""
                                    }`}
                                    style={
                                        revealed
                                            ? {
                                                  backgroundImage:
                                                      "linear-gradient(90deg, var(--color-foreground) 0%, var(--color-discount-shimmer-mid) 50%, var(--color-foreground) 100%)",
                                                  WebkitBackgroundClip: "text",
                                                  WebkitTextFillColor: "transparent"
                                              }
                                            : undefined
                                    }
                                >
                                    {discountCode}
                                </span>
                                <span className="mt-2 text-[0.55rem] font-medium uppercase tracking-[0.28em] text-muted-foreground/80 sm:text-[0.6rem]">
                                    Enter at checkout
                                </span>
                            </div>

                            {!revealed && (
                                <canvas
                                    ref={canvasRef}
                                    aria-hidden="true"
                                    className="absolute inset-0 h-full w-full cursor-grab touch-none active:cursor-grabbing"
                                    onPointerDown={onPointerDown}
                                    onPointerMove={onPointerMove}
                                    onPointerUp={onPointerUp}
                                    onPointerCancel={onPointerUp}
                                />
                            )}
                        </div>

                        {/* Action row — meta caption left + outline pill CTA right.
                            Pill + ArrowUpRight + tracking-[0.22em] is a verbatim reuse of
                            the FeaturedProductSpotlight "View featured product" button —
                            the dialog's CTA now visually rhymes with the homepage's. */}
                        <div className="mt-6 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <span className="text-[0.6rem] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                                Single use · Auto-applies
                            </span>
                            <Button
                                onClick={() => {
                                    void copyCode();
                                }}
                                disabled={!revealed}
                                size="lg"
                                className="group/btn rounded-[var(--radius-pill-raw)] uppercase tracking-[0.22em] text-xs sm:text-sm h-11 px-6"
                                aria-label={
                                    revealed
                                        ? `Copy discount code ${discountCode}`
                                        : "Scratch the card to reveal your code"
                                }
                            >
                                {copied ? "Copied to clipboard" : revealed ? "Copy code" : "Scratch to reveal"}
                                <ArrowUpRight
                                    aria-hidden="true"
                                    className="size-4 transition-transform duration-300 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5"
                                />
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
