/**
 * @fileoverview Policy Section Card Component
 *
 * @description
 * Renders an individual policy section with:
 * - Optional section number badge
 * - Section title
 * - HTML content with prose styling
 * - Gradient hover overlay
 * - Lift animation on hover
 * - Border color transition
 *
 * @design
 * - Card wrapper with semi-transparent background
 * - Blue primary color highlight on hover
 * - Smooth 300ms transitions
 * - Gradient overlay effect
 * - Responsive typography
 *
 * @security
 * HTML content is rendered via dangerouslySetInnerHTML from Shopify's
 * ShopPolicy.body field. This is safe because:
 * 1. Content is authored by the store owner in Shopify admin
 * 2. Shopify sanitizes and validates all policy content
 * 3. This is a trusted first-party source, not user-generated content
 */

import {Badge} from "~/components/ui/badge";
import {Card, CardContent, CardHeader, CardTitle} from "~/components/ui/card";
import {cn} from "~/lib/utils";

export type PolicySection = {
    title: string;
    content: string;
    index: number;
};

type PolicySectionCardProps = {
    section: PolicySection;
    showIndex?: boolean;
};

/** Collapse inter-tag whitespace to prevent SSR/client hydration mismatches. */
const normalizeHtml = (html: string): string =>
    html.replace(/>\s+</g, "><").trim();

export const PolicySectionCard = ({section, showIndex = false}: PolicySectionCardProps) => {
    const hasTitle = section.title.trim().length > 0;
    const hasContent = section.content.trim().length > 0;

    return (
        <Card
            id={`policy-section-${section.index}`}
            className={cn(
                "group sleek relative overflow-hidden scroll-mt-8",
                "bg-card/95 border-border/30",
                "hover:border-primary/40 hover:bg-card/100 hover:shadow-primary/10",
                "hover:-translate-y-1 hover:shadow-lg"
            )}
        >
            {(hasTitle || showIndex) && (
                <CardHeader className="pb-4">
                    <div className="flex items-start gap-3">
                        {showIndex && (
                            <Badge
                                variant="secondary"
                                className="shrink-0 sleek group-hover:bg-primary/20"
                            >
                                {section.index}
                            </Badge>
                        )}
                        {hasTitle && (
                            <CardTitle className="text-base leading-tight font-semibold sleek md:text-lg group-hover:text-primary">
                                {section.title}
                            </CardTitle>
                        )}
                    </div>
                </CardHeader>
            )}

            <CardContent className={hasTitle || showIndex ? "pt-0" : ""}>
                {hasContent ? (
                    <div
                        className="prose prose-sm prose-slate max-w-none text-sm leading-relaxed"
                        /* Shopify-provided HTML from trusted admin source (see @security JSDoc) */
                        dangerouslySetInnerHTML={{__html: normalizeHtml(section.content)}}
                    />
                ) : (
                    <p className="text-muted-foreground text-sm italic">No content available for this section.</p>
                )}
            </CardContent>

            {/* Subtle gradient overlay on hover */}
            <div className="pointer-events-none absolute inset-0 opacity-0 sleek group-hover:opacity-100">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
            </div>
        </Card>
    );
};
