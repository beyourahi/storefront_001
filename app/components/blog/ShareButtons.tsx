"use client";

import {useState} from "react";
import {cn} from "~/lib/utils";
import {createArticleShareData, type ArticleShareInput} from "~/lib/blog-utils";
import {getSocialSharePlatforms, copyToClipboard, openShareWindow, type ShareData} from "~/lib/social-share";
import {Button} from "~/components/ui/button";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger} from "~/components/ui/dialog";
import {Check, Share2} from "lucide-react";
import {toast} from "sonner";

interface ShareButtonsProps {
    article: ArticleShareInput;
    variant?: "inline" | "dialog";
    className?: string;
    shopName?: string;
}

export const ShareButtons = ({article, variant = "inline", className, shopName}: ShareButtonsProps) => {
    const [copied, setCopied] = useState(false);

    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const shareData = createArticleShareData(article, baseUrl, shopName);
    const platforms = getSocialSharePlatforms();

    const handleShare = async (platform: (typeof platforms)[0], data: ShareData) => {
        if (platform.id === "copy") {
            await copyToClipboard(
                data.url,
                () => {
                    setCopied(true);
                    toast.success("Link copied to clipboard!");
                    setTimeout(() => setCopied(false), 2000);
                },
                () => {
                    toast.error("Failed to copy link");
                }
            );
            return;
        }

        if (platform.customHandler) {
            await platform.customHandler(data);
            return;
        }

        const url = platform.url(data);
        openShareWindow(url, `Share on ${platform.name}`);
    };

    if (variant === "inline") {
        return (
            <div className={cn("space-y-2.5 sm:space-y-3 md:space-y-4", className)}>
                <h3 className="text-sm sm:text-sm md:text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Share this article
                </h3>
                <div className="flex flex-wrap gap-1.5 sm:gap-2 md:gap-2.5">
                    {platforms.map(platform => (
                        <Button
                            key={platform.id}
                            variant="outline"
                            size="sm"
                            className="gap-1.5 sm:gap-2 size-10 sm:size-auto p-0 sm:px-3"
                            onClick={() => void handleShare(platform, shareData)}
                        >
                            {platform.id === "copy" && copied ? (
                                <Check className="size-4" />
                            ) : (
                                <platform.icon className="size-4" />
                            )}
                            <span className="hidden sm:inline">{platform.name}</span>
                        </Button>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className={cn("gap-1.5 sm:gap-2", className)}
                >
                    <Share2 className="size-3.5 sm:size-4" />
                    <span className="hidden xs:inline">Share</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="w-[calc(100vw-1.5rem)] sm:w-[calc(100vw-2rem)] max-w-md mx-auto p-4 sm:p-6">
                <DialogHeader>
                    <DialogTitle className="font-serif text-base sm:text-lg md:text-xl">Share this article</DialogTitle>
                </DialogHeader>

                <div className="bg-muted/30 rounded-lg sm:rounded-xl p-3 sm:p-4 space-y-1 sm:space-y-1.5 md:space-y-2">
                    <h4 className="font-medium text-primary line-clamp-2 text-sm sm:text-sm md:text-base">
                        {article.title}
                    </h4>
                    {article.excerpt && (
                        <p className="text-sm sm:text-sm md:text-sm text-muted-foreground line-clamp-2">
                            {article.excerpt}
                        </p>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-1.5 sm:gap-2 md:gap-2.5">
                    {platforms.map(platform => (
                        <Button
                            key={platform.id}
                            variant="outline"
                            className={cn(
                                "group rounded-lg sm:rounded-xl gap-1.5 sm:gap-2 min-h-11 sm:min-h-12",
                                "hover:bg-primary hover:text-primary-foreground",
                                "text-sm sm:text-sm md:text-base"
                            )}
                            onClick={() => void handleShare(platform, shareData)}
                        >
                            {platform.id === "copy" && copied ? (
                                <Check className="sleek size-3.5 sm:size-4 group-hover:scale-110" />
                            ) : (
                                <platform.icon className="sleek size-3.5 sm:size-4 group-hover:scale-110" />
                            )}
                            {platform.name}
                        </Button>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
};
