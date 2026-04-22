import {useEffect, useState} from "react";
import {Link} from "react-router";
import {Button} from "~/components/ui/button";
import {Badge} from "~/components/ui/badge";
import {WifiOff} from "lucide-react";

interface OfflineAwareErrorPageProps {
    statusCode: number;
    title?: string;
    message?: string;
}

export const OfflineAwareErrorPage = ({statusCode, title, message}: OfflineAwareErrorPageProps) => {
    const [isOffline, setIsOffline] = useState(false);

    useEffect(() => {
        if (typeof navigator !== "undefined") {
            setIsOffline(!navigator.onLine);
        }

        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    if (isOffline) {
        return <OfflineErrorUI />;
    }

    if (statusCode === 404) {
        return <NotFoundErrorUI title={title} message={message} />;
    }

    return <GenericErrorUI statusCode={statusCode} title={title} message={message} />;
};

const OfflineErrorUI = () => {
    return (
        <section className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-4 pt-6 pb-10">
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
                            You&apos;re Offline
                        </h1>
                        <p className="mx-auto max-w-lg text-lg leading-relaxed text-muted-foreground">
                            Check your internet connection and try again.
                        </p>
                        <p className="text-sm font-medium text-primary/80">
                            Previously viewed pages may still be available while offline.
                        </p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4">
                        <Button onClick={() => window.location.reload()}>Try Again</Button>
                        <Button variant="outline" asChild>
                            <a href="/">Back to Home</a>
                        </Button>
                    </div>
                    <div className="sr-only">
                        <h3>You are offline</h3>
                        <p>Navigate to: Homepage</p>
                    </div>
                </div>
            </div>
        </section>
    );
};

interface NotFoundErrorUIProps {
    title?: string;
    message?: string;
}

const NotFoundErrorUI = ({title, message}: NotFoundErrorUIProps) => {
    const displayTitle = title ?? "Page Not Found";
    const displayMessage = message ?? "The page you're looking for doesn't exist or has been moved.";

    return (
        <section className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-4 pt-6 pb-10">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--color-primary)_0%,_transparent_50%)] opacity-[0.03]" />
            <div className="relative mx-auto w-full max-w-2xl text-center">
                <div className="space-y-6">
                    <div className="inline-flex items-center">
                        <Badge variant="outline" className="px-4 py-1.5 text-xs font-medium">
                            Error 404
                        </Badge>
                    </div>
                    <div className="space-y-4">
                        <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
                            {displayTitle}
                        </h1>
                        <p className="mx-auto max-w-lg text-lg leading-relaxed text-muted-foreground">
                            {displayMessage}
                        </p>
                        <p className="text-sm font-medium text-primary/80">
                            But our collection is still here, waiting for you
                        </p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4">
                        <Button asChild>
                            <Link to="/">Back to Home</Link>
                        </Button>
                        <Button variant="outline" asChild>
                            <Link to="/collections/all-products">Browse All Products</Link>
                        </Button>
                    </div>
                    <div className="sr-only">
                        <h3>Error 404</h3>
                        <p>Navigate to: Homepage, Collections</p>
                    </div>
                </div>
            </div>
        </section>
    );
};

interface GenericErrorUIProps {
    statusCode: number;
    title?: string;
    message?: string;
}

const GenericErrorUI = ({statusCode, title, message}: GenericErrorUIProps) => {
    const displayTitle = title ?? (statusCode >= 500 ? "Server Error" : "An Error Occurred");
    const displayMessage = message ?? "We're experiencing technical difficulties. Please try again in a moment.";

    return (
        <section className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-4 pt-6 pb-10">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--color-primary)_0%,_transparent_50%)] opacity-[0.03]" />
            <div className="relative mx-auto w-full max-w-2xl text-center">
                <div className="space-y-6">
                    <div className="inline-flex items-center">
                        <Badge variant="outline" className="px-4 py-1.5 text-xs font-medium">
                            Error {statusCode}
                        </Badge>
                    </div>
                    <div className="space-y-4">
                        <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
                            {displayTitle}
                        </h1>
                        <p className="mx-auto max-w-lg text-lg leading-relaxed text-muted-foreground">
                            {displayMessage}
                        </p>
                        <p className="text-sm font-medium text-primary/80">
                            {statusCode >= 500 ? "We're working to fix this issue" : "Let's get you back on track"}
                        </p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4">
                        <Button onClick={() => window.location.reload()}>Try Again</Button>
                        <Button variant="outline" asChild>
                            <Link to="/">Back to Home</Link>
                        </Button>
                    </div>
                    <div className="bg-muted/50 border-border mt-6 inline-block rounded-full border px-4 py-2">
                        <p className="text-muted-foreground text-xs">
                            Code: <span className="font-mono font-medium">{statusCode}</span>
                        </p>
                    </div>
                    <div className="sr-only">
                        <h3>Error {statusCode}</h3>
                        <p>Navigate to: Homepage</p>
                    </div>
                </div>
            </div>
        </section>
    );
};
