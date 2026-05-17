/**
 * @fileoverview AgentFallbackBanner — compact, non-dismissible inline banner
 * for the cart surface when an agent encounters a cart state it cannot proceed through
 * (empty cart, unsupported checkout flow). Directs the agent to an alternate path.
 *
 * @behavior
 * - Emits `fallback_shown` observability event on mount (console path only;
 *   AGENT_ANALYTICS binding is server-only)
 * - Copy is driven by `useAgentFallbackCopy()` from `~/lib/site-content-context`
 *
 * @accessibility
 * - `role="note"` — supplementary informational landmark
 * - `aria-label` describes purpose to screen readers
 * - Full-width CTA tap zone satisfies WCAG 2.5.5 touch target
 *
 * @related
 * - ~/lib/site-content-context.tsx — `useAgentFallbackCopy()` hook
 * - ~/lib/metaobject-parsers.ts — `FALLBACK_AGENT_FALLBACK_COPY` constants
 * - ~/lib/agentic/observability.ts — `emitAgentEvent()` (console path client-side)
 * - ~/components/AgentFallbackBanner.tsx — full-page interstitial for non-cart surfaces
 */

import {useEffect} from "react";
import {Link} from "react-router";
import {Bot, ArrowRight} from "lucide-react";
import {cn} from "~/lib/utils";
import {useAgentFallbackCopy} from "~/lib/site-content-context";
import {emitAgentEvent} from "~/lib/agentic/observability";

type AgentFallbackBannerProps = {
    alternatePath?: string;
};

export function AgentFallbackBanner({alternatePath = "/search"}: AgentFallbackBannerProps) {
    const copy = useAgentFallbackCopy();

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
            className={cn(
                "rounded-lg border border-border bg-muted font-mono",
                "animate-in fade-in-0 slide-in-from-top-2 duration-300"
            )}
        >
            <div className="p-3">
                <div className="mb-2.5 flex items-center gap-2">
                    <span
                        className="flex shrink-0 items-center justify-center rounded-md bg-accent/20 p-1 text-accent-foreground"
                        aria-hidden="true"
                    >
                        <Bot className="size-3" />
                    </span>
                    <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        Agent Routing
                    </span>
                </div>

                <div className="mb-3 border-t border-border/50 pt-2.5 space-y-0.5">
                    <p className="text-xs font-semibold leading-snug text-foreground">{copy.title}</p>
                    <p className="text-[10px] leading-relaxed text-muted-foreground">{copy.subtitle}</p>
                </div>

                <Link
                    to={alternatePath}
                    className={cn(
                        "flex w-full items-center justify-between",
                        "border border-foreground/20 px-3 py-2",
                        "text-[10px] font-semibold text-foreground",
                        "transition-colors duration-150 hover:border-foreground hover:bg-foreground hover:text-background"
                    )}
                >
                    {copy.alternatePathLabel}
                    <ArrowRight className="size-3 shrink-0" />
                </Link>
            </div>
        </div>
    );
}
