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

    const hasMoreThanTen = faqItems.length > 10;
    const mid = Math.ceil(faqItems.length / 2);
    const leftItems = hasMoreThanTen ? faqItems.slice(0, mid) : faqItems;
    const rightItems = hasMoreThanTen ? faqItems.slice(mid) : [];

    const renderAccordionItems = (
        items: typeof faqItems,
        globalOffset: number,
        idPrefix: string
    ) =>
        items.map((item, i) => {
            const itemId = `${idPrefix}-${i}`;
            return (
                <AccordionItem
                    key={itemId}
                    value={itemId}
                    className="border-0 border-b border-border"
                >
                    <AccordionTrigger className="py-5 sm:py-6 text-left hover:no-underline [&>svg]:hidden gap-0 items-start justify-start">
                        <span className="font-mono text-xs font-semibold text-primary mr-4 mt-1 shrink-0 tabular-nums">
                            {String(globalOffset + i + 1).padStart(2, "0")}
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
        });

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
                    {hasMoreThanTen ? (
                        <>
                            {/* Two-column layout for large screens (>10 FAQs only) */}
                            <div className="hidden lg:grid lg:grid-cols-2 lg:gap-x-12 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                                <Accordion
                                    type="multiple"
                                    defaultValue={leftItems.map((_, i) => `ll-${i}`)}
                                    className="w-full"
                                >
                                    {renderAccordionItems(leftItems, 0, "ll")}
                                </Accordion>
                                <Accordion
                                    type="multiple"
                                    defaultValue={rightItems.map((_, i) => `lr-${i}`)}
                                    className="w-full"
                                >
                                    {renderAccordionItems(rightItems, mid, "lr")}
                                </Accordion>
                            </div>
                            {/* Single-column fallback for smaller screens */}
                            <div className="lg:hidden mx-auto max-w-3xl px-4 sm:px-6">
                                <Accordion
                                    type="multiple"
                                    defaultValue={faqItems.map((_, i) => `sm-${i}`)}
                                    className="w-full"
                                >
                                    {renderAccordionItems(faqItems, 0, "sm")}
                                </Accordion>
                            </div>
                        </>
                    ) : (
                        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
                            <Accordion
                                type="multiple"
                                defaultValue={faqItems.map((_, i) => `fq-${i}`)}
                                className="w-full"
                            >
                                {renderAccordionItems(faqItems, 0, "fq")}
                            </Accordion>
                        </div>
                    )}
                </div>
            </AnimatedSection>
        </div>
    );
}

export {RouteErrorBoundary as ErrorBoundary} from "~/components/RouteErrorBoundary";
