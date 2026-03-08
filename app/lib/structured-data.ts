/**
 * Schema.org types from schema-dts for reference:
 * - WithContext<Product> for createProductSchema
 * - WithContext<Organization> for createOrganizationSchema
 * - WithContext<WebSite> for createWebSiteSchema
 * - WithContext<FAQPage> for createFAQSchema
 * - WithContext<BlogPosting> for createBlogPostingSchema
 * - WithContext<BreadcrumbList> for createBreadcrumbSchema
 * - WithContext<CollectionPage> for createCollectionSchema
 *
 * Note: schema-dts types are strict unions that don't align with our loose
 * object literals. The types are documented here for reference; the actual
 * return objects conform to Schema.org spec at runtime.
 */
import type {
    WithContext,
    Organization,
    WebSite,
    Product as SchemaProduct,
    FAQPage,
    BlogPosting,
    BreadcrumbList,
    CollectionPage
} from "schema-dts";
import {STORE_COUNTRY_NAME, STORE_LOCALE} from "~/lib/store-locale";

// Re-export for consumers that want to reference these types
export type {WithContext, Organization, WebSite, SchemaProduct, FAQPage, BlogPosting, BreadcrumbList, CollectionPage};

import {DEFAULT_SOCIAL_LINKS} from "~/lib/metaobject-parsers";

const FALLBACK_SLOGAN = "Your store. Your story. Built to sell.";
const FALLBACK_CONTACT_EMAIL = "hello@example.com";
const FALLBACK_CONTACT_PHONE = "+1 (555) 123-4567";
const FALLBACK_ADDRESS = {
    street: "123 Broadway",
    city: "New York",
    state: "NY",
    zip: "10001",
    country: STORE_COUNTRY_NAME
};

type MoneyV2 = {amount: string; currencyCode: string};
type ImageNode = {url: string; altText?: string | null; width?: number | null; height?: number | null};

export const SEO_CONFIG = {
    siteName: FALLBACK_SLOGAN ? FALLBACK_SLOGAN : "Store",
    defaultDescription: FALLBACK_SLOGAN ?? "",
    locale: STORE_LOCALE,
    twitterCardType: "summary_large_image" as const
} as const;

export function truncateDescription(text: string | null | undefined, maxLength = 155): string {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    const truncated = text.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(" ");
    return lastSpace > 0 ? truncated.substring(0, lastSpace) + "..." : truncated + "...";
}

export function stripHtml(html: string | null | undefined): string {
    if (!html) return "";
    return html.replace(/<[^>]*>/g, "").trim();
}

export function buildCanonicalUrl(path: string, siteUrl: string): string {
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${siteUrl}${cleanPath}`;
}

export function formatSchemaPrice(amount: string | number): string {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return num.toFixed(2);
}

export function formatSchemaDate(date: string | Date): string {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toISOString();
}

export function getBrandNameFromMatches(matches: Array<{id: string; data?: unknown} | undefined>): string {
    const rootMatch = matches.find(m => m?.id === "root");
    const rootData = rootMatch?.data as {siteContent?: {siteSettings?: {brandName?: string}}} | undefined;
    return rootData?.siteContent?.siteSettings?.brandName || "Store";
}

export function createProductSchema(
    product: {
        title: string;
        description?: string;
        handle: string;
        vendor?: string;
        images?: {nodes?: ImageNode[]};
        selectedOrFirstAvailableVariant?: {
            price: MoneyV2;
            compareAtPrice?: MoneyV2 | null;
            availableForSale?: boolean;
            sku?: string | null;
        } | null;
        seo?: {title?: string | null; description?: string | null} | null;
    },
    url: string
) {
    const variant = product.selectedOrFirstAvailableVariant;
    const image = product.images?.nodes?.[0];

    return {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.title,
        description: product.seo?.description || product.description || "",
        url,
        image: image?.url,
        brand: product.vendor ? {"@type": "Brand", name: product.vendor} : undefined,
        sku: variant?.sku || undefined,
        offers: variant
            ? {
                  "@type": "Offer",
                  url,
                  priceCurrency: variant.price.currencyCode,
                  price: variant.price.amount,
                  availability: variant.availableForSale
                      ? "https://schema.org/InStock"
                      : "https://schema.org/OutOfStock"
              }
            : undefined
    };
}

export function createFAQSchema(faqs: Array<{question: string; answer: string}>) {
    if (!faqs || faqs.length === 0) return null;

    return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map(faq => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: {
                "@type": "Answer",
                text: faq.answer
            }
        }))
    };
}

export function createOrganizationSchema(shopName?: string, url?: string) {
    const name = shopName || SEO_CONFIG.siteName;
    const socialUrls = DEFAULT_SOCIAL_LINKS.map(link => link.url).filter(Boolean);

    return {
        "@context": "https://schema.org",
        "@type": "Organization",
        name,
        url: url || undefined,
        email: FALLBACK_CONTACT_EMAIL || undefined,
        telephone: FALLBACK_CONTACT_PHONE || undefined,
        address: FALLBACK_ADDRESS
            ? {
                  "@type": "PostalAddress",
                  streetAddress: FALLBACK_ADDRESS.street,
                  addressLocality: FALLBACK_ADDRESS.city,
                  addressRegion: FALLBACK_ADDRESS.state,
                  postalCode: FALLBACK_ADDRESS.zip,
                  addressCountry: FALLBACK_ADDRESS.country
              }
            : undefined,
        sameAs: socialUrls.length > 0 ? socialUrls : undefined
    };
}

export function createBreadcrumbSchema(items: Array<{name: string; url: string}>, baseUrl: string) {
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: item.name,
            item: `${baseUrl}${item.url}`
        }))
    };
}

export function createCollectionSchema(
    collection: {
        title: string;
        description?: string;
        products?: {
            nodes?: Array<{
                title: string;
                handle: string;
                images?: {nodes?: ImageNode[]};
                priceRange?: {minVariantPrice: MoneyV2};
            }>;
        };
    },
    url: string
) {
    const items = collection.products?.nodes?.slice(0, 10) ?? [];

    return {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: collection.title,
        description: collection.description || "",
        url,
        mainEntity: {
            "@type": "ItemList",
            numberOfItems: collection.products?.nodes?.length ?? 0,
            itemListElement: items.map((product, index) => ({
                "@type": "ListItem",
                position: index + 1,
                url: `${new URL(url).origin}/products/${product.handle}`,
                name: product.title,
                image: product.images?.nodes?.[0]?.url
            }))
        }
    };
}

export function createBlogPostingSchema(
    article: {
        title: string;
        excerpt?: string | null;
        publishedAt?: string | null;
        author?: {name?: string | null} | null;
        image?: {url: string; width?: number | null; height?: number | null} | null;
        handle: string;
    },
    blogHandle: string,
    shopName: string,
    siteUrl: string
) {
    return {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: article.title,
        description: article.excerpt || undefined,
        image: article.image?.url || undefined,
        datePublished: article.publishedAt ? new Date(article.publishedAt).toISOString() : undefined,
        dateModified: article.publishedAt ? new Date(article.publishedAt).toISOString() : undefined,
        author: article.author?.name
            ? {"@type": "Person", name: article.author.name}
            : {"@type": "Organization", name: shopName},
        publisher: {
            "@type": "Organization",
            name: shopName,
            url: siteUrl
        },
        mainEntityOfPage: {
            "@type": "WebPage",
            "@id": `${siteUrl}/blogs/${blogHandle}/${article.handle}`
        }
    };
}

export const createWebSiteSchema = (shopName: string, siteUrl: string) => ({
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: shopName,
    url: siteUrl,
    potentialAction: {
        "@type": "SearchAction",
        target: {
            "@type": "EntryPoint",
            urlTemplate: `${siteUrl}/search?q={search_term_string}`
        },
        "query-input": "required name=search_term_string"
    }
});

export function renderJsonLd(schema: Record<string, unknown> | null) {
    if (!schema) return null;
    return `<script type="application/ld+json">${JSON.stringify(schema)}</script>`;
}
