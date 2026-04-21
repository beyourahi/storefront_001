import {Link} from "react-router";
import {Image} from "@shopify/hydrogen";
import {cn} from "~/lib/utils";
import {formatArticleDateShort, calculateReadingTime} from "~/lib/blog-utils";
import {Badge} from "~/components/ui/badge";
import {ArrowRight} from "lucide-react";

export interface ArticleHeroData {
    handle: string;
    title: string;
    excerpt?: string | null;
    excerptHtml?: string | null;
    content?: string | null;
    contentHtml?: string | null;
    publishedAt: string;
    tags?: string[];
    image?: {
        url: string;
        altText?: string | null;
        width?: number | null;
        height?: number | null;
    } | null;
    blog: {
        handle: string;
        title?: string | null;
    };
    author?: {
        name?: string | null;
    } | null;
}

interface ArticleHeroProps {
    article: ArticleHeroData;
    variant?: "listing" | "detail";
    showReadMore?: boolean;
    className?: string;
}

export const ArticleHero = ({article, variant = "listing", showReadMore = true, className}: ArticleHeroProps) => {
    const {handle, title, content, contentHtml, publishedAt, tags, image, blog, author} = article;

    const articleUrl = `/blogs/${blog.handle}/${handle}`;
    const publishedDate = formatArticleDateShort(publishedAt);
    const readingContent = contentHtml || content || "";
    const readingMinutes = readingContent ? calculateReadingTime(readingContent) : null;

    if (variant === "listing") {
        // Entire card is a single Link. The "Read Article" element is a visual
        // pseudo-button (not a nested <a>), animated via group-hover.
        return (
            <Link
                to={articleUrl}
                prefetch="viewport"
                aria-label={`Read article: ${title}`}
                className={cn(
                    "group sleek relative block overflow-hidden rounded-xl",
                    "focus-visible:ring-primary/40 focus-visible:ring-2 focus-visible:ring-offset-2",
                    "no-underline",
                    className
                )}
            >
                <div className="relative aspect-[4/5] sm:aspect-[16/10] md:aspect-[21/9]">
                    {image ? (
                        <>
                            <Image
                                alt={image.altText || title}
                                data={image}
                                loading="eager"
                                sizes="100vw"
                                className="sleek absolute inset-0 h-full w-full object-cover group-hover:scale-[1.03]"
                            />
                            <div className="from-dark/90 via-dark/45 absolute inset-0 bg-gradient-to-t to-transparent sm:via-dark/35 sm:from-dark/85" />
                        </>
                    ) : (
                        <div className="bg-muted absolute inset-0 h-full w-full" />
                    )}

                    <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 md:p-10 lg:p-12">
                        <div className="max-w-3xl space-y-3 sm:space-y-3">
                            {tags && tags.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                    {tags.slice(0, 3).map(tag => (
                                        <Badge key={tag} variant="secondary" className="pointer-events-none text-xs">
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            )}
                            <h2 className="hero-title-fluid text-light leading-tight">{title}</h2>
                            <p className="text-light/80 font-mono text-xs sm:text-sm">
                                {author?.name && <>{author.name} · </>}
                                {publishedDate}
                                {readingMinutes && <> · {readingMinutes} min</>}
                            </p>
                            {showReadMore && (
                                <div className="pt-2 sm:pt-3">
                                    <span
                                        className={cn(
                                            "sleek inline-flex items-center gap-2 rounded-md px-4 py-2 sm:px-5 sm:py-2.5",
                                            "bg-primary text-primary-foreground",
                                            "text-sm font-medium sm:text-base",
                                            "group-hover:bg-primary/90 group-hover:-translate-y-0.5 group-hover:shadow-lg"
                                        )}
                                        aria-hidden="true"
                                    >
                                        Read Article
                                        <ArrowRight className="sleek ml-0 h-4 w-4 group-hover:translate-x-0.5" />
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </Link>
        );
    }

    return (
        <div className={cn("relative overflow-hidden rounded-xl md:rounded-2xl", className)}>
            {image && (
                <div className="aspect-[16/9] relative">
                    <Image
                        alt={image.altText || title}
                        data={image}
                        loading="eager"
                        sizes="(min-width: 1280px) 1024px, (min-width: 768px) 90vw, 100vw"
                        className="h-full w-full object-cover absolute inset-0"
                    />
                    <div
                        className="absolute inset-x-0 bottom-0 h-24 pointer-events-none"
                        style={{background: "linear-gradient(to top, var(--color-background), transparent)"}}
                        aria-hidden="true"
                    />
                </div>
            )}
        </div>
    );
};
