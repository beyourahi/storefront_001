import {Suspense} from "react";
import {Await} from "react-router";
import {Carousel, CarouselContent, CarouselItem} from "~/components/ui/carousel";
import {ArticleCard, type ArticleCardData} from "~/components/blog/ArticleCard";
import {Skeleton} from "~/components/ui/skeleton";
import {Card, CardContent} from "~/components/ui/card";
import {WheelGesturesPlugin} from "embla-carousel-wheel-gestures";

interface RelatedArticlesProps {
    articles: ArticleCardData[] | Promise<ArticleCardData[] | null>;
    title?: string;
    className?: string;
}

const SKELETON_IDS = ["skeleton-1", "skeleton-2", "skeleton-3", "skeleton-4"] as const;

const RelatedArticlesSkeleton = ({className}: {className?: string}) => {
    return (
        <section className={className}>
            <div className="mb-8 md:mb-12">
                <div className="flex items-center gap-4 md:gap-6">
                    <Skeleton className="h-7 w-48 shrink-0 md:h-10 md:w-64" />
                    <div className="bg-muted h-px flex-1" />
                </div>
            </div>
            <div className="flex gap-2.5 sm:gap-3 md:gap-4 overflow-hidden -mx-2 sm:mx-0 pl-2 sm:pl-0">
                {SKELETON_IDS.map(id => (
                    <Card key={id} className="border-0 shadow-none py-0 overflow-hidden shrink-0 w-[55.5%]">
                        <Skeleton className="aspect-video w-full rounded-xl sm:rounded-2xl" />
                        <CardContent className="p-0 pt-2 sm:pt-3 md:pt-4 space-y-1.5 sm:space-y-2 md:space-y-3">
                            <Skeleton className="h-4 sm:h-5 w-3/4" />
                            <Skeleton className="h-3 sm:h-4 w-full" />
                            <Skeleton className="h-2.5 sm:h-3 w-1/3" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </section>
    );
};

export const RelatedArticles = ({articles, title = "Related Articles", className}: RelatedArticlesProps) => {
    return (
        <Suspense fallback={<RelatedArticlesSkeleton className={className} />}>
            <Await resolve={articles}>
                {resolvedArticles => {
                    if (!resolvedArticles || resolvedArticles.length === 0) return null;

                    return (
                        <section className={className}>
                            <div className="mb-8 md:mb-12">
                                <div className="flex items-center gap-4 md:gap-6">
                                    <h2 className="text-foreground font-serif text-xl font-bold uppercase md:text-3xl lg:text-4xl shrink-0">
                                        {title}
                                    </h2>
                                    <div className="bg-primary relative h-px flex-1 overflow-hidden">
                                        <div className="bg-primary animate-in slide-in-from-left absolute top-0 left-0 h-full w-full origin-left duration-1000" />
                                    </div>
                                </div>
                            </div>
                            <div className="relative -mx-2 sm:mx-0">
                                <Carousel
                                    opts={{align: "start", loop: true, dragFree: true}}
                                    plugins={[WheelGesturesPlugin()]}
                                    className="w-full"
                                >
                                    <CarouselContent className="-ml-2.5 sm:-ml-3 md:-ml-4 pl-4 sm:pl-0">
                                        {resolvedArticles.slice(0, 8).map((article, index) => (
                                            <CarouselItem
                                                key={article.handle}
                                                className="pl-2.5 sm:pl-3 md:pl-4 basis-[80%] sm:basis-[45%] lg:basis-[32%] xl:basis-[27%] 2xl:basis-[22%]"
                                            >
                                                <ArticleCard
                                                    article={article}
                                                    index={index}
                                                    variant="default"
                                                    loading={index < 4 ? "eager" : "lazy"}
                                                    showTags={false}
                                                />
                                            </CarouselItem>
                                        ))}
                                    </CarouselContent>
                                </Carousel>
                            </div>
                        </section>
                    );
                }}
            </Await>
        </Suspense>
    );
};
