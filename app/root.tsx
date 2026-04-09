import {useEffect, useMemo} from "react";
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
import {toast} from "sonner";
import {GtmScript} from "~/components/GtmScript";
import {GoogleTagManager} from "~/components/GoogleTagManager";
import {ServiceWorkerRegistration} from "~/components/ServiceWorkerRegistration";
import {ServiceWorkerUpdateBanner} from "~/components/pwa/ServiceWorkerUpdateBanner";
import {NetworkStatusIndicator} from "~/components/NetworkStatusIndicator";
import {NativeAppBanner} from "~/components/NativeAppBanner";
import {OfflineAwareErrorPage} from "~/components/OfflineAwareErrorPage";
import {SearchControllerProvider} from "~/components/search/SearchControllerProvider";
import {generateWebsiteSchema, getSeoDefaults} from "~/lib/seo";
import {STORE_LANGUAGE_CODE} from "~/lib/store-locale";
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
        // Google Fonts preconnects are emitted dynamically in Layout's <head> alongside the
        // actual stylesheet. Duplicating them here via links() caused them to appear twice
        // because links() feeds <Links /> which renders on every navigation.
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

    // NOTE: theme-color, PWA, and mobile meta tags are emitted in Layout's static <head>
    // so they persist across child route navigations (child meta() exports replace parent meta).
    return [
        ...seoMeta,
        ...(data?.websiteSchema ? [{"script:ld+json": data.websiteSchema}] : [])
    ];
};

export async function loader(args: Route.LoaderArgs) {
    const deferredData = loadDeferredData(args);
    const criticalData = await loadCriticalData(args);
    return {...deferredData, ...criticalData};
}

async function loadCriticalData({context, request}: Route.LoaderArgs) {
    const {storefront, dataAdapter, env} = context;
    const requestUrl = new URL(request.url);

    const [header, menuCollectionsData, shopData, themeSettingsData, siteContentData, blogData] = await Promise.all([
        dataAdapter.query(HEADER_QUERY, {
            variables: {headerMenuHandle: "main-menu"},
            cache: dataAdapter.CacheLong()
        }),
        dataAdapter.query(MENU_COLLECTIONS_QUERY, {cache: dataAdapter.CacheShort()}).catch((error: unknown) => {
            console.error("Failed to load menu collections:", error);
            return null;
        }),
        dataAdapter.query(SHOP_SHIPPING_CONFIG_QUERY, {cache: dataAdapter.CacheLong()}).catch((error: unknown) => {
            console.error("Failed to load shipping config:", error);
            return null;
        }),
        dataAdapter.query(THEME_SETTINGS_QUERY, {cache: dataAdapter.CacheLong()}).catch((error: unknown) => {
            console.error("Failed to load theme settings:", error);
            return null;
        }),
        dataAdapter.query(SITE_CONTENT_QUERY, {cache: dataAdapter.CacheLong()}).catch((error: unknown) => {
            console.error("Failed to load site content:", error);
            return null;
        }),
        dataAdapter.query(HAS_BLOG_QUERY, {cache: dataAdapter.CacheLong()}).catch((error: unknown) => {
            console.error("Failed to check blog availability:", error);
            return null;
        })
    ]);

    const siteContent = parseSiteContent(siteContentData, themeSettingsData);
    const generatedTheme: GeneratedTheme | null = generateTheme(
        siteContent.themeConfig.colors,
        siteContent.themeConfig.fonts,
        siteContent.themeConfig.borderRadius
    );
    const hasBlog = (blogData as any)?.articles?.nodes?.length > 0;
    const websiteSchema = generateWebsiteSchema(siteContent.siteSettings);
    const shippingConfig = parseShippingConfig(
        shopData?.shop?.freeShippingThreshold?.value,
        shopData?.shop?.paymentSettings?.currencyCode
    );

    const menuCollections =
        menuCollectionsData?.collections?.nodes
            ?.map((collection: any) => ({
                id: collection.id,
                handle: collection.handle,
                title: collection.title,
                productsCount: (collection.products?.nodes?.length ?? 0) > 0 ? 1 : 0,
                image: collection.image
            }))
            .filter((collection: any) => collection.productsCount > 0) ?? [];

    const totalProductCount = menuCollectionsData?.allProducts?.nodes?.length ?? 0;

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
        .filter((p: any) => p.featuredImage)
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
                    currencyCode: p.priceRange.minVariantPrice.currencyCode
                }
            },
            variants: {
                nodes: (p.variants?.nodes ?? []).map((v: any) => ({
                    availableForSale: v.availableForSale,
                    price: {amount: v.price.amount, currencyCode: v.price.currencyCode},
                    compareAtPrice: v.compareAtPrice
                        ? {amount: v.compareAtPrice.amount, currencyCode: v.compareAtPrice.currencyCode}
                        : null
                }))
            }
        }));

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
        publicStoreDomain: env.PUBLIC_STORE_DOMAIN,
        shop: getShopAnalytics({storefront, publicStorefrontId: env.PUBLIC_STOREFRONT_ID || "0"}),
        consent: {
            checkoutDomain: env.PUBLIC_CHECKOUT_DOMAIN,
            storefrontAccessToken: env.PUBLIC_STOREFRONT_API_TOKEN,
            withPrivacyBanner: false,
            country: storefront.i18n.country,
            language: storefront.i18n.language
        },
        gtmContainerId: env.PUBLIC_GTM_CONTAINER_ID || "",
        websiteSchema
    };
}

function loadDeferredData({context}: Route.LoaderArgs) {
    const {storefront, customerAccount, cart} = context;

    const cartPromise = withTimeoutAndFallback(cart.get(), null, TIMEOUT_DEFAULTS.CART);

    const isLoggedInPromise = customerAccount.isLoggedIn();
    const isLoggedIn = withTimeoutAndFallback(isLoggedInPromise, false, TIMEOUT_DEFAULTS.AUTH);

    const hasStoreCredit: Promise<boolean> = isLoggedInPromise
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
        .catch((error: unknown) => {
            console.error("Failed to check store credit balance:", error);
            return false;
        });

    const hasStoreCreditWithTimeout = withTimeoutAndFallback(hasStoreCredit, false, TIMEOUT_DEFAULTS.STORE_CREDIT);

    // Wrap footer and cartSuggestions in timeout to prevent indefinite loading
    // states if Storefront API hangs. Falls back to null after 8 seconds.
    const footer = withTimeoutAndFallback(
        storefront
            .query(FOOTER_QUERY, {
                variables: {footerMenuHandle: "footer"}
            })
            .catch((error: unknown) => {
                console.error("Failed to load footer:", error);
                return null;
            }),
        null,
        TIMEOUT_DEFAULTS.API
    );

    const cartSuggestions = withTimeoutAndFallback(
        storefront
            .query(CART_SUGGESTIONS_QUERY)
            .then(data => data.products?.nodes?.filter((p: any) => p.availableForSale) ?? null)
            .catch((error: unknown) => {
                console.error("Failed to load cart suggestions:", error);
                return null;
            }),
        null,
        TIMEOUT_DEFAULTS.API
    );

    return {
        cart: cartPromise,
        isLoggedIn,
        hasStoreCredit: hasStoreCreditWithTimeout,
        footer,
        cartSuggestions
    };
}

function ThemeStyleTag({css}: {css: string}) {
    return <style dangerouslySetInnerHTML={{__html: css}} />;
}

export function Layout({children}: {children?: React.ReactNode}) {
    const nonce = useNonce();
    const data = useRouteLoaderData<RootLoader>("root");
    const generatedTheme = data?.generatedTheme;
    // Derive theme-color and brand name for static head meta — must be computed here
    // because child route meta() exports replace root meta() entirely (React Router 7).
    const seoDefaults = getSeoDefaults(data?.siteContent?.siteSettings, data?.siteContent?.themeConfig);

    return (
        <html lang={STORE_LANGUAGE_CODE.toLowerCase()}>
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width,initial-scale=1" />
                {/* Static PWA/mobile meta — placed here rather than in meta() so they persist
                    on every page regardless of which child route overrides meta(). */}
                <meta name="theme-color" content={seoDefaults.themeColor} />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="default" />
                <meta name="apple-mobile-web-app-title" content={seoDefaults.brandName} />
                <meta name="mobile-web-app-capable" content="yes" />
                <meta name="format-detection" content="telephone=no" />
                {/* Font preload reduces FOUT by hinting the browser to fetch before the stylesheet parses */}
                {generatedTheme?.googleFontsUrl && (
                    <link rel="preconnect" href="https://fonts.googleapis.com" />
                )}
                {generatedTheme?.googleFontsUrl && (
                    <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                )}
                {generatedTheme?.googleFontsUrl && (
                    <link rel="preload" as="style" href={generatedTheme.googleFontsUrl} />
                )}
                {generatedTheme?.googleFontsUrl && (
                    <link rel="stylesheet" href={generatedTheme.googleFontsUrl} />
                )}
                <Meta />
                <Links />
                {generatedTheme?.cssVariables && <ThemeStyleTag css={generatedTheme.cssVariables} />}
                {/* PWA install-capture script is non-critical — async prevents it from blocking
                    HTML parsing. Placed after Links/Meta so it does not delay critical resources. */}
                <script src="/pwa-install-capture.js" async nonce={nonce} suppressHydrationWarning />
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

    // Show toast notifications for discount code application results.
    // The discount route appends ?discount_applied=CODE or ?discount_error=invalid.
    // NOTE: sonner's Toaster may not hydrate in time for the initial mount toast —
    // if toasts don't appear, investigate sonner SSR hydration with Hydrogen.
    useEffect(() => {
        if (typeof window === "undefined") return;
        const params = new URLSearchParams(window.location.search);
        const applied = params.get("discount_applied");
        const error = params.get("discount_error");
        if (!applied && !error) return;

        // Defer to allow sonner's Toaster to mount after hydration
        const tid = setTimeout(() => {
            if (applied) {
                toast.success(`Discount code "${applied}" applied!`);
            } else if (error) {
                toast.error("That discount code is invalid or has expired.");
            }
        }, 300);

        params.delete("discount_applied");
        params.delete("discount_error");
        const clean = `${window.location.pathname}${params.toString() ? "?" + params.toString() : ""}`;
        window.history.replaceState({}, "", clean);

        return () => clearTimeout(tid);
    }, []);

    // Memoized before the early return guard to satisfy the Rules of Hooks.
    const menuCollections = useMemo(() => data?.menuCollections ?? [], [data?.menuCollections]);
    const mobileMenuCollections = useMemo(() => menuCollections.map((collection: any) => ({
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
    })), [menuCollections]);
    const searchCollections = useMemo(() => menuCollections.map((collection: any) => ({
        id: collection.id,
        title: collection.title,
        handle: collection.handle,
        image: collection.image
            ? {
                  url: collection.image.url,
                  altText: collection.image.altText ?? null
              }
            : null
    })), [menuCollections]);

    if (!data) return (<><Outlet /><Toaster position="top-center" /></>);

    const shopName = data.siteContent.siteSettings.brandName?.trim() || "Store";

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
                                    {/* Persistent native-app deep-link button — mobile only, mounted once at shell level */}
                                    <NativeAppBanner />
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

    let status = 500;
    let message: string | undefined;

    if (isRouteErrorResponse(error)) {
        status = error.status;
        message = error.data?.message ?? error.data;
    } else if (error instanceof Error) {
        message = error.message;
    }

    // Content only — React Router 7's Layout export wraps ErrorBoundary
    // with the full <html> document shell, so we must NOT render one here.
    return (
        <>
            <CachedThemeInjector />
            <OfflineAwareErrorPage statusCode={status} title={undefined} message={message} />
        </>
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
