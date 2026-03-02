import {useEffect, useRef, useState} from "react";

export const useReadingProgress = () => {
    const contentRef = useRef<HTMLDivElement>(null);
    const [progress, setProgress] = useState(0);
    const rafRef = useRef<number>(0);

    useEffect(() => {
        const element = contentRef.current;
        if (!element) return;

        const calculateProgress = () => {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = requestAnimationFrame(() => {
                const rect = element.getBoundingClientRect();
                const elementTop = rect.top + window.scrollY;
                const elementHeight = rect.height;
                const scrollPosition = window.scrollY + window.innerHeight;
                const start = elementTop;
                const end = elementTop + elementHeight;

                if (scrollPosition <= start) {
                    setProgress(0);
                } else if (scrollPosition >= end) {
                    setProgress(100);
                } else {
                    const pct = ((scrollPosition - start) / (end - start)) * 100;
                    setProgress(Math.min(100, Math.max(0, pct)));
                }
            });
        };

        window.addEventListener("scroll", calculateProgress, {passive: true});
        window.addEventListener("resize", calculateProgress, {passive: true});
        calculateProgress();

        return () => {
            window.removeEventListener("scroll", calculateProgress);
            window.removeEventListener("resize", calculateProgress);
            cancelAnimationFrame(rafRef.current);
        };
    }, []);

    return {contentRef, progress};
};
