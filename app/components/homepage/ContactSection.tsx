import {Mail, Phone, MapPin, Clock, ExternalLink, MessageCircle} from "lucide-react";
import {useSiteSettings} from "~/lib/site-content-context";
import {cn} from "~/lib/utils";
import type {SocialLink} from "types";

// ─── Platform icon map ────────────────────────────────────────────────────────
// Maps lowercase platform names to a unicode glyph or label for social links.
// We intentionally avoid importing SVG brand icons (no new packages allowed),
// so each platform gets a styled pill with its name and the ExternalLink icon.
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
    const {contactEmail, contactPhone, businessHours, address, socialLinks, whatsappNumber, messengerPageId} =
        useSiteSettings();

    // Build address string — filter any falsy parts
    const addressParts = [address?.street, address?.city, address?.state, address?.zip].filter(Boolean);
    const fullAddress = addressParts.join(", ");

    const hasEmail = Boolean(contactEmail);
    const hasPhone = Boolean(contactPhone);
    const hasAddress = fullAddress.length > 0;
    const hasHours = Boolean(businessHours);
    const hasSocialLinks = Array.isArray(socialLinks) && socialLinks.length > 0;
    const hasWhatsapp = Boolean(whatsappNumber);
    const hasMessenger = Boolean(messengerPageId);

    // Only render the section when there is something meaningful to show
    const hasContactInfo = hasEmail || hasPhone || hasAddress || hasHours;
    const hasSocialInfo = hasSocialLinks || hasWhatsapp || hasMessenger;
    if (!hasContactInfo && !hasSocialInfo) return null;

    const whatsappHref = hasWhatsapp
        ? `https://wa.me/${whatsappNumber.replace(/\D/g, "")}`
        : null;
    const messengerHref = hasMessenger ? `https://m.me/${messengerPageId}` : null;

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

                    {/* Right — social links + messaging */}
                    {hasSocialInfo && (
                        <div className={cn("bg-muted rounded-2xl border p-8", !hasContactInfo && "lg:col-span-2")}>
                            <h3 className="text-foreground mb-6 text-lg font-semibold">Follow Us</h3>

                            {hasSocialLinks && (
                                <div className="mb-6 flex flex-wrap gap-3">
                                    {[...socialLinks]
                                        .sort((a: SocialLink, b: SocialLink) => a.displayOrder - b.displayOrder)
                                        .map((link: SocialLink) => (
                                            <a
                                                key={link.id}
                                                href={link.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                aria-label={`Visit our ${getPlatformLabel(link.platform)} page`}
                                                className="bg-background border-border text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary inline-flex min-h-[44px] items-center gap-2 rounded-full border px-5 py-2 text-sm font-medium transition-colors"
                                            >
                                                <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden="true" />
                                                {getPlatformLabel(link.platform)}
                                            </a>
                                        ))}
                                </div>
                            )}

                            {(hasWhatsapp || hasMessenger) && (
                                <div className="space-y-3">
                                    <p className="text-muted-foreground mb-4 text-xs font-semibold uppercase tracking-widest">
                                        Message Us Directly
                                    </p>

                                    {hasWhatsapp && whatsappHref && (
                                        <a
                                            href={whatsappHref}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            aria-label="Message us on WhatsApp"
                                            className="bg-background border-border text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary flex min-h-[44px] w-full items-center gap-3 rounded-xl border px-5 py-3 text-sm font-medium transition-colors"
                                        >
                                            <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                                            Message us on WhatsApp
                                        </a>
                                    )}

                                    {hasMessenger && messengerHref && (
                                        <a
                                            href={messengerHref}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            aria-label="Message us on Messenger"
                                            className="bg-background border-border text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary flex min-h-[44px] w-full items-center gap-3 rounded-xl border px-5 py-3 text-sm font-medium transition-colors"
                                        >
                                            <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                                            Message us on Messenger
                                        </a>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};
