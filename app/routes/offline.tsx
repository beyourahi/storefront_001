import {useEffect, useState} from "react";
import {Button} from "~/components/ui/button";
import {Badge} from "~/components/ui/badge";
import {WifiOff} from "lucide-react";
import type {MetaFunction} from "react-router";
import {trackOfflinePageView} from "~/hooks/usePwaAnalytics";

export const meta: MetaFunction = () => [{title: "Offline"}, {name: "robots", content: "noindex"}];
import {getThemeFromStorage} from "~/lib/theme-storage";
const FALLBACK_ERROR_CONTENT = {
    notFoundHeading: "Page Not Found",
    notFoundMessage: "The page you're looking for doesn't exist or has been moved.",
    notFoundPrimaryCta: "Back to Home",
    notFoundSecondaryCta: "Browse Collections",
    serverErrorHeading: "Something Went Wrong",
    serverErrorMessage: "We're experiencing technical difficulties. Please try again.",
    serverErrorRetry: "Try Again",
    serverErrorHome: "Return Home",
    offlineHeading: "You're Offline",
    offlineMessage: "Please check your internet connection and try again.",
    offlineRetry: "Retry",
    offlineHome: "Return Home",
    offlineTip: "Tip: Some pages you've visited before may still be available",
    maintenanceHeading: "We'll Be Right Back",
    maintenanceMessage: "We're making some improvements. Please check back soon.",
    maintenanceEstimated: "Estimated time: a few minutes"
};
import type {GeneratedTheme} from "types";

/**
 * Applies the last-known brand theme while offline.
 * Reads the `GeneratedTheme` from localStorage (written by the online flow) and
 * injects the CSS variables + Google Fonts link into the document head so the
 * offline page renders with the correct brand colors and typography.
 */
const useOfflineTheme = () => {
    const [theme, setTheme] = useState<GeneratedTheme | null>(null);

    useEffect(() => {
        const cachedTheme = getThemeFromStorage();
        if (cachedTheme) {
            setTheme(cachedTheme);
        }
    }, []);

    useEffect(() => {
        if (!theme) return;

        const styleId = "offline-theme-override";
        let styleElement = document.getElementById(styleId) as HTMLStyleElement | null;

        if (!styleElement) {
            styleElement = document.createElement("style");
            styleElement.id = styleId;
            document.head.appendChild(styleElement);
        }

        styleElement.textContent = theme.cssVariables;

        if (theme.googleFontsUrl) {
            const fontLinkId = "offline-google-fonts";
            let fontLink = document.getElementById(fontLinkId) as HTMLLinkElement | null;

            if (!fontLink) {
                fontLink = document.createElement("link");
                fontLink.id = fontLinkId;
                fontLink.rel = "stylesheet";
                fontLink.href = theme.googleFontsUrl;
                document.head.appendChild(fontLink);
            }
        }
    }, [theme]);

    return theme;
};

export default function OfflinePage() {
    useOfflineTheme();

    const errorContent = FALLBACK_ERROR_CONTENT;

    useEffect(() => {
        if (typeof window !== "undefined") {
            void trackOfflinePageView();
        }
    }, []);

    return (
        <section className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-4 pt-6 pb-10">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--color-primary)_0%,_transparent_50%)] opacity-[0.03]" />
            <div className="relative mx-auto w-full max-w-2xl text-center">
                <div className="space-y-6">
                    <div className="bg-primary/10 mb-4 inline-flex rounded-full p-4 shadow-sm backdrop-blur-sm">
                        <WifiOff className="text-primary size-10" strokeWidth={1.5} aria-hidden="true" />
                    </div>
                    <div className="inline-flex items-center">
                        <Badge variant="outline" className="px-4 py-1.5 text-xs font-medium">
                            Offline
                        </Badge>
                    </div>
                    <div className="space-y-4">
                        <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
                            {errorContent.offlineHeading}
                        </h1>
                        <p className="mx-auto max-w-lg text-lg leading-relaxed text-muted-foreground">
                            {errorContent.offlineMessage}
                        </p>
                        <p className="text-sm font-medium text-primary/80">{errorContent.offlineTip}</p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4">
                        <Button onClick={() => window.location.reload()}>{errorContent.offlineRetry}</Button>
                        <Button variant="outline" asChild>
                            <a href="/">{errorContent.offlineHome}</a>
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    );
}

export {RouteErrorBoundary as ErrorBoundary} from "~/components/RouteErrorBoundary";
