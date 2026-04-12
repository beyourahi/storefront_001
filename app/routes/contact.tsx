import {useMemo} from "react";
import type {Route} from "./+types/contact";
import {getSeoMeta} from "@shopify/hydrogen";
import {buildCanonicalUrl, getBrandNameFromMatches, getRequiredSocialMeta, getSiteUrlFromMatches} from "~/lib/seo";
import {Mail, Phone, MapPin, Shield, FileCheck, Truck, RotateCcw, type LucideIcon} from "lucide-react";
import {GiantText} from "~/components/common/GiantText";
import {PageBreadcrumbs} from "~/components/common/PageBreadcrumbs";
import {ContactMethodCard} from "~/components/contact/ContactMethodCard";
import {FAQSection} from "~/components/homepage/FAQSection";
import {SocialMediaSection} from "~/components/homepage/SocialMediaSection";
import {AnimatedSection} from "~/components/sections/AnimatedSection";
import {cn} from "~/lib/utils";
import {useContactInfo, useFaqItems, useSocialLinks} from "~/lib/site-content-context";
import {STORE_COUNTRY_NAME} from "~/lib/store-locale";

type ContactMethod = {
    icon: LucideIcon;
    title: string;
    content: string;
    description: string;
    href: string;
    openInNewTab?: boolean;
};

type LegalLink = {
    href: string;
    title: string;
    description: string;
    icon: LucideIcon;
};

const LEGAL_LINKS: LegalLink[] = [
    {
        href: "/policies/privacy-policy",
        title: "Privacy Policy",
        description: "Learn how we collect, use, and protect your personal information.",
        icon: Shield
    },
    {
        href: "/policies/terms-of-service",
        title: "Terms of Service",
        description: "Terms and conditions for using our services and platform.",
        icon: FileCheck
    },
    {
        href: "/policies/shipping-policy",
        title: "Shipping Policy",
        description: "Information about shipping, delivery, and handling processes.",
        icon: Truck
    },
    {
        href: "/policies/refund-policy",
        title: "Refund Policy",
        description: "Our refund and return policy information and procedures.",
        icon: RotateCcw
    }
];

const isContactInfoValid = (value?: string | null): boolean => Boolean(value && value.trim().length > 0);

const getGridColsClass = (methodCount: number): string => {
    if (methodCount === 1) return "md:grid-cols-1 max-w-md mx-auto";
    if (methodCount === 2) return "md:grid-cols-2";
    return "md:grid-cols-3";
};

const getAddressLine = (city?: string, state?: string, zip?: string): string => {
    return [city, state, zip].filter(Boolean).join(" ").trim();
};

const legalCardClass =
    "hover:border-primary/40 bg-muted/95 hover:bg-foreground/10 group hover:shadow-primary/10 focus-visible:ring-primary/20 focus-visible:bg-primary/3 sleek block rounded-lg border p-6 hover:-translate-y-1 hover:shadow-md focus-visible:ring-2 focus-visible:outline-none";

export const meta: Route.MetaFunction = ({matches}) => {
    const siteUrl = getSiteUrlFromMatches(matches);
    const brandName = getBrandNameFromMatches(matches);
    return [
        ...(getSeoMeta({
            title: `Contact Us | ${brandName}`,
            description:
                "Get in touch with our team. We're here to help with any questions about our products, orders, or services.",
            url: buildCanonicalUrl("/contact", siteUrl)
        }) ?? []),
        ...getRequiredSocialMeta("website", brandName)
    ];
};

export default function Contact() {
    const title = "Get in Touch";
    const subtitle = "Have questions about our products, orders, or services? We're here to help!";

    const contactInfo = useContactInfo();
    const faqItems = useFaqItems();
    const socialLinks = useSocialLinks();

    const cityStateZip = getAddressLine(contactInfo.address.city, contactInfo.address.state, contactInfo.address.zip);
    const fullAddress = [contactInfo.address.street, cityStateZip, STORE_COUNTRY_NAME]
        .filter(isContactInfoValid)
        .join(", ");

    const contactMethods = useMemo<ContactMethod[]>(() => {
        return [
            ...(isContactInfoValid(contactInfo.email)
                ? [
                      {
                          icon: Mail,
                          title: "Email Us",
                          content: contactInfo.email,
                          description: "Send us an email and we'll respond ASAP. Perfect for detailed inquiries.",
                          href: `mailto:${contactInfo.email}`,
                          openInNewTab: true
                      }
                  ]
                : []),
            ...(isContactInfoValid(contactInfo.phone)
                ? [
                      {
                          icon: Phone,
                          title: "Call Us",
                          content: contactInfo.phone,
                          description: "Speak directly with our team. Available 24/7 for your convenience.",
                          href: `tel:${contactInfo.phone}`
                      }
                  ]
                : []),
            ...(isContactInfoValid(fullAddress)
                ? [
                      {
                          icon: MapPin,
                          title: "Find Us",
                          content: fullAddress,
                          description: "Where we're located and ready to assist you with your needs.",
                          href: `https://maps.google.com/maps?q=${encodeURIComponent(fullAddress)}`,
                          openInNewTab: true
                      }
                  ]
                : [])
        ];
    }, [contactInfo.email, contactInfo.phone, fullAddress]);

    const contextSocialLinks = useMemo(() => {
        return socialLinks
            .filter(link => isContactInfoValid(link.platform) && isContactInfoValid(link.url))
            .map(link => ({
                platform: link.platform,
                url: link.url
            }));
    }, [socialLinks]);

    return (
        <>
            <PageBreadcrumbs customTitle="Contact Us" />

            <AnimatedSection animation="fade" threshold={0.08}>
                <section className="bg-overlay-dark relative py-8">
                    <div className="mx-auto max-w-[2000px] px-2 md:px-4">
                        <div className="flex w-full flex-col items-center justify-center gap-2 text-center xl:gap-4">
                            <GiantText
                                as="h1"
                                text={title}
                                className={cn("w-full font-black", title.length <= 7 ? "lg:w-[30%]" : "lg:w-[60%]")}
                                textClass="text-light drop-shadow-lg"
                            />

                            <p className="text-light/90 drop-shadow-lg w-full text-xs lg:w-[60%] lg:text-sm 2xl:text-base">
                                {subtitle}
                            </p>
                        </div>
                    </div>
                </section>
            </AnimatedSection>

            <AnimatedSection animation="slide-up" threshold={0.12}>
                <section className="bg-background py-8 md:py-20">
                    <div className="mx-auto max-w-7xl px-6">
                        {contactMethods.length > 0 ? (
                            <div className={cn("grid grid-cols-1 gap-8", getGridColsClass(contactMethods.length))}>
                                {contactMethods.map(method => (
                                    <ContactMethodCard
                                        key={method.title}
                                        icon={method.icon}
                                        title={method.title}
                                        content={method.content}
                                        description={method.description}
                                        href={method.href}
                                        openInNewTab={method.openInNewTab}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center">
                                <div className="bg-card mx-auto max-w-md rounded-2xl border p-8">
                                    <h3 className="text-foreground mb-4 text-xl font-semibold">Contact Information Coming Soon</h3>
                                    <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
                                        We&apos;re currently updating our contact information. In the meantime, you can reach us
                                        through our social media channels below.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            </AnimatedSection>

            <AnimatedSection animation="fade" threshold={0.1}>
                <FAQSection faqItems={faqItems} contactEmail={contactInfo.email} contactPhone={contactInfo.phone} />
            </AnimatedSection>

            {contextSocialLinks.length > 0 && (
                <AnimatedSection animation="slide-up" threshold={0.1}>
                    <SocialMediaSection socialLinks={contextSocialLinks} />
                </AnimatedSection>
            )}

            <AnimatedSection animation="slide-up" threshold={0.1}>
                <section className="bg-background py-16">
                    <div className="mx-auto max-w-4xl px-6">
                        <div className="mb-12 text-center">
                            <h2 className="text-foreground mb-4 font-serif text-2xl font-bold">Legal Information</h2>
                            <p className="text-muted-foreground mx-auto max-w-2xl leading-relaxed">
                                Find important information about our policies, terms, and legal guidelines.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            {LEGAL_LINKS.map(link => {
                                const Icon = link.icon;

                                return (
                                    <a key={link.href} href={link.href} className={legalCardClass}>
                                        <div className="mb-3 flex items-center gap-3">
                                            <div className="bg-secondary/90 group-hover:bg-secondary group-hover:shadow-secondary/20 sleek flex h-12 w-12 items-center justify-center rounded-lg group-hover:scale-105 group-hover:shadow-sm">
                                                <Icon className="text-secondary-foreground sleek h-6 w-6" />
                                            </div>
                                            <h3 className="text-card-foreground/95 sleek text-lg font-semibold">{link.title}</h3>
                                        </div>
                                        <p className="text-muted-foreground/85 group-hover:text-foreground/80 sleek text-sm leading-relaxed">
                                            {link.description}
                                        </p>
                                    </a>
                                );
                            })}
                        </div>
                    </div>
                </section>
            </AnimatedSection>
        </>
    );
}

export {RouteErrorBoundary as ErrorBoundary} from "~/components/RouteErrorBoundary";
