import {useEffect, useRef, useState} from "react";

type UseInViewOptions = {
    threshold?: number;
    rootMargin?: string;
    triggerOnce?: boolean;
    delay?: number;
    disabled?: boolean;
};

type UseInViewReturn = {
    ref: React.RefObject<HTMLElement | null>;
    inView: boolean;
    triggerInView: () => void;
};

export const useInView = (options: UseInViewOptions = {}): UseInViewReturn => {
    const {threshold = 0.1, rootMargin = "0px", triggerOnce = true, delay = 0, disabled = false} = options;

    const ref = useRef<HTMLElement | null>(null);
    const [inView, setInView] = useState(disabled);

    const triggerInView = () => {
        setInView(true);
    };

    useEffect(() => {
        if (disabled) {
            setInView(true);
            return;
        }

        const element = ref.current;
        if (!element) return;

        const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        if (prefersReducedMotion) {
            setInView(true);
            return;
        }

        const observer = new IntersectionObserver(
            entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        if (delay > 0) {
                            setTimeout(() => setInView(true), delay);
                        } else {
                            setInView(true);
                        }

                        if (triggerOnce) {
                            observer.disconnect();
                        }
                    } else if (!triggerOnce) {
                        setInView(false);
                    }
                });
            },
            {
                threshold,
                rootMargin
            }
        );

        observer.observe(element);

        return () => {
            observer.disconnect();
        };
    }, [threshold, rootMargin, triggerOnce, delay, disabled]);

    return {ref, inView, triggerInView};
};

export const getStaggerDelay = (index: number, delayIncrement = 40, maxItems = 12): number => {
    return Math.min(index, maxItems - 1) * delayIncrement;
};

export const getStaggerStyle = (index: number, delayIncrement = 40, maxItems = 12): React.CSSProperties => ({
    animationDelay: `${getStaggerDelay(index, delayIncrement, maxItems)}ms`
});

export default useInView;
