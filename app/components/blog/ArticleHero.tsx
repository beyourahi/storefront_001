import {Link} from "react-router";
import {Image} from "@shopify/hydrogen";
import {cn} from "~/lib/utils";
import {formatArticleDateShort, calculateReadingTime} from "~/lib/blog-utils";
import {Badge} from "~/components/ui/badge";
import {Button} from "~/components/ui/button";
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
        return (
            <div className={cn("relative overflow-hidden rounded-xl", className)}>
                <div className="aspect-[21/9] relative">
                    {image ? (
                        <>
                            <Image
                                alt={image.altText || title}
                                data={image}
                                loading="eager"
                                sizes="100vw"
                                className="h-full w-full object-cover absolute inset-0"
                            />
                            <div
                                className="absolute inset-0"
                                style={{background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 60%)"}}
                            />
                        </>
                    ) : (
                        <div className="h-full w-full bg-muted absolute inset-0" />
                    )}
                    <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 lg:p-12">
                        <div className="max-w-3xl space-y-3">
                            {tags && tags.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                    {tags.slice(0, 3).map(tag => (
                                        <Badge
                                            key={tag}
                                            variant="secondary"
                                            className="text-xs pointer-events-none"
                                        >
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            )}
                            <h2 className="hero-title-fluid text-white leading-tight">{title}</h2>
                            <p className="font-mono text-sm text-white/80">
                                {author?.name && <>{author.name} · </>}
                                {publishedDate}
                                {readingMinutes && <> · {readingMinutes} min</>}
                            </p>
                            {showReadMore && (
                                <div className="pt-2">
                                    <Link to={articleUrl} prefetch="viewport" className="no-underline">
                                        <Button
                                            size="lg"
                                        >
                                            Read Article <ArrowRight className="h-4 w-4 ml-2" />
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
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
