import Lenis from "lenis";

export const SMOOTH_SCROLL = {
    DURATION: 1.2,
    WHEEL_MULTIPLIER: 1,
    TOUCH_MULTIPLIER: 2,
    LERP: 0.1
} as const;

const expoEaseOut = (t: number): number => Math.min(1, 1.001 - Math.pow(2, -10 * t));

export const initSmoothScroll = (): Lenis => {
    const lenis = new Lenis({
        duration: SMOOTH_SCROLL.DURATION,
        easing: expoEaseOut,
        orientation: "vertical",
        smoothWheel: true,
        wheelMultiplier: SMOOTH_SCROLL.WHEEL_MULTIPLIER,
        touchMultiplier: SMOOTH_SCROLL.TOUCH_MULTIPLIER,
        lerp: SMOOTH_SCROLL.LERP,
        autoResize: true,
        anchors: true,
        autoRaf: true
    });

    return lenis;
};
