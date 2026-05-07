import {Mail, Phone, MapPin, Clock, ShieldCheck, RotateCcw, Truck, Headphones} from "lucide-react";
import {useSiteSettings, useSocialLinks} from "~/lib/site-content-context";
import {SocialIcon} from "~/components/SocialIcon";
import {getSocialLabel} from "~/lib/social-platform-registry";
import {cn} from "~/lib/utils";
import type {SocialLink} from "types";

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
                                            aria-label={`Visit our ${getSocialLabel(link.platform)} page`}
                                            className="bg-background border-border text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary inline-flex min-h-[44px] items-center gap-2 rounded-full border px-5 py-2 text-sm font-medium transition-colors"
                                        >
                                            <SocialIcon className="h-4 w-4 shrink-0" platform={link.platform} />
                                            {getSocialLabel(link.platform)}
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
