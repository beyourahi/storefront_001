import type {Route} from "./+types/faq";
import {getSeoMeta} from "@shopify/hydrogen";
import {Accordion, AccordionContent, AccordionItem, AccordionTrigger} from "~/components/ui/accordion";
import {AnimatedSection} from "~/components/sections/AnimatedSection";
import {useFaqItems} from "~/lib/site-content-context";
import {generateFAQPageSchema} from "~/lib/seo";

export const meta: Route.MetaFunction = ({matches}) => {
    const rootData = (
        matches.find(m => m?.id === "root") as
            | {data?: {siteContent?: {siteSettings?: {faqItems?: Array<{question: string; answer: string}>}}}}
            | undefined
    )?.data;
    const faqItems = rootData?.siteContent?.siteSettings?.faqItems;
    const faqSchema = faqItems?.length ? generateFAQPageSchema(faqItems) : undefined;

    return getSeoMeta({
        title: "Frequently Asked Questions",
        description: "Find answers to common questions about our products, shipping, and policies.",
        jsonLd: faqSchema as any
    }) ?? [];
};

export default function FAQ() {
    const faqItems = useFaqItems();

    if (!faqItems || faqItems.length === 0) {
        throw new Response("Not Found", {status: 404});
    }

    return (
        <div className="min-h-dvh bg-primary">

            <AnimatedSection animation="fade" threshold={0.08}>
                <section className="pt-32 pb-12 sm:pt-40 sm:pb-16 md:pb-24 lg:pb-32">
                    <div className="px-4 sm:px-6 lg:px-8">
                        <div className="grid gap-8 sm:gap-12 lg:grid-cols-[2fr_3fr] lg:gap-16">
                            <div className="lg:sticky lg:top-32 lg:self-start">
                                <h1 className="font-serif text-4xl font-medium leading-none text-primary-foreground sm:text-5xl md:text-6xl lg:text-7xl">
                                    Frequently Asked
                                    <br />
                                    Questions
                                </h1>
                                <p className="mt-4 max-w-sm text-base leading-relaxed text-primary-foreground/70 sm:mt-6 sm:text-lg">
                                    Find answers to common questions about orders, shipping, returns, and more.
                                </p>
                                <p className="mt-4 text-sm text-primary-foreground/50">{faqItems.length} questions</p>
                            </div>

                            <div>
                                <Accordion
                                    type="single"
                                    collapsible
                                    className="w-full"
                                >
                                    {faqItems.map((item, index) => {
                                        const itemId = `faq-${index}`;
                                        return (
                                            <AccordionItem
                                                key={itemId}
                                                value={itemId}
                                                className="border-primary-foreground/20"
                                            >
                                                <AccordionTrigger className="min-h-14 gap-3 py-4 text-left text-base font-medium text-primary-foreground hover:text-primary-foreground/80 hover:no-underline sm:min-h-16 sm:gap-4 sm:py-5 sm:text-lg [&>svg]:hidden">
                                                    <span className="flex items-start gap-3">
                                                        <span className="mt-2 size-2 shrink-0 rounded-full bg-primary-foreground/60" />
                                                        {item.question}
                                                    </span>
                                                </AccordionTrigger>
                                                <AccordionContent className="pb-5 text-base leading-relaxed text-primary-foreground! sm:pb-6 sm:text-lg">
                                                    {item.answer}
                                                </AccordionContent>
                                            </AccordionItem>
                                        );
                                    })}
                                </Accordion>
                            </div>
                        </div>
                    </div>
                </section>
            </AnimatedSection>

            <AnimatedSection animation="slide-up" threshold={0.1}>
                <section className="bg-primary-foreground/10 py-12 sm:py-16 md:py-20">
                    <div className="px-4 sm:px-6 lg:px-8">
                        <div className="text-center">
                            <h2 className="mb-3 font-serif text-2xl font-medium text-primary-foreground sm:mb-4 sm:text-3xl md:text-4xl">
                                Still have questions?
                            </h2>
                            <p className="mx-auto mb-6 max-w-lg text-base text-primary-foreground/70 sm:mb-8 sm:text-lg">
                                Our team is here to help. Reach out and we&apos;ll get back to you within 24 hours.
                            </p>
                            <a
                                href="/contact"
                                className="inline-flex min-h-12 items-center justify-center rounded-full bg-primary-foreground px-6 py-3 text-sm font-medium text-primary transition-colors hover:bg-primary-foreground/90 sm:min-h-14 sm:px-8 sm:py-4 sm:text-base"
                            >
                                Contact Us
                                <span className="ml-2">&rarr;</span>
                            </a>
                        </div>
                    </div>
                </section>
            </AnimatedSection>
        </div>
    );
}

export {RouteErrorBoundary as ErrorBoundary} from "~/components/RouteErrorBoundary";
