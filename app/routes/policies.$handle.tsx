import {useLoaderData} from "react-router";
import type {Route} from "./+types/policies.$handle";
import {getSeoMeta} from "@shopify/hydrogen";
import type {Shop} from "@shopify/hydrogen/storefront-api-types";
import {LegalPageLayout} from "~/components/legal";
import {POLICY_CONTENT_QUERY} from "~/lib/queries/policy";
import {getBrandNameFromMatches, buildCanonicalUrl, getSiteUrlFromMatches} from "~/lib/seo";
import {kebabToCamelCase} from "~/lib/string-utils";

type PolicyKey = keyof Pick<Shop, "privacyPolicy" | "shippingPolicy" | "termsOfService" | "refundPolicy">;

const POLICY_DESCRIPTIONS: Record<PolicyKey, (brandName: string) => string> = {
    privacyPolicy: (brandName) =>
        `Learn how ${brandName} collects, uses, and protects your personal information.`,
    shippingPolicy: () => "Find out about our shipping methods, delivery times, and shipping costs.",
    termsOfService: (brandName) =>
        `Read our terms and conditions for using the ${brandName} website and services.`,
    refundPolicy: (brandName) =>
        `Understand our return and refund policies for purchases made at ${brandName}.`
};

export const meta: Route.MetaFunction = ({data, matches}) => {
    const brandName = getBrandNameFromMatches(matches);
    const policy = data?.policy;
    if (!policy) return [{title: "Policy"}];

    const policyKey = kebabToCamelCase(policy.handle) as PolicyKey;
    const descriptionFn = POLICY_DESCRIPTIONS[policyKey];
    const description = descriptionFn
        ? descriptionFn(brandName)
        : `Read our ${policy.title.toLowerCase()} at ${brandName}.`;

    const siteUrl = getSiteUrlFromMatches(matches);
    return getSeoMeta({title: policy.title, description, url: buildCanonicalUrl(`/policies/${policy.handle}`, siteUrl)}) ?? [];
};

export async function loader({params, context}: Route.LoaderArgs) {
    if (!params.handle) {
        throw new Response("No policy handle provided", {status: 404});
    }

    const policyKey = kebabToCamelCase(params.handle) as PolicyKey;

    const data = await context.dataAdapter.query(POLICY_CONTENT_QUERY, {
        variables: {
            privacyPolicy: false,
            shippingPolicy: false,
            termsOfService: false,
            refundPolicy: false,
            [policyKey]: true,
            language: context.storefront.i18n?.language
        }
    });

    const policy = data.shop?.[policyKey];

    if (!policy) {
        throw new Response("Could not find the policy", {status: 404});
    }

    return {policy};
}

export default function PolicyRoute() {
    const {policy} = useLoaderData<typeof loader>();

    const policyKey = kebabToCamelCase(policy.handle) as PolicyKey;
    const descriptionFn = POLICY_DESCRIPTIONS[policyKey];
    const description = descriptionFn ? descriptionFn("our store") : undefined;

    return <LegalPageLayout title={policy.title} description={description} content={policy.body} />;
}

export {RouteErrorBoundary as ErrorBoundary} from "~/components/RouteErrorBoundary";
