import {useState, useEffect} from "react";

/**
 * Returns the current scroll progress as a percentage (0–100).
 * Uses `requestAnimationFrame` to batch DOM reads and a passive scroll listener
 * to avoid blocking the main thread. Used by the reading-progress bar on blog
 * article pages.
 */
export function useScrollProgress(): number {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        let rafId: number;

        const updateProgress = () => {
            const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
            const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrolled = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
            setProgress(Math.min(100, Math.max(0, scrolled)));
        };

        const handleScroll = () => {
            if (rafId) {
                cancelAnimationFrame(rafId);
            }
            rafId = requestAnimationFrame(updateProgress);
        };

        updateProgress();
        window.addEventListener("scroll", handleScroll, {passive: true});

        return () => {
            if (rafId) {
                cancelAnimationFrame(rafId);
            }
            window.removeEventListener("scroll", handleScroll);
        };
    }, []);

    return progress;
}
