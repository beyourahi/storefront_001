import {useState, useEffect} from "react";
import {cn} from "~/lib/utils";

type LoadingScreenProps = {
    shopName?: string;
    shopSlogan?: string;
};

export const LoadingScreen = ({
    shopName = "Shop",
    shopSlogan = "Premium e-commerce experience"
}: LoadingScreenProps) => {
    const [progress, setProgress] = useState(0);
    const [isComplete, setIsComplete] = useState(false);
    const [shouldRender, setShouldRender] = useState(true);

    useEffect(() => {
        const startTime = Date.now();
        const duration = 500;
        let animationId: number;

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const nextProgress = Math.min((elapsed / duration) * 100, 100);
            setProgress(nextProgress);

            if (nextProgress >= 100) {
                setIsComplete(true);
                setTimeout(() => {
                    setShouldRender(false);
                }, 500);
            } else {
                animationId = requestAnimationFrame(animate);
            }
        };

        animationId = requestAnimationFrame(animate);

        return () => {
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
        };
    }, []);

    if (!shouldRender) return null;

    return (
        <div
            className={cn(
                "bg-background fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-500",
                isComplete ? "pointer-events-none opacity-0" : "opacity-100"
            )}
        >
            <div className="relative flex flex-col items-center justify-center gap-8">
                <div className="relative">
                    <svg className="pointer-events-none h-32 w-32" viewBox="0 0 100 100">
                        <circle className="stroke-primary/20" strokeWidth="4" fill="none" cx="50" cy="50" r="44" />
                        <circle
                            className="stroke-primary"
                            strokeWidth="4"
                            fill="none"
                            cx="50"
                            cy="50"
                            r="44"
                            strokeLinecap="round"
                            strokeDasharray={`${progress * 2.76}, 1000`}
                            transform="rotate(-90 50 50)"
                        />
                    </svg>

                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-primary font-mono text-lg font-bold">
                            {Math.round(progress)}%
                        </span>
                    </div>
                </div>

                <div className="text-center">
                    <h1 className="text-primary mb-2 animate-pulse text-2xl font-extrabold tracking-wider uppercase sm:text-3xl">
                        {shopName}
                    </h1>
                    <p className="text-muted-foreground text-sm">{shopSlogan}</p>
                </div>
            </div>
        </div>
    );
};
