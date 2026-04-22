import {Badge} from "~/components/ui/badge";
import {cn} from "~/lib/utils";
import {filterDisplayTags} from "~/lib/product-tags";

type ProductTagBadgesProps = {
    tags: string[] | undefined | null;
    className?: string;
};

/**
 * Renders customer-facing product tags as outlined badges in a consistent,
 * shared format. Used directly above product titles across the PDP, quick-add
 * sheet, and quick-add dialog so the visual hierarchy stays uniform.
 *
 * Special system tags (premium, preorder, etc.) are filtered out via
 * `filterDisplayTags` — those surface separately through `ProductBadgeStack`.
 */
export function ProductTagBadges({tags, className}: ProductTagBadgesProps) {
    const displayTags = filterDisplayTags(tags);

    if (displayTags.length === 0) return null;

    return (
        <div className={cn("flex flex-wrap gap-1.5", className)} aria-label="Product tags">
            {displayTags.map(tag => (
                <Badge
                    key={tag}
                    variant="outline"
                    className="border text-primary font-semibold uppercase tracking-wide text-xs px-2 py-0.5"
                >
                    {tag}
                </Badge>
            ))}
        </div>
    );
}
