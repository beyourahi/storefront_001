import {type ReactNode} from "react";
import {useInView} from "~/hooks/useInView";
import {cn} from "~/lib/utils";

type AnimationType =
    | "slide-up"
    | "slide-down"
    | "slide-left"
    | "slide-right"
    | "fade"
    | "scale"
    | "blur"
    | "flip"
    | "rotate"
    | "none";

interface AnimatedSectionProps {
    children: ReactNode;
    animation?: AnimationType;
    delay?: number;
    duration?: number;
    once?: boolean;
    threshold?: number;
    stagger?: number;
    staggerDelay?: number;
    className?: string;
}

const animationClasses: Record<AnimationType, string> = {
    "slide-up": "translate-y-8 opacity-0",
    "slide-down": "-translate-y-8 opacity-0",
    "slide-left": "translate-x-8 opacity-0",
    "slide-right": "-translate-x-8 opacity-0",
    fade: "opacity-0",
    scale: "scale-95 opacity-0",
    blur: "blur-sm opacity-0",
    flip: "rotate-x-90 opacity-0",
    rotate: "rotate-6 opacity-0",
    none: ""
};

const animationTransitions: Record<AnimationType, string> = {
    "slide-up": "transition-all duration-700 ease-out",
    "slide-down": "transition-all duration-700 ease-out",
    "slide-left": "transition-all duration-700 ease-out",
    "slide-right": "transition-all duration-700 ease-out",
    fade: "transition-opacity duration-700 ease-out",
    scale: "transition-all duration-700 ease-out",
    blur: "transition-all duration-700 ease-out",
    flip: "transition-all duration-700 ease-out",
    rotate: "transition-all duration-700 ease-out",
    none: ""
};

export function AnimatedSection({
    children,
    animation = "fade",
    delay = 0,
    duration = 700,
    once = true,
    threshold = 0.1,
    stagger: _stagger = 0,
    staggerDelay: _staggerDelay = 100,
    className
}: AnimatedSectionProps) {
    const {ref, inView} = useInView({
        threshold,
        triggerOnce: once,
        delay
    });

    const baseClasses = animationClasses[animation];
    const transitionClasses = animationTransitions[animation];

    const finalClasses = cn(
        baseClasses,
        transitionClasses,
        inView && "!translate-x-0 !translate-y-0 !scale-100 !rotate-0 !opacity-100 !blur-none",
        "motion-reduce:!transition-none motion-reduce:!translate-x-0 motion-reduce:!translate-y-0 motion-reduce:!scale-100 motion-reduce:!rotate-0 motion-reduce:!opacity-100 motion-reduce:!blur-none",
        className
    );

    return (
        <div
            ref={ref as any}
            className={finalClasses}
            style={{
                transitionDuration: `${duration}ms`,
                transitionDelay: `${delay}ms`
            }}
        >
            {children}
        </div>
    );
}
