import {useEffect, useMemo, useState} from "react";
import {Ticket} from "lucide-react";
import {useNonce, Analytics, getShopAnalytics} from "@shopify/hydrogen";
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
import {HEADER_QUERY, CART_SUGGESTIONS_QUERY, FOOTER_QUERY, MENU_COLLECTIONS_QUERY} from "~/lib/fragments";
import {THEME_SETTINGS_QUERY, SITE_CONTENT_QUERY} from "~/lib/metaobject-queries";
import {parseSiteContent} from "~/lib/metaobject-parsers";
import {generateTheme, type GeneratedTheme} from "~/lib/theme-utils";
import {SiteContentProvider, useSiteSettings} from "~/lib/site-content-context";
import {WishlistProvider} from "~/lib/wishlist-context";
import {saveThemeToStorage, getThemeFromStorage, updateOfflinePageCache} from "~/lib/theme-storage";
import {LenisProvider} from "~/lib/LenisProvider";
import {withTimeoutAndFallback, TIMEOUT_DEFAULTS} from "~/lib/promise-utils";
import {parseShippingConfig} from "~/lib/shipping";
import {FLOATING_ACTION_BUTTON_CLASSES} from "~/lib/floating-action-styles";
import {extractPopularSearchTerms} from "~/lib/popularSearches";
import {countDiscountedProducts, type LightweightProduct} from "~/lib/discounts";
import {STORE_CREDIT_BALANCE_QUERY} from "~/graphql/customer-account/StoreCreditQueries";
import {CartDrawerProvider} from "~/hooks/useCartDrawer";
import {RecentlyViewedProvider} from "~/components/RecentlyViewedProvider";
import {CartAside} from "~/components/cart/CartAside";
import {ScratchCard} from "~/components/ScratchCard";
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
import {OpenInAppButton} from "~/components/pwa/OpenInAppButton";
import {FloatingChatWidget} from "~/components/FloatingChatWidget";
import {useFooterClearance} from "~/hooks/useFooterClearance";
import {OfflineAwareErrorPage} from "~/components/OfflineAwareErrorPage";
import {SearchControllerProvider} from "~/components/search/SearchControllerProvider";
import {generateWebsiteSchema, getSeoDefaults, buildMeta} from "~/lib/seo";
import {detectAiAttribution} from "~/lib/ai-attribution";
import {AgentSurfaceProvider} from "~/lib/agent-surface-context";
import {deriveAgentSurface, type AgentSurface} from "~/lib/agentic/agent-surface";
import {emitAgentEvent, routeFromRequest} from "~/lib/agentic/observability";
import {AGENT_SESSION_ID_KEY} from "~/lib/session";
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
    return buildMeta({
        title: seoDefaults.brandName,
        titleTemplate: null,
        description: seoDefaults.description,
        pathname: "/",
        siteUrl: seoDefaults.siteUrl,
        brandName: seoDefaults.brandName,
        ogImage: seoDefaults.media ? {
            url: seoDefaults.media.url,
            width: seoDefaults.media.width,
            height: seoDefaults.media.height
        } : undefined,
        ogType: "website",
        jsonLd: data?.websiteSchema ? [data.websiteSchema] : []
    }) as any;
};

export async function loader(args: Route.LoaderArgs) {
    const deferredData = loadDeferredData(args);
    const criticalData = await loadCriticalData(args);
    return {...deferredData, ...criticalData};
}

async function loadCriticalData({context, request}: Route.LoaderArgs) {
    const {storefront, dataAdapter, env} = context;
    const requestUrl = new URL(request.url);
    const aiAttribution = detectAiAttribution(request.headers, requestUrl.searchParams);
    const hasAgentSession = Boolean(context.session.get(AGENT_SESSION_ID_KEY));
    const agentSurface = deriveAgentSurface({aiAttribution, hasAgentSession});

    if (agentSurface.isAgent && (agentSurface.source === "referer" || agentSurface.source === "permalink")) {
        emitAgentEvent(context.env as Env, {
            evt: "agent_arrival",
            route: routeFromRequest(request),
            requestType: "agent",
            responseCategory: "ok"
        });
    }

    const [header, menuCollectionsData, themeSettingsData, siteContentData, blogData] = await Promise.all([
        dataAdapter
            .query(HEADER_QUERY, {
                variables: {headerMenuHandle: "main-menu"},
                cache: dataAdapter.CacheLong()
            })
            .catch((error: unknown) => {
                console.error("Failed to load header:", error);
                return null;
            }),
        dataAdapter.query(MENU_COLLECTIONS_QUERY, {cache: dataAdapter.CacheLong()}).catch((error: unknown) => {
            console.error("Failed to load menu collections:", error);
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
        siteContent.siteSettings.freeShippingMinimumOrder,
        header?.shop?.paymentSettings?.currencyCode
    );

    // Capture raw total before filtering — used for "All Collections" count in FullScreenMenu
    const totalCollections = menuCollectionsData?.collections?.nodes?.length ?? 0;

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
        totalCollections,
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
        websiteSchema,
        aiAttribution,
        agentSurface
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

function NonBlockingFontLoader({url}: {url?: string}) {
    useEffect(() => {
        if (!url) return;
        if (document.querySelector(`link[href="${url}"][rel="stylesheet"]`)) return;
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = url;
        document.head.appendChild(link);
    }, [url]);
    return null;
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
                {/* NOTE: og:site_name, og:type, and twitter:card are now emitted per-route via buildMeta().
                    Static OG/Twitter tags were removed to prevent duplicate meta tags. */}
                {/* Google Fonts: preload hint the browser early; NonBlockingFontLoader
                    appends the actual stylesheet via useEffect — never render-blocking.
                    The &display=swap param makes Google Fonts include font-display:swap in @font-face.
                    Preconnect links are emitted via links() so they apply on every navigation. */}
                {generatedTheme?.googleFontsUrl && (
                    <link rel="preload" as="style" href={generatedTheme.googleFontsUrl} />
                )}
                <NonBlockingFontLoader url={generatedTheme?.googleFontsUrl} />
                <Meta />
                <Links />
                {generatedTheme?.cssVariables && <ThemeStyleTag css={generatedTheme.cssVariables} />}
                {/* PWA install-capture script must load synchronously before the browser can fire
                    beforeinstallprompt — removing async ensures the event listener is registered
                    in time. The script is 6 lines served from the same edge origin (negligible cost). */}
                <script src="/pwa-install-capture.js" nonce={nonce} suppressHydrationWarning />
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

    // Force a clean reload when the browser restores this page from bfcache.
    // Hydrogen's Analytics.Provider calls Object.defineProperty(window, 'shopify', { configurable: false })
    // on mount. bfcache preserves that locked property in the JS heap, so when React re-runs effects
    // on restoration it tries to redefine an already-frozen property — throwing "Cannot redefine
    // property: shopify" and crashing into the ErrorBoundary as a 500. Reloading resets the heap.
    useEffect(() => {
        const onPageShow = (e: PageTransitionEvent) => {
            if (e.persisted) window.location.reload();
        };
        window.addEventListener("pageshow", onPageShow);
        return () => window.removeEventListener("pageshow", onPageShow);
    }, []);

    // Memoized before the early return guard to satisfy the Rules of Hooks.
    const menuCollections = useMemo(() => data?.menuCollections ?? [], [data?.menuCollections]);
    const mobileMenuCollections = useMemo(
        () =>
            menuCollections.map((collection: any) => ({
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
            })),
        [menuCollections]
    );
    const searchCollections = useMemo(
        () =>
            menuCollections.map((collection: any) => ({
                id: collection.id,
                title: collection.title,
                handle: collection.handle,
                image: collection.image
                    ? {
                          url: collection.image.url,
                          altText: collection.image.altText ?? null
                      }
                    : null
            })),
        [menuCollections]
    );

    if (!data)
        return (
            <>
                <Outlet />
                <Toaster position="top-center" />
            </>
        );

    const shopName = data.siteContent.siteSettings.brandName?.trim() || "Store";

    return (
        <AgentSurfaceProvider value={data.agentSurface ?? {isAgent: false, source: "none"}}>
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
                                        {/* Persistent PWA install banner — shown on mobile when install is available, mounted once at shell level */}
                                        <FloatingButtonStack />
                                        <Toaster position="top-center" />
                                    </SearchControllerProvider>
                                </CartDrawerProvider>
                            </LenisProvider>
                        </RecentlyViewedProvider>
                    </Analytics.Provider>
                </WishlistProvider>
            </SiteContentProvider>
        </AgentSurfaceProvider>
    );
}

// ================================================================================
// Floating Button Stack
// ================================================================================

/**
 * FloatingButtonStack — unified fixed-position container for all floating action buttons.
 *
 * Owns the fixed stacking context so the PWA install button and chat widget
 * share a single dynamic offset computation instead of each maintaining
 * independently hardcoded `bottom` values.
 *
 * Footer clearance:
 *   When `#footer-bottom-bar` scrolls into the viewport, `useFooterClearance`
 *   returns its visible pixel height. Applied as `translateY(-Xpx)` on this
 *   container, lifting the entire button stack by exactly the amount needed
 *   to clear the footer's copyright/attribution block.
 *
 * Base `bottom` offset preserves the product-page sticky action bar clearance
 * via `--product-sticky-bar-height` (set to the bar's height on product pages,
 * 0 elsewhere) plus a 1rem gutter from the viewport edge.
 *
 * CSS transition:
 *   `transition-transform duration-300 ease-in-out` animates the lift smoothly.
 *   `motion-reduce:transition-none` skips the animation for prefers-reduced-motion.
 *
 * Stack order (bottom → top, flex-col in a bottom-anchored container):
 *   ① PWA install button  — last DOM child → lowest in visual stack (lg+ only)
 *   ② Messenger           — bottom of FloatingChatWidget's own flex-col
 *   ③ WhatsApp            — top of FloatingChatWidget's own flex-col
 *   ④ Scratch card trigger — first DOM child → topmost in visual stack
 *
 * Mobile behaviour:
 *   OpenInAppButton renders `max-lg:hidden` so only the chat + scratch buttons
 *   are visible on viewports narrower than 1024 px.
 *
 * @see useFooterClearance   — IO-based dynamic offset hook
 * @see FloatingChatWidget   — Messenger + WhatsApp buttons (no own positioning)
 * @see OpenInAppButton      — PWA install button (no own positioning when variant="desktop-fixed")
 * @see ScratchCard          — controlled discount-reveal dialog
 */
function FloatingButtonStack() {
    const offset = useFooterClearance();
    const {discountCode} = useSiteSettings();
    const [scratchOpen, setScratchOpen] = useState(false);

    return (
        <>
            {/* Dialog renders via Radix portal — placement here only governs which subtree owns the open state. */}
            <ScratchCard open={scratchOpen} onOpenChange={setScratchOpen} />
            <div
                className={[
                    "fixed right-4 z-[var(--z-navbar)]",
                    "flex flex-col items-end gap-3",
                    // Smooth lift when footer bar enters viewport.
                    // Only the transform axis is transitioned — no opacity/scale side-effects.
                    // motion-reduce: instant reposition is acceptable per WCAG 2.3.3.
                    "transition-transform duration-300 ease-in-out motion-reduce:transition-none"
                ].join(" ")}
                style={{
                    // Base bottom: clears the product sticky action bar (0 on non-product pages)
                    // plus a 1rem gutter from the safe-area / viewport edge.
                    bottom: "calc(var(--product-sticky-bar-height, 0px) + max(env(safe-area-inset-bottom), 1rem))",
                    transform: offset > 0 ? `translateY(-${offset}px)` : undefined
                }}
            >
                {/* Scratch trigger first → topmost in the stack; only when a discount code is configured. */}
                {discountCode && (
                    <button
                        type="button"
                        onClick={() => setScratchOpen(true)}
                        aria-label="Reveal your discount code"
                        className={[
                            FLOATING_ACTION_BUTTON_CLASSES,
                            // Theme-aware: inverts to brand foreground/background → blends with each storefront's palette
                            "bg-foreground text-background",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        ].join(" ")}
                    >
                        <Ticket className="h-6 w-6" aria-hidden="true" />
                    </button>
                )}
                {/* Chat widget → sits above the PWA button in the visual stack */}
                <FloatingChatWidget />
                {/* PWA install button last → lowest in the stack, desktop only (max-lg:hidden) */}
                <OpenInAppButton variant="desktop-fixed" />
            </div>
        </>
    );
}

/**
 * Tracks error boundary events via analytics using useEffect (not during render).
 * Returns null — purely a side-effect component.
 */
function ErrorTracker({
    statusCode,
    errorType,
    route
}: {
    statusCode: number;
    errorType: "route_error" | "js_error";
    route: string;
}) {
    useEffect(() => {
        // Log error analytics in a non-blocking way
        if (typeof window !== "undefined") {
            console.warn(`[ErrorBoundary] ${errorType} on ${route}: status=${statusCode}`);
        }
    }, [statusCode, errorType, route]);
    return null;
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

    const errorType = isRouteErrorResponse(error) ? "route_error" : "js_error";

    const title = status === 404 ? "Page Not Found" : status >= 500 ? "Something Went Wrong" : "An Error Occurred";

    // Content only — React Router 7's Layout export wraps ErrorBoundary
    // with the full <html> document shell, so we must NOT render one here.
    return (
        <>
            <CachedThemeInjector />
            <ErrorTracker statusCode={status} errorType={errorType} route="root" />
            <OfflineAwareErrorPage statusCode={status} title={title} message={message} />
        </>
    );
}

const HAS_BLOG_QUERY = `#graphql
  query HasBlog(
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    articles(first: 1) {
      nodes {
        id
      }
    }
  }
` as const;
