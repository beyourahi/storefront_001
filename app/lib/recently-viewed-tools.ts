/**
 * @fileoverview Recently Viewed — Agent Tool Bridge
 * Exposes recently-viewed product IDs from the request cookie for
 * server-side agent tool use (lookup_catalog can then fetch live data).
 */

const COOKIE_KEY = "recently_viewed";
const MAX_IDS = 10;

/**
 * Reads recently-viewed product IDs from the request's `recently_viewed` cookie.
 * Returns at most 10 IDs, filtering out entries that lack an `id` field.
 * Returns an empty array on parse failure or missing cookie.
 *
 * @param request - Incoming HTTP request from which the cookie header is read
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
            .filter((item): item is {id: string} => typeof item === "object" && item !== null && "id" in item)
            .slice(0, MAX_IDS)
            .map(item => item.id);
    } catch {
        return [];
    }
}
