export const NAVIGATION_LINKS: readonly {href: string; label: string}[] = [
    {href: "/collections/all-products", label: "Shop All"},
    {href: "/collections", label: "Collections"},
    {href: "/gallery", label: "Gallery"}
];

export const POLICY_LINKS = [
    {
        href: "/policies/privacy-policy",
        label: "Privacy Policy",
        handle: "privacy-policy",
        policyKey: "privacyPolicy"
    },
    {
        href: "/policies/terms-of-service",
        label: "Terms of Service",
        handle: "terms-of-service",
        policyKey: "termsOfService"
    },
    {
        href: "/policies/shipping-policy",
        label: "Shipping Policy",
        handle: "shipping-policy",
        policyKey: "shippingPolicy"
    },
    {
        href: "/policies/refund-policy",
        label: "Refund Policy",
        handle: "refund-policy",
        policyKey: "refundPolicy"
    }
] as const;

export const DEVELOPER_CONFIG = {
    name: "Rahi Khan",
    url: "https://beyourahi.com",
    email: "beyourahi@gmail.com"
} as const;
