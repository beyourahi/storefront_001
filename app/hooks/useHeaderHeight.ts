import {useEffect, useRef} from "react";

interface UseHeaderHeightOptions {
    /**
     * The CSS custom property name to update (e.g., "--announcement-height")
     */
    variableName: string;

    /**
     * Whether the hook should actively measure and update the height
     * @default true
     */
    enabled?: boolean;

    /**
     * Debounce delay in milliseconds for height updates
     * @default 0 (no debounce)
     */
    debounceMs?: number;
}

/**
 * Custom hook that measures an element's height and updates a CSS custom property.
 *
 * Uses ResizeObserver for accurate height tracking that responds to:
 * - Initial render
 * - Content changes (text wrapping, dynamic content)
 * - Window resize
 * - Font loading
 *
 * The CSS variable is automatically reset to "0px" when the component unmounts,
 * ensuring proper cleanup and preventing stale values.
 *
 * @example
 * ```tsx
 * function Header() {
 *   const headerRef = useHeaderHeight<HTMLElement>({
 *     variableName: "--header-height",
 *     enabled: true
 *   });
 *
 *   return <header ref={headerRef}>...</header>;
 * }
 * ```
 *
 * @param options - Configuration options
 * @returns A React ref to attach to the element you want to measure
 */
export function useHeaderHeight<T extends HTMLElement = HTMLElement>(
    options: UseHeaderHeightOptions
) {
    const {variableName, enabled = true, debounceMs = 0} = options;
    const ref = useRef<T>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!enabled || !ref.current) return;

        const element = ref.current as HTMLElement;

        const updateHeight = (height: number) => {
            document.documentElement.style.setProperty(variableName, `${height}px`);
        };

        const handleResize = (entries: ResizeObserverEntry[]) => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            const entry = entries[0];
            if (!entry) return;

            const updateFn = () => {
                // Use borderBoxSize for more accurate measurements when available
                const height =
                    entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height;
                updateHeight(height);
            };

            if (debounceMs > 0) {
                timeoutRef.current = setTimeout(updateFn, debounceMs);
            } else {
                updateFn();
            }
        };

        // Initial measurement
        const rect = element.getBoundingClientRect();
        updateHeight(rect.height);

        // Observe resize
        const resizeObserver = new ResizeObserver(handleResize);
        resizeObserver.observe(element);

        // Cleanup: reset to 0px when component unmounts
        return () => {
            resizeObserver.disconnect();
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            document.documentElement.style.setProperty(variableName, "0px");
        };
    }, [variableName, enabled, debounceMs]);

    return ref;
}
