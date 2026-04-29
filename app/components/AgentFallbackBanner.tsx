import {useEffect} from "react";
import {Link} from "react-router";
import {Bot, ArrowRight} from "lucide-react";
import {useAgentFallbackCopy} from "~/lib/site-content-context";
import {emitAgentEvent} from "~/lib/agentic/observability";

type AgentFallbackBannerProps = {
    /** URL to the alternate agent-friendly endpoint (defaults to /search). */
    alternatePath?: string;
};

/**
 * Non-dismissible top-of-page banner shown when an agent lands on an interactive
 * route (quiz, editorial experience) that cannot be navigated programmatically.
 *
 * Design — SF001 minimal monochrome: font-mono, muted border, tight layout.
 * Non-dismissible: the agent cannot interact with the page behind it, so removing
 * the hint would leave it with no path forward.
 *
 * Emits `fallback_shown` observability event on mount (console.log path only;
 * AGENT_ANALYTICS binding is server-only and unavailable here).
 */
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
            className="w-full border-b border-border bg-muted/60 font-mono"
        >
            <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    {/* Icon + copy */}
                    <div className="flex items-start gap-3">
                        <Bot
                            className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground"
                            aria-hidden="true"
                        />
                        <div className="space-y-0.5">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-foreground">
                                {copy.title}
                            </p>
                            <p className="text-[10px] leading-relaxed text-muted-foreground">
                                {copy.subtitle}
                            </p>
                        </div>
                    </div>

                    {/* Single CTA */}
                    <Link
                        to={alternatePath}
                        className="flex shrink-0 items-center gap-1.5 self-start border border-foreground px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-foreground transition-colors hover:bg-foreground hover:text-background sm:self-auto"
                    >
                        {copy.alternatePathLabel}
                        <ArrowRight className="h-3 w-3" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
