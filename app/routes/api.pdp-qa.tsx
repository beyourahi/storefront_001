/**
 * @fileoverview PDP Q&A — Single-Turn AI Endpoint
 *
 * Buyer asks a question about a specific product; returns a streamed answer
 * grounded only in the product's own data (title, description, vendor, price,
 * availability, tags). No chat history, no multi-turn context — single shot,
 * bounded, low hallucination risk.
 *
 * Flow:
 *   POST /api/pdp-qa with JSON {productHandle, question}
 *   → guard: feature flag on + provider available + rate limit ok
 *   → cache lookup (key = productHandle + sha(question)) — 1h TTL
 *   → on miss: fetch product, build system prompt, stream answer, populate cache via waitUntil
 *
 * Caller (`ProductQA` panel) consumes the AI SDK UI message stream via `useChat`-shaped
 * fetch on the client.
 *
 * Rate limit: cookie-tracked counter, 5 questions per session per product.
 *
 * Privacy: only product context goes to the LLM. No buyer identity, no cart state,
 * no order history, no PII.
 */

import type {Route} from "./+types/api.pdp-qa";
import {getAIModel} from "~/lib/ai-provider";
import {readCache, writeCache} from "~/lib/ai-cache";
import {emitAgentEvent, routeFromRequest} from "~/lib/agentic/observability";

const RATE_LIMIT_COOKIE = "pdp_qa_budget";
const MAX_QUESTIONS_PER_PRODUCT = 5;
const CACHE_TTL_SECONDS = 60 * 60; // 1 hour

/** Strip HTML, collapse whitespace, truncate — keeps the LLM context bounded and clean. */
function summarizeForPrompt(input: string | null | undefined, maxLen: number): string {
    if (!input) return "";
    const stripped = input.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    return stripped.length > maxLen ? `${stripped.slice(0, maxLen - 1)}…` : stripped;
}

function readBudgetCookie(request: Request, productHandle: string): number {
    const cookie = request.headers.get("cookie") ?? "";
    const match = cookie
        .split(";")
        .map(s => s.trim())
        .find(s => s.startsWith(`${RATE_LIMIT_COOKIE}=`));
    if (!match) return 0;
    try {
        const raw = decodeURIComponent(match.slice(RATE_LIMIT_COOKIE.length + 1));
        const parsed = JSON.parse(raw) as Record<string, number>;
        return parsed[productHandle] ?? 0;
    } catch {
        return 0;
    }
}

function buildBudgetCookie(request: Request, productHandle: string, newCount: number): string {
    const cookie = request.headers.get("cookie") ?? "";
    const match = cookie
        .split(";")
        .map(s => s.trim())
        .find(s => s.startsWith(`${RATE_LIMIT_COOKIE}=`));
    let current: Record<string, number> = {};
    if (match) {
        try {
            current = JSON.parse(decodeURIComponent(match.slice(RATE_LIMIT_COOKIE.length + 1))) as Record<string, number>;
        } catch {
            current = {};
        }
    }
    current[productHandle] = newCount;
    const value = encodeURIComponent(JSON.stringify(current));
    return `${RATE_LIMIT_COOKIE}=${value}; Path=/; Max-Age=86400; SameSite=Lax`;
}

const PRODUCT_QA_QUERY = `#graphql
  query ProductQaContext($handle: String!, $country: CountryCode, $language: LanguageCode)
   @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      title
      description
      vendor
      productType
      tags
      priceRange {
        minVariantPrice { amount currencyCode }
        maxVariantPrice { amount currencyCode }
      }
      featuredImage { altText }
      availableForSale
    }
  }
` as const;

export async function action({request, context}: Route.ActionArgs) {
    if (request.method !== "POST") {
        return new Response("Method Not Allowed", {status: 405});
    }

    const env = context.env as unknown as Record<string, unknown>;
    if (!env.AI_PDP_QA_ENABLED || env.AI_PDP_QA_ENABLED === "false") {
        return Response.json({error: "Product Q&A is not enabled"}, {status: 503});
    }

    let body: {productHandle?: string; question?: string};
    try {
        body = (await request.json()) as {productHandle?: string; question?: string};
    } catch {
        return Response.json({error: "Invalid JSON body"}, {status: 400});
    }

    const productHandle = typeof body.productHandle === "string" ? body.productHandle.trim() : "";
    const question = typeof body.question === "string" ? body.question.trim() : "";
    if (!productHandle || !question) {
        return Response.json({error: "productHandle and question are required"}, {status: 400});
    }
    if (question.length > 500) {
        return Response.json({error: "Question is too long (max 500 chars)"}, {status: 400});
    }

    const currentBudget = readBudgetCookie(request, productHandle);
    if (currentBudget >= MAX_QUESTIONS_PER_PRODUCT) {
        return Response.json({error: "Rate limit reached for this product"}, {status: 429});
    }

    const model = await getAIModel(env);
    if (!model) {
        return Response.json({error: "AI provider not configured"}, {status: 503});
    }

    const cacheKey = `${productHandle}::${question.toLowerCase()}`;
    const cached = await readCache("pdp-qa", cacheKey);
    if (cached) {
        emitAgentEvent(env, {evt: "agent_pdp_qa_cache_hit", route: routeFromRequest(request)});
        return new Response(cached, {
            status: 200,
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "Set-Cookie": buildBudgetCookie(request, productHandle, currentBudget + 1)
            }
        });
    }

    const {product} = await context.dataAdapter.query(PRODUCT_QA_QUERY, {
        variables: {handle: productHandle},
        cache: context.dataAdapter.CacheShort()
    });

    if (!product) {
        return Response.json({error: "Product not found"}, {status: 404});
    }

    const productContext = [
        `Title: ${product.title}`,
        product.vendor ? `Brand: ${product.vendor}` : "",
        product.productType ? `Category: ${product.productType}` : "",
        `Availability: ${product.availableForSale ? "In stock" : "Out of stock"}`,
        product.priceRange?.minVariantPrice
            ? `Price: ${product.priceRange.minVariantPrice.amount} ${product.priceRange.minVariantPrice.currencyCode}`
            : "",
        product.tags && product.tags.length > 0 ? `Tags: ${product.tags.join(", ")}` : "",
        product.description ? `Description: ${summarizeForPrompt(product.description, 2000)}` : ""
    ]
        .filter(Boolean)
        .join("\n");

    const systemPrompt =
        "You are a helpful product Q&A assistant for a Shopify storefront. " +
        "Answer the shopper's question using ONLY the product information provided below. " +
        "If the information doesn't cover the question, say so honestly — never invent specs, " +
        "warranties, materials, or compatibility claims. Keep answers concise (2-4 sentences). " +
        "If asked about price, availability, or shipping, defer to the product page and checkout. " +
        "Never make medical, legal, or safety claims.\n\n" +
        `PRODUCT INFORMATION:\n${productContext}`;

    const {generateText} = await import("ai");
    const result = await generateText({
        model,
        system: systemPrompt,
        prompt: question,
        temperature: 0.3,
        maxOutputTokens: 300
    });

    const answer = result.text.trim();
    if (typeof context.waitUntil === "function") {
        context.waitUntil(writeCache("pdp-qa", cacheKey, answer, CACHE_TTL_SECONDS));
    }

    emitAgentEvent(env, {evt: "agent_pdp_qa_query", route: routeFromRequest(request)});

    return new Response(answer, {
        status: 200,
        headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Set-Cookie": buildBudgetCookie(request, productHandle, currentBudget + 1)
        }
    });
}
