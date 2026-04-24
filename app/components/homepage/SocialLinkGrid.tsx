import {Facebook, Instagram, Linkedin, Twitter, Youtube, type LucideIcon} from "lucide-react";
import {Image} from "@shopify/hydrogen";
import {cn} from "~/lib/utils";

export type SocialLinkItem = {
    platform: string;
    url: string;
    icon?: LucideIcon | string;
};

type SocialLinkGridProps = {
    socialLinks: SocialLinkItem[];
};

const iconMap: Record<string, LucideIcon> = {
    instagram: Instagram,
    facebook: Facebook,
    twitter: Twitter,
    linkedin: Linkedin,
    youtube: Youtube
};

const getIcon = (platform: string): LucideIcon => {
    return iconMap[platform.toLowerCase()] || iconMap.twitter;
};

const getBrandColor = (platform: string): string => {
    const colors: Record<string, string> = {
        facebook: "rgb(24, 119, 242)",
        instagram: "rgb(228, 64, 95)",
        twitter: "rgb(29, 161, 242)",
        x: "rgb(0, 0, 0)",
        linkedin: "rgb(10, 102, 194)",
        youtube: "rgb(255, 0, 0)",
        tiktok: "rgb(0, 0, 0)",
        whatsapp: "rgb(37, 211, 102)",
        pinterest: "rgb(189, 8, 28)"
    };
    return colors[platform.toLowerCase()] || "rgb(29, 161, 242)";
};

export const SocialLinkGrid = ({socialLinks}: SocialLinkGridProps) => {
    return (
        <div
            className={cn(
                "mx-auto gap-4",
                socialLinks.length === 1
                    ? "block md:flex md:justify-center"
                    : "grid grid-cols-2 md:flex md:flex-wrap md:justify-center"
            )}
        >
            {socialLinks.map(social => {
                const Icon = typeof social.icon === "function" ? social.icon : getIcon(social.platform);
                const isStringIcon = typeof social.icon === "string";

                return (
                    <a
                        key={social.platform}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group bg-accent/25 border-accent/30 hover:border-primary/40 hover:bg-foreground/8 hover:shadow-primary/10 focus-visible:ring-primary/20 focus-visible:bg-primary/3 sleek flex w-full flex-col items-center justify-center rounded-lg border px-4 py-4 hover:-translate-y-1 hover:shadow-lg focus-visible:ring-2 focus-visible:outline-none md:w-28 md:px-32"
                    >
                        <div
                            className="sleek mb-2 flex h-12 w-12 items-center justify-center rounded-lg group-hover:scale-110 group-hover:shadow-md"
                            style={{backgroundColor: getBrandColor(social.platform)}}
                        >
                            {isStringIcon ? (
                                <Image
                                    src={social.icon as string}
                                    alt={social.platform || "Social media"}
                                    className="sleek h-6 w-6"
                                    style={{filter: "brightness(0) invert(1)"}}
                                />
                            ) : (
                                <Icon className="h-6 w-6 text-white" />
                            )}
                        </div>
                        <span className="text-foreground group-hover:text-primary sleek text-sm font-medium capitalize">
                            {social.platform}
                        </span>
                    </a>
                );
            })}
        </div>
    );
};
