/**
 * @fileoverview Recently Viewed — Agent Tool Bridge
 *
 * Exposes recently-viewed product IDs from the request cookie for server-side
 * agent tool use (e.g. the MCP `lookup_catalog` tool can fetch live product
 * data for items the buyer has recently viewed, enabling agent personalization
 * without requiring client-side hydration).
 *
 * The cookie is written client-side by `hooks/useRecentlyViewed.ts` as a mirror
 * of the LocalStorage product list, truncated to fit within typical cookie size
 * limits (~3.5KB). We parse just the IDs server-side; full product data is then
 * resolved via the Storefront API.
 */

/** Cookie name written by `hooks/useRecentlyViewed.ts` via its default storageKey. */
const COOKIE_KEY = "shopify-recently-viewed";

/** Maximum number of product IDs to return; bounded to keep MCP tool inputs small. */
const MAX_IDS = 10;

/**
 * Read recently viewed product IDs from the request cookie, server-side.
 *
 * The cookie stores a JSON array of product entries with at minimum an `id`
 * field. Returns an empty array on missing cookie or any parse failure — never
 * throws, since this powers optional agent personalization.
 *
 * @param request - Incoming request carrying the recently-viewed cookie
 */
export function getRecentlyViewedIds(request: Request): string[] {
    const cookie = request.headers.get("cookie") ?? "";
    const match = cookie
        .split(";")
        .map(s => s.trim())
        .find(s => s.startsWith(`${COOKIE_KEY}=`));
    if (!match) return [];
    try {
        const raw = decodeURIComponent(match.slice(COOKIE_KEY.length + 1));
        const parsed: unknown = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return (parsed as unknown[])
            .filter(
                (item): item is {id: string} =>
                    typeof item === "object" && item !== null && "id" in item && typeof (item as {id: unknown}).id === "string"
            )
            .slice(0, MAX_IDS)
            .map(item => item.id);
    } catch {
        return [];
    }
}
