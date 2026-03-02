import {useState, useEffect} from "react";

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
