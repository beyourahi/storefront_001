import {Badge} from "~/components/ui/badge";
import {Card, CardContent, CardHeader, CardTitle} from "~/components/ui/card";
import {cn} from "~/lib/utils";

type PolicySection = {
    title: string;
    content: string;
    index: number;
};

type PolicySectionCardProps = {
    section: PolicySection;
    showIndex?: boolean;
};

export const PolicySectionCard = ({section, showIndex = false}: PolicySectionCardProps) => {
    const hasTitle = section.title.trim();
    const showHeader = hasTitle || showIndex;

    return (
        <Card
            id={`policy-section-${section.index}`}
            className={cn(
                "group bg-card/95 border-border/30 hover:border-primary/40 hover:bg-card/100 hover:shadow-primary/10",
                "relative scroll-mt-8 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            )}
        >
            {showHeader && (
                <CardHeader className="pb-4">
                    <div className="flex items-start gap-3">
                        {showIndex && (
                            <Badge
                                variant="secondary"
                                className="group-hover:bg-primary/20 shrink-0 transition-colors duration-300"
                            >
                                {section.index}
                            </Badge>
                        )}
                        {hasTitle && (
                            <CardTitle className="group-hover:text-primary text-base leading-tight font-semibold transition-colors duration-300 md:text-lg">
                                {section.title}
                            </CardTitle>
                        )}
                    </div>
                </CardHeader>
            )}

            <CardContent className={showHeader ? "pt-0" : ""}>
                {section.content.trim() ? (
                    <div
                        className="prose prose-sm prose-slate max-w-none text-sm leading-relaxed"
                        dangerouslySetInnerHTML={{__html: section.content}}
                    />
                ) : (
                    <p className="text-muted-foreground text-sm italic">No content available for this section.</p>
                )}
            </CardContent>

            <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <div className="from-primary/5 absolute inset-0 bg-gradient-to-br to-transparent" />
            </div>
        </Card>
    );
};
