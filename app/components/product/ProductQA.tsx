/**
 * @fileoverview Product Q&A Panel — storefront_001
 *
 * Bounded single-turn AI Q&A surface for the PDP. Buyer types a question;
 * the backend route grounds the LLM in the product's own data (no chat history,
 * no multi-turn context). Lazy: the panel is collapsed by default; the answer
 * stream and react-markdown only mount after first expansion.
 *
 * Visual language: 001 sleek/utility-first — flat surfaces, minimal motion,
 * monospace transcript styling, foreground/muted token usage.
 *
 * @related
 * - app/routes/api.pdp-qa.tsx — backend POST endpoint
 * - app/lib/ai-provider.ts — LLM provider abstraction
 */

import {useState, useId, lazy, Suspense} from "react";
import {ChevronDown, Sparkles, AlertCircle} from "lucide-react";
import {Button} from "~/components/ui/button";
import {cn} from "~/lib/utils";

// Lazy-load react-markdown so an unexpanded panel ships zero markdown JS.
const Markdown = lazy(() => import("react-markdown"));

type Status = "idle" | "loading" | "answered" | "rate-limited" | "error";

interface ProductQAProps {
    productHandle: string;
    /** When false, the panel is hidden entirely — controlled by feature flag in the loader. */
    enabled?: boolean;
}

const DISCLOSURE_TEXT =
    "Answers are AI-generated based on this product's information. May contain errors — confirm details before purchase.";

export function ProductQA({productHandle, enabled = true}: ProductQAProps) {
    const [open, setOpen] = useState(false);
    const [question, setQuestion] = useState("");
    const [answer, setAnswer] = useState<string | null>(null);
    const [status, setStatus] = useState<Status>("idle");
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const inputId = useId();

    if (!enabled) return null;

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = question.trim();
        if (!trimmed || status === "loading") return;

        setStatus("loading");
        setAnswer(null);
        setErrorMsg(null);

        try {
            const res = await fetch("/api/pdp-qa", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({productHandle, question: trimmed})
            });

            if (res.status === 429) {
                setStatus("rate-limited");
                return;
            }
            if (!res.ok) {
                const payload = (await res.json().catch(() => null)) as {error?: string} | null;
                setErrorMsg(payload?.error ?? "Unable to answer right now");
                setStatus("error");
                return;
            }

            const text = await res.text();
            setAnswer(text);
            setStatus("answered");
        } catch {
            setErrorMsg("Network error — please try again");
            setStatus("error");
        }
    };

    return (
        <section className="border-t border-border py-8 lg:py-12">
            <div className="mx-auto max-w-3xl px-4">
                <button
                    type="button"
                    onClick={() => setOpen(o => !o)}
                    className="flex w-full items-center justify-between gap-3 text-left"
                    aria-expanded={open}
                    aria-controls={`${inputId}-panel`}
                >
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                        <h2 className="text-foreground font-serif text-lg font-bold uppercase tracking-wide md:text-xl">
                            Ask about this product
                        </h2>
                    </div>
                    <ChevronDown
                        className={cn(
                            "h-4 w-4 text-muted-foreground transition-transform duration-200",
                            open && "rotate-180"
                        )}
                        aria-hidden="true"
                    />
                </button>

                {open && (
                    <div id={`${inputId}-panel`} className="mt-6 space-y-4">
                        <form onSubmit={e => void submit(e)} className="space-y-3">
                            <label htmlFor={inputId} className="sr-only">
                                Your question
                            </label>
                            <input
                                id={inputId}
                                type="text"
                                value={question}
                                onChange={e => setQuestion(e.target.value)}
                                maxLength={500}
                                placeholder="e.g. What materials is this made from?"
                                className="w-full border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-foreground focus:outline-none"
                                disabled={status === "loading"}
                            />
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                                    {DISCLOSURE_TEXT}
                                </p>
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={status === "loading" || question.trim().length === 0}
                                    className="shrink-0"
                                >
                                    {status === "loading" ? "Thinking…" : "Ask"}
                                </Button>
                            </div>
                        </form>

                        {status === "rate-limited" && (
                            <div className="flex items-start gap-2 border-l-2 border-muted-foreground/40 bg-muted/30 px-3 py-2">
                                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                                <p className="text-xs text-muted-foreground">
                                    You&apos;ve reached the question limit for this product. Try again later.
                                </p>
                            </div>
                        )}

                        {status === "error" && errorMsg && (
                            <div className="flex items-start gap-2 border-l-2 border-destructive/60 bg-destructive/5 px-3 py-2">
                                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" aria-hidden="true" />
                                <p className="text-xs text-destructive">{errorMsg}</p>
                            </div>
                        )}

                        {status === "answered" && answer && (
                            <div className="border-l-2 border-foreground/40 bg-muted/20 px-4 py-3">
                                <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                                    Answer
                                </p>
                                <div className="prose prose-sm max-w-none text-sm leading-relaxed text-foreground prose-headings:font-serif prose-strong:font-semibold prose-p:my-2">
                                    <Suspense fallback={<p className="text-sm text-foreground">{answer}</p>}>
                                        <Markdown>{answer}</Markdown>
                                    </Suspense>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
}
