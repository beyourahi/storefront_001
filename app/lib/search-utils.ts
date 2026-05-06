/**
 * Client-side search filtering helpers used by the instant-search overlay.
 * Returns at most 5 results per category; empty arrays when the query is blank.
 * `policyPages` is the static registry of policy routes searched alongside products.
 */

export const policyPages = [
    {
        id: "privacy-policy",
        title: "Privacy Policy",
        description: "How we collect, use, and protect your personal information",
        href: "/privacy-policy"
    },
    {
        id: "terms-of-service",
        title: "Terms of Service",
        description: "Terms and conditions for using our services",
        href: "/terms-of-service"
    },
    {
        id: "shipping-policy",
        title: "Shipping Policy",
        description: "Information about shipping, delivery, and returns",
        href: "/shipping-policy"
    },
    {
        id: "refund-policy",
        title: "Refund Policy",
        description: "Our refund and return policy information",
        href: "/refund-policy"
    }
];

export const filterPolicies = (query: string) => {
    if (query === "") return [];
    return policyPages.filter(
        policy =>
            policy.title.toLowerCase().includes(query.toLowerCase()) ||
            policy.description.toLowerCase().includes(query.toLowerCase())
    );
};
