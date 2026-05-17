/**
 * @fileoverview AI Provider Abstraction
 *
 * Returns a Vercel AI SDK `LanguageModel` selected at runtime per the current
 * environment. Single auto-detection rule, no caller branching:
 *   1. Cloudflare Workers AI binding (`env.AI`)  — free, no API key, only on Workers
 *   2. Anthropic API key (`env.ANTHROPIC_API_KEY`) — works everywhere (Workers + Oxygen)
 *   3. `null` — no provider available; caller MUST handle this and degrade gracefully
 *
 * Callers (`api.pdp-qa.tsx`, `ai-meta.ts`, `ai-search.ts`) check for `null` and
 * skip the LLM call rather than throwing — keeps the storefront fully functional
 * when no AI is configured.
 *
 * Imports are dynamic so the AI SDK + provider packages stay out of route bundles
 * that don't actually call this. Only the API route handlers that import this
 * file pay the bundle cost.
 */

import type {LanguageModel} from "ai";

/**
 * Minimal Cloudflare Workers AI binding shape used here. The real binding exposes
 * many more methods; we only need it to exist so `workers-ai-provider` can call it.
 */
type WorkersAIBinding = {
    run: (...args: unknown[]) => Promise<unknown>;
};

/** Auto-detect provider selection. Returns `null` when no provider is configured. */
export async function getAIModel(env: Record<string, unknown>): Promise<LanguageModel | null> {
    if (!env.AI_FEATURES_ENABLED || env.AI_FEATURES_ENABLED === "false") return null;

    const workersAI = env.AI as WorkersAIBinding | undefined;
    if (workersAI && typeof workersAI.run === "function") {
        const {createWorkersAI} = await import("workers-ai-provider");
        const provider = createWorkersAI({binding: workersAI as Parameters<typeof createWorkersAI>[0]["binding"]});
        // Llama 3.3 70B is the highest-quality Workers AI chat model in the free tier (24k context).
        // Llama 3.1 8B is cheaper if you want lower latency on simple Q&A.
        return provider("@cf/meta/llama-3.3-70b-instruct-fp8-fast");
    }

    const anthropicKey = typeof env.ANTHROPIC_API_KEY === "string" ? env.ANTHROPIC_API_KEY : "";
    if (anthropicKey) {
        const {createAnthropic} = await import("@ai-sdk/anthropic");
        const provider = createAnthropic({apiKey: anthropicKey});
        // Haiku is fast and cheap; good fit for bounded Q&A and meta description generation.
        // Upgrade to "claude-sonnet-4-6" or "claude-opus-4-7" if quality matters more than latency.
        return provider("claude-haiku-4-5-20251001");
    }

    return null;
}

/**
 * Describes the provider that would be selected, without instantiating it.
 * Used by /.well-known/ucp and llms.txt-adjacent surfaces to honestly disclose
 * which AI features are active. Cheap — no dynamic imports.
 */
export function describeAIProvider(env: Record<string, unknown>): {
    enabled: boolean;
    provider: "workers-ai" | "anthropic" | null;
} {
    if (!env.AI_FEATURES_ENABLED || env.AI_FEATURES_ENABLED === "false") {
        return {enabled: false, provider: null};
    }
    const workersAI = env.AI as WorkersAIBinding | undefined;
    if (workersAI && typeof workersAI.run === "function") return {enabled: true, provider: "workers-ai"};
    if (typeof env.ANTHROPIC_API_KEY === "string" && env.ANTHROPIC_API_KEY.length > 0)
        return {enabled: true, provider: "anthropic"};
    return {enabled: false, provider: null};
}
