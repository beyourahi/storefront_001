import {useState} from "react";
import {X} from "lucide-react";
import {
    getSocialSharePlatforms,
    copyToClipboard,
    openShareWindow,
    type ShareData,
    type SocialSharePlatform
} from "~/lib/social-share";
import {useLockBodyScroll} from "~/lib/LenisProvider";

type ShareDialogProps = {
    url: string;
    title: string;
    onClose: () => void;
};

/**
 * Full-screen share dialog with platform buttons (Facebook, X, WhatsApp, Pinterest, copy-link).
 * Locks body scroll via Lenis while open. Clicking the backdrop closes the dialog.
 * The copy-link button shows a transient "Copied!" label for 2 seconds.
 */
export const ShareDialog = ({url, title, onClose}: ShareDialogProps) => {
    useLockBodyScroll(true);
    const [copied, setCopied] = useState(false);

    const shareData: ShareData = {
        title,
        description: title,
        url,
        price: ""
    };

    const platforms = getSocialSharePlatforms();

    const handlePlatformClick = async (platform: SocialSharePlatform) => {
        if (platform.customHandler) {
            await platform.customHandler(shareData, () => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            });
            return;
        }
        const shareUrl = platform.url(shareData);
        openShareWindow(shareUrl, platform.name);
    };

    return (
        <div
            className="bg-overlay-dark fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md"
            role="button"
            tabIndex={0}
            onClick={onClose}
            onKeyDown={e => {
                if (e.key === "Enter" || e.key === " ") onClose?.();
            }}
        >
            {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
            <div
                className="bg-card text-card-foreground border-border w-full max-w-md rounded-lg border p-6 shadow-2xl"
                role="dialog"
                aria-labelledby="share-dialog-title"
                aria-modal="true"
                onClick={e => e.stopPropagation()}
                onKeyDown={e => e.stopPropagation()}
            >
                <div className="mb-4 flex items-center justify-between">
                    <h2 id="share-dialog-title" className="text-xl font-bold">
                        {title}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-muted-foreground hover:bg-muted rounded-lg p-2 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div className="grid grid-cols-5 gap-3">
                    {platforms.map(platform => (
                        <button
                            key={platform.id}
                            onClick={() => void handlePlatformClick(platform)}
                            className="hover:bg-muted flex flex-col items-center gap-2 rounded-lg p-3 transition-colors"
                        >
                            <platform.icon className="h-6 w-6" />
                            <span className="text-xs">
                                {platform.id === "copy" && copied ? "Copied!" : platform.name}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
