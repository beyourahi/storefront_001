import {useRef, useEffect, useCallback, useLayoutEffect} from "react";
import type {CSSProperties, HTMLAttributes} from "react";
import {cn} from "~/lib/utils";

const MIN_FONT_SIZE = 1;
const MAX_FONT_SIZE = 2500;

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

type GiantTextProps = Omit<HTMLAttributes<HTMLDivElement>, "className" | "style" | "children"> & {
    text: string;
    className?: string;
    textClass?: string;
    style?: CSSProperties;
    /** Semantic HTML tag for the container (default: "div") */
    as?: "div" | "h1" | "h2" | "h3" | "p";
};

/**
 * Fills the full width of its container by binary-searching for the largest font
 * size (between 1px and 2500px) at which the text still fits without wrapping.
 * Uses a `ResizeObserver` and `document.fonts.ready` to re-run the search when
 * the container resizes or custom fonts load. A `mountedRef` guard prevents
 * stale rAF callbacks from firing after unmount.
 */
export const GiantText = ({text, className, textClass, style, as: Tag = "div", ...restProps}: GiantTextProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLSpanElement>(null);
    const rafIdRef = useRef<number | null>(null);
    const mountedRef = useRef(false);

    const resizeText = useCallback((): boolean => {
        const container = containerRef.current;
        const textElement = textRef.current;

        if (!container || !textElement) {
            return false;
        }

        const containerWidth = container.offsetWidth;
        if (containerWidth <= 0) {
            return false;
        }

        let min = MIN_FONT_SIZE;
        let max = MAX_FONT_SIZE;
        let hasPositiveMeasurement = false;

        while (min <= max) {
            const mid = Math.floor((min + max) / 2);
            textElement.style.fontSize = `${mid}px`;

            const textWidth = textElement.offsetWidth;
            if (textWidth > 0) {
                hasPositiveMeasurement = true;
            }

            if (textWidth <= containerWidth) {
                min = mid + 1;
            } else {
                max = mid - 1;
            }
        }

        if (!hasPositiveMeasurement) {
            return false;
        }

        const finalFontSize = Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, max));
        textElement.style.fontSize = `${finalFontSize}px`;
        return true;
    }, []);

    const scheduleResize = useCallback(() => {
        if (!mountedRef.current) {
            return;
        }

        if (rafIdRef.current !== null) {
            cancelAnimationFrame(rafIdRef.current);
        }

        rafIdRef.current = requestAnimationFrame(() => {
            rafIdRef.current = null;

            if (!mountedRef.current) {
                return;
            }

            const measured = resizeText();
            if (!measured && mountedRef.current) {
                rafIdRef.current = requestAnimationFrame(() => {
                    rafIdRef.current = null;
                    if (mountedRef.current) {
                        resizeText();
                    }
                });
            }
        });
    }, [resizeText]);

    useIsomorphicLayoutEffect(() => {
        const container = containerRef.current;
        if (!container) {
            return;
        }

        mountedRef.current = true;

        resizeText();
        scheduleResize();

        const resizeObserver = new ResizeObserver(() => {
            scheduleResize();
        });
        resizeObserver.observe(container);

        void document.fonts?.ready.then(() => {
            if (mountedRef.current) {
                scheduleResize();
            }
        });

        return () => {
            mountedRef.current = false;
            resizeObserver.disconnect();

            if (rafIdRef.current !== null) {
                cancelAnimationFrame(rafIdRef.current);
                rafIdRef.current = null;
            }
        };
    }, [resizeText, scheduleResize]);

    useIsomorphicLayoutEffect(() => {
        scheduleResize();
    }, [text, scheduleResize]);

    return (
        <Tag ref={containerRef as any} className={cn("sleek w-full overflow-hidden", className)} style={style} {...restProps}>
            {/* leading-none is intentional — the binary-search font-size algorithm measures the container height; line-height > 1 would shift the bounding box and produce an incorrect result */}
            <span
                ref={textRef}
                className={cn("text-center leading-none tracking-wider whitespace-nowrap uppercase", textClass)}
            >
                {text}
            </span>
        </Tag>
    );
};
