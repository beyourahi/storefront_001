/**
 * @fileoverview Legal Page Layout Component
 *
 * @description
 * Top-level wrapper for legal pages that combines:
 * - Breadcrumb navigation
 * - Hero section with title and description
 * - Optional Quick Answers section (from policyExtension metaobject)
 * - Policy content sections with TOC
 *
 * @structure
 * 1. PageBreadcrumbs (navigation)
 * 2. LegalPageHero (title + description)
 * 3. QuickAnswers (optional FAQ accordion from policyExtension — storefront_001 style)
 * 4. PolicyContentSection (parsed content with TOC)
 *
 * @props
 * - title: Page title (required)
 * - description: Optional subtitle/description
 * - content: HTML content from Shopify policy
 * - policyExtension: Optional structured Q&A entries from metaobject
 */

import {Accordion, AccordionContent, AccordionItem, AccordionTrigger} from "~/components/ui/accordion";
import {PageBreadcrumbs} from "~/components/common/PageBreadcrumbs";
import {LegalPageHero} from "./LegalPageHero";
import {PolicyContentSection} from "./PolicyContentSection";

type PolicyExtensionEntry = {
    key: string;
    value: string;
    context?: string;
};

type LegalPageLayoutProps = {
    title: string;
    description?: string;
    content: string;
    policyExtension?: PolicyExtensionEntry[] | null;
};

export const LegalPageLayout = ({title, description, content, policyExtension}: LegalPageLayoutProps) => {
    const hasExtension = policyExtension && policyExtension.length > 0;

    return (
        <>
            <PageBreadcrumbs customTitle={title} />
            <LegalPageHero title={title} description={description} />
            {hasExtension && (
                <section className="mx-auto max-w-3xl px-4 pb-8 sm:px-6 lg:px-8">
                    <div className="rounded-xl border border-border bg-card p-6">
                        <h2 className="mb-4 font-serif text-xl font-semibold text-foreground">Quick Answers</h2>
                        <Accordion type="multiple" className="w-full">
                            {policyExtension!.map((entry, index) => (
                                <AccordionItem
                                    key={entry.key}
                                    value={`ext-${index}`}
                                    className="border-0 border-b border-border last:border-0"
                                >
                                    <AccordionTrigger className="py-4 text-left hover:no-underline [&>svg]:hidden gap-0 items-start justify-start">
                                        <span className="font-mono text-xs font-semibold text-primary mr-4 mt-0.5 shrink-0 tabular-nums">
                                            {String(index + 1).padStart(2, "0")}
                                        </span>
                                        <span className="font-medium text-foreground text-sm sm:text-base">
                                            {entry.key}
                                        </span>
                                    </AccordionTrigger>
                                    <AccordionContent className="pb-4">
                                        <p className="pl-10 text-muted-foreground text-sm leading-relaxed">
                                            {entry.value}
                                        </p>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </div>
                </section>
            )}
            <PolicyContentSection content={content} />
        </>
    );
};
