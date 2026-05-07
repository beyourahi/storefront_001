import {Accordion, AccordionContent, AccordionItem, AccordionTrigger} from "~/components/ui/accordion";
import {parseMarkdownLinks} from "~/lib/text-format";
import {useSiteSettings} from "~/lib/site-content-context";

type FAQItem = {
    id?: string;
    question: string;
    answer: string;
};

type FAQSectionProps = {
    faqItems?: FAQItem[];
};

/**
 * Accordion FAQ section.
 * Props take precedence over `useSiteSettings` values so the same component can
 * be rendered standalone on the `/faq` route with explicitly supplied data, or
 * on the homepage where it falls back to the metaobject-driven site settings.
 * FAQ answers are passed through `parseMarkdownLinks` which converts markdown-style
 * links to `<a>` tags before being set as inner HTML — content originates from
 * Shopify metaobjects, not user input.
 */
export const FAQSection = ({faqItems}: FAQSectionProps = {}) => {
    const {faqItems: settingsFaqItems} = useSiteSettings();
    const faqs = faqItems ?? settingsFaqItems;

    const hasFAQs = Array.isArray(faqs) && faqs.length > 0;

    if (!hasFAQs) return null;

    return (
        <section className="bg-background py-8 lg:py-16">
            <div className="mx-auto max-w-[2000px] px-2 md:px-4">
                <div className="mb-12 text-center">
                    <h2 className="text-foreground mb-4 font-serif text-2xl font-bold md:text-3xl">
                        Frequently Asked Questions
                    </h2>
                    <p className="text-muted-foreground mx-auto max-w-2xl">
                        Find answers to common questions about our products, shipping, returns, and more. Can&apos;t
                        find what you&apos;re looking for? Contact our support team.
                    </p>
                </div>

                <div className="mx-auto mb-12 max-w-7xl">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        {faqs.map((faq, index) => {
                            const key = faq.id || `faq-${index}`;
                            return (
                                <div key={key} className="bg-muted overflow-hidden rounded-lg border">
                                    <Accordion type="multiple">
                                        <AccordionItem value={key} className="border-0">
                                            <AccordionTrigger className="hover:bg-muted/50 sleek p-6 text-left font-semibold hover:no-underline [&[data-state=open]>svg]:rotate-180">
                                                {faq.question}
                                            </AccordionTrigger>
                                            <AccordionContent className="px-6">
                                                <p
                                                    className="text-muted-foreground leading-relaxed"
                                                    dangerouslySetInnerHTML={{__html: parseMarkdownLinks(faq.answer)}}
                                                />
                                            </AccordionContent>
                                        </AccordionItem>
                                    </Accordion>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
};
