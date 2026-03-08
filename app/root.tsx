import {useEffect} from "react";
import {useNonce, Analytics, getSeoMeta, getShopAnalytics} from "@shopify/hydrogen";
import {
    Outlet,
    Links,
    Meta,
    Scripts,
    ScrollRestoration,
    useRouteLoaderData,
    useRouteError,
    isRouteErrorResponse,
    type ShouldRevalidateFunction
} from "react-router";
import type {Route} from "./+types/root";
import {
    HEADER_QUERY,
    CART_SUGGESTIONS_QUERY,
    FOOTER_QUERY,
    MENU_COLLECTIONS_QUERY,
    SHOP_SHIPPING_CONFIG_QUERY
} from "~/lib/fragments";
import {THEME_SETTINGS_QUERY, SITE_CONTENT_QUERY} from "~/lib/metaobject-queries";
import {parseSiteContent} from "~/lib/metaobject-parsers";
import {generateTheme, type GeneratedTheme} from "~/lib/theme-utils";
import {SiteContentProvider} from "~/lib/site-content-context";
import {WishlistProvider} from "~/lib/wishlist-context";
import {saveThemeToStorage, getThemeFromStorage, updateOfflinePageCache} from "~/lib/theme-storage";
import {LenisProvider} from "~/lib/LenisProvider";
import {withTimeoutAndFallback, TIMEOUT_DEFAULTS} from "~/lib/promise-utils";
import {parseShippingConfig} from "~/lib/shipping";
import {extractPopularSearchTerms} from "~/lib/popularSearches";
import {countDiscountedProducts, type LightweightProduct} from "~/lib/discounts";
import {STORE_CREDIT_BALANCE_QUERY} from "~/graphql/customer-account/StoreCreditQueries";
import {CartDrawerProvider} from "~/hooks/useCartDrawer";
import {RecentlyViewedProvider} from "~/components/RecentlyViewedProvider";
import {CartAside} from "~/components/cart/CartAside";
import {Navbar} from "~/components/layout/Navbar";
import {SearchOverlay} from "~/components/layout/SearchOverlay";
import {Footer} from "~/components/layout/Footer";
import {AnnouncementBanner} from "~/components/layout/AnnouncementBanner";
import {Toaster} from "~/components/ui/sonner";
import {GtmScript} from "~/components/GtmScript";
import {GoogleTagManager} from "~/components/GoogleTagManager";
import {ServiceWorkerRegistration} from "~/components/ServiceWorkerRegistration";
import {ServiceWorkerUpdateBanner} from "~/components/pwa/ServiceWorkerUpdateBanner";
import {NetworkStatusIndicator} from "~/components/NetworkStatusIndicator";
import {OfflineAwareErrorPage} from "~/components/OfflineAwareErrorPage";
import {SearchControllerProvider} from "~/components/search/SearchControllerProvider";
import {createWebSiteSchema, getSeoDefaults} from "~/lib/structured-data";
import appCss from "./styles/app.css?url";

export type RootLoader = typeof loader;

export type PopularProduct = {
    id: string;
    handle: string;
    title: string;
    availableForSale: boolean;
    featuredImage: {url: string; altText: string | null} | null;
    priceRange: {minVariantPrice: {amount: string; currencyCode: string}};
    variants: {
        nodes: Array<{
            availableForSale: boolean;
            price: {amount: string; currencyCode: string};
            compareAtPrice: {amount: string; currencyCode: string} | null;
        }>;
    };
};

export const shouldRevalidate: ShouldRevalidateFunction = ({formMethod, currentUrl, nextUrl}) => {
    if (formMethod && formMethod !== "GET") return true;
    if (currentUrl.toString() === nextUrl.toString()) return true;
    return false;
};

export function links() {
    return [
        {rel: "preconnect", href: "https://cdn.shopify.com"},
        {rel: "preconnect", href: "https://shop.app"},
        {rel: "preconnect", href: "https://fonts.googleapis.com"},
        {rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" as const},
        {rel: "stylesheet", href: appCss},
        {rel: "manifest", href: "/manifest.webmanifest"},
        {rel: "apple-touch-icon", href: "/apple-touch-icon.png"},
        {rel: "icon", href: "/favicon.ico"}
    ];
}

export const meta: Route.MetaFunction = ({data}) => {
    const seoDefaults = getSeoDefaults(data?.siteContent?.siteSettings, data?.siteContent?.themeConfig);
    const seoMeta =
        getSeoMeta({
            title: seoDefaults.brandName,
            titleTemplate: `%s | ${seoDefaults.brandName}`,
            description: seoDefaults.description,
            url: seoDefaults.siteUrl || undefined,
            media: seoDefaults.media
        }) ?? [];

    return [
        ...seoMeta,
        {name: "theme-color", content: seoDefaults.themeColor},
        {name: "apple-mobile-web-app-capable", content: "yes"},
        {name: "apple-mobile-web-app-status-bar-style", content: "default"},
        {name: "apple-mobile-web-app-title", content: seoDefaults.brandName},
        {name: "mobile-web-app-capable", content: "yes"},
        {name: "format-detection", content: "telephone=no"},
        ...(data?.websiteSchema ? [{"script:ld+json": data.websiteSchema}] : [])
    ];
};

export async function loader({context, request}: Route.LoaderArgs) {
    const {storefront, dataAdapter, customerAccount, cart, env} = context;
    const requestUrl = new URL(request.url);

    // Critical data — blocks render
    const [header, menuCollectionsData, shopData, themeSettingsData, siteContentData, blogData] = await Promise.all([
        dataAdapter.query(HEADER_QUERY, {
            variables: {headerMenuHandle: "main-menu"}
        }),
        dataAdapter.query(MENU_COLLECTIONS_QUERY).catch((error: unknown) => { console.error("Failed to load menu collections:", error); return null; }),
        dataAdapter.query(SHOP_SHIPPING_CONFIG_QUERY).catch((error: unknown) => { console.error("Failed to load shipping config:", error); return null; }),
        dataAdapter.query(THEME_SETTINGS_QUERY, {cache: dataAdapter.CacheNone()}).catch((error: unknown) => { console.error("Failed to load theme settings:", error); return null; }),
        dataAdapter.query(SITE_CONTENT_QUERY, {cache: dataAdapter.CacheNone()}).catch((error: unknown) => { console.error("Failed to load site content:", error); return null; }),
        dataAdapter.query(HAS_BLOG_QUERY).catch((error: unknown) => { console.error("Failed to check blog availability:", error); return null; })
    ]);

    const siteContent = parseSiteContent(siteContentData, themeSettingsData);
    const generatedTheme: GeneratedTheme | null = generateTheme(
        siteContent.themeConfig.colors,
        siteContent.themeConfig.fonts
    );
    const hasBlog = (blogData as any)?.articles?.nodes?.length > 0;
    const websiteSchema = createWebSiteSchema(
        siteContent.siteSettings.brandName || "Store",
        siteContent.siteSettings.siteUrl || requestUrl.origin
    );
    const shippingConfig = parseShippingConfig(shopData?.shop?.freeShippingThreshold?.value);

    // Process collections for navigation (product counts, discounts)
    const menuCollections =
        menuCollectionsData?.collections?.nodes
            ?.map((collection: any) => ({
                id: collection.id,
                handle: collection.handle,
                title: collection.title,
                productsCount: collection.products?.nodes?.filter((p: any) => p.availableForSale).length ?? 0,
                image: collection.image
            }))
            .filter((collection: any) => collection.productsCount > 0) ?? [];

    const totalProductCount =
        menuCollectionsData?.allProducts?.nodes?.filter(
            (p: any) => p.availableForSale && p.variants?.nodes?.some((v: any) => v.availableForSale)
        ).length ?? 0;

    const discountCount = menuCollectionsData?.allProducts?.nodes
        ? countDiscountedProducts(menuCollectionsData.allProducts.nodes as LightweightProduct[])
        : 0;

    const popularSearchTerms = menuCollectionsData
        ? extractPopularSearchTerms(
              menuCollectionsData.allProducts?.nodes?.map((p: any) => ({
                  title: p.title,
                  productType: p.productType,
                  availableForSale: p.availableForSale
              })) ?? [],
              menuCollectionsData.collections?.nodes?.map((c: any) => ({
                  title: c.title,
                  handle: c.handle
              })) ?? []
          )
        : [];

    const popularProducts: PopularProduct[] = (menuCollectionsData?.allProducts?.nodes ?? [])
        .filter((p: any) => p.availableForSale && p.featuredImage)
        .slice(0, 10)
        .map((p: any) => ({
            id: p.id,
            handle: p.handle,
            title: p.title,
            availableForSale: p.availableForSale,
            featuredImage: p.featuredImage
                ? {url: p.featuredImage.url, altText: p.featuredImage.altText ?? null}
                : null,
            priceRange: {
                minVariantPrice: {
                    amount: p.priceRange.minVariantPrice.amount,
                    currencyCode: p.priceRange.minVariantPrice.currencyCode,
                },
            },
            variants: {
                nodes: (p.variants?.nodes ?? []).map((v: any) => ({
                    availableForSale: v.availableForSale,
                    price: {amount: v.price.amount, currencyCode: v.price.currencyCode},
                    compareAtPrice: v.compareAtPrice
                        ? {amount: v.compareAtPrice.amount, currencyCode: v.compareAtPrice.currencyCode}
                        : null,
                })),
            },
        }));

    // Deferred data — streams in after initial render
    const cartPromise = withTimeoutAndFallback(cart.get(), null, TIMEOUT_DEFAULTS.CART);

    const isLoggedIn = withTimeoutAndFallback(customerAccount.isLoggedIn(), false, TIMEOUT_DEFAULTS.AUTH);

    const hasStoreCredit: Promise<boolean> = customerAccount
        .isLoggedIn()
        .then(async loggedIn => {
            if (!loggedIn) return false;
            try {
                const response = await customerAccount.query(STORE_CREDIT_BALANCE_QUERY, {
                    variables: {language: customerAccount.i18n.language}
                });
                const accounts = response?.data?.customer?.storeCreditAccounts?.nodes ?? [];
                return accounts.length > 0;
            } catch {
                return false;
            }
        })
        .catch((error: unknown) => { console.error("Failed to check store credit balance:", error); return false; });

    const hasStoreCreditWithTimeout = withTimeoutAndFallback(hasStoreCredit, false, TIMEOUT_DEFAULTS.STORE_CREDIT);

    const footer = storefront
        .query(FOOTER_QUERY, {
            variables: {footerMenuHandle: "footer"}
        })
        .catch((error: unknown) => { console.error("Failed to load footer:", error); return null; });

    const cartSuggestions = storefront
        .query(CART_SUGGESTIONS_QUERY)
        .then(data => data.products?.nodes?.filter((p: any) => p.availableForSale) ?? null)
        .catch((error: unknown) => { console.error("Failed to load cart suggestions:", error); return null; });

    return {
        header,
        siteContent,
        generatedTheme,
        hasBlog,
        menuCollections,
        totalProductCount,
        discountCount,
        popularSearchTerms,
        popularProducts,
        shippingConfig,
        cart: cartPromise,
        isLoggedIn,
        hasStoreCredit: hasStoreCreditWithTimeout,
        footer,
        cartSuggestions,
        publicStoreDomain: env.PUBLIC_STORE_DOMAIN,
        shop: getShopAnalytics({storefront, publicStorefrontId: env.PUBLIC_STOREFRONT_ID}),
        consent: {
            checkoutDomain: env.PUBLIC_CHECKOUT_DOMAIN,
            storefrontAccessToken: env.PUBLIC_STOREFRONT_API_TOKEN
        },
        gtmContainerId: env.PUBLIC_GTM_CONTAINER_ID || "",
        websiteSchema
    };
}

function ThemeStyleTag({css}: {css: string}) {
    return <style dangerouslySetInnerHTML={{__html: css}} />;
}

export function Layout({children}: {children?: React.ReactNode}) {
    const nonce = useNonce();
    const data = useRouteLoaderData<RootLoader>("root");
    const generatedTheme = data?.generatedTheme;

    return (
        <html lang="en">
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width,initial-scale=1" />
                <script src="/pwa-install-capture.js" nonce={nonce} suppressHydrationWarning />
                {generatedTheme?.googleFontsUrl && <link rel="stylesheet" href={generatedTheme.googleFontsUrl} />}
                <Meta />
                <Links />
                {generatedTheme?.cssVariables && <ThemeStyleTag css={generatedTheme.cssVariables} />}
            </head>
            <body>
                <GtmScript gtmContainerId={data?.gtmContainerId || ""} />
                <ServiceWorkerRegistration />
                <ServiceWorkerUpdateBanner />
                <NetworkStatusIndicator />
                {children}
                <ScrollRestoration nonce={nonce} />
                <Scripts nonce={nonce} />
            </body>
        </html>
    );
}

export default function App() {
    const data = useRouteLoaderData<RootLoader>("root");

    useEffect(() => {
        if (data?.generatedTheme) {
            saveThemeToStorage(data.generatedTheme);
            void updateOfflinePageCache();
        }
    }, [data?.generatedTheme]);

    if (!data) return <Outlet />;

    const shopName = data.siteContent.siteSettings.brandName?.trim() || "Store";
    const mobileMenuCollections = (data.menuCollections ?? []).map((collection: any) => ({
        id: collection.id,
        title: collection.title,
        handle: collection.handle,
        description: "",
        image: collection.image
            ? {
                  url: collection.image.url,
                  altText: collection.image.altText ?? null
              }
            : null,
        productCount: collection.productsCount ?? 0
    }));
    const searchCollections = (data.menuCollections ?? []).map((collection: any) => ({
        id: collection.id,
        title: collection.title,
        handle: collection.handle,
        image: collection.image
            ? {
                  url: collection.image.url,
                  altText: collection.image.altText ?? null
              }
            : null
    }));

    return (
        <SiteContentProvider siteContent={data.siteContent}>
            <WishlistProvider>
                <Analytics.Provider cart={data.cart} shop={data.shop} consent={data.consent}>
                    <GoogleTagManager />
                    <RecentlyViewedProvider>
                        <LenisProvider>
                            <CartDrawerProvider>
                                <SearchControllerProvider>
                                    <CartAside />
                                    <AnnouncementBanner texts={data.siteContent.siteSettings.announcementBanner} />
                                    <Navbar shopName={shopName} collections={mobileMenuCollections} />
                                    <SearchOverlay
                                        shopName={shopName}
                                        collections={searchCollections}
                                        popularSearchTerms={data.popularSearchTerms ?? []}
                                        popularProducts={data.popularProducts ?? []}
                                    />
                                    <main className="pt-[var(--total-header-height)] transition-[padding-top] duration-300 ease-in-out">
                                        <Outlet />
                                    </main>
                                    <Footer shopName={shopName} />
                                    <Toaster position="top-center" />
                                </SearchControllerProvider>
                            </CartDrawerProvider>
                        </LenisProvider>
                    </RecentlyViewedProvider>
                </Analytics.Provider>
            </WishlistProvider>
        </SiteContentProvider>
    );
}

function CachedThemeInjector() {
    useEffect(() => {
        const theme = getThemeFromStorage();
        if (!theme) return;

        if (theme.cssVariables) {
            const styleId = "error-boundary-theme";
            let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
            if (!styleEl) {
                styleEl = document.createElement("style");
                styleEl.id = styleId;
                document.head.appendChild(styleEl);
            }
            styleEl.textContent = theme.cssVariables;
        }

        if (theme.googleFontsUrl) {
            const fontId = "error-boundary-fonts";
            if (!document.getElementById(fontId)) {
                const fontLink = document.createElement("link");
                fontLink.id = fontId;
                fontLink.rel = "stylesheet";
                fontLink.href = theme.googleFontsUrl;
                document.head.appendChild(fontLink);
            }
        }
    }, []);

    return null;
}

export function ErrorBoundary() {
    const error = useRouteError();
    const nonce = useNonce();

    let status = 500;
    let message: string | undefined;

    if (isRouteErrorResponse(error)) {
        status = error.status;
        message = error.data?.message ?? error.data;
    } else if (error instanceof Error) {
        message = error.message;
    }

    return (
        <html lang="en">
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width,initial-scale=1" />
                <title>{`${status} Error`}</title>
                <Meta />
                <Links />
            </head>
            <body>
                <CachedThemeInjector />
                <OfflineAwareErrorPage statusCode={status} title={undefined} message={message} />
                <Scripts nonce={nonce} />
            </body>
        </html>
    );
}

const HAS_BLOG_QUERY = `#graphql
  query HasBlog {
    articles(first: 1) {
      nodes {
        id
      }
    }
  }
` as const;
