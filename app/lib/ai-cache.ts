/**
 * @fileoverview AI Response Cache
 *
 * Thin wrapper over Cloudflare's `(caches as unknown as {default: Cache}).default` for deduplicating identical
 * LLM requests. Same buyer asking the same product question twice in an hour
 * should hit cached text, not the LLM. Same meta-description request should
 * resolve from cache for a week.
 *
 * Why Cache API and not KV/D1: zero new bindings, available on both Cloudflare
 * Workers and Oxygen, no quota management. Limitations: per-zone (not global),
 * eviction is opportunistic. Good enough for AI response caching where misses
 * are tolerable.
 *
 * Cache keys are derived as sha-256(namespace + ":" + input) and exposed as
 * `https://ai-cache.local/{key}` synthetic URLs — `(caches as unknown as {default: Cache}).default` requires
 * Request/URL keys, never plain strings.
 */

const CACHE_HOST = "https://ai-cache.local";

async function sha256Hex(input: string): Promise<string> {
    const data = new TextEncoder().encode(input);
    const buf = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(buf))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
}

async function buildKey(namespace: string, input: string): Promise<Request> {
    const hash = await sha256Hex(`${namespace}:${input}`);
    return new Request(`${CACHE_HOST}/${namespace}/${hash}`);
}

/** Look up a cached AI response. Returns `null` on miss or eviction. */
export async function readCache(namespace: string, input: string): Promise<string | null> {
    if (typeof caches === "undefined") return null;
    try {
        const key = await buildKey(namespace, input);
        const hit = await (caches as unknown as {default: Cache}).default.match(key);
        return hit ? await hit.text() : null;
    } catch {
        return null;
    }
}

/**
 * Store an AI response in cache with a TTL.
 *
 * @param namespace - Logical grouping (e.g. `"pdp-qa"`, `"meta-desc"`, `"query-rewrite"`)
 * @param input - The original input that produced this response (used as the cache key)
 * @param value - The generated text to cache
 * @param ttlSeconds - Cache lifetime (max-age); Cache API uses Cache-Control headers
 */
export async function writeCache(namespace: string, input: string, value: string, ttlSeconds: number): Promise<void> {
    if (typeof caches === "undefined") return;
    try {
        const key = await buildKey(namespace, input);
        const response = new Response(value, {
            status: 200,
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "Cache-Control": `public, max-age=${ttlSeconds}`
            }
        });
        await (caches as unknown as {default: Cache}).default.put(key, response);
    } catch {
        // Silent — cache writes are best-effort
    }
}
