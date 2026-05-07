import {ExternalLink} from "lucide-react";
import {resolvePlatform} from "~/lib/social-platform-registry";

interface SocialIconProps {
    platform: string;
    className?: string;
}

export function SocialIcon({platform, className = "h-3.5 w-3.5 shrink-0"}: SocialIconProps) {
    const entry = resolvePlatform(platform);
    if (!entry) {
        return <ExternalLink className={className} aria-hidden="true" />;
    }
    return (
        <svg viewBox="0 0 24 24" className={`${className} fill-current`} aria-hidden="true">
            <path d={entry.svgPath} />
        </svg>
    );
}
