import {useCallback, useEffect, useRef, useState, type ReactNode} from "react";
import {useLenisScroll} from "~/lib/LenisProvider";
import {cn} from "~/lib/utils";

const MOBILE_OR_COARSE_QUERY = "(max-width: 767px), (pointer: coarse)";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

type ParallaxLayerProps = {
    children: ReactNode;
    className?: string;
    contentClassName?: string;
    amplitude?: number;
    mobileAmplitude?: number;
    scale?: number;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

/**
 * Scroll-driven parallax wrapper powered by Lenis. The inner content element
 * is pre-scaled by `scale` (default 1.06) to keep the edges hidden as the
 * layer shifts — without this the background edges become visible at the extremes.
 *
 * `translateY` is computed from how far the element's center is from the viewport
 * center (normalized against a "travel window" of 75% viewport height), so the
 * effect is proportional to the element's position in the scroll, not a raw pixel
 * offset. Clipped to ±1 to prevent over-translation on very short pages.
 *
 * Animation is fully suppressed when `prefers-reduced-motion` is set, and the
 * amplitude defaults to 0 on touch/mobile devices (`mobileAmplitude` override
 * available for cases where light parallax on mobile is intentional).
 */
export function ParallaxLayer({
    children,
    className,
    contentClassName,
    amplitude = 24,
    mobileAmplitude = 0,
    scale = 1.06
}: ParallaxLayerProps) {
    const rootRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const [isMobileLike, setIsMobileLike] = useState(false);
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const mobileQuery = window.matchMedia(MOBILE_OR_COARSE_QUERY);
        const motionQuery = window.matchMedia(REDUCED_MOTION_QUERY);
        const syncPreferences = () => {
            setIsMobileLike(mobileQuery.matches);
            setPrefersReducedMotion(motionQuery.matches);
        };

        syncPreferences();

        mobileQuery.addEventListener("change", syncPreferences);
        motionQuery.addEventListener("change", syncPreferences);

        return () => {
            mobileQuery.removeEventListener("change", syncPreferences);
            motionQuery.removeEventListener("change", syncPreferences);
        };
    }, []);

    const effectiveAmplitude = prefersReducedMotion ? 0 : isMobileLike ? mobileAmplitude : amplitude;
    const effectiveScale = effectiveAmplitude > 0 ? scale : 1;

    const updateTransform = useCallback(() => {
        if (typeof window === "undefined") return;

        const root = rootRef.current;
        const content = contentRef.current;

        if (!root || !content) return;

        if (effectiveAmplitude <= 0) {
            content.style.transform = "translate3d(0, 0, 0) scale(1)";
            content.style.willChange = "auto";
            return;
        }

        const rect = root.getBoundingClientRect();
        const viewportHeight = window.innerHeight || 1;
        const distanceFromCenter = rect.top + rect.height / 2 - viewportHeight / 2;
        const travelWindow = Math.max(viewportHeight * 0.75, rect.height);
        const progress = clamp(distanceFromCenter / travelWindow, -1, 1);
        const translateY = -progress * effectiveAmplitude;

        content.style.transform = `translate3d(0, ${translateY.toFixed(2)}px, 0) scale(${effectiveScale})`;
        content.style.willChange = "transform";
    }, [effectiveAmplitude, effectiveScale]);

    useLenisScroll(() => {
        updateTransform();
    });

    useEffect(() => {
        if (typeof window === "undefined") return;

        updateTransform();
        window.addEventListener("resize", updateTransform);

        return () => {
            window.removeEventListener("resize", updateTransform);
        };
    }, [updateTransform]);

    return (
        <div ref={rootRef} data-parallax-root="" className={cn("overflow-hidden", className)}>
            <div
                ref={contentRef}
                data-parallax-content=""
                className={cn("size-full [backface-visibility:hidden]", contentClassName)}
                style={{transform: "translate3d(0, 0, 0) scale(1)"}}
            >
                {children}
            </div>
        </div>
    );
}
