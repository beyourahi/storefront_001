import {useEffect, useState} from "react";
import {useFetcher, NavLink} from "react-router";
import {Send, CheckCircle, AlertCircle, LogIn} from "lucide-react";
import {ButtonSpinner} from "~/components/ui/button-spinner";
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

/**
 * Email capture form with two layouts: `"compact"` (footer inline row) and
 * `"expanded"` (standalone section with heading, privacy note, and login link).
 * POSTs to `/api/newsletter`. Success clears the input and shows a status message
 * for 5 seconds, then hides it. `displayData` is set to `undefined` after the
 * timeout so the status message disappears without a flash on the next render.
 */
export const NewsletterSignup = ({variant = "compact", className}: NewsletterSignupProps) => {
    const fetcher = useFetcher<NewsletterResponse>();
    const [email, setEmail] = useState("");
    const [showSuccess, setShowSuccess] = useState(false);
    const isSubmitting = fetcher.state === "submitting";
    const data = fetcher.data;
    const isSuccess = data?.success === true;
    const isError = data?.success === false;
    const errorMessage = isError ? (data?.error ?? "") : "";

    useEffect(() => {
        if (isSuccess) {
            setShowSuccess(true);
            setEmail("");
            const timer = setTimeout(() => setShowSuccess(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [isSuccess]);

    const displayData = isSuccess && !showSuccess ? undefined : data;

    if (variant === "expanded") {
        return (
            <div className={cn("w-full", className)}>
                <h3 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl">Stay in the Loop</h3>
                <p className="mt-2 text-muted-foreground">
                    Be the first to know about new arrivals, exclusive offers, and more.
                </p>

                <fetcher.Form method="post" action="/api/newsletter" className="mt-5 flex flex-col gap-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                        <div className="relative flex-1">
                            <input
                                type="email"
                                name="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                placeholder="Enter your email address"
                                autoComplete="email"
                                disabled={isSubmitting}
                                aria-label="Email address for newsletter"
                                aria-describedby={errorMessage ? "newsletter-error" : undefined}
                                className={cn(
                                    "h-12 w-full rounded-md border bg-background px-4 text-foreground",
                                    "placeholder:text-muted-foreground/60",
                                    "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:outline-none",
                                    "disabled:opacity-60",
                                    isError &&
                                        "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20"
                                )}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isSubmitting || !email}
                            className={cn(
                                "cta-enhanced inline-flex h-12 items-center justify-center gap-2 rounded-md",
                                "bg-primary px-6 text-primary-foreground relative",
                                "hover:bg-primary/90 active:scale-[0.97]",
                                "disabled:opacity-60 disabled:pointer-events-none"
                            )}
                        >
                            <span className={isSubmitting ? "opacity-0" : undefined}>
                                <Send className="h-4 w-4" />
                            </span>
                            <span className={isSubmitting ? "opacity-0" : undefined}>Subscribe</span>
                            {isSubmitting && (
                                <span className="absolute inset-0 flex items-center justify-center">
                                    <ButtonSpinner />
                                </span>
                            )}
                        </button>
                    </div>
                    <p className="text-sm px-1 text-muted-foreground">
                        By subscribing, you agree to our{" "}
                        <a
                            href="/policies/privacy-policy"
                            className="underline underline-offset-2 text-muted-foreground hover:text-foreground"
                        >
                            Privacy Policy
                        </a>
                        . Unsubscribe anytime.
                    </p>
                </fetcher.Form>

                <StatusMessage data={displayData} />
                <div className="mt-4 pt-4 border-t border-border flex items-center justify-center gap-2">
                    <p className="text-sm text-muted-foreground">Already a member?</p>
                    <NavLink
                        to="/account"
                        prefetch="viewport"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 hover:no-underline transition-colors"
                    >
                        <LogIn className="size-3.5" />
                        <span>Log in to your account</span>
                    </NavLink>
                </div>
            </div>
        );
    }

    // Compact variant (footer)
    return (
        <div className={cn("w-full", className)}>
            <fetcher.Form method="post" action="/api/newsletter" className="flex items-stretch gap-2">
                <div className="relative flex-1">
                    <input
                        type="email"
                        name="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        placeholder="Your email"
                        autoComplete="email"
                        disabled={isSubmitting}
                        aria-label="Email address for newsletter"
                        aria-describedby={errorMessage ? "newsletter-error" : undefined}
                        className={cn(
                            "h-10 w-full rounded-md border bg-background px-3 text-sm text-foreground",
                            "placeholder:text-muted-foreground/60",
                            "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:outline-none",
                            "disabled:opacity-60",
                            isError &&
                                "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20"
                        )}
                    />
                </div>
                <button
                    type="submit"
                    disabled={isSubmitting || !email}
                    aria-label={isSubmitting ? "Subscribing" : "Subscribe to newsletter"}
                    className={cn(
                        "inline-flex h-10 items-center justify-center gap-1.5 rounded-md",
                        "bg-primary px-4 text-sm font-semibold text-primary-foreground",
                        "hover:bg-primary/90 active:scale-[0.97]",
                        "disabled:opacity-60 disabled:pointer-events-none"
                    )}
                >
                    {isSubmitting ? <ButtonSpinner /> : <Send className="h-3.5 w-3.5" />}
                    <span className="hidden sm:inline">Subscribe</span>
                </button>
            </fetcher.Form>

            <StatusMessage data={displayData} compact />
            <p className="mt-2 text-sm px-1 text-muted-foreground">
                By subscribing, you agree to our{" "}
                <a
                    href="/policies/privacy-policy"
                    className="underline underline-offset-2 text-muted-foreground hover:text-foreground"
                >
                    Privacy Policy
                </a>
                . Unsubscribe anytime.
            </p>
            <div className="mt-4 pt-4 border-t border-border flex items-center justify-start gap-2">
                <p className="text-sm text-muted-foreground">Already a member?</p>
                <NavLink
                    to="/account"
                    prefetch="viewport"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 hover:no-underline transition-colors"
                >
                    <LogIn className="size-3.5" />
                    <span>Log in to your account</span>
                </NavLink>
            </div>
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
            id={!isSuccess ? "newsletter-error" : undefined}
            role={isSuccess ? "status" : "alert"}
            aria-live={isSuccess ? "polite" : undefined}
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
