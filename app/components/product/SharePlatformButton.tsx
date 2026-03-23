import {useState, useCallback} from "react";
import {Loader2} from "lucide-react";
import {Button} from "~/components/ui/button";
import {
    openShareWindow,
    PLATFORM_COLORS,
    type ShareData,
    type SocialSharePlatform
} from "~/lib/social-share";

type SharePlatformButtonProps = {
    platform: SocialSharePlatform;
    shareData: ShareData;
    loading?: boolean;
    onShare?: (platformId: string, shareData: ShareData) => void;
};

export const SharePlatformButton = ({platform, shareData, loading = false, onShare}: SharePlatformButtonProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showError, setShowError] = useState(false);

    const handleShare = useCallback(async () => {
        setIsLoading(true);
        setShowSuccess(false);
        setShowError(false);

        try {
            if (onShare) {
                onShare(platform.id, shareData);
            }

            if (platform.customHandler) {
                await platform.customHandler(
                    shareData,
                    () => {
                        setShowSuccess(true);
                        setTimeout(() => setShowSuccess(false), 2000);
                    },
                    () => {
                        setShowError(true);
                        setTimeout(() => setShowError(false), 2000);
                    }
                );
            } else {
                const shareUrl = platform.url(shareData);
                openShareWindow(shareUrl, `Share on ${platform.name}`);
            }
        } catch {
            if (platform.id === "copy") {
                setShowError(true);
                setTimeout(() => setShowError(false), 2000);
            }
        } finally {
            setIsLoading(false);
        }
    }, [platform, shareData, onShare]);

    const PlatformIcon = platform.icon;

    return (
        <Button
            variant="outline"
            className="sleek bg-background hover:bg-accent/50 border-border hover:border-primary/20 group relative h-14 w-full cursor-pointer justify-center gap-3 px-4 hover:scale-[1.02] hover:shadow-sm disabled:opacity-50 disabled:hover:scale-100"
            onClick={() => void handleShare()}
            disabled={loading || isLoading}
        >
            <div
                className="flex h-8 w-8 items-center justify-center rounded-md sleek"
                style={{
                    backgroundColor: showSuccess ? "rgb(34, 197, 94)" : showError ? "rgb(239, 68, 68)" : PLATFORM_COLORS[platform.id as keyof typeof PLATFORM_COLORS] || "rgb(107, 114, 128)"
                }}
            >
                {loading || isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                ) : showSuccess ? (
                    <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                ) : showError ? (
                    <svg
                        className="h-4 w-4 text-white"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <path d="m18 6-12 12" />
                        <path d="m6 6 12 12" />
                    </svg>
                ) : (
                    <PlatformIcon className="h-4 w-4 text-white" />
                )}
            </div>

            <div className="flex flex-col items-center text-center">
                <span className="text-foreground group-hover:text-primary sleek text-sm font-medium">
                    {showSuccess && platform.id === "copy"
                        ? "Copied!"
                        : showError && platform.id === "copy"
                          ? "Failed to copy"
                          : platform.name}
                </span>
                {showSuccess && platform.id === "copy" ? (
                    <span className="text-muted-foreground sleek text-xs">Link copied to clipboard</span>
                ) : showError && platform.id === "copy" ? (
                    <span className="text-muted-foreground sleek text-xs">Please try again</span>
                ) : platform.id === "copy" ? (
                    <span className="text-muted-foreground sleek text-xs">Copy to clipboard</span>
                ) : (
                    <span className="text-muted-foreground sleek text-xs">Share now</span>
                )}
            </div>
        </Button>
    );
};
