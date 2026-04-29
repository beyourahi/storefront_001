/**
 * @fileoverview AgentFallbackBanner — SF001 style: sticky non-dismissible top-of-page
 * banner with a single CTA, shown on interactive routes that cannot be navigated
 * programmatically by an AI agent (e.g. quiz pages, editorial experiences).
 *
 * @design SF001 monochrome minimal aesthetic:
 * - `bg-foreground text-background` — maximum contrast, strong visual signal
 * - `font-mono` — matches the agent-surface family (AgentCartView, AgentProductBrief)
 * - `sticky top-0 z-50` — stays in view as the inaccessible page scrolls beneath
 * - Non-dismissible — the agent MUST use an alternate path; this is not an optional hint
 * - Single CTA — one `<Link>` to the alternate agent-friendly route
 *
 * @behavior
 * - Emits `fallback_shown` observability event on mount (console path; env binding
 *   is server-only and unavailable client-side)
 * - Copy is driven by `useAgentFallbackCopy()` from `~/lib/site-content-context`
 *   (metaobject-sourced or falls back to `FALLBACK_AGENT_FALLBACK_COPY`)
 *
 * @accessibility
 * - `role="note"` — supplementary informational landmark
 * - `aria-label` describes purpose to screen readers
 * - Hover state on CTA provides visible focus feedback
 * - Color: bg-foreground on background = ~21:1 contrast (WCAG AAA ✓)
 */

import {useEffect} from "react";
import {Link} from "react-router";
import {Bot, ArrowRight} from "lucide-react";
import {useAgentFallbackCopy} from "~/lib/site-content-context";
import {emitAgentEvent} from "~/lib/agentic/observability";

type AgentFallbackBannerProps = {
    /** Alternate agent-friendly route. Defaults to /search. */
    alternatePath?: string;
};

export function AgentFallbackBanner({alternatePath = "/search"}: AgentFallbackBannerProps) {
    const copy = useAgentFallbackCopy();

    // Emit observability event once on mount — console path only (env is server-only).
    useEffect(() => {
        emitAgentEvent(null, {
            evt: "fallback_shown",
            route: typeof window !== "undefined" ? window.location.pathname : undefined,
            requestType: "agent"
        });
    }, []);

    return (
        <div
            role="note"
            aria-label="Agent routing guidance"
            className="sticky top-0 z-50 w-full bg-foreground font-mono text-background"
        >
            <div className="mx-auto flex max-w-4xl items-center gap-4 px-4 py-3">
                {/* Bot icon — signals agent context */}
                <Bot className="h-3.5 w-3.5 shrink-0 text-background/60" aria-hidden="true" />

                {/* Copy block */}
                <div className="min-w-0 flex-1">
                    <span className="text-xs font-semibold tracking-wide">{copy.title}</span>
                    {copy.subtitle && (
                        <span className="ml-2 hidden text-[10px] text-background/60 sm:inline">
                            {copy.subtitle}
                        </span>
                    )}
                </div>

                {/* Single CTA — non-dismissible; the agent must use this path */}
                <Link
                    to={alternatePath}
                    className="flex shrink-0 items-center gap-1.5 border border-background/30 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-background transition-colors hover:border-background hover:bg-background hover:text-foreground"
                >
                    {copy.alternatePathLabel}
                    <ArrowRight className="h-3 w-3" />
                </Link>
            </div>
        </div>
    );
}
