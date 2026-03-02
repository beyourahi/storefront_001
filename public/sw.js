/* eslint-disable no-console */
/* global importScripts, workbox */

importScripts("https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js");

if (!workbox) {
    console.error("[SW] Workbox failed to load");
} else {
    console.log("[SW] Workbox loaded successfully");

    const {registerRoute, setDefaultHandler, setCatchHandler} = workbox.routing;
    const {CacheFirst, NetworkFirst, StaleWhileRevalidate, NetworkOnly} = workbox.strategies;
    const {ExpirationPlugin} = workbox.expiration;
    const {CacheableResponsePlugin} = workbox.cacheableResponse;

    const OFFLINE_PAGE = "/offline";
    const OFFLINE_CACHE_NAME = "hydrogen-pwa-offline-v1";

    const CACHE_PREFIX = "hydrogen-pwa";
    const CACHE_VERSION = "v1";

    async function getOfflinePage() {
        try {
            const offlineCache = await caches.open(OFFLINE_CACHE_NAME);
            const response = await offlineCache.match(OFFLINE_PAGE, {
                ignoreSearch: true,
                ignoreVary: true
            });
            if (response) {
                console.log("[SW] Serving offline page from dedicated cache");
                return response.clone();
            }

            const allCachesResponse = await caches.match(OFFLINE_PAGE, {
                ignoreSearch: true,
                ignoreVary: true
            });
            if (allCachesResponse) {
                console.log("[SW] Serving offline page from general cache search");
                return allCachesResponse.clone();
            }

            console.warn("[SW] Offline page not found in any cache");
            return null;
        } catch (error) {
            console.error("[SW] Error getting offline page:", error);
            return null;
        }
    }

    registerRoute(
        ({url}) => url.hostname === "cdn.shopify.com",
        new CacheFirst({
            cacheName: `${CACHE_PREFIX}-shopify-cdn-${CACHE_VERSION}`,
            plugins: [
                new CacheableResponsePlugin({
                    statuses: [0, 200]
                }),
                new ExpirationPlugin({
                    maxEntries: 200,
                    maxAgeSeconds: 30 * 24 * 60 * 60,
                    purgeOnQuotaError: true
                })
            ]
        })
    );

    registerRoute(
        ({url}) => url.hostname === "fonts.googleapis.com",
        new StaleWhileRevalidate({
            cacheName: `${CACHE_PREFIX}-google-fonts-stylesheets-${CACHE_VERSION}`,
            plugins: [
                new CacheableResponsePlugin({
                    statuses: [0, 200]
                }),
                new ExpirationPlugin({
                    maxEntries: 30,
                    maxAgeSeconds: 365 * 24 * 60 * 60
                })
            ]
        })
    );

    registerRoute(
        ({url}) => url.hostname === "fonts.gstatic.com",
        new CacheFirst({
            cacheName: `${CACHE_PREFIX}-google-fonts-webfonts-${CACHE_VERSION}`,
            plugins: [
                new CacheableResponsePlugin({
                    statuses: [0, 200]
                }),
                new ExpirationPlugin({
                    maxEntries: 30,
                    maxAgeSeconds: 365 * 24 * 60 * 60
                })
            ]
        })
    );

    registerRoute(
        ({request, url}) =>
            request.destination === "script" ||
            request.destination === "style" ||
            url.pathname.endsWith(".js") ||
            url.pathname.endsWith(".css"),
        new StaleWhileRevalidate({
            cacheName: `${CACHE_PREFIX}-static-assets-${CACHE_VERSION}`,
            plugins: [
                new CacheableResponsePlugin({
                    statuses: [0, 200]
                }),
                new ExpirationPlugin({
                    maxEntries: 100,
                    maxAgeSeconds: 7 * 24 * 60 * 60,
                    purgeOnQuotaError: true
                })
            ]
        })
    );

    const SENSITIVE_ROUTES = [/^\/cart/, /^\/checkout/, /^\/account/, /^\/api\//, /^\/search\?/];

    const isSensitiveRoute = url => {
        return SENSITIVE_ROUTES.some(pattern => pattern.test(url.pathname + url.search));
    };

    registerRoute(
        ({request, url}) => request.mode === "navigate" && !isSensitiveRoute(url),
        new NetworkFirst({
            cacheName: `${CACHE_PREFIX}-pages-${CACHE_VERSION}`,
            networkTimeoutSeconds: 3,
            plugins: [
                new CacheableResponsePlugin({
                    statuses: [0, 200]
                }),
                new ExpirationPlugin({
                    maxEntries: 50,
                    maxAgeSeconds: 24 * 60 * 60,
                    purgeOnQuotaError: true
                })
            ]
        })
    );

    registerRoute(
        ({request, url}) => request.mode === "navigate" && isSensitiveRoute(url),
        new NetworkOnly({
            plugins: [
                {
                    handlerDidError: async () => {
                        return getOfflinePage();
                    }
                }
            ]
        })
    );

    registerRoute(({request, url}) => request.mode !== "navigate" && isSensitiveRoute(url), new NetworkOnly());

    setDefaultHandler(
        new NetworkFirst({
            cacheName: `${CACHE_PREFIX}-default-${CACHE_VERSION}`,
            networkTimeoutSeconds: 3,
            plugins: [
                new CacheableResponsePlugin({
                    statuses: [0, 200]
                }),
                new ExpirationPlugin({
                    maxEntries: 50,
                    maxAgeSeconds: 24 * 60 * 60
                })
            ]
        })
    );

    setCatchHandler(async ({request}) => {
        if (request.mode === "navigate") {
            try {
                const clients = await self.clients.matchAll({type: "window"});
                clients.forEach(client => {
                    client.postMessage({
                        type: "CACHE_MISS",
                        url: request.url
                    });
                });
            } catch {
                //
            }

            const offlineResponse = await getOfflinePage();
            if (offlineResponse) {
                return offlineResponse;
            }
        }

        return Response.error();
    });

    self.addEventListener("install", event => {
        console.log("[SW] Installing service worker...");

        event.waitUntil(
            caches.open(OFFLINE_CACHE_NAME).then(cache => {
                console.log("[SW] Precaching offline page");
                return cache.add(OFFLINE_PAGE);
            })
        );
    });

    self.addEventListener("activate", event => {
        console.log("[SW] Activating service worker...");

        event.waitUntil(
            Promise.all([
                self.clients.claim(),

                caches.keys().then(cacheNames => {
                    return Promise.all(
                        cacheNames
                            .filter(name => name.startsWith(CACHE_PREFIX) && !name.includes(CACHE_VERSION))
                            .map(name => {
                                console.log("[SW] Deleting old cache:", name);
                                return caches.delete(name);
                            })
                    );
                })
            ])
        );
    });

    self.addEventListener("message", event => {
        if (event.data && event.data.type === "SKIP_WAITING") {
            self.skipWaiting();
        }

        if (event.data && event.data.type === "UPDATE_OFFLINE_CACHE") {
            console.log("[SW] Received UPDATE_OFFLINE_CACHE message");
            event.waitUntil(
                (async () => {
                    try {
                        const response = await fetch(OFFLINE_PAGE, {
                            credentials: "same-origin",
                            cache: "reload"
                        });

                        if (response.ok) {
                            const cacheNames = await caches.keys();
                            await Promise.all(
                                cacheNames.map(async name => {
                                    const cache = await caches.open(name);
                                    await cache.delete(OFFLINE_PAGE);
                                })
                            );

                            const offlineCache = await caches.open(OFFLINE_CACHE_NAME);
                            await offlineCache.put(OFFLINE_PAGE, response);
                            console.log("[SW] Offline page cache updated with themed version");

                            if (event.source) {
                                event.source.postMessage({type: "OFFLINE_CACHE_UPDATED"});
                            }
                        }
                    } catch (error) {
                        console.error("[SW] Failed to update offline cache:", error);
                    }
                })()
            );
        }
    });
}
/* eslint-enable no-console */
