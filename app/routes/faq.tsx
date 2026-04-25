import type {Route} from "./+types/faq";
import {getSeoMeta} from "@shopify/hydrogen";
import {Accordion, AccordionContent, AccordionItem, AccordionTrigger} from "~/components/ui/accordion";
import {AnimatedSection} from "~/components/sections/AnimatedSection";
import {useFaqItems} from "~/lib/site-content-context";
import {generateFAQPageSchema, getBrandNameFromMatches, getRequiredSocialMeta, buildCanonicalUrl, getSiteUrlFromMatches} from "~/lib/seo";

export const meta: Route.MetaFunction = ({matches}) => {
    const rootData = (
        matches.find(m => m?.id === "root") as
            | {data?: {siteContent?: {siteSettings?: {faqItems?: Array<{question: string; answer: string}>}}}}
            | undefined
    )?.data;
    const faqItems = rootData?.siteContent?.siteSettings?.faqItems;
    const faqSchema = faqItems?.length ? generateFAQPageSchema(faqItems) : undefined;
    const brandName = getBrandNameFromMatches(matches);
    const siteUrl = getSiteUrlFromMatches(matches);

    return [
        ...(getSeoMeta({
            title: `Frequently Asked Questions | ${brandName}`,
            description: "Find answers to common questions about our products, shipping, and policies.",
            url: buildCanonicalUrl("/faq", siteUrl),
            jsonLd: faqSchema as any
        }) ?? []),
        ...getRequiredSocialMeta("website", brandName)
    ];
};

export default function FAQ() {
    const faqItems = useFaqItems();

    if (!faqItems || faqItems.length === 0) {
        throw new Response("Not Found", {status: 404});
    }

    return (
        <div className="min-h-screen bg-background">
            <AnimatedSection animation="fade" threshold={0.08}>
                <section className="pt-32 pb-16 sm:pt-40 sm:pb-24">
                    <div className="px-4 sm:px-6 lg:px-8">
                        <div className="max-w-3xl mx-auto">
                            {/* Hero — decorative question count + page title */}
                            <div className="mb-16 sm:mb-20">
                                <p className="font-mono text-7xl sm:text-9xl font-bold text-primary/10 leading-none select-none mb-4">
                                    {String(faqItems.length).padStart(2, "0")}
                                </p>
                                <h1 className="font-serif text-4xl sm:text-5xl font-medium text-foreground leading-tight mb-4">
                                    Frequently Asked
                                    <br />
                                    Questions
                                </h1>
                                <p className="text-muted-foreground text-base sm:text-lg">
                                    Everything you need to know, answered.
                                </p>
                            </div>

                            {/* Accordion — numbered questions, serif body, mono index prefix */}
                            <Accordion type="single" collapsible className="w-full">
                                {faqItems.map((item, index) => {
                                    const itemId = `faq-${index}`;
                                    return (
                                        <AccordionItem
                                            key={itemId}
                                            value={itemId}
                                            className="border-0 border-b border-border"
                                        >
                                            <AccordionTrigger className="py-5 sm:py-6 text-left hover:no-underline [&>svg]:hidden gap-0 items-start">
                                                <span className="font-mono text-xs font-semibold text-primary mr-4 mt-1 shrink-0 tabular-nums">
                                                    {String(index + 1).padStart(2, "0")}
                                                </span>
                                                <span className="font-serif text-base sm:text-lg font-medium text-foreground">
                                                    {item.question}
                                                </span>
                                            </AccordionTrigger>
                                            <AccordionContent className="pb-5 sm:pb-6">
                                                <p className="pl-10 text-muted-foreground text-base leading-relaxed">
                                                    {item.answer}
                                                </p>
                                            </AccordionContent>
                                        </AccordionItem>
                                    );
                                })}
                            </Accordion>
                        </div>
                    </div>
                </section>
            </AnimatedSection>
        </div>
    );
}

export {RouteErrorBoundary as ErrorBoundary} from "~/components/RouteErrorBoundary";
