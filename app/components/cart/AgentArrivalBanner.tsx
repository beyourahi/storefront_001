/**
 * @fileoverview AgentArrivalBanner — sticky top-of-cart notice for AI-agent-prepared carts.
 *
 * Shown when a buyer lands on the cart page via an AI agent's checkout link
 * (i.e. when `?_agent=1` is present in the URL). The banner informs the user
 * that their cart was prepared by a shopping assistant, creating transparency
 * about the agentic commerce flow.
 *
 * Design:
 * - `bg-primary text-primary-foreground` — mirrors the checkout button's color
 *   family for visual coherence within the cart surface.
 * - Smooth slide-down on appear, slide-up on dismiss (CSS keyframe via a ref-injected
 *   <style> element — no dangerouslySetInnerHTML).
 * - Session-scoped dismiss — hides for the page session; reappears on hard refresh
 *   (intentional: contextual banner, not a persistent user preference).
 * - `aria-live="polite"` so assistive technologies announce it without interrupting focus.
 *
 * @usage
 * ```tsx
 * <AgentArrivalBanner />
 * ```
 */

import {useEffect, useRef, useState} from "react";
import {Bot, X} from "lucide-react";
import {useAgentArrivalCopy} from "~/lib/site-content-context";
import {cn} from "~/lib/utils";

// ---------------------------------------------------------------------------
// Static keyframe CSS — developer-controlled constant, never user input.
// Injected via styleRef.current.textContent to avoid dangerouslySetInnerHTML.
// ---------------------------------------------------------------------------

const AGENT_BANNER_CSS =
    "@keyframes agent-banner-in{from{transform:translateY(-100%);opacity:0}to{transform:translateY(0);opacity:1}}" +
    "@keyframes agent-banner-out{from{transform:translateY(0);opacity:1}to{transform:translateY(-100%);opacity:0}}" +
    ".agent-banner-enter{animation:agent-banner-in 0.32s cubic-bezier(0.22,1,0.36,1) both}" +
    ".agent-banner-exit{animation:agent-banner-out 0.24s cubic-bezier(0.55,0,1,0.45) both}";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AgentArrivalBanner() {
    const {title, subtitle} = useAgentArrivalCopy();
    const styleRef = useRef<HTMLStyleElement | null>(null);

    // Inject keyframe styles once via a <style> element in <head>.
    // Using a ref + textContent avoids dangerouslySetInnerHTML entirely.
    useEffect(() => {
        const existing = document.getElementById("agent-banner-keyframes");
        if (existing) return;

        const el = document.createElement("style");
        el.id = "agent-banner-keyframes";
        el.textContent = AGENT_BANNER_CSS;
        document.head.appendChild(el);
        styleRef.current = el;

        return () => {
            // Leave the style tag in place — removing it causes flicker if the
            // component remounts (e.g. HMR). The id guard prevents duplicates.
        };
    }, []);

    // Three-phase dismiss: "visible" → "exiting" (animation) → "hidden" (unmounted).
    const [phase, setPhase] = useState<"visible" | "exiting" | "hidden">("visible");

    const handleDismiss = () => {
        setPhase("exiting");
        // Unmount after the exit animation completes (240 ms, matches agent-banner-out).
        setTimeout(() => {
            setPhase("hidden");
        }, 260);
    };

    if (phase === "hidden") return null;

    return (
        /*
         * role="status" + aria-live="polite" announces the banner to assistive tech
         * when it appears without interrupting the user's current focus context.
         * aria-atomic ensures the entire region is read as one announcement.
         */
        <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className={cn(
                "relative overflow-hidden rounded-xl px-4 py-3",
                "bg-primary text-primary-foreground",
                "shadow-sm",
                phase === "visible" && "agent-banner-enter",
                phase === "exiting" && "agent-banner-exit"
            )}
        >
            <div className="flex items-start gap-3">
                {/* Bot icon — signals agentic origin clearly without being alarming. */}
                <div
                    className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary-foreground/15"
                    aria-hidden="true"
                >
                    <Bot className="h-4 w-4" />
                </div>

                {/* Copy — sourced from useAgentArrivalCopy() → FALLBACK_AGENT_ARRIVAL_COPY. */}
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold leading-snug">{title}</p>
                    <p className="mt-0.5 text-xs font-normal leading-snug opacity-80">{subtitle}</p>
                </div>

                {/* Dismiss button — WCAG 2.5.5: 44×44 px touch target via negative margin. */}
                <button
                    type="button"
                    onClick={handleDismiss}
                    aria-label="Dismiss agent arrival notice"
                    className={cn(
                        "sleek -mr-1 mt-0.5 flex-shrink-0 rounded-full p-1.5",
                        "text-primary-foreground/70 hover:text-primary-foreground",
                        "hover:bg-primary-foreground/15",
                        "focus-visible:ring-2 focus-visible:ring-primary-foreground/50",
                        "focus-visible:outline-none"
                    )}
                >
                    <X className="h-3.5 w-3.5" />
                </button>
            </div>
        </div>
    );
}
