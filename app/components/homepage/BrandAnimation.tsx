import {createContext, useContext, useState, useEffect, useRef, type ReactNode} from "react";

import {useSiteSettings} from "~/lib/site-content-context";

interface MeasuredPositions {
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
    fontSize: number;
    endX: number;
    endY: number;
    endScale: number;
}

interface BrandAnimationContextValue {
    progress: number;
    isComplete: boolean;
    heroRef: React.MutableRefObject<HTMLElement>;
    isHomePage: boolean;
    setIsHomePage: (value: boolean) => void;
}

const HEADER_HEIGHT = 68;
const ANNOUNCEMENT_HEIGHT = 32;
const ANNOUNCEMENT_GAP = 8;
const HEADER_PADDING_TOP_SM = 8;
const HEADER_PADDING_TOP_MOBILE = 0;
const HEADER_TEXT_SIZE_MOBILE = 24;
const HEADER_TEXT_SIZE_SM = 30;
const SM_BREAKPOINT = 640;

const ANIMATION_DAMPING_DOWN = 0.12;
const ANIMATION_DAMPING_UP = 0.12;

const BrandAnimationContext = createContext<BrandAnimationContextValue | null>(null);

export function BrandAnimationProvider({children}: {children: ReactNode}) {
    const heroRef = useRef<HTMLElement>(null!);
    const [heroHeight, setHeroHeight] = useState(0);
    const [isHomePage, setIsHomePage] = useState(false);
    const [dampedProgress, setDampedProgress] = useState(0);
    const dampedProgressRef = useRef(0);
    const rafRef = useRef<number | null>(null);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const measureHero = () => {
            if (heroRef.current) {
                setHeroHeight(heroRef.current.offsetHeight);
            }
        };

        requestAnimationFrame(measureHero);

        window.addEventListener("resize", measureHero);
        return () => window.removeEventListener("resize", measureHero);
    }, []);

    const endOffset = Math.max(heroHeight, 100);

    const [targetProgress, setTargetProgress] = useState(0);
    const [isComplete, setIsComplete] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const updateProgress = () => {
            const scrollY = window.scrollY;
            const progress = Math.min(1, scrollY / endOffset);
            setTargetProgress(progress);
            setIsComplete(scrollY >= endOffset);
        };

        updateProgress();
        window.addEventListener("scroll", updateProgress, {passive: true});
        return () => window.removeEventListener("scroll", updateProgress);
    }, [endOffset]);

    useEffect(() => {
        if (typeof window === "undefined") return;

        let lastTime = performance.now();

        const animate = (currentTime: number) => {
            const deltaTime = currentTime - lastTime;
            lastTime = currentTime;

            const diff = targetProgress - dampedProgressRef.current;

            const baseDamping = diff > 0 ? ANIMATION_DAMPING_DOWN : ANIMATION_DAMPING_UP;

            const frameDamping = 1 - Math.pow(1 - baseDamping, deltaTime / 16.67);

            dampedProgressRef.current += diff * frameDamping;

            if (Math.abs(diff) < 0.0001) {
                dampedProgressRef.current = targetProgress;
            }

            setDampedProgress(dampedProgressRef.current);
            rafRef.current = requestAnimationFrame(animate);
        };

        rafRef.current = requestAnimationFrame(animate);

        return () => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
        };
    }, [targetProgress]);

    const value = {progress: dampedProgress, isComplete, heroRef, isHomePage, setIsHomePage};

    return <BrandAnimationContext.Provider value={value}>{children}</BrandAnimationContext.Provider>;
}

export function useBrandAnimation() {
    const context = useContext(BrandAnimationContext);
    if (!context) {
        throw new Error("useBrandAnimation must be used within BrandAnimationProvider");
    }
    return context;
}

function easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
}

function lerp(start: number, end: number, progress: number): number {
    return start + (end - start) * progress;
}

function calculateOptimalFontSize(element: HTMLElement, maxWidth: number): number {
    let min = 1;
    let max = 2500;

    while (min <= max) {
        const mid = Math.floor((min + max) / 2);
        element.style.fontSize = mid + "px";

        if (element.offsetWidth <= maxWidth) {
            min = mid + 1;
        } else {
            max = mid - 1;
        }
    }

    return max;
}

export function AnimatedBrandText() {
    const {progress, heroRef} = useBrandAnimation();
    const {brandName} = useSiteSettings();
    const containerRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLParagraphElement>(null);
    const [positions, setPositions] = useState<MeasuredPositions | null>(null);
    const [isClient, setIsClient] = useState(false);
    const [hasMeasured, setHasMeasured] = useState(false);
    const [optimalFontSize, setOptimalFontSize] = useState<number | null>(null);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (!isClient || !containerRef.current || !textRef.current) return;

        const container = containerRef.current;
        const textElement = textRef.current;

        const updateFontSize = () => {
            const containerWidth = container.offsetWidth;
            const newFontSize = calculateOptimalFontSize(textElement, containerWidth);
            setOptimalFontSize(newFontSize);
        };

        const timeoutId = setTimeout(updateFontSize, 50);

        const resizeObserver = new ResizeObserver(updateFontSize);
        resizeObserver.observe(container);

        return () => {
            clearTimeout(timeoutId);
            resizeObserver.disconnect();
        };
    }, [isClient, brandName]);

    useEffect(() => {
        if (!isClient || optimalFontSize === null) return;

        const calculatePositions = () => {
            if (!textRef.current || !heroRef.current || optimalFontSize === null) return;

            const textRect = textRef.current.getBoundingClientRect();
            const fontSize = optimalFontSize;

            const startX = textRect.left;
            const startY = textRect.top + window.scrollY;
            const startWidth = textRect.width;
            const startHeight = textRect.height;

            const viewportWidth = window.innerWidth;

            const targetTextSize = viewportWidth < SM_BREAKPOINT ? HEADER_TEXT_SIZE_MOBILE : HEADER_TEXT_SIZE_SM;
            const endScale = targetTextSize / fontSize;

            const scaledWidth = startWidth * endScale;

            const endX = (viewportWidth - scaledWidth) / 2;

            const scaledHeight = startHeight * endScale;
            const headerPaddingTop = viewportWidth < SM_BREAKPOINT ? HEADER_PADDING_TOP_MOBILE : HEADER_PADDING_TOP_SM;
            const endY = ANNOUNCEMENT_HEIGHT + ANNOUNCEMENT_GAP + headerPaddingTop + (HEADER_HEIGHT - scaledHeight) / 2;

            setPositions({
                startX,
                startY,
                startWidth,
                startHeight,
                fontSize,
                endX,
                endY,
                endScale: Math.max(0.05, endScale)
            });
            setHasMeasured(true);
        };

        const timeoutId = setTimeout(() => {
            requestAnimationFrame(calculatePositions);
        }, 100);

        window.addEventListener("resize", calculatePositions);
        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener("resize", calculatePositions);
        };
    }, [isClient, optimalFontSize, heroRef]);

    if (!isClient) {
        return null;
    }

    if (!hasMeasured) {
        return (
            <div ref={containerRef} className="absolute inset-x-0 bottom-2 overflow-hidden">
                <p
                    ref={textRef}
                    className="font-serif text-light/20 uppercase tracking-wider whitespace-nowrap leading-none w-fit"
                    style={optimalFontSize ? {fontSize: `${optimalFontSize}px`} : {fontSize: "10vw"}}
                >
                    {brandName}
                </p>
            </div>
        );
    }

    if (!positions) {
        return null;
    }

    const easedProgress = easeOutCubic(progress);
    const scrollY = window.scrollY;

    const naturalViewportY = positions.startY - scrollY;

    const currentX = lerp(positions.startX, positions.endX, easedProgress);
    const currentY = lerp(naturalViewportY, positions.endY, easedProgress);
    const currentScale = lerp(1, positions.endScale, easedProgress);
    const currentOpacity = lerp(0.2, 1, easedProgress);

    return (
        <p
            className="fixed left-0 top-0 font-serif uppercase tracking-wider whitespace-nowrap leading-none pointer-events-none"
            style={{
                fontSize: `${positions.fontSize}px`,
                color: `rgba(255, 255, 255, ${currentOpacity})`,
                transform: `translate3d(${currentX}px, ${currentY}px, 0) scale(${currentScale})`,
                transformOrigin: "left top",
                willChange: "transform, opacity",
                backfaceVisibility: "hidden",
                zIndex: 100
            }}
        >
            {brandName}
        </p>
    );
}
