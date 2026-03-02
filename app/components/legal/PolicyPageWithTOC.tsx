/**
 * @fileoverview Policy Page with Table of Contents Component
 *
 * @description
 * Layout controller that conditionally renders policy sections based on count:
 * - 0 sections: Empty state with message
 * - 1 section: Full-width card for better readability
 * - Multiple sections: Desktop grid (TOC sidebar + content), mobile collapsible TOC
 *
 * @responsive
 * - Mobile (< lg): Collapsible TOC at top using details/summary
 * - Desktop (>= lg): Sticky sidebar TOC with 4-column grid
 *
 * @design
 * - Max width: 4xl for single section, 7xl for multi-section
 * - Container padding: px-2 (mobile), md:px-4 (desktop)
 * - Vertical spacing: py-8
 * - Sticky TOC: top-28, h-[calc(100vh-7rem)]
 */

import {PolicySectionCard, type PolicySection} from "./PolicySectionCard";
import {PolicyTableOfContents} from "./PolicyTableOfContents";

type PolicyPageWithTOCProps = {
    sections: PolicySection[];
    showIndexes?: boolean;
};

export const PolicyPageWithTOC = ({sections, showIndexes = false}: PolicyPageWithTOCProps) => {
    return (
        <section className="bg-background py-8">
            <div className="mx-auto max-w-[2000px] px-2 md:px-4">
                {sections.length === 0 ? (
                    // Empty state
                    <div className="mx-auto max-w-4xl text-center">
                        <p className="text-muted-foreground text-lg">No policy sections available at this time.</p>
                    </div>
                ) : sections.length === 1 ? (
                    // Single section layout - full width for better readability
                    <div className="mx-auto max-w-4xl">
                        <PolicySectionCard section={sections[0]} showIndex={showIndexes} />
                    </div>
                ) : (
                    // Multi-section layout with Table of Contents
                    <div className="mx-auto max-w-7xl">
                        {/* Mobile: Collapsible TOC at top */}
                        <div className="mb-6 block lg:hidden">
                            <details className="group">
                                <summary className="cursor-pointer rounded-md border border-border/30 bg-card/95 p-4 transition-colors hover:bg-card/100">
                                    <span className="font-semibold">Table of Contents</span>
                                    <span className="float-right text-muted-foreground transition-transform group-open:rotate-180">
                                        ▼
                                    </span>
                                </summary>
                                <div className="mt-4 rounded-md border border-border/30 bg-card/95 p-4">
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
                                                    }}
                                                    className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                                                >
                                                    <span className="rounded bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                                                        {section.index}
                                                    </span>
                                                    <span className="line-clamp-1 leading-tight">{title}</span>
                                                </button>
                                            );
                                        })}
                                    </nav>
                                </div>
                            </details>
                        </div>

                        {/* Desktop: Two-column layout */}
                        <div className="lg:grid lg:grid-cols-4 lg:gap-8">
                            {/* Table of Contents - Sticky on desktop */}
                            <div className="hidden lg:col-span-1 lg:block">
                                <div className="sticky top-28 h-[calc(100vh-7rem)] py-8">
                                    <PolicyTableOfContents sections={sections} />
                                </div>
                            </div>

                            {/* Policy Content */}
                            <div className="lg:col-span-3 lg:py-8">
                                <div className="space-y-6">
                                    {sections.map(section => (
                                        <PolicySectionCard key={section.index} section={section} showIndex={showIndexes} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
};
