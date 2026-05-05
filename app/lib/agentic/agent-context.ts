/**
 * Extracts a typed `AgentContext` from an MCP JSON-RPC request body.
 *
 * Reads the `meta["ucp-agent"].profile` field that MCP-compatible clients
 * embed in their request payloads. Returns `null` for any human or non-UCP
 * request so callers can gate agent-only logic cleanly.
 */
import type {AgentContext, AgentProfile} from "./types";
import type {DataAdapter, StorefrontLike} from "~/lib/data-source";

type HydrogenCtx = {
    storefront: StorefrontLike;
    dataAdapter: DataAdapter;
};

/**
 * Parse agent identity and profile from a raw JSON-RPC request body.
 * Returns `null` when the body is not an agent request (missing `meta["ucp-agent"]`).
 */
export function extractAgentContext(body: unknown, hydrogenCtx: HydrogenCtx): AgentContext {
    if (!body || typeof body !== "object") return null;

    const req = body as Record<string, unknown>;
    const meta = req.meta as Record<string, unknown> | undefined;
    if (!meta) return null;

    const ucpAgent = meta["ucp-agent"] as Record<string, unknown> | undefined;
    if (!ucpAgent) return null;

    const rawProfile = ucpAgent.profile as AgentProfile | undefined;
    if (!rawProfile) return null;

    const profile: AgentProfile = {
        ...rawProfile,
        class: rawProfile.class ?? "unknown"
    };

    return {
        isAgent: true,
        profile,
        storefront: hydrogenCtx.storefront,
        dataAdapter: hydrogenCtx.dataAdapter,
    };
}
