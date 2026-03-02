import {GiantText} from "~/components/common/GiantText";
import {cn} from "~/lib/utils";

type ShopAllHeroProps = {
    title?: string;
    subtitle?: string;
};

export const ShopAllHero = ({
    title = "All Products",
    subtitle = "Discover our complete collection of premium products, carefully curated for exceptional quality and design."
}: ShopAllHeroProps) => {
    return (
        <section className="relative overflow-hidden py-8">
            <div className="bg-background absolute inset-0 z-0" />

            <div className="relative z-10 mx-auto max-w-[2000px] px-2 md:px-4">
                <div className="flex w-full flex-col items-center justify-center gap-2 text-center xl:gap-4">
                    <GiantText
                        text={title}
                        className={cn(
                            "text-foreground w-full font-black",
                            title.length <= 7 ? "lg:w-[30%]" : "lg:w-[60%]"
                        )}
                    />

                    <p className="text-muted-foreground w-full text-xs lg:w-[60%] lg:text-sm 2xl:text-base">
                        {subtitle}
                    </p>
                </div>
            </div>
        </section>
    );
};
