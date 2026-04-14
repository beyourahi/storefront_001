import FacebookIcon from "~/assets/icons/facebook.svg";
import InstagramIcon from "~/assets/icons/instagram.svg";
import LinkedInIcon from "~/assets/icons/linkedin.svg";
import PinterestIcon from "~/assets/icons/pinterest.svg";
import TikTokIcon from "~/assets/icons/tiktok.svg";
import WhatsAppIcon from "~/assets/icons/whatsapp.svg";
import XIcon from "~/assets/icons/x.svg";
import YouTubeIcon from "~/assets/icons/youtube.svg";
import {SocialLinkGrid, type SocialLinkItem} from "~/components/homepage/SocialLinkGrid";
import {useSiteSettings} from "~/lib/site-content-context";

type SocialMediaSectionProps = {
    socialLinks?: Array<{platform: string; url: string; icon?: string}>;
};

const platformIconMap: Record<string, string> = {
    facebook: FacebookIcon,
    instagram: InstagramIcon,
    tiktok: TikTokIcon,
    x: XIcon,
    whatsapp: WhatsAppIcon,
    youtube: YouTubeIcon,
    linkedin: LinkedInIcon,
    pinterest: PinterestIcon
};

const normalizeSocialLinks = (links: Array<{platform: string; url: string; icon?: string}>): SocialLinkItem[] => {
    return links
        .filter(link => Boolean(link.platform?.trim()) && Boolean(link.url?.trim()))
        .map(link => ({
            platform: link.platform,
            url: link.url,
            icon: link.icon || platformIconMap[link.platform.toLowerCase()]
        }));
};

export const SocialMediaSection = ({socialLinks}: SocialMediaSectionProps = {}) => {
    const {socialLinks: settingsSocialLinks} = useSiteSettings();
    const resolvedSocialLinks = normalizeSocialLinks(socialLinks || settingsSocialLinks);

    if (resolvedSocialLinks.length === 0) return null;

    return (
        <section className="bg-background py-20">
            <div className="mx-auto max-w-6xl px-6">
                <div className="mb-16 text-center">
                    <h2 className="text-foreground mb-4 text-2xl font-bold">Follow Our Journey</h2>
                    <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
                        Stay connected and get the latest updates, behind-the-scenes content, and community highlights.
                    </p>
                </div>

                <SocialLinkGrid socialLinks={resolvedSocialLinks} />
            </div>
        </section>
    );
};
