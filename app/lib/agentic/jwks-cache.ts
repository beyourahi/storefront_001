/**
 * In-memory JWKS cache with a 1-hour TTL per endpoint URL.
 *
 * One cache entry is kept per `jwksUrl`. The cache is module-level and shared
 * across all requests within a Workers isolate. If the TTL expires, the next
 * call re-fetches and updates the entry.
 */
export type JwkKey = {
    kty: string;
    kid?: string;
    use?: string;
    alg?: string;
    n?: string;
    e?: string;
    x?: string;
    y?: string;
    crv?: string;
};

export type JwksDocument = {
    keys: JwkKey[];
};

type CacheEntry = {
    doc: JwksDocument;
    fetchedAt: number;
};

const TTL_MS = 3_600_000;

const cache = new Map<string, CacheEntry>();

/**
 * Fetch and cache a JWKS document. Returns the cached document if it was
 * fetched within the last hour; otherwise re-fetches from `jwksUrl`.
 * Throws if the fetch fails or the response lacks a `keys` array.
 */
export async function getJwks(jwksUrl: string): Promise<JwksDocument> {
    const entry = cache.get(jwksUrl);
    if (entry && Date.now() - entry.fetchedAt < TTL_MS) {
        return entry.doc;
    }

    const response = await fetch(jwksUrl, {
        headers: {Accept: "application/json"}
    });

    if (!response.ok) {
        throw new Error(`JWKS fetch failed: ${response.status} ${response.statusText}`);
    }

    const doc = (await response.json()) as JwksDocument;

    if (!Array.isArray(doc.keys)) {
        throw new Error("JWKS response missing keys array");
    }

    cache.set(jwksUrl, {doc, fetchedAt: Date.now()});
    return doc;
}
