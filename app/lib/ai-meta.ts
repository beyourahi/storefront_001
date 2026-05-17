/**
 * @fileoverview AI Meta Description Fallback
 *
 * Generates a search-optimized meta description for products and collections
 * that lack a merchant-provided one. Merchant-authored copy always wins —
 * AI generation only fires when `seo.description` is empty.
 *
 * Cache: 7-day TTL keyed on entity type + handle + sha(title+description).
 * The cache key includes a content hash so descriptions automatically refresh
 * when the merchant edits the product title or description.
 *
 * Pattern: cache-hit synchronous return; cache-miss returns `null` and triggers
 * background generation via `waitUntil`. This means the first request after
 * cache eviction sees no AI description (falls back to merchant value or empty);
 * subsequent requests within the TTL get the generated description. The benefit:
 * P95 render latency is zero — we never block on the LLM call.
 *
 * Disclosure: callers should add `<meta name="ai-generated" content="description">`
 * when they serve a generated description so crawlers know.
 */

import {getAIModel} from "~/lib/ai-provider";
import {readCache, writeCache} from "~/lib/ai-cache";
import {emitAgentEvent} from "~/lib/agentic/observability";

type EntityType = "product" | "collection";

interface MetaGenerationInput {
    entityType: EntityType;
    handle: string;
    title: string;
    /** Long-form description (HTML allowed; stripped before prompting). */
    description?: string | null;
    /** Currency-formatted price string, only for products. */
    price?: string | null;
    /** Brand/vendor name, only for products. */
    vendor?: string | null;
    /** Hint about what's in the collection (top product titles, type breakdown). */
    collectionHint?: string | null;
}

const CACHE_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days
const TARGET_LENGTH = 155;

async function sha256Short(input: string): Promise<string> {
    const data = new TextEncoder().encode(input);
    const buf = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(buf))
        .slice(0, 8)
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
}

function stripHtml(input: string): string {
    return input.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

async function buildCacheKey(input: MetaGenerationInput): Promise<string> {
    const fingerprint = await sha256Short(`${input.title}::${input.description ?? ""}`);
    return `${input.entityType}::${input.handle}::${fingerprint}`;
}

interface GeneratedMeta {
    description: string;
    aiGenerated: boolean;
}

/**
 * Resolve a meta description for a product or collection.
 *
 * @param merchantDescription - The `seo.description` value (or fallback) the merchant set
 * @param input - Entity context used to generate a fresh description on cache miss
 * @param env - Environment object (reads feature flags + provider creds)
 * @param waitUntil - Cloudflare `waitUntil` for background cache population
 */
export async function resolveMetaDescription(
    merchantDescription: string | null | undefined,
    input: MetaGenerationInput,
    env: Record<string, unknown>,
    waitUntil?: (promise: Promise<unknown>) => void
): Promise<GeneratedMeta | null> {
    const trimmedMerchant = (merchantDescription ?? "").trim();
    if (trimmedMerchant.length > 0) {
        return {description: trimmedMerchant, aiGenerated: false};
    }

    if (env.AI_FEATURES_ENABLED !== "true" || env.AI_META_DESC_ENABLED !== "true") {
        return null;
    }

    const cacheKey = await buildCacheKey(input);
    const cached = await readCache("meta-desc", cacheKey);
    if (cached) {
        return {description: cached, aiGenerated: true};
    }

    // Cache miss: fire generation in the background; serve null this request.
    // Next render within the TTL will hit cache.
    if (waitUntil) {
        waitUntil(generateAndCache(input, env, cacheKey));
    }
    return null;
}

async function generateAndCache(
    input: MetaGenerationInput,
    env: Record<string, unknown>,
    cacheKey: string
): Promise<void> {
    try {
        const model = await getAIModel(env);
        if (!model) return;

        const contextLines = [
            `Type: ${input.entityType}`,
            `Title: ${input.title}`,
            input.vendor ? `Brand: ${input.vendor}` : "",
            input.price ? `Price: ${input.price}` : "",
            input.collectionHint ? `Contains: ${input.collectionHint}` : "",
            input.description ? `Details: ${stripHtml(input.description).slice(0, 1200)}` : ""
        ]
            .filter(Boolean)
            .join("\n");

        const systemPrompt =
            `Write a single meta description (target ${TARGET_LENGTH} characters, max 160) for a Shopify ` +
            `${input.entityType} page. Tone: concise, factual, benefit-oriented. No marketing fluff, ` +
            `no superlatives, no emoji, no quotation marks around the output. Output ONLY the description text — ` +
            `no preamble, no labels, no line breaks.`;

        const {generateText} = await import("ai");
        const result = await generateText({
            model,
            system: systemPrompt,
            prompt: contextLines,
            temperature: 0.4,
            maxOutputTokens: 120
        });

        const cleaned = result.text.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();
        const truncated = cleaned.length > 160 ? `${cleaned.slice(0, 159)}…` : cleaned;
        if (truncated.length === 0) return;

        await writeCache("meta-desc", cacheKey, truncated, CACHE_TTL_SECONDS);
        emitAgentEvent(env as Parameters<typeof emitAgentEvent>[0], {evt: "agent_meta_generation"});
    } catch {
        // Best-effort — meta generation failure leaves the entity with no description.
    }
}
