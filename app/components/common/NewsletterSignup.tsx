import {useEffect, useRef} from "react";
import {useFetcher} from "react-router";
import {Send, CheckCircle, AlertCircle, Loader2} from "lucide-react";
import {cn} from "~/lib/utils";

type NewsletterResponse = {
    success?: boolean;
    message?: string;
    error?: string;
};

interface NewsletterSignupProps {
    /** "compact" renders an inline row (for footer); "expanded" renders a stacked layout with heading */
    variant?: "compact" | "expanded";
    className?: string;
}

export const NewsletterSignup = ({variant = "compact", className}: NewsletterSignupProps) => {
    const fetcher = useFetcher<NewsletterResponse>();
    const inputRef = useRef<HTMLInputElement>(null);
    const isSubmitting = fetcher.state === "submitting";
    const data = fetcher.data;
    const isSuccess = data?.success === true;
    const isError = data?.success === false;

    // Clear the input after a successful submission
    useEffect(() => {
        if (isSuccess && inputRef.current) {
            inputRef.current.value = "";
        }
    }, [isSuccess]);

    if (variant === "expanded") {
        return (
            <div className={cn("w-full", className)}>
                <h3 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl">
                    Stay in the Loop
                </h3>
                <p className="mt-2 text-muted-foreground">
                    Be the first to know about new arrivals, exclusive offers, and more.
                </p>

                <fetcher.Form
                    method="post"
                    action="/api/newsletter"
                    className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-start"
                >
                    <div className="relative flex-1">
                        <input
                            ref={inputRef}
                            type="email"
                            name="email"
                            required
                            placeholder="Enter your email address"
                            autoComplete="email"
                            disabled={isSubmitting}
                            aria-label="Email address for newsletter"
                            className={cn(
                                "h-12 w-full rounded-lg border bg-background px-4 text-foreground",
                                "placeholder:text-muted-foreground/60",
                                "focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none",
                                "disabled:opacity-60",
                                isError && "border-destructive focus:border-destructive focus:ring-destructive/20"
                            )}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={cn(
                            "cta-enhanced inline-flex h-12 items-center justify-center gap-2 rounded-lg",
                            "bg-primary px-6 text-primary-foreground",
                            "hover:bg-primary/90 active:scale-[0.97]",
                            "disabled:opacity-60 disabled:pointer-events-none"
                        )}
                    >
                        {isSubmitting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                        {isSubmitting ? "Subscribing..." : "Subscribe"}
                    </button>
                </fetcher.Form>

                <StatusMessage data={data} />
            </div>
        );
    }

    // Compact variant (footer)
    return (
        <div className={cn("w-full", className)}>
            <fetcher.Form
                method="post"
                action="/api/newsletter"
                className="flex items-stretch gap-2"
            >
                <div className="relative flex-1">
                    <input
                        ref={inputRef}
                        type="email"
                        name="email"
                        required
                        placeholder="Your email"
                        autoComplete="email"
                        disabled={isSubmitting}
                        aria-label="Email address for newsletter"
                        className={cn(
                            "h-10 w-full rounded-md border bg-background px-3 text-sm text-foreground",
                            "placeholder:text-muted-foreground/60",
                            "focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none",
                            "disabled:opacity-60",
                            isError && "border-destructive focus:border-destructive focus:ring-destructive/20"
                        )}
                    />
                </div>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    aria-label={isSubmitting ? "Subscribing" : "Subscribe to newsletter"}
                    className={cn(
                        "inline-flex h-10 items-center justify-center gap-1.5 rounded-md",
                        "bg-primary px-4 text-sm font-semibold text-primary-foreground",
                        "hover:bg-primary/90 active:scale-[0.97]",
                        "disabled:opacity-60 disabled:pointer-events-none"
                    )}
                >
                    {isSubmitting ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                        <Send className="h-3.5 w-3.5" />
                    )}
                    <span className="hidden sm:inline">{isSubmitting ? "..." : "Subscribe"}</span>
                </button>
            </fetcher.Form>

            <StatusMessage data={data} compact />
        </div>
    );
};

/** Renders success / error feedback below the form */
const StatusMessage = ({data, compact = false}: {data: NewsletterResponse | undefined; compact?: boolean}) => {
    if (!data) return null;

    const isSuccess = data.success === true;
    const message = data.message || data.error || "";

    if (!message) return null;

    return (
        <p
            role="status"
            aria-live="polite"
            className={cn(
                "mt-2 flex items-center gap-1.5",
                compact ? "text-xs" : "text-sm",
                isSuccess ? "text-success" : "text-destructive"
            )}
        >
            {isSuccess ? (
                <CheckCircle className={cn(compact ? "h-3 w-3" : "h-4 w-4", "shrink-0")} />
            ) : (
                <AlertCircle className={cn(compact ? "h-3 w-3" : "h-4 w-4", "shrink-0")} />
            )}
            {message}
        </p>
    );
};
