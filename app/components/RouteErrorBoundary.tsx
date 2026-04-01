/**
 * @fileoverview Reusable Route Error Boundary
 *
 * @description
 * A lightweight, reusable error boundary component for route modules.
 * Renders content only (no <html> shell) — React Router 7's Layout export
 * in root.tsx wraps ErrorBoundary output with the document shell.
 *
 * Handles both route error responses (4xx, 5xx) and unexpected errors,
 * displaying a centered card with status code, title, message, and a
 * link back to the homepage.
 *
 * @usage
 * Re-export from any route file that doesn't need a custom error UI:
 * ```ts
 * export { RouteErrorBoundary as ErrorBoundary } from "~/components/RouteErrorBoundary";
 * ```
 *
 * @related
 * - app/root.tsx - Root ErrorBoundary (uses OfflineAwareErrorPage instead)
 * - app/components/OfflineAwareErrorPage.tsx - Full-featured error page with offline detection
 * - app/routes/$.tsx - Custom 404 ErrorBoundary with collection carousel
 */

import {isRouteErrorResponse, useRouteError, Link} from "react-router";
import {Badge} from "~/components/ui/badge";
import {Button} from "~/components/ui/button";

/**
 * Derives a human-readable title from the HTTP status code.
 */
function getErrorTitle(status: number): string {
    switch (status) {
        case 400:
            return "Bad Request";
        case 401:
            return "Unauthorized";
        case 403:
            return "Forbidden";
        case 404:
            return "Page Not Found";
        case 408:
            return "Request Timeout";
        case 429:
            return "Too Many Requests";
        case 500:
            return "Server Error";
        case 502:
            return "Bad Gateway";
        case 503:
            return "Service Unavailable";
        default:
            return status >= 500 ? "Server Error" : "An Error Occurred";
    }
}

/**
 * Derives a default message from the HTTP status code when no specific
 * message is available from the error response.
 */
function getDefaultMessage(status: number): string {
    if (status === 404) {
        return "The page you're looking for doesn't exist or has been moved.";
    }
    if (status >= 500) {
        return "We're experiencing technical difficulties. Please try again in a moment.";
    }
    return "Something went wrong. Please try again.";
}

export function RouteErrorBoundary() {
    const error = useRouteError();

    let status = 500;
    let message: string | undefined;

    if (isRouteErrorResponse(error)) {
        status = error.status;
        message = error.data?.message ?? error.data;
    } else if (error instanceof Error) {
        message = error.message;
    }

    const title = getErrorTitle(status);
    const displayMessage = message || getDefaultMessage(status);

    return (
        <section className="relative flex min-h-[60dvh] flex-col items-center justify-center overflow-hidden px-4 py-16">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--color-primary)_0%,_transparent_50%)] opacity-[0.03]" />
            <div className="relative mx-auto w-full max-w-2xl text-center">
                <div className="space-y-6">
                    <div className="inline-flex items-center">
                        <Badge variant="outline" className="px-4 py-1.5 text-xs font-medium">
                            Error {status}
                        </Badge>
                    </div>
                    <div className="space-y-4">
                        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                            {title}
                        </h1>
                        <p className="mx-auto max-w-lg text-lg leading-relaxed text-muted-foreground">
                            {displayMessage}
                        </p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4">
                        <Button onClick={() => window.location.reload()}>
                            Try Again
                        </Button>
                        <Button variant="outline" asChild>
                            <Link to="/">Return Home</Link>
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    );
}
