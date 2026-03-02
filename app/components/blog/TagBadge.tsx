import {Link} from "react-router";
import {Badge} from "~/components/ui/badge";
import {cn} from "~/lib/utils";
import {slugify} from "~/lib/blog-utils";

interface TagBadgeProps {
    tag: string;
    href?: string;
    variant?: "default" | "outline" | "muted";
    size?: "sm" | "default";
    className?: string;
    blogHandle?: string;
}

export const TagBadge = ({tag, href, variant = "outline", size = "default", className, blogHandle}: TagBadgeProps) => {
    const linkHref = href ?? (blogHandle ? `/blogs/${blogHandle}?tag=${slugify(tag)}` : undefined);

    const badgeClassName = cn(
        "rounded-full font-medium transition-colors whitespace-nowrap",
        size === "sm"
            ? "px-2 sm:px-2.5 py-0.5 sm:py-1 text-sm sm:text-sm"
            : "px-2.5 sm:px-3 py-1 sm:py-1.5 text-sm sm:text-sm",
        linkHref && "min-h-8 sm:min-h-9 inline-flex items-center",
        variant === "default" && "bg-primary text-primary-foreground",
        variant === "outline" && "border-2 border-primary/40 text-primary bg-transparent hover:bg-primary/10",
        variant === "muted" && "bg-muted/60 text-muted-foreground",
        linkHref && "cursor-pointer",
        className,
    );

    if (linkHref) {
        return (
            <Link to={linkHref} prefetch="viewport" className="no-underline cursor-pointer">
                <Badge variant="outline" className={badgeClassName}>
                    {tag}
                </Badge>
            </Link>
        );
    }

    return (
        <Badge variant="outline" className={badgeClassName}>
            {tag}
        </Badge>
    );
};

interface TagListProps {
    tags: string[];
    limit?: number;
    variant?: "default" | "outline" | "muted";
    size?: "sm" | "default";
    blogHandle?: string;
    className?: string;
}

export const TagList = ({tags, limit, variant = "outline", size = "default", blogHandle, className}: TagListProps) => {
    const displayTags = limit ? tags.slice(0, limit) : tags;
    const remaining = limit && tags.length > limit ? tags.length - limit : 0;

    if (displayTags.length === 0) return null;

    return (
        <div
            className={cn("flex flex-wrap gap-1 sm:gap-1.5 md:gap-2", className)}
            role="list"
            aria-label="Article tags"
        >
            {displayTags.map(tag => (
                <TagBadge key={tag} tag={tag} variant={variant} size={size} blogHandle={blogHandle} />
            ))}
            {remaining > 0 && (
                <span className="text-sm sm:text-sm md:text-sm text-muted-foreground self-center ml-0.5 sm:ml-1">
                    +{remaining}
                </span>
            )}
        </div>
    );
};
