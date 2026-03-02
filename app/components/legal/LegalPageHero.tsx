/**
 * @fileoverview Legal Page Hero Component
 *
 * @description
 * Hero section for legal pages with:
 * - Large responsive title using GiantText
 * - Optional description text
 * - Centered layout
 * - Responsive typography
 *
 * @design
 * - Container: max-w-[2000px]
 * - Padding: px-2 (mobile), md:px-4 (desktop)
 * - Vertical spacing: py-8
 * - Title width: 30% for short titles (≤7 chars), 60% for longer titles
 * - Description width: 50% on desktop
 * - Typography: uppercase, font-black for title
 */

import {GiantText} from "~/components/common/GiantText";
import {cn} from "~/lib/utils";

type LegalPageHeroProps = {
    title: string;
    description?: string;
};

export const LegalPageHero = ({title, description}: LegalPageHeroProps) => {
    return (
        <section className="py-8">
            <div className="mx-auto max-w-[2000px] px-2 md:px-4">
                <div className="flex w-full flex-col items-center justify-center gap-2 text-center xl:gap-4">
                    <GiantText
                        text={title}
                        className={cn("w-full font-black", title.length <= 7 ? "lg:w-[30%]" : "lg:w-[60%]")}
                    />

                    {description && (
                        <p className="text-muted-foreground w-full text-xs lg:w-1/2 lg:text-sm 2xl:text-base">
                            {description}
                        </p>
                    )}
                </div>
            </div>
        </section>
    );
};
