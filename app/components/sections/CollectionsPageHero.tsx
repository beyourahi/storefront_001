import {GiantText} from "~/components/common/GiantText";
import {cn} from "~/lib/utils";

type CollectionsPageHeroProps = {
    title?: string;
    subtitle?: string;
};

export const CollectionsPageHero = ({
    title = "All Collections",
    subtitle = "Discover carefully curated collections that showcase the best in design, quality, and craftsmanship. Each collection tells its own unique story of excellence and innovation."
}: CollectionsPageHeroProps) => {
    return (
        <section className="relative overflow-hidden py-8">
            <div className="bg-background absolute inset-0 z-0" />

            <div className="relative z-10 mx-auto max-w-[2000px] px-2 md:px-4">
                <div className="flex w-full flex-col items-center justify-center gap-2 text-center xl:gap-4">
                    <GiantText
                        text={title}
                        className={cn("w-full font-black", title.length <= 7 ? "lg:w-[30%]" : "lg:w-[60%]")}
                    />

                    <p className="text-muted-foreground w-full text-xs lg:w-[60%] lg:text-sm 2xl:text-base">
                        {subtitle}
                    </p>
                </div>
            </div>
        </section>
    );
};
