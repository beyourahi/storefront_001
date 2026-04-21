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
    time?: string; // Optional time of day, e.g. "8pm", "11am", "12pm"
    headline: string; // ≤80 chars, user-friendly
    summary: string; // 2–3 sentences, plain English
    category: ChangelogCategory;
};

// Newest entries at the top. Add new entries here in the same commit that ships the change.
export const CHANGELOG_ENTRIES: ChangelogEntry[] = [
    {
        date: "2026-04-21",
        headline: "Save any product to your wishlist directly from its page",
        summary:
            "A heart button now appears next to the product title on every product page. Tap it to save the item — the heart fills with a pop animation, and you get a toast confirmation with an undo option. Your saved items persist across sessions and stay in sync across tabs.",
        category: "New Feature"
    },
    {
        date: "2026-04-21",
        headline: "Wishlist button now reads clearly over any product image",
        summary:
            "The save button on product cards now has a frosted glass background so it stands out against any image colour or tone. Tapping it plays a satisfying pop animation as the heart fills. The button position remains at the bottom-left corner of the card image.",
        category: "Improvement"
    },
    {
        date: "2026-04-20",
        headline: "Only the changed item's price animates during cart updates",
        summary:
            "When you adjust a quantity or remove an item, the loading indicator now appears only on that line's price and the checkout total — other items in your cart stay fully visible and static throughout.",
        category: "Improvement"
    },
    {
        date: "2026-04-20",
        headline: "Cart prices animate gracefully while your updates process",
        summary:
            "When you change a quantity or remove an item, the price on that line and the checkout button total now display a subtle animated indicator instead of showing a stale number. Prices restore instantly the moment your change is confirmed.",
        category: "Improvement"
    },
    {
        date: "2026-04-20",
        headline: "Cart items without photos now show a placeholder image",
        summary:
            "Products added to your cart that have no photos now display the same tidy placeholder icon used across the rest of the store, keeping the cart layout consistent and preventing empty gaps.",
        category: "Improvement"
    },
    {
        date: "2026-04-20",
        headline: "Page no longer scrolls behind open product or share dialogs",
        summary:
            "Opening a product options dialog or a share sheet now freezes the background page in place, just like the cart drawer already did. The page resumes scrolling the moment the dialog closes, with your scroll position exactly where you left it.",
        category: "Fix"
    },
    {
        date: "2026-04-20",
        headline: "No-image products look consistent everywhere in the cart",
        summary:
            "Products without photos now show the same tidy placeholder across all surfaces — including the small suggestion cards at the bottom of your cart. Previously those cards showed a plain box emoji; they now match the refined placeholder used everywhere else in the store.",
        category: "Fix"
    },
    {
        date: "2026-04-20",
        headline: "Cart badge and item removal update before the server responds",
        summary:
            "The cart count in the navigation updates the instant you add or remove a product — no waiting. Removing an item also hides it right away, so the cart always feels fast and never briefly shows something you've already taken out.",
        category: "Improvement"
    },
    {
        date: "2026-04-20",
        headline: "Cart controls freeze instantly while your cart updates",
        summary:
            "When you change a quantity, remove an item, or add something from suggestions, all buttons in the cart are briefly locked until the change goes through. This stops you from accidentally triggering a second action while the first one is still being applied.",
        category: "Improvement"
    },
    {
        date: "2026-04-19",
        headline: "Back navigation no longer crashes the storefront",
        summary:
            "Pressing the browser back button after visiting an external page — such as returning from the Shopify checkout — could cause the store to go blank with an error. The page now loads cleanly every time you navigate back.",
        category: "Fix"
    },
    {
        date: "2026-04-19",
        headline: "Trackpad horizontal scroll works on all carousels",
        summary:
            "Swiping left and right with a trackpad or two-finger gesture now scrolls through every carousel in the store — including product reviews, the blog listing, and the catalog browsing carousel. Previously only the cart suggestion carousel supported this gesture.",
        category: "Improvement"
    },
    {
        date: "2026-04-19",
        headline: "Suggested products hide once you add them to cart",
        summary:
            "The \"Frequently bought with\" panel no longer shows products you have already added to your cart. Tapping Quick Add removes the item from the suggestion list instantly — no page reload needed.",
        category: "Improvement"
    },
    {
        date: "2026-04-19",
        headline: "Cart suggestions heading reflects what's in your cart",
        summary:
            "The heading above the suggested products in your cart now changes based on whether your cart is empty or has items. It draws from a curated set of copy lines — things like \"Pairs well with your picks\" or \"You might like these\" — so it always feels relevant to where you are in your shopping journey.",
        category: "Improvement"
    },
    {
        date: "2026-04-19",
        headline: "Buttons show a clean spinner while actions are processing",
        summary:
            "Add to cart, buy now, newsletter sign-up, cart note, wishlist, address, and return form buttons now show a single spinner while they're working — no more bouncing icons or loading text. The button keeps its original size throughout, so the layout stays stable as you interact.",
        category: "Improvement"
    },
    {
        date: "2026-04-19",
        headline: "Suggested products always visible in the cart",
        summary:
            "The Frequently bought with section in the cart is now always visible on every device, including phones. Previously, tapping to expand the section was required on mobile — it now opens immediately alongside your cart items, making it easier to discover and add complementary products.",
        category: "Improvement"
    },
    {
        date: "2026-04-19",
        headline: "Cart quantity buttons no longer get stuck loading",
        summary:
            "Rapidly tapping the + or – buttons, removing an item, or clicking checkout could occasionally leave the cart completely frozen — stuck buttons, spinners that never clear, or a checkout you couldn't proceed through. This is now fixed so the cart always responds cleanly, no matter how quickly you tap.",
        category: "Fix"
    },
    {
        date: "2026-04-19",
        headline: "Tapping any text field on mobile no longer zooms the page",
        summary:
            "iOS Safari was involuntarily zooming in whenever you tapped a search box, email field, or any other text input — a frustrating experience on phones. This is now fixed across every input on the site, including the search overlay, newsletter sign-up, cart notes, and account forms.",
        category: "Fix",
    },
    {
        date: "2026-04-19",
        headline: "Quick Add from cart suggestions no longer crashes the cart",
        summary:
            "Tapping 'Add' on a product in the 'Frequently bought with' section while the cart is already open could cause the cart to break and show a blank error screen. The cart now correctly displays the item and its price the moment it's added, without any glitch.",
        category: "Fix"
    },
    {
        date: "2026-04-19",
        headline: "Cart shows the correct product instantly when you add one",
        summary:
            "When you add a product to your cart, the cart panel now immediately shows the correct image, name, and price — no blank placeholder or delay. This applies whether you're adding from a collection page, the product page, or the suggested products panel.",
        category: "Fix"
    },
    {
        date: "2026-04-19",
        headline: "Order note editor opens reliably on all browsers",
        summary:
            "The \"Add a note\" field inside the cart could silently fail to appear on certain browsers, leaving the area empty. It now shows up consistently every time, regardless of which browser you are using.",
        category: "Fix"
    },
    {
        date: "2026-04-18",
        headline: "\"Buy Now\" button resets after returning from checkout",
        summary:
            "Tapping \"Buy Now\" and then pressing the browser back button from the checkout page left the button stuck showing \"Processing…\" with no way to click it again. It now resets to its normal state whenever you navigate back, ready for another tap.",
        category: "Fix"
    },
    {
        date: "2026-04-18",
        headline: "Quick Add dialog now appears above the cart panel",
        summary:
            "Tapping \"Add to Cart\" on a product suggestion inside the cart no longer leaves the option picker hidden behind the cart itself. The selector now reliably opens on top of everything else, so you can choose a size or color without closing the cart first.",
        category: "Fix"
    },
    {
        date: "2026-04-18",
        headline: "Product info and interactive cards are fully keyboard accessible",
        summary:
            "On touchscreens, product image details now stay visible instead of requiring a hover gesture that isn't possible on touch devices. Buttons and links across the store — cards, articles, the menu, and the wishlist — now show a clear highlight outline when navigated with a keyboard, making it easy to see where you are on the page.",
        category: "Improvement"
    },
    {
        date: "2026-04-17",
        headline: "Products with no variant options no longer show a selector",
        summary:
            "Simple products — those with no size, color, or other options — previously showed a pointless \"Default Title\" button on the product page and in the quick-add panel. That label is now suppressed everywhere it appeared. The product still adds to cart correctly; there's just nothing unnecessary to click.",
        category: "Fix"
    },
    {
        date: "2026-04-16",
        headline: "Low stock warning appears when a variant is running low",
        summary:
            "When a product variant has 10 or fewer units remaining, an \"Only X left\" notice now appears on the product page before you set your quantity. The indicator updates instantly when you switch between variants and disappears when stock is sufficient or untracked.",
        category: "New Feature"
    },
    {
        date: "2026-04-16",
        headline: "Review section adapts its layout to the number of reviews",
        summary:
            "Product pages with a single review now display a focused, editorial-style card rather than a lonely item in a wide grid. Two reviews get a balanced side-by-side layout. Three reviews use an asymmetric featured arrangement on larger screens. Four or more reviews are shown in a scrollable carousel with navigation arrows and dot indicators.",
        category: "Improvement"
    },
    {
        date: "2026-04-16",
        headline: "Products without images now show a designed placeholder",
        summary:
            "When a product has no image uploaded, the card and product page now display a purposeful, on-brand placeholder instead of an empty space. It uses the same visual style as the rest of the store — no broken layouts, no generic icons.",
        category: "Improvement"
    },
    {
        date: "2026-04-16",
        headline: "Product pages now play videos directly in the gallery",
        summary:
            "Product galleries now support all Shopify media types. Videos hosted on Shopify play inline with native controls — hover to preview, or click expand to watch fullscreen. YouTube and Vimeo embeds open in a fullscreen lightbox. 3D model previews show the product thumbnail. Mixed galleries (photos + videos) are fully supported.",
        category: "New Feature"
    },
    {
        date: "2026-04-15",
        headline: "App updates now apply automatically without prompts",
        summary:
            "The store app previously required you to manually accept an update notification before new changes took effect. Updates now activate silently in the background the moment they are available — no prompt, no extra tap required.",
        category: "Improvement"
    },
    {
        date: "2026-04-15",
        headline: "Shop location map added to homepage",
        summary:
            "A new section on the homepage shows the store's location on Google Maps, with a direct link to get directions. Multiple locations are supported with a tab switcher — each tab labeled by store letter.",
        category: "New Feature"
    },
    {
        date: "2026-04-14",
        time: "3pm",
        headline: "Changelog dates now show the time of day each update shipped",
        summary:
            "The date displayed on each changelog group now includes a short time indicator alongside it — like \"3pm\" or \"11am\" — so you can see not just the date, but roughly when during the day an update was released.",
        category: "Improvement"
    },
    {
        date: "2026-04-14",
        time: "3pm",
        headline: "Changelog update list now has balanced side spacing",
        summary:
            "The list of updates on the Changelog page now has equal breathing room on both sides at wider screen sizes. Previously, the right edge of the update cards sat closer to the screen edge than the left side, creating a slightly uneven appearance. The spacing is now consistent for a cleaner reading experience.",
        category: "Improvement"
    },
    {
        date: "2026-04-13",
        time: "11am",
        headline: "Changelog now shows total changes and per-date update counts",
        summary:
            "The Changelog page now quietly displays the total number of changes shipped to the storefront, pulled live from the repository. Each date group also shows how many updates were released that day, so you can see at a glance how much work landed on any given date.",
        category: "Improvement"
    },
    {
        date: "2026-04-13",
        time: "11am",
        headline: "Changelog date headers now stay visible while you scroll",
        summary:
            "Each date group on the Changelog page now has a sticky header that pins to the top of the screen as you scroll through its entries, then hands off cleanly to the next date. This makes it easy to know which update period you are reading without having to scroll back up.",
        category: "Improvement"
    },
    {
        date: "2026-04-13",
        time: "11am",
        headline: "Out-of-stock products now have a clearer visual treatment",
        summary:
            "Out-of-stock product cards now show a diagonal line and a subtle white tint over the image, making their unavailable status unmistakable at a glance. The status badge is now styled in red for stronger contrast. On the product page, hover zoom effects are suppressed for out-of-stock items so the experience is calmer and less misleading.",
        category: "Improvement"
    },
    {
        date: "2026-04-13",
        time: "11am",
        headline: "Out-of-stock products now visible across all product surfaces",
        summary:
            "Products that are temporarily out of stock now appear everywhere — on collection pages, search results, the gallery, sale, and your wishlist — instead of being hidden. Each out-of-stock product shows a clear badge, a lightly muted image, and a disabled cart button so you can still browse, save to your wishlist, and check back when stock returns.",
        category: "Improvement"
    },
    {
        date: "2026-04-12",
        time: "7pm",
        headline: "Chat buttons now sit in the bottom-right corner",
        summary:
            "The WhatsApp and Messenger contact buttons have moved to the conventional bottom-right position where you'd expect them. They now sit just above the copyright line with comfortable spacing, and the App install button no longer duplicates between the navbar and the floating position on mobile.",
        category: "Fix"
    },
    {
        date: "2026-04-10",
        time: "2pm",
        headline: "Changelog link added to footer on all devices",
        summary:
            "The Changelog link now appears in the footer navigation on every device — mobile, tablet, and desktop. Previously it was only shown on desktop. The floating chat and install buttons have also been repositioned so they never cover the copyright row at the bottom of the page.",
        category: "Improvement"
    },
    {
        date: "2026-04-10",
        time: "2pm",
        headline: "App install button is now inside the mobile menu",
        summary:
            "Moved the \"Add to Home Screen\" button into the mobile navigation menu so it no longer clutters the navigation bar. The button still appears prominently when you open the menu, making the install flow easy to discover without getting in the way of everyday browsing.",
        category: "Improvement"
    },
    {
        date: "2026-04-10",
        time: "2pm",
        headline: "App install button now appears everywhere on mobile",
        summary:
            "Mobile visitors can now install the store as a home screen app from any page, not just specific spots. The button appears in the navigation bar on phones, so you never have to hunt for it.",
        category: "New Feature"
    },
    {
        date: "2026-04-10",
        time: "2pm",
        headline: "Install prompt no longer covers the cart drawer",
        summary:
            "Fixed a layering issue where the app install button would sit on top of the shopping cart drawer, blocking access to your items. The button now correctly sits behind the drawer overlay when it opens.",
        category: "Fix"
    },
    {
        date: "2026-04-10",
        time: "2pm",
        headline: "Install button hides automatically once the app is installed",
        summary:
            "The \"Add to Home Screen\" button now detects when the store is already installed and hides itself automatically. If you tap the button after installing, you see clear instructions instead of a confusing duplicate prompt.",
        category: "Improvement"
    },
    {
        date: "2026-04-10",
        time: "2pm",
        headline: "Fixed app install prompt not appearing on iPads",
        summary:
            "iPadOS was not being recognized correctly, which caused the app install prompt to never show up on iPads. This is now fixed — iPad users see the same install experience as iPhone users.",
        category: "Fix"
    },
    {
        date: "2026-04-10",
        time: "2pm",
        headline: "App install prompt now shows reliably on fast connections",
        summary:
            "Fixed a timing issue where the browser's install prompt could fire before the page was ready to capture it, causing the option to silently disappear. The prompt now appears consistently regardless of page load speed.",
        category: "Fix"
    },
    {
        date: "2026-04-10",
        time: "2pm",
        headline: "Install button in the menu meets accessibility contrast requirements",
        summary:
            "The \"Install App\" button inside the mobile menu had insufficient color contrast, making it hard to read for users with low vision. It now uses a high-contrast style that passes WCAG 2.1 AA standards.",
        category: "Fix"
    },
    {
        date: "2026-04-10",
        time: "2pm",
        headline: "Offline scripts now load from our own servers",
        summary:
            "The scripts that power offline browsing are now served directly from the store instead of relying on an external CDN. This makes offline mode faster to activate and removes a potential point of failure.",
        category: "Maintenance"
    },
    {
        date: "2026-04-09",
        time: "10am",
        headline: "Added a floating chat widget — reach support via Messenger or WhatsApp",
        summary:
            "A floating chat button now lives on every page, giving you instant access to support through Facebook Messenger or WhatsApp. Tap the icon and choose your preferred channel — no need to navigate away from what you're browsing.",
        category: "New Feature"
    },
    {
        date: "2026-04-09",
        time: "10am",
        headline: "iOS and Android users can now open the store in the native app",
        summary:
            "A persistent banner now appears for mobile visitors, inviting them to open the store in the dedicated native app experience. The banner stays visible so you can tap when it is convenient rather than missing a one-time prompt.",
        category: "New Feature"
    },
    {
        date: "2026-04-09",
        time: "10am",
        headline: "Messenger chat button opens faster without third-party scripts",
        summary:
            "The chat button used to load Facebook's entire Messenger SDK in the background, slowing down the page. It now redirects you directly to Messenger with a simple link, so it opens instantly without any extra tracking scripts.",
        category: "Improvement"
    },
    {
        date: "2026-04-09",
        time: "10am",
        headline: "Quick Add button on featured products",
        summary:
            "Featured products on the homepage now have a Quick Add button so you can drop items straight into your cart without visiting the product page. Select your size or variant and add — all without leaving the homepage.",
        category: "Improvement"
    },
    {
        date: "2026-04-09",
        time: "10am",
        headline: "Product titles are larger and easier to read",
        summary:
            "Product names on the product detail page are now displayed one size larger across all screen sizes. The change makes titles easier to scan at a glance and gives the page a stronger visual hierarchy.",
        category: "Improvement"
    },
    {
        date: "2026-04-09",
        time: "10am",
        headline: "Long product names in breadcrumbs are now neatly trimmed",
        summary:
            "When a product name was very long, the breadcrumb trail at the top of the product page would overflow or wrap awkwardly. It now truncates cleanly so the navigation always stays on one tidy line.",
        category: "Fix"
    },
    {
        date: "2026-04-09",
        time: "10am",
        headline: "Keyboard focus indicators no longer show when clicking with a mouse",
        summary:
            "Focus outlines used to appear on buttons and links when clicking with a mouse, which looked out of place. They now only appear when navigating with a keyboard, keeping the interface clean for mouse and touch users while remaining accessible for keyboard users.",
        category: "Improvement"
    },
    {
        date: "2026-04-09",
        time: "10am",
        headline: "Full-screen image viewer is now available on all devices",
        summary:
            "The product image lightbox was previously limited to desktop. It now works on phones and tablets too, with scroll locking so the page stays put while you examine images, and a smoother open and close animation.",
        category: "Improvement"
    },
    {
        date: "2026-04-08",
        time: "4pm",
        headline: "Whole-number prices no longer show unnecessary decimal places",
        summary:
            "Prices like $50.00 or $120.00 now display as $50 and $120 across the entire store, reducing visual clutter. Prices with cents (like $19.99) still display the full amount as expected.",
        category: "Improvement"
    },
    {
        date: "2026-04-07",
        time: "6pm",
        headline: "Product links now show the correct preview when shared on social media",
        summary:
            "Product pages now show a proper title, image, and description when shared on social platforms like Twitter, Facebook, and iMessage. Previously, shared links appeared as plain text with no preview.",
        category: "Fix"
    },
    {
        date: "2026-04-07",
        time: "6pm",
        headline: "Typography renders more consistently across all browsers",
        summary:
            "Text now looks the same no matter which browser you use. Headings, body copy, and the search bar now render with consistent, intentional styling across Chrome, Firefox, and Safari.",
        category: "Fix"
    },
    {
        date: "2026-04-07",
        time: "6pm",
        headline: "Corrected heading structure on product pages for better search visibility",
        summary:
            "Product pages are now better organized for search engines, which can improve how your products appear when shoppers search for them. Previously, some pages had conflicting title elements that made them harder to read correctly.",
        category: "Fix"
    },
    {
        date: "2026-04-06",
        time: "1pm",
        headline: "Free shipping progress bar only appears when a threshold is set",
        summary:
            "The progress bar showing how close you are to free shipping was showing up even when no minimum order requirement was configured. It now correctly stays hidden until a free shipping threshold has been set up.",
        category: "Fix"
    },
    {
        date: "2026-04-05",
        time: "9am",
        headline: "Product and collection data refreshes up to 4× more often",
        summary:
            "Updated product listings, prices, and inventory now appear on the site within 5 hours instead of the previous 23-hour window. If a product goes out of stock or a sale starts, the store reflects it much sooner.",
        category: "Improvement"
    },
    {
        date: "2026-04-05",
        time: "9am",
        headline: "Search results and sale page can now be sorted",
        summary:
            "You can now sort items on the search results page and sale page by price (low to high or high to low), newest first, or best-selling. The sort bar appears alongside the existing filters so you stay in control of what you see.",
        category: "New Feature"
    }
];
