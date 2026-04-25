import type {Route} from "./+types/faq";
import {getSeoMeta} from "@shopify/hydrogen";
import {Accordion, AccordionContent, AccordionItem, AccordionTrigger} from "~/components/ui/accordion";
import {AnimatedSection} from "~/components/sections/AnimatedSection";
import {useFaqItems} from "~/lib/site-content-context";
import {generateFAQPageSchema, getBrandNameFromMatches, getRequiredSocialMeta, buildCanonicalUrl, getSiteUrlFromMatches} from "~/lib/seo";
import {GiantText} from "~/components/common/GiantText";
import {PageBreadcrumbs} from "~/components/common/PageBreadcrumbs";
import {cn} from "~/lib/utils";

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

    const title = "Frequently Asked Questions";
    const subtitle = "Everything you need to know, answered.";

    return (
        <div className="min-h-screen bg-background text-foreground">
            <PageBreadcrumbs customTitle="FAQ" />

            <AnimatedSection animation="fade" threshold={0.08}>
                <section className="py-8">
                    <div className="mx-auto max-w-[2000px] px-2 md:px-4">
                        <div className="flex w-full flex-col items-center justify-center gap-2 text-center xl:gap-4">
                            <GiantText
                                text={title}
                                as="h1"
                                className={cn("w-full font-black", title.length <= 7 ? "lg:w-[30%]" : "lg:w-[60%]")}
                            />
                            <p className="text-muted-foreground w-full text-xs lg:w-[60%] lg:text-sm 2xl:text-base">
                                {subtitle}
                            </p>
                        </div>
                    </div>
                </section>
            </AnimatedSection>

            <AnimatedSection animation="slide-up" threshold={0.1}>
                <div className="pb-16 sm:pb-24">
                    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
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
            </AnimatedSection>
        </div>
    );
}

export {RouteErrorBoundary as ErrorBoundary} from "~/components/RouteErrorBoundary";
