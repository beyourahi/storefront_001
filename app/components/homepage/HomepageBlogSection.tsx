import {Link} from "react-router";
import {ArrowRight} from "lucide-react";
import {ArticleCard, type ArticleCardData} from "~/components/blog/ArticleCard";
import {Skeleton} from "~/components/ui/skeleton";
import {Button} from "~/components/ui/button";

interface HomepageBlogSectionProps {
    articles: ArticleCardData[];
    loading?: boolean;
}

const SKELETON_COUNT = 3;

const SectionHeader = () => (
    <div className="mb-8 md:mb-12">
        <div className="flex items-center gap-4 md:gap-6">
            <div className="flex flex-col items-start gap-1">
                <h2 className="text-foreground font-serif text-xl font-bold uppercase md:text-3xl lg:text-4xl">
                    From the
                </h2>
                <p className="text-primary text-left font-serif text-xl font-bold uppercase md:text-3xl lg:text-4xl">
                    Journal
                </p>
            </div>
            <div className="bg-primary relative h-px flex-1 overflow-hidden">
                <div className="bg-primary animate-in slide-in-from-left absolute top-0 left-0 h-full w-full origin-left duration-1000" />
            </div>
            <div className="group relative flex items-center">
                <span className="text-primary font-serif text-4xl leading-none font-bold transition-all duration-500 group-hover:scale-105 md:text-6xl lg:text-7xl">
                    07
                </span>
                <div className="from-primary to-primary absolute right-0 -bottom-1 left-0 mx-auto h-0.5 w-0 bg-gradient-to-r transition-all duration-500 group-hover:w-full" />
            </div>
        </div>
    </div>
);

const ArticleCardSkeleton = () => (
    <div className="pointer-events-none space-y-3 sm:space-y-4">
        <Skeleton className="aspect-video w-full rounded-xl sm:rounded-2xl" />
        <div className="space-y-2 sm:space-y-3">
            <Skeleton className="h-5 w-16 rounded-full" />
            <div className="space-y-1.5">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-3/4" />
            </div>
            <div className="space-y-1">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
            </div>
            <Skeleton className="h-4 w-1/3" />
        </div>
    </div>
);

export const HomepageBlogSection = ({articles, loading = false}: HomepageBlogSectionProps) => {
    if (!loading && articles.length === 0) return null;

    return (
        <section className="bg-background py-16">
            <div className="mx-auto max-w-[2000px] px-2 md:px-4">
                <SectionHeader />

                {loading ? (
                    <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-3">
                        {Array.from({length: SKELETON_COUNT}, (_, i) => (
                            <ArticleCardSkeleton key={i} />
                        ))}
                    </div>
                ) : (
                    <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-3 md:mb-12">
                        {articles.slice(0, 6).map((article, index) => (
                            <ArticleCard
                                key={article.handle}
                                article={article}
                                loading={index < 3 ? "eager" : "lazy"}
                                variant="default"
                                index={index}
                            />
                        ))}
                    </div>
                )}

                <div className="flex justify-center">
                    <Button size="lg" asChild className="w-[80vw] sm:w-auto">
                        <Link
                            to="/blogs"
                            aria-label="View all blog posts"
                            className="flex items-center gap-2 px-10 leading-none"
                        >
                            View All Posts <ArrowRight className="h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </div>
        </section>
    );
};
