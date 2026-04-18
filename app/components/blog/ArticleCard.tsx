import {Link} from "react-router";
import {Image} from "@shopify/hydrogen";
import {cn} from "~/lib/utils";
import {formatArticleDateShort, calculateReadingTime, stripHtml} from "~/lib/blog-utils";
import {TagList} from "~/components/blog/TagBadge";
import {Card, CardContent} from "~/components/ui/card";
import {Badge} from "~/components/ui/badge";
import {BookOpen, Clock} from "lucide-react";

export interface ArticleCardData {
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

interface ArticleCardProps {
    article: ArticleCardData;
    loading?: "eager" | "lazy";
    variant?: "default" | "featured" | "compact";
    index?: number;
    className?: string;
    showTags?: boolean;
    showReadingTime?: boolean;
    showAuthor?: boolean;
}

export const ArticleCard = ({
    article,
    loading,
    variant = "default",
    index = 0,
    className,
    showTags = true,
    showReadingTime = true,
    showAuthor = false
}: ArticleCardProps) => {
    const {handle, title, excerpt, excerptHtml, content, contentHtml, publishedAt, tags, image, blog, author} = article;

    const articleUrl = `/blogs/${blog.handle}/${handle}`;
    const publishedDate = formatArticleDateShort(publishedAt);
    const excerptText = excerpt || (excerptHtml ? stripHtml(excerptHtml) : null);
    const readingContent = contentHtml || content || excerpt || (excerptHtml ? stripHtml(excerptHtml) : "") || "";
    const readingMinutes = readingContent ? calculateReadingTime(readingContent) : null;
    const staggerDelay = Math.min(index, 11) * 40;

    if (variant === "compact") {
        return (
            <Link
                to={articleUrl}
                prefetch="viewport"
                className={cn(
                    "flex items-start gap-3 sm:gap-4 py-3 sm:py-4 no-underline group cursor-pointer",
                    "sleek hover:bg-muted/30 rounded-lg px-2 -mx-2",
                    "animate-in fade-in",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2",
                    className
                )}
                style={{animationDelay: `${staggerDelay}ms`}}
            >
                {image && (
                    <div className="relative w-16 sm:w-20 md:w-24 shrink-0 overflow-hidden rounded-lg sm:rounded-xl bg-muted/50">
                        <Image
                            alt={image.altText || title}
                            aspectRatio="4/5"
                            data={image}
                            loading={loading}
                            sizes="(min-width: 768px) 96px, (min-width: 640px) 80px, 64px"
                            className="h-full w-full object-cover sleek group-hover:scale-105"
                        />
                    </div>
                )}

                <div className="flex-1 min-w-0 space-y-0.5 sm:space-y-1">
                    <h3 className="font-serif text-sm sm:text-base font-normal leading-snug text-primary line-clamp-2 group-hover:text-primary/80 sleek">
                        {title}
                    </h3>
                    <p className="text-sm sm:text-sm text-muted-foreground">
                        {publishedDate}
                        {showReadingTime && readingMinutes && <span> · {readingMinutes} min</span>}
                    </p>
                </div>
            </Link>
        );
    }

    if (variant === "featured") {
        return (
            <Link
                to={articleUrl}
                prefetch="viewport"
                className={cn(
                    "block no-underline group animate-in fade-in cursor-pointer",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2",
                    className
                )}
                style={{animationDelay: `${staggerDelay}ms`}}
            >
                {image && (
                    <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-muted/50 mb-4 sm:mb-6">
                        <Image
                            alt={image.altText || title}
                            aspectRatio="16/10"
                            data={image}
                            loading={loading || "eager"}
                            sizes="(min-width: 1024px) 70vw, (min-width: 768px) 80vw, 100vw"
                            className="h-full w-full object-cover sleek group-hover:scale-[1.02]"
                        />
                    </div>
                )}

                <div className="space-y-3 sm:space-y-4">
                    {showTags && tags && tags.length > 0 && (
                        <TagList tags={tags} limit={3} variant="default" size="sm" />
                    )}

                    <h2 className="font-serif text-xl sm:text-2xl md:text-3xl font-normal leading-tight text-primary group-hover:text-primary/80 sleek line-clamp-3">
                        {title}
                    </h2>

                    {excerptText && (
                        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed line-clamp-2 sm:line-clamp-3">
                            {excerptText}
                        </p>
                    )}

                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-sm sm:text-sm text-muted-foreground">
                        {showAuthor && author?.name && (
                            <>
                                <span>{author.name}</span>
                                <span className="text-muted-foreground/50">·</span>
                            </>
                        )}
                        <time dateTime={publishedAt}>{publishedDate}</time>
                        {showReadingTime && readingMinutes && (
                            <>
                                <span className="text-muted-foreground/50">·</span>
                                <span>{readingMinutes} min read</span>
                            </>
                        )}
                    </div>
                </div>
            </Link>
        );
    }

    return (
        <Link
            to={articleUrl}
            prefetch="viewport"
            className={cn(
                "group block no-underline animate-in fade-in cursor-pointer h-full",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2",
                className
            )}
            style={{animationDelay: `${staggerDelay}ms`}}
        >
            <Card className="h-full overflow-hidden group-hover:shadow-md sleek py-0 gap-0">
                <div className="aspect-video overflow-hidden">
                    {image ? (
                        <Image
                            alt={image.altText || title}
                            data={image}
                            loading={loading}
                            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                    ) : (
                        <div className="h-full w-full bg-muted flex items-center justify-center">
                            <BookOpen className="h-8 w-8 text-muted-foreground/40" />
                        </div>
                    )}
                </div>
                <CardContent className="flex flex-col gap-3 p-4">
                    {showTags && tags && tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {tags.slice(0, 6).map(tag => (
                                <Badge key={tag} variant="default" className="text-xs pointer-events-none">
                                    {tag}
                                </Badge>
                            ))}
                            {tags.length > 6 && (
                                <span className="text-xs text-muted-foreground self-center">+{tags.length - 6}</span>
                            )}
                        </div>
                    )}
                    <h3 className="font-serif text-lg font-semibold leading-snug line-clamp-2">{title}</h3>
                    {excerptText && (
                        <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">{excerptText}</p>
                    )}
                    <div className="flex justify-between items-center font-mono text-xs text-muted-foreground border-t border-border mt-auto pt-2">
                        <time dateTime={publishedAt}>{publishedDate}</time>
                        {showReadingTime && readingMinutes && (
                            <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {readingMinutes} min read
                            </span>
                        )}
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
};
