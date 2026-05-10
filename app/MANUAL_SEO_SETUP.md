# SEO Setup Guide for storefront_001

This document covers what needs to be configured in Shopify Admin and in the metaobject CMS
to get full SEO functionality from this storefront template.

## Required Shopify Shop Fields

Configure these in **Shopify Admin → Settings → General** (or via the Storefront API):

| Field | Where to set | SEO impact |
|-------|-------------|-----------|
| `shop.name` | General settings | Site name, `og:site_name`, title suffix |
| `shop.description` | General settings | Default meta description fallback |
| `shop.primaryDomain.url` | Domains settings | Canonical URL base (`<link rel="canonical">`) |
| `brand.logo` | Brand settings | OG image fallback, Organization schema `logo` |
| `brand.coverImage` | Brand settings | OG image (preferred over logo for social sharing) |

## Required `site_settings` Metaobject Fields

The template reads these fields from the `site_settings` metaobject
(defined in `app/lib/metaobject-parsers.ts`):

| Field key | Type | SEO impact |
|-----------|------|-----------|
| `brand_name` | text | Site name, title suffix, schema `name` |
| `mission_statement` | text | Default page meta description |
| `website_url` | url | **Critical** — used as canonical URL base; without this, canonical links are path-only |
| `og_image` | image | Default OG image for social sharing (1200×630px recommended) |
| `brand_logo` | image | Fallback OG image + schema `logo` |
| `faq_items` | list | Generates `FAQPage` JSON-LD on homepage and `/faq` |
| `social_links` | list | Populates `Organization.sameAs` in schema |
| `announcement_banner` | text | N/A (UI only) |

### Setting `website_url`

This is the most critical field. Without it, canonical tags emit path-only URLs (`/products/foo`)
instead of absolute URLs (`https://example.com/products/foo`). Absolute canonicals are required
for Google to deduplicate URLs correctly.

Set it to your primary Shopify domain: `https://your-store.myshopify.com` or your custom domain.

## Per-Product SEO

Set product-level SEO overrides in **Shopify Admin → Products → [product] → SEO section**:
- **Page title** — overrides the generated `<title>` and `og:title`
- **Meta description** — overrides the generated `<meta name="description">`

These values are fetched via `product.seo { title description }` in the product GraphQL fragment.
If empty, the template falls back to `product.title` and `product.description`.

## Robots and Indexability

The following routes are marked `noindex` by default and will NOT appear in search engines:

| Route | Robots | Reason |
|-------|--------|--------|
| `/account/*` | `noindex, nofollow` | Private user data |
| `/cart` | `noindex` | Per-user cart state |
| `/wishlist` | `noindex` | Redirects to /account/wishlist |
| `/changelog` | `noindex` | Internal-facing content |
| `/search` | `noindex` | Duplicate/thin content on search result pages |

## Sitemap

- **`/sitemap.xml`** — Shopify-generated sitemap index (products, collections, articles, pages)
- **`/sitemap.custom.xml`** — Custom sitemap for routes outside Shopify's index: `/faq`, `/gallery`, `/sale`
- `/wishlist` and `/changelog` are intentionally **excluded** from the custom sitemap

## Validation Checklist

After deploying this storefront to a client:

1. **Canonical links** — view-source every page and confirm exactly one `<link rel="canonical" href="https://...">` with an absolute URL
2. **JSON-LD** — paste page source into [Google Rich Results Test](https://search.google.com/test/rich-results); fix any errors
3. **robots.txt** — visit `/robots.txt`; confirm `Sitemap:` line uses the correct domain
4. **Sitemap** — visit `/sitemap.xml`; confirm it resolves and lists your product/collection URLs
5. **Lighthouse SEO** — run Lighthouse on homepage, a PDP, and a collection page; target ≥90
6. **Search Console** — submit sitemap URL in Google Search Console after launch

## Optional Schema Enhancements

To unlock `LocalBusiness` schema (for stores with a physical location), add these fields
to the `site_settings` metaobject:

| Field key | Type | Usage |
|-----------|------|-------|
| `address_street` | text | `LocalBusiness.address.streetAddress` |
| `address_city` | text | `LocalBusiness.address.addressLocality` |
| `address_region` | text | `LocalBusiness.address.addressRegion` |
| `address_postal` | text | `LocalBusiness.address.postalCode` |
| `address_country` | text | `LocalBusiness.address.addressCountry` |
| `phone` | text | `LocalBusiness.telephone` |

The template degrades gracefully if these fields are absent — no errors, just no LocalBusiness schema.
