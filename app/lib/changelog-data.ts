/**
 * @fileoverview Changelog data — hand-curated product update entries
 *
 * @description
 * Single source of truth for the /changelog page. Every meaningful
 * customer-facing change gets one entry here, written in plain English
 * for shoppers — no technical jargon, no commit SHAs, no file paths.
 *
 * HOW TO ADD A NEW ENTRY
 * ─────────────────────
 * 1. Add a new object at the TOP of CHANGELOG_ENTRIES (newest first).
 * 2. Write the entry in the SAME commit that ships the change.
 * 3. Use the shopper's perspective — what changed for them?
 * 4. Pick the right category:
 *    • "New Feature"  — something that didn't exist before
 *    • "Improvement"  — existing experience made better
 *    • "Fix"          — something that was broken, now working
 *    • "Maintenance"  — infrastructure / under-the-hood work
 *
 * WHAT TO SKIP
 * ────────────
 * chore, ci, build, docs, lint, dependency bumps, internal refactors with
 * no visible user effect, commits under ~20 lines changed.
 */

export type ChangelogCategory = "New Feature" | "Improvement" | "Fix" | "Maintenance";

export type ChangelogEntry = {
    date: string; // ISO 8601 YYYY-MM-DD
    headline: string; // ≤80 chars, user-friendly
    summary: string; // 2–3 sentences, plain English
    category: ChangelogCategory;
};

// Newest entries at the top. Add new entries here in the same commit that ships the change.
export const CHANGELOG_ENTRIES: ChangelogEntry[] = [
    {
        date: "2026-04-13",
        headline: "Out-of-stock products now have a clearer visual treatment",
        summary:
            "Out-of-stock product cards now show a diagonal line and a subtle white tint over the image, making their unavailable status unmistakable at a glance. The status badge is now styled in red for stronger contrast. On the product page, hover zoom effects are suppressed for out-of-stock items so the experience is calmer and less misleading.",
        category: "Improvement"
    },
    {
        date: "2026-04-13",
        headline: "Out-of-stock products now visible across all product surfaces",
        summary:
            "Products that are temporarily out of stock now appear everywhere — on collection pages, search results, the gallery, sale, and your wishlist — instead of being hidden. Each out-of-stock product shows a clear badge, a lightly muted image, and a disabled cart button so you can still browse, save to your wishlist, and check back when stock returns.",
        category: "Improvement"
    },
    {
        date: "2026-04-12",
        headline: "Chat buttons now sit in the bottom-right corner",
        summary:
            "The WhatsApp and Messenger contact buttons have moved to the conventional bottom-right position where you'd expect them. They now sit just above the copyright line with comfortable spacing, and the App install button no longer duplicates between the navbar and the floating position on mobile.",
        category: "Fix"
    },
    {
        date: "2026-04-10",
        headline: "Changelog link added to footer on all devices",
        summary:
            "The Changelog link now appears in the footer navigation on every device — mobile, tablet, and desktop. Previously it was only shown on desktop. The floating chat and install buttons have also been repositioned so they never cover the copyright row at the bottom of the page.",
        category: "Improvement"
    },
    {
        date: "2026-04-10",
        headline: "App install button is now inside the mobile menu",
        summary:
            "Moved the \"Add to Home Screen\" button into the mobile navigation menu so it no longer clutters the navigation bar. The button still appears prominently when you open the menu, making the install flow easy to discover without getting in the way of everyday browsing.",
        category: "Improvement"
    },
    {
        date: "2026-04-10",
        headline: "App install button now appears everywhere on mobile",
        summary:
            "Mobile visitors can now install the store as a home screen app from any page, not just specific spots. The button appears in the navigation bar on phones, so you never have to hunt for it.",
        category: "New Feature"
    },
    {
        date: "2026-04-10",
        headline: "Install prompt no longer covers the cart drawer",
        summary:
            "Fixed a layering issue where the app install button would sit on top of the shopping cart drawer, blocking access to your items. The button now correctly sits behind the drawer overlay when it opens.",
        category: "Fix"
    },
    {
        date: "2026-04-10",
        headline: "Install button hides automatically once the app is installed",
        summary:
            "The \"Add to Home Screen\" button now detects when the store is already installed and hides itself automatically. If you tap the button after installing, you see clear instructions instead of a confusing duplicate prompt.",
        category: "Improvement"
    },
    {
        date: "2026-04-10",
        headline: "Fixed app install prompt not appearing on iPads",
        summary:
            "iPadOS was not being recognized correctly, which caused the app install prompt to never show up on iPads. This is now fixed — iPad users see the same install experience as iPhone users.",
        category: "Fix"
    },
    {
        date: "2026-04-10",
        headline: "App install prompt now shows reliably on fast connections",
        summary:
            "Fixed a timing issue where the browser's install prompt could fire before the page was ready to capture it, causing the option to silently disappear. The prompt now appears consistently regardless of page load speed.",
        category: "Fix"
    },
    {
        date: "2026-04-10",
        headline: "Install button in the menu meets accessibility contrast requirements",
        summary:
            "The \"Install App\" button inside the mobile menu had insufficient color contrast, making it hard to read for users with low vision. It now uses a high-contrast style that passes WCAG 2.1 AA standards.",
        category: "Fix"
    },
    {
        date: "2026-04-10",
        headline: "Offline scripts now load from our own servers",
        summary:
            "The scripts that power offline browsing are now served directly from the store instead of relying on an external CDN. This makes offline mode faster to activate and removes a potential point of failure.",
        category: "Maintenance"
    },
    {
        date: "2026-04-09",
        headline: "Added a floating chat widget — reach support via Messenger or WhatsApp",
        summary:
            "A floating chat button now lives on every page, giving you instant access to support through Facebook Messenger or WhatsApp. Tap the icon and choose your preferred channel — no need to navigate away from what you're browsing.",
        category: "New Feature"
    },
    {
        date: "2026-04-09",
        headline: "iOS and Android users can now open the store in the native app",
        summary:
            "A persistent banner now appears for mobile visitors, inviting them to open the store in the dedicated native app experience. The banner stays visible so you can tap when it is convenient rather than missing a one-time prompt.",
        category: "New Feature"
    },
    {
        date: "2026-04-09",
        headline: "Messenger chat button opens faster without third-party scripts",
        summary:
            "The chat button used to load Facebook's entire Messenger SDK in the background, slowing down the page. It now redirects you directly to Messenger with a simple link, so it opens instantly without any extra tracking scripts.",
        category: "Improvement"
    },
    {
        date: "2026-04-09",
        headline: "Quick Add button on featured products",
        summary:
            "Featured products on the homepage now have a Quick Add button so you can drop items straight into your cart without visiting the product page. Select your size or variant and add — all without leaving the homepage.",
        category: "Improvement"
    },
    {
        date: "2026-04-09",
        headline: "Product titles are larger and easier to read",
        summary:
            "Product names on the product detail page are now displayed one size larger across all screen sizes. The change makes titles easier to scan at a glance and gives the page a stronger visual hierarchy.",
        category: "Improvement"
    },
    {
        date: "2026-04-09",
        headline: "Long product names in breadcrumbs are now neatly trimmed",
        summary:
            "When a product name was very long, the breadcrumb trail at the top of the product page would overflow or wrap awkwardly. It now truncates cleanly so the navigation always stays on one tidy line.",
        category: "Fix"
    },
    {
        date: "2026-04-09",
        headline: "Keyboard focus indicators no longer show when clicking with a mouse",
        summary:
            "Focus outlines used to appear on buttons and links when clicking with a mouse, which looked out of place. They now only appear when navigating with a keyboard, keeping the interface clean for mouse and touch users while remaining accessible for keyboard users.",
        category: "Improvement"
    },
    {
        date: "2026-04-09",
        headline: "Full-screen image viewer is now available on all devices",
        summary:
            "The product image lightbox was previously limited to desktop. It now works on phones and tablets too, with scroll locking so the page stays put while you examine images, and a smoother open and close animation.",
        category: "Improvement"
    },
    {
        date: "2026-04-08",
        headline: "Whole-number prices no longer show unnecessary decimal places",
        summary:
            "Prices like $50.00 or $120.00 now display as $50 and $120 across the entire store, reducing visual clutter. Prices with cents (like $19.99) still display the full amount as expected.",
        category: "Improvement"
    },
    {
        date: "2026-04-07",
        headline: "Product links now show the correct preview when shared on social media",
        summary:
            "Fixed missing metadata that caused product pages to appear without a title, image, or description when shared on social platforms like Twitter, Facebook, and iMessage. Links now display a proper rich preview.",
        category: "Fix"
    },
    {
        date: "2026-04-07",
        headline: "Typography renders more consistently across all browsers",
        summary:
            "Fixed font fallback settings that caused text to look different in Firefox and some versions of Safari. Headings, body text, and the search bar now use consistent, intentional font stacks across every browser.",
        category: "Fix"
    },
    {
        date: "2026-04-07",
        headline: "Corrected heading structure on product pages for better search visibility",
        summary:
            "Each product page now has a single, well-structured main heading instead of multiple conflicting ones. This helps search engines understand the page content correctly and can improve how products appear in search results.",
        category: "Fix"
    },
    {
        date: "2026-04-06",
        headline: "Free shipping progress bar only appears when a threshold is set",
        summary:
            "The progress bar showing how close you are to free shipping was showing up even when no minimum order requirement was configured. It now correctly stays hidden until a free shipping threshold has been set up.",
        category: "Fix"
    },
    {
        date: "2026-04-05",
        headline: "Product and collection data refreshes up to 4× more often",
        summary:
            "Updated product listings, prices, and inventory now appear on the site within 5 hours instead of the previous 23-hour window. If a product goes out of stock or a sale starts, the store reflects it much sooner.",
        category: "Improvement"
    },
    {
        date: "2026-04-05",
        headline: "Search results and sale page can now be sorted",
        summary:
            "You can now sort items on the search results page and sale page by price (low to high or high to low), newest first, or best-selling. The sort bar appears alongside the existing filters so you stay in control of what you see.",
        category: "New Feature"
    }
];
