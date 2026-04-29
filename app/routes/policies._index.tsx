import {Link, useLoaderData} from "react-router";
import type {Route} from "./+types/policies._index";
import {getSeoMeta} from "@shopify/hydrogen";
import {generateBreadcrumbListSchema, getBrandNameFromMatches, getRequiredSocialMeta, buildCanonicalUrl, getSiteUrlFromMatches} from "~/lib/seo";
import {generateFAQPageSchema} from "~/lib/agentic/structured-data";
import {PageBreadcrumbs} from "~/components/common/PageBreadcrumbs";
import {AnimatedSection} from "~/components/sections/AnimatedSection";
import {POLICY_CONTENT_QUERY} from "~/lib/queries/policy";
import {GiantText} from "~/components/common/GiantText";

const POLICY_ITEMS = [
    {handle: "privacy-policy", label: "Privacy Policy", description: "How we collect and use your information"},
    {handle: "shipping-policy", label: "Shipping Policy", description: "Delivery methods, timeframes, and costs"},
    {handle: "refund-policy", label: "Return & Refund Policy", description: "How to return items and get a refund"},
    {handle: "terms-of-service", label: "Terms of Service", description: "Rules and guidelines for using our services"}
] as const;

export const meta: Route.MetaFunction = ({matches}) => {
    const brandName = getBrandNameFromMatches(matches);
    const siteUrl = getSiteUrlFromMatches(matches);
    const breadcrumbSchema = generateBreadcrumbListSchema([
        {name: "Home", url: "/"},
        {name: "Policies", url: "/policies"}
    ], siteUrl);

    const rootData = (matches.find(m => m?.id === "root") as any)?.data;
    const policyExtensions: Array<{key: string; value: string}> =
        rootData?.siteContent?.siteSettings?.policyExtension ?? [];
    const faqSchema = policyExtensions.length > 0
        ? generateFAQPageSchema(policyExtensions.map(ext => ({question: ext.key, answer: ext.value})))
        : null;

    return [
        ...(getSeoMeta({
            title: `Policies | ${brandName}`,
            description: `Review our store policies including shipping, returns, privacy, and terms of service.`,
            url: buildCanonicalUrl("/policies", siteUrl)
        }) ?? []),
        {"script:ld+json": breadcrumbSchema as any},
        ...(faqSchema ? [{"script:ld+json": faqSchema as any}] : []),
        ...getRequiredSocialMeta("website", brandName)
    ];
};

export async function loader({context}: Route.LoaderArgs) {
    const {kebabToCamelCase} = await import("~/lib/string-utils");

    // Fetch all four policies to confirm they exist (some stores may not have all)
    const policies: Array<{handle: string; label: string; description: string; exists: boolean}> = [];

    for (const item of POLICY_ITEMS) {
        try {
            const policyKey = kebabToCamelCase(item.handle) as "privacyPolicy" | "shippingPolicy" | "refundPolicy" | "termsOfService";
            const data = await context.dataAdapter.query(POLICY_CONTENT_QUERY, {
                variables: {
                    privacyPolicy: false,
                    shippingPolicy: false,
                    termsOfService: false,
                    refundPolicy: false,
                    [policyKey]: true
                },
                cache: context.dataAdapter.CacheLong()
            });
            const exists = !!(data?.shop?.[policyKey]);
            policies.push({...item, exists});
        } catch {
            policies.push({...item, exists: false});
        }
    }

    return {policies};
}

export default function PoliciesIndex() {
    const {policies} = useLoaderData<typeof loader>();

    return (
        <div className="min-h-screen bg-background text-foreground">
            <PageBreadcrumbs customTitle="Policies" />

            <AnimatedSection animation="fade" threshold={0.08}>
                <section className="py-8">
                    <div className="mx-auto max-w-[2000px] px-2 md:px-4">
                        <div className="flex w-full flex-col items-center justify-center gap-2 text-center xl:gap-4">
                            <GiantText
                                text="Policies"
                                as="h1"
                                className="w-full font-black lg:w-[40%]"
                            />
                            <p className="text-muted-foreground w-full text-xs lg:w-[60%] lg:text-sm 2xl:text-base">
                                Everything you need to know about shopping with us.
                            </p>
                        </div>
                    </div>
                </section>
            </AnimatedSection>

            <AnimatedSection animation="slide-up" threshold={0.1}>
                <section className="pb-16 sm:pb-24">
                    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
                        <div className="grid gap-4 sm:gap-6">
                            {policies.filter(p => p.exists).map((policy) => (
                                <Link
                                    key={policy.handle}
                                    to={`/policies/${policy.handle}`}
                                    className="group flex flex-col gap-1 rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary hover:bg-accent"
                                >
                                    <span className="font-serif text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                                        {policy.label}
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                        {policy.description}
                                    </span>
                                </Link>
                            ))}
                            <Link
                                to="/faq"
                                className="group flex flex-col gap-1 rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary hover:bg-accent"
                            >
                                <span className="font-serif text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                                    Frequently Asked Questions
                                </span>
                                <span className="text-sm text-muted-foreground">
                                    Answers to common questions about our products and services
                                </span>
                            </Link>
                        </div>
                    </div>
                </section>
            </AnimatedSection>
        </div>
    );
}

export {RouteErrorBoundary as ErrorBoundary} from "~/components/RouteErrorBoundary";
