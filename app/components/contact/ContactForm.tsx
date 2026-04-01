import {useState, useCallback, useRef, useEffect} from "react";
import {useFetcher} from "react-router";
import {Send, CheckCircle2, AlertCircle, ArrowLeft, Loader2} from "lucide-react";
import {Input} from "~/components/ui/input";
import {Textarea} from "~/components/ui/textarea";
import {Label} from "~/components/ui/label";
import {Button} from "~/components/ui/button";
import {cn} from "~/lib/utils";

type FieldError = {field: string; message: string};

type ContactFormResult = {
    success?: boolean;
    message?: string;
    errors?: FieldError[];
};

/** Extract server-side error message for a specific field. */
function getFieldError(errors: FieldError[] | undefined, field: string): string | undefined {
    return errors?.find(e => e.field === field)?.message;
}

/** Simple client-side email check (mirrors server regex). */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ContactForm() {
    const fetcher = useFetcher<ContactFormResult>();
    const isSubmitting = fetcher.state === "submitting";
    const result = fetcher.data;
    const formRef = useRef<HTMLFormElement>(null);

    // Client-side validation errors (cleared on submit attempt)
    const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

    // Track whether we've shown the success state so the user can dismiss it
    const [showSuccess, setShowSuccess] = useState(false);

    // When the server returns success, flip to the success state
    useEffect(() => {
        if (result?.success) {
            setShowSuccess(true);
        }
    }, [result]);

    const validateClient = useCallback((): boolean => {
        const form = formRef.current;
        if (!form) return false;

        const fd = new FormData(form);
        const name = (fd.get("name") as string | null)?.trim() ?? "";
        const email = (fd.get("email") as string | null)?.trim() ?? "";
        const message = (fd.get("message") as string | null)?.trim() ?? "";

        const errors: Record<string, string> = {};

        if (!name) errors.name = "Name is required";
        if (!email) {
            errors.email = "Email is required";
        } else if (!EMAIL_REGEX.test(email)) {
            errors.email = "Please enter a valid email address";
        }
        if (!message) errors.message = "Message is required";

        setClientErrors(errors);
        return Object.keys(errors).length === 0;
    }, []);

    const handleSubmit = useCallback(
        (e: React.FormEvent<HTMLFormElement>) => {
            if (!validateClient()) {
                e.preventDefault();
            }
            // If validation passes, let useFetcher handle submission naturally
        },
        [validateClient]
    );

    const handleReset = useCallback(() => {
        setShowSuccess(false);
        setClientErrors({});
        formRef.current?.reset();
    }, []);

    // Merge client + server errors — client errors take priority because they're more immediate
    const serverErrors = result?.success === false ? result.errors : undefined;
    const formLevelError = getFieldError(serverErrors, "form");

    const getError = (field: string): string | undefined => {
        return clientErrors[field] || getFieldError(serverErrors, field);
    };

    // ── Success state ──
    if (showSuccess) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <div
                    className={cn(
                        "bg-success/10 mb-6 flex h-16 w-16 items-center justify-center rounded-full",
                        "ring-success/20 ring-4 ring-offset-2 ring-offset-transparent"
                    )}
                >
                    <CheckCircle2 className="text-success h-8 w-8" />
                </div>

                <h3 className="text-foreground mb-2 font-serif text-xl font-bold">Message Sent</h3>

                <p className="text-muted-foreground mb-8 max-w-sm text-sm leading-relaxed">
                    {result?.message ?? "Thank you for your message! We'll get back to you soon."}
                </p>

                <Button type="button" variant="outline" size="lg" onClick={handleReset} className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Send Another Message
                </Button>
            </div>
        );
    }

    // ── Form ──
    return (
        <fetcher.Form
            ref={formRef}
            method="post"
            action="/api/contact"
            onSubmit={handleSubmit}
            noValidate
            className="space-y-6"
        >
            {/* Honeypot — visually hidden, screen-reader hidden, tab-skipped */}
            <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
                <label htmlFor="contact-website">Website</label>
                <input type="text" id="contact-website" name="website" tabIndex={-1} autoComplete="off" />
            </div>

            {/* Form-level error (network/server issues) */}
            {formLevelError && (
                <div
                    className="border-destructive/30 bg-destructive/5 flex items-start gap-3 rounded-lg border p-4"
                    role="alert"
                >
                    <AlertCircle className="text-destructive mt-0.5 h-5 w-5 shrink-0" />
                    <p className="text-destructive text-sm font-medium">{formLevelError}</p>
                </div>
            )}

            {/* Name + Email — side-by-side on desktop */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <FormField
                    id="contact-name"
                    name="name"
                    label="Name"
                    placeholder="Your name"
                    required
                    error={getError("name")}
                    disabled={isSubmitting}
                    autoComplete="name"
                />

                <FormField
                    id="contact-email"
                    name="email"
                    label="Email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    error={getError("email")}
                    disabled={isSubmitting}
                    autoComplete="email"
                />
            </div>

            {/* Subject — full width */}
            <FormField
                id="contact-subject"
                name="subject"
                label="Subject"
                placeholder="What is this about?"
                error={getError("subject")}
                disabled={isSubmitting}
            />

            {/* Message — textarea */}
            <FormField
                id="contact-message"
                name="message"
                label="Message"
                placeholder="Tell us how we can help..."
                required
                multiline
                rows={5}
                error={getError("message")}
                disabled={isSubmitting}
            />

            {/* Submit */}
            <div className="flex justify-start pt-2">
                <Button
                    type="submit"
                    size="lg"
                    disabled={isSubmitting}
                    className="w-full gap-2 sm:w-auto"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Sending...
                        </>
                    ) : (
                        <>
                            <Send className="h-4 w-4" />
                            Send Message
                        </>
                    )}
                </Button>
            </div>
        </fetcher.Form>
    );
}

// ── Internal FormField component (keeps the parent markup clean) ──

type FormFieldProps = {
    id: string;
    name: string;
    label: string;
    type?: string;
    placeholder?: string;
    required?: boolean;
    multiline?: boolean;
    rows?: number;
    error?: string;
    disabled?: boolean;
    autoComplete?: string;
};

function FormField({
    id,
    name,
    label,
    type = "text",
    placeholder,
    required = false,
    multiline = false,
    rows = 4,
    error,
    disabled,
    autoComplete
}: FormFieldProps) {
    const hasError = Boolean(error);
    const describedBy = hasError ? `${id}-error` : undefined;

    return (
        <div className="space-y-2">
            <Label htmlFor={id} className="text-foreground/90">
                {label}
                {required && <span className="text-destructive ml-1">*</span>}
            </Label>

            {multiline ? (
                <Textarea
                    id={id}
                    name={name}
                    placeholder={placeholder}
                    rows={rows}
                    disabled={disabled}
                    aria-invalid={hasError || undefined}
                    aria-describedby={describedBy}
                    className={cn(
                        "bg-muted/40 focus:bg-background sleek rounded-lg",
                        hasError && "border-destructive ring-destructive/20 ring-2"
                    )}
                />
            ) : (
                <Input
                    id={id}
                    name={name}
                    type={type}
                    placeholder={placeholder}
                    disabled={disabled}
                    autoComplete={autoComplete}
                    aria-invalid={hasError || undefined}
                    aria-describedby={describedBy}
                    className={cn(
                        "bg-muted/40 focus:bg-background sleek h-11 rounded-lg",
                        hasError && "border-destructive ring-destructive/20 ring-2"
                    )}
                />
            )}

            {hasError && (
                <p id={describedBy} className="text-destructive flex items-center gap-1.5 text-xs" role="alert">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    {error}
                </p>
            )}
        </div>
    );
}
