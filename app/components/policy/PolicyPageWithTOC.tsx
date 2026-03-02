import {useState} from "react";
import {PolicySectionCard} from "~/components/policy/PolicySectionCard";
import {PolicyTableOfContents} from "~/components/policy/PolicyTableOfContents";

type PolicySection = {
    title: string;
    content: string;
    index: number;
};

type PolicyPageWithTOCProps = {
    sections: PolicySection[];
    showIndexes?: boolean;
};

export const PolicyPageWithTOC = ({sections, showIndexes = false}: PolicyPageWithTOCProps) => {
    const [mobileTocOpen, setMobileTocOpen] = useState(false);

    if (sections.length === 0) {
        return (
            <section className="bg-background py-8">
                <div className="mx-auto max-w-[2000px] px-2 md:px-4">
                    <div className="mx-auto max-w-4xl text-center">
                        <p className="text-muted-foreground text-lg">No policy sections available at this time.</p>
                    </div>
                </div>
            </section>
        );
    }

    if (sections.length === 1) {
        return (
            <section className="bg-background py-8">
                <div className="mx-auto max-w-[2000px] px-2 md:px-4">
                    <div className="mx-auto max-w-4xl">
                        <PolicySectionCard section={sections[0]} showIndex={showIndexes} />
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="bg-background py-8">
            <div className="mx-auto max-w-[2000px] px-2 md:px-4">
                <div className="mx-auto max-w-7xl">
                    <div className="mb-6 block lg:hidden">
                        <div className="group">
                            <button
                                type="button"
                                onClick={() => setMobileTocOpen(!mobileTocOpen)}
                                className="border-border/30 bg-card/95 hover:bg-card/100 flex w-full cursor-pointer items-center justify-between rounded-md border p-4 transition-colors"
                            >
                                <span className="font-semibold">Table of Contents</span>
                                <span
                                    className="text-muted-foreground transition-transform"
                                    style={{transform: mobileTocOpen ? "rotate(180deg)" : "rotate(0deg)"}}
                                >
                                    &#9660;
                                </span>
                            </button>
                            {mobileTocOpen && (
                                <div className="border-border/30 bg-card/95 mt-4 rounded-md border p-4">
                                    <nav className="space-y-2">
                                        {sections.map(section => {
                                            const title = section.title?.trim() || `Section ${section.index}`;
                                            return (
                                                <button
                                                    key={section.index}
                                                    type="button"
                                                    onClick={() => {
                                                        const element = document.getElementById(
                                                            `policy-section-${section.index}`
                                                        );
                                                        element?.scrollIntoView({behavior: "smooth", block: "start"});
                                                        setMobileTocOpen(false);
                                                    }}
                                                    className="hover:bg-muted/50 text-muted-foreground hover:text-foreground flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors"
                                                >
                                                    <span className="bg-muted text-muted-foreground rounded px-2 py-1 text-xs font-medium">
                                                        {section.index}
                                                    </span>
                                                    <span className="line-clamp-1 leading-tight">{title}</span>
                                                </button>
                                            );
                                        })}
                                    </nav>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="lg:grid lg:grid-cols-4 lg:gap-8">
                        <div className="hidden lg:col-span-1 lg:block">
                            <div className="sticky top-28 h-[calc(100vh-7rem)] py-8">
                                <PolicyTableOfContents sections={sections} />
                            </div>
                        </div>

                        <div className="lg:col-span-3 lg:py-8">
                            <div className="space-y-6">
                                {sections.map(section => (
                                    <PolicySectionCard key={section.index} section={section} showIndex={showIndexes} />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
