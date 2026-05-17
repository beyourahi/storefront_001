/**
 * @fileoverview LLM-Powered Search Query Reformulation
 *
 * When a buyer's raw search query returns thin results (Shopify's predictive
 * search comes back with <3 products), this utility asks the LLM to suggest
 * a richer reformulation — adding synonyms, expanding abbreviations, fixing
 * typos. The reformulated query is sent BACK to Shopify's predictive search;
 * we never invent product matches client-side.
 *
 * Pure progressive enhancement:
 * - Flag off / provider unavailable → returns null, caller uses raw query only
 * - Flag on but no useful reformulation → returns null, caller uses raw query only
 * - Cache hit → instant
 * - Cache miss → fires generation in background via waitUntil, returns null this request
 *
 * Cache TTL: 24h — search vocabulary doesn't drift hourly.
 */

import {getAIModel} from "~/lib/ai-provider";
import {readCache, writeCache} from "~/lib/ai-cache";
import {emitAgentEvent} from "~/lib/agentic/observability";

const CACHE_TTL_SECONDS = 60 * 60 * 24; // 24 hours
const MAX_QUERY_LENGTH = 80;

export interface ReformulatedQuery {
    expandedQuery: string;
}

/**
 * Attempt to reformulate a search query. Returns null when no useful
 * reformulation is available — caller should fall back to the raw query.
 */
export async function reformulateQuery(
    rawQuery: string,
    env: Record<string, unknown>,
    waitUntil?: (promise: Promise<unknown>) => void
): Promise<ReformulatedQuery | null> {
    const trimmed = rawQuery.trim();
    if (trimmed.length === 0 || trimmed.length > MAX_QUERY_LENGTH) return null;

    if (env.AI_FEATURES_ENABLED !== "true" || env.AI_QUERY_REFORMULATION_ENABLED !== "true") {
        return null;
    }

    const cacheKey = trimmed.toLowerCase();
    const cached = await readCache("query-rewrite", cacheKey);
    if (cached && cached !== trimmed) {
        return {expandedQuery: cached};
    }

    if (waitUntil) {
        waitUntil(generateAndCache(trimmed, env, cacheKey));
    }

    return null;
}

async function generateAndCache(rawQuery: string, env: Record<string, unknown>, cacheKey: string): Promise<void> {
    try {
        const model = await getAIModel(env);
        if (!model) return;

        const systemPrompt =
            "You expand short product-search queries into richer keyword strings for a Shopify storefront's " +
            "search engine. Fix typos, expand abbreviations, add 1-2 strong synonyms. Keep the result under " +
            "80 characters. Output ONLY the expanded keyword string — no quotation marks, no labels, no preamble, " +
            "no commentary. If the query is already specific and clear, output it unchanged.";

        const {generateText} = await import("ai");
        const result = await generateText({
            model,
            system: systemPrompt,
            prompt: rawQuery,
            temperature: 0.2,
            maxOutputTokens: 40
        });

        const cleaned = result.text
            .replace(/[\r\n]+/g, " ")
            .replace(/^["'`]+|["'`]+$/g, "")
            .replace(/\s+/g, " ")
            .trim();

        if (cleaned.length === 0 || cleaned.length > MAX_QUERY_LENGTH) return;
        if (cleaned.toLowerCase() === rawQuery.toLowerCase()) return;

        await writeCache("query-rewrite", cacheKey, cleaned, CACHE_TTL_SECONDS);
        emitAgentEvent(env as Parameters<typeof emitAgentEvent>[0], {evt: "agent_query_reformulation"});
    } catch {
        // Best-effort — reformulation failure leaves the buyer with raw-query results.
    }
}
