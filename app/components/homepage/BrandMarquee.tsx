import {cn} from "~/lib/utils";

interface BrandMarqueeProps {
    words: string[];
    className?: string;
}

export function BrandMarquee({words, className}: BrandMarqueeProps) {
    if (!words || words.length === 0) {
        return null;
    }

    const trackContent = (
        <>
            {words.map((word, index) => (
                <span key={word} className="text-4xl sm:text-5xl md:text-6xl font-serif uppercase tracking-wide">
                    {word}
                </span>
            ))}
        </>
    );

    return (
        <section
            className={cn(
                "w-full py-12 sm:py-16 md:py-20 overflow-hidden bg-background",
                "pointer-events-none",
                className
            )}
            aria-label="Brand values"
        >
            <div className="flex gap-8 sm:gap-12 md:gap-16 items-center whitespace-nowrap">
                <div
                    className={cn(
                        "flex gap-8 sm:gap-12 md:gap-16 items-center shrink-0",
                        "animate-marquee motion-reduce:animate-none",
                        "hover:pause-animation active:pause-animation"
                    )}
                    aria-hidden="true"
                >
                    {trackContent}
                </div>

                <div
                    className={cn(
                        "flex gap-8 sm:gap-12 md:gap-16 items-center shrink-0",
                        "animate-marquee motion-reduce:animate-none",
                        "hover:pause-animation active:pause-animation"
                    )}
                    aria-hidden="true"
                >
                    {trackContent}
                </div>
            </div>
        </section>
    );
}
