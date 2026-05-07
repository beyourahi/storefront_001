import {Mail, Phone, MapPin, Clock, ExternalLink, ShieldCheck, RotateCcw, Truck, Headphones} from "lucide-react";
import {useSiteSettings, useSocialLinks} from "~/lib/site-content-context";
import {cn} from "~/lib/utils";
import type {SocialLink} from "types";

// ─── Platform icon SVG paths (Simple Icons, viewBox="0 0 24 24") ──────────────
// Inline paths avoid a new package dependency while remaining brand-accurate.
// Unknown platforms fall back to the ExternalLink lucide icon.
const PLATFORM_ICON_PATHS: Record<string, string> = {
    instagram:
        "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z",
    facebook:
        "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z",
    twitter:
        "M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z",
    x: "M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z",
    tiktok:
        "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z",
    youtube:
        "M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z",
    pinterest:
        "M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12.017 24c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001 12.017.001z",
    linkedin:
        "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
    snapchat:
        "M12.166 2c1.23 0 4.924.437 6.714 4.024.49.976.37 2.63.294 3.734l-.006.11c-.009.139-.018.272-.022.406.198.094.495.18.879.18.323 0 .657-.066.991-.198l.015-.005c.067-.024.137-.036.207-.036.144 0 .289.053.395.157a.509.509 0 0 1 .028.7c-.074.08-.237.21-.533.356-.36.177-.823.344-1.363.49.03.127.064.265.098.412.07.297.143.597.22.894l.015.06c.159.609.323 1.039.479 1.278a.468.468 0 0 1-.042.594c-.1.097-.249.148-.41.148-.201 0-.406-.075-.589-.148l-.061-.025c-.494-.192-1.082-.459-1.87-.459-.371 0-.73.046-1.068.138-.578.156-1.07.487-1.605.842-.73.482-1.556 1.028-2.742 1.028-.07 0-.14-.002-.21-.006-.069.004-.139.006-.208.006-1.183 0-2.009-.546-2.737-1.027-.536-.355-1.028-.686-1.606-.842a4.297 4.297 0 0 0-1.069-.138c-.783 0-1.371.265-1.863.457-.2.079-.377.15-.576.15-.174 0-.33-.056-.433-.156a.477.477 0 0 1-.037-.608c.154-.24.318-.669.476-1.278l.016-.059c.076-.298.149-.597.219-.894.035-.148.068-.286.099-.413a7.888 7.888 0 0 1-1.365-.49c-.295-.146-.458-.275-.531-.355a.509.509 0 0 1 .026-.7.548.548 0 0 1 .393-.157c.07 0 .14.012.208.036l.015.005c.334.132.668.198.99.198.4 0 .703-.1.889-.19-.007-.14-.018-.277-.029-.42l-.005-.095c-.076-1.105-.197-2.76.293-3.736C7.21 2.437 10.912 2 12.138 2h.028z",
    threads:
        "M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15.3 6.34 6.34 0 0 0 9.49 21.64a6.34 6.34 0 0 0 6.34-6.34V9.42a8.16 8.16 0 0 0 4.83 1.55V7.5a4.85 4.85 0 0 1-1.07-.81z"
};

// ─── Platform icon component ──────────────────────────────────────────────────

interface PlatformIconProps {
    platform: string;
}

const PlatformIcon = ({platform}: PlatformIconProps) => {
    const path = PLATFORM_ICON_PATHS[platform.toLowerCase()];
    if (!path) {
        return <ExternalLink className="h-4 w-4 shrink-0 opacity-60" aria-hidden="true" />;
    }
    return (
        <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 fill-current" aria-hidden="true">
            <path d={path} />
        </svg>
    );
};

// ─── Platform label map ───────────────────────────────────────────────────────

const PLATFORM_LABEL: Record<string, string> = {
    instagram: "Instagram",
    facebook: "Facebook",
    twitter: "Twitter",
    tiktok: "TikTok",
    youtube: "YouTube",
    pinterest: "Pinterest",
    linkedin: "LinkedIn",
    x: "X",
    snapchat: "Snapchat",
    threads: "Threads"
};

const getPlatformLabel = (platform: string): string =>
    PLATFORM_LABEL[platform.toLowerCase()] ?? platform;

// ─── Brand promise pillars ────────────────────────────────────────────────────
// Static trust signals that reinforce purchase confidence within the contact
// context — shoppers deciding whether to reach out often need reassurance first.

const BRAND_PROMISES = [
    {icon: ShieldCheck, title: "Secure Checkout", desc: "SSL encrypted, safe payments"},
    {icon: RotateCcw, title: "Easy Returns", desc: "Hassle-free 30-day policy"},
    {icon: Truck, title: "Fast Shipping", desc: "Orders dispatched daily"},
    {icon: Headphones, title: "Expert Support", desc: "Real people, fast replies"}
] as const;

// ─── Contact row ──────────────────────────────────────────────────────────────

interface ContactRowProps {
    icon: React.ReactNode;
    label: string;
    children: React.ReactNode;
}

const ContactRow = ({icon, label, children}: ContactRowProps) => (
    <div className="flex items-start gap-4">
        <div
            className="bg-primary/10 text-primary flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
            aria-hidden="true"
        >
            {icon}
        </div>
        <div className="min-w-0 flex-1 pt-2">
            <p className="text-muted-foreground mb-1 text-xs font-semibold uppercase tracking-widest">{label}</p>
            {children}
        </div>
    </div>
);

// ─── Component ────────────────────────────────────────────────────────────────

export const ContactSection = () => {
    const {contactEmail, contactPhone, businessHours, address} = useSiteSettings();
    const socialLinks = useSocialLinks();

    const addressParts = [address?.street, address?.city, address?.state, address?.zip].filter(Boolean);
    const fullAddress = addressParts.join(", ");

    const hasEmail = Boolean(contactEmail);
    const hasPhone = Boolean(contactPhone);
    const hasAddress = fullAddress.length > 0;
    const hasHours = Boolean(businessHours);
    const hasSocialLinks = socialLinks.length > 0;

    const hasContactInfo = hasEmail || hasPhone || hasAddress || hasHours;

    // Always render — right panel has trust pillars regardless of data
    if (!hasContactInfo && !hasSocialLinks) return null;

    return (
        <section className="bg-background py-8 lg:py-16">
            <div className="mx-auto max-w-[2000px] px-2 md:px-4">
                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="mb-12 text-center">
                    <h2 className="text-foreground mb-4 font-serif text-2xl font-bold md:text-3xl">Get in Touch</h2>
                    <p className="text-muted-foreground mx-auto max-w-2xl">
                        Have a question or need help? Reach out through any of the channels below — we&apos;re happy to
                        hear from you.
                    </p>
                </div>

                {/* ── Grid ────────────────────────────────────────────────── */}
                <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Left — contact details */}
                    {hasContactInfo && (
                        <div className="bg-muted rounded-2xl border p-8">
                            <h3 className="text-foreground mb-6 text-lg font-semibold">Contact Information</h3>
                            <div className="space-y-6">
                                {hasEmail && (
                                    <ContactRow icon={<Mail className="h-5 w-5" />} label="Email">
                                        <a
                                            href={`mailto:${contactEmail}`}
                                            className="text-foreground hover:text-primary break-all text-sm font-medium transition-colors"
                                            aria-label={`Send email to ${contactEmail}`}
                                        >
                                            {contactEmail}
                                        </a>
                                    </ContactRow>
                                )}

                                {hasPhone && (
                                    <ContactRow icon={<Phone className="h-5 w-5" />} label="Phone">
                                        <a
                                            href={`tel:${contactPhone}`}
                                            className="text-foreground hover:text-primary text-sm font-medium transition-colors"
                                            aria-label={`Call us at ${contactPhone}`}
                                        >
                                            {contactPhone}
                                        </a>
                                    </ContactRow>
                                )}

                                {hasAddress && (
                                    <ContactRow icon={<MapPin className="h-5 w-5" />} label="Address">
                                        <address className="text-foreground not-italic text-sm font-medium">
                                            {fullAddress}
                                        </address>
                                    </ContactRow>
                                )}

                                {hasHours && (
                                    <ContactRow icon={<Clock className="h-5 w-5" />} label="Business Hours">
                                        <p className="text-foreground text-sm font-medium">{businessHours}</p>
                                    </ContactRow>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Right — social links + brand promise */}
                    <div className={cn("bg-muted rounded-2xl border p-8", !hasContactInfo && "lg:col-span-2")}>
                        {hasSocialLinks && (
                            <>
                                <h3 className="text-foreground mb-6 text-lg font-semibold">Follow Us</h3>
                                <div className="mb-6 flex flex-wrap gap-3">
                                    {socialLinks.map((link: SocialLink) => (
                                        <a
                                            key={link.id}
                                            href={link.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            aria-label={`Visit our ${getPlatformLabel(link.platform)} page`}
                                            className="bg-background border-border text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary inline-flex min-h-[44px] items-center gap-2 rounded-full border px-5 py-2 text-sm font-medium transition-colors"
                                        >
                                            <PlatformIcon platform={link.platform} />
                                            {getPlatformLabel(link.platform)}
                                        </a>
                                    ))}
                                </div>
                            </>
                        )}

                        {/* Brand promise — replaces the redundant messaging CTA */}
                        <div className={cn(hasSocialLinks && "border-t border-border pt-6")}>
                            <p className="text-muted-foreground mb-4 text-xs font-semibold uppercase tracking-widest">
                                Why Shop With Us
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                {BRAND_PROMISES.map(({icon: Icon, title, desc}) => (
                                    <div key={title} className="bg-background rounded-xl border p-4">
                                        <div className="text-primary mb-2">
                                            <Icon className="h-5 w-5" aria-hidden="true" />
                                        </div>
                                        <p className="text-foreground text-sm font-semibold">{title}</p>
                                        <p className="text-muted-foreground mt-0.5 text-xs">{desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
