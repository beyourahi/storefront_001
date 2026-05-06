/**
 * Derives the agent surface classification for a request.
 *
 * Classifies the origin of a request into one of four surface types so that
 * banner components and analytics can respond appropriately:
 * - `"permalink"` — request arrived via an agent-generated cart/product permalink
 * - `"referer"` — request arrived from a known AI referrer (e.g., claude.ai)
 * - `"none"` — ordinary human browser request
 * (The `"mcp"` source is reserved for future direct MCP session detection.)
 */
import type {AiAttribution} from "~/lib/ai-attribution";
import type {AgentProfile} from "~/lib/agentic/types";

/** Classification of the current request's origin surface. */
export type AgentSurface = {
    isAgent: boolean;
    source: "mcp" | "referer" | "permalink" | "none";
    /** Field names (never values) of the agent profile, for observability. */
    profileShape?: {fields: string[]; capabilities?: string[]};
};

/**
 * Classify the agent surface from request metadata.
 * Priority: active agent session (permalink) > AI referrer header > human.
 */
export function deriveAgentSurface(opts: {
    aiAttribution: AiAttribution;
    hasAgentSession: boolean;
    agentProfile?: AgentProfile | null;
}): AgentSurface {
    const {aiAttribution, hasAgentSession, agentProfile} = opts;

    if (hasAgentSession) {
        const profileShape = agentProfile
            ? {
                  fields: Object.keys(agentProfile).filter(k => agentProfile[k as keyof AgentProfile] !== undefined),
                  capabilities: agentProfile.capabilities
              }
            : undefined;
        return {isAgent: true, source: "permalink", profileShape};
    }

    if (aiAttribution.isAiReferrer) {
        return {isAgent: true, source: "referer"};
    }

    return {isAgent: false, source: "none"};
}
