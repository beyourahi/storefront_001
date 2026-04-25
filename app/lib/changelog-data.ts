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

export type ChangelogCategory = "New Feature" | "Improvement" | "Fix" | "Maintenance" | "Performance";

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
        date: "2026-04-25",
        headline: "Resolve accessibility gaps and suppress build warnings",
        summary:
            "The mobile menu and share dialog are now properly labelled for screen readers, resolving two accessibility gaps. A 404 page hydration mismatch and a drawer overlay reference warning have also been corrected, and the production build no longer emits spurious sourcemap warnings from third-party dependencies.",
        category: "Maintenance"
    },
    {
        date: "2026-04-25",
        headline: "Fixed crashes on homepage, product, and collection pages",
        summary:
            "Pages could crash or show an error screen on first visit. Homepage, product, and collection pages now load reliably every time. The blog listing page also had a display glitch that has been corrected.",
        category: "Fix"
    },
    {
        date: "2026-04-25",
        headline: "Store navigation and cart now fail gracefully on load errors",
        summary:
            "If the store's navigation menu or cart encounters an error while loading, the page now continues to function instead of crashing into a blank error screen. The failing section degrades silently, keeping the rest of the page fully usable.",
        category: "Fix"
    },
    {
        date: "2026-04-25",
        headline: "Prices now display correctly for 15 more global currencies",
        summary:
            "Shoppers in Bangladesh, New Zealand, Turkey, Ukraine, Vietnam, Nigeria, Pakistan, Sri Lanka, Nepal, Bahrain, Kuwait, Qatar, and Oman now see prices with the correct local currency symbol. Whole-number amounts in all newly supported currencies also drop the unnecessary decimal places.",
        category: "Improvement"
    },
    {
        date: "2026-04-24",
        headline: "Discounts now appear on each item in your cart",
        summary:
            "Applied discount codes, automatic discounts, and bundle savings now show directly on the relevant line items inside the cart drawer. You can see exactly how much each product's price has been reduced before proceeding to checkout.",
        category: "New Feature"
    },
    {
        date: "2026-04-24",
        headline: "Out-of-stock product card overlay simplified to badge and tinted image",
        summary:
            "The diagonal strikethrough line that previously overlaid out-of-stock product images has been removed. Unavailable products are still clearly indicated by the red \"Out of Stock\" badge and a subtly muted image — a cleaner look that no longer obscures the product photo.",
        category: "Improvement"
    },
    {
        date: "2026-04-24",
        headline: "Account \"Returns\" link only appears when the feature is set up",
        summary:
            "The Returns link inside the account navigation menu is now hidden unless the store has an active returns flow configured. This keeps the account area clean and prevents you from landing on a non-functional page when the feature is not yet enabled.",
        category: "Improvement"
    },
    {
        date: "2026-04-24",
        headline: "FAQ page no longer shows Shopify template placeholder text",
        summary:
            "When the store's FAQ hasn't been customised yet, the page now shows a useful set of default e-commerce questions and answers instead of Shopify's generic template copy. Actual FAQ content configured in the store settings always takes priority.",
        category: "Fix"
    },
    {
        date: "2026-04-24",
        headline: "Custom fonts load in the background without delaying content",
        summary:
            "The store's custom typefaces previously blocked the browser from rendering anything until the font files finished downloading. Fonts now load in the background after the initial paint, so text, images, and layout appear immediately and the font swaps in smoothly once ready.",
        category: "Performance"
    },
    {
        date: "2026-04-24",
        headline: "Navigation and footer links begin loading the next page on hover",
        summary:
            "Every link in the top navigation bar and footer now starts fetching the destination page the moment you hover over it. By the time you click, the page is already partially loaded — making browsing between sections of the store feel nearly instant.",
        category: "Performance"
    },
    {
        date: "2026-04-24",
        headline: "Product pages request less data so they open faster",
        summary:
            "The product page now fetches only the fields it actually shows, trimming unused data from every product request. Collection lookups were also tightened to fetch one result instead of ten. These changes reduce the payload on every product page load.",
        category: "Performance"
    },
    {
        date: "2026-04-24",
        headline: "Pages load faster with leaner API queries and smarter image loading",
        summary: "Product reviews now load after the main product details so prices and buy options appear sooner. Images across the site use Shopify's CDN to serve the right resolution for each screen. Navigating between products and collections now plays smooth native page transitions.",
        category: "Improvement"
    },
    {
        date: "2026-04-24",
        headline: "Faster page loads with smarter Shopify API caching",
        summary:
            "The homepage and search pages now cache product and collection data from Shopify instead of fetching it fresh on every visit. Collections and blog articles — which rarely change — are held longer, while product listings refresh more frequently so prices and availability stay accurate. Repeat visits and searches on popular terms load noticeably faster.",
        category: "Performance"
    },
    {
        date: "2026-04-23",
        headline: "Old contact page URL fully removed",
        summary:
            "The /contact URL previously forwarded to the FAQ page as a holdover from the retired contact form. That forwarding has now been removed, so any stale bookmarks to /contact will land on the standard not-found page. Reach out via the floating WhatsApp and Messenger buttons on every page for support.",
        category: "Maintenance"
    },
    {
        date: "2026-04-22",
        headline: "Product tags now sit in the same spot everywhere",
        summary:
            "Product tags like 'Fragrance' or 'Women' now appear as small badges right above the product name on the product page and inside both quick add views. Before, they were in different spots depending on where you opened a product, which made pages feel less tidy. Same tag, same place, same look — every time.",
        category: "Improvement"
    },
    {
        date: "2026-04-22",
        headline: "Product videos show up everywhere, not just product cards",
        summary:
            "If a product leads with a video, you'll now see that video in your cart, the 'you might like' suggestions, and the quick add window — not just on the product grid. Videos play silently when visible and pause when you scroll away, so they don't eat your data or battery.",
        category: "Improvement"
    },
    {
        date: "2026-04-22",
        headline: "Tidier product card media carousel",
        summary:
            "Fixed a layout glitch where some product card slides would collapse instead of filling the card when swiping between photos and videos. The little dots that show which slide you're on now sit clear of the Quick Add button, so they never overlap or feel cramped.",
        category: "Fix"
    },
    {
        date: "2026-04-22",
        headline: "Browse product videos and photos right from the card",
        summary:
            "Product cards now show every photo and video for a product in a swipeable carousel, so you can explore a product without leaving the page. Videos play silently in view and pause when you scroll away to save data and battery. Swipe on phones, or hover to reveal arrows on desktop.",
        category: "New Feature"
    },
    {
        date: "2026-04-22",
        headline: "Cleaner gallery view on phones",
        summary:
            "Product names no longer overlay every image in the gallery on phone-sized screens, so the visuals can breathe and the grid reads as a true lookbook. Tap any image to open its product page as before — the full details are a single tap away. On tablets and desktops the captions still appear on hover.",
        category: "Improvement"
    },
    {
        date: "2026-04-22",
        headline: "Gallery now loads smoothly as you scroll",
        summary:
            "The visual gallery used to fetch every product image upfront, which made the first paint heavy on large catalogues. Now it loads an initial batch and streams in more as you scroll toward the bottom. Tapping an image also prefetches the product page on hover, so opening a product feels instant.",
        category: "Improvement"
    },
    {
        date: "2026-04-21",
        headline: "Blog listing now spotlights the featured article on mobile",
        summary:
            "When a blog has a single article, the page focuses entirely on the featured story instead of showing an empty filter bar. The featured card is taller on phones for easier reading, and tapping anywhere on it now opens the article — not just the Read Article button.",
        category: "Improvement"
    },
    {
        date: "2026-04-21",
        headline: "Share buttons on articles are more prominent and tap-friendly",
        summary:
            "The social sharing section at the end of each blog article now stands out with a card-style container, a heading icon, and larger buttons that are easier to tap on small screens. The platform labels stay visible on larger screens so you know where each button shares to.",
        category: "Improvement"
    },
    {
        date: "2026-04-21",
        headline: "Blog articles now load instantly without fade-in",
        summary:
            "Individual blog posts no longer use scroll-triggered fade animations. Content appears immediately, which makes articles feel faster — especially when navigating from other pages or sharing direct links.",
        category: "Improvement"
    },
    {
        date: "2026-04-21",
        headline: "Recent searches now show product thumbnails",
        summary:
            "When you click a product from search results, we remember its image so the next time you open search, the product pops up as a visual chip alongside the text — making it quicker to recognize and re-open what you were looking at.",
        category: "Improvement"
    },
    {
        date: "2026-04-21",
        headline: "Long breadcrumb titles now truncate cleanly with ellipsis",
        summary:
            "Product and collection pages with very long names no longer overflow the breadcrumb trail. Long labels are shortened with an ellipsis, and hovering reveals the full text — keeping navigation tidy on every screen size.",
        category: "Fix"
    },
    {
        date: "2026-04-21",
        headline: "Quick-add panel redesigned to match the site's style",
        summary:
            "The quick-add sheet that opens when you tap \"Get Now\" on a suggested product now uses the same buttons, typography, and spacing as the rest of the store. The add-to-cart button is now a full-width solid button, and variant selectors match the style found on product pages.",
        category: "Improvement"
    },
    {
        date: "2026-04-21",
        headline: "Blog articles now available as an RSS feed",
        summary: "All published blog posts are now syndicated at /blogs/feed.xml in RSS 2.0 format. Subscribe in any RSS reader to get new articles automatically, or share the feed link with newsletter tools and content aggregators.",
        category: "New Feature"
    },
    {
        date: "2026-04-21",
        headline: "\"Get Now\" in cart suggestions now opens the product options panel",
        summary:
            "Tapping \"Get Now\" on a suggested product inside the cart now correctly opens the full quick-add panel, where you can pick a size or colour and add it in one step. Previously the button had no effect.",
        category: "Fix"
    },
    {
        date: "2026-04-21",
        headline: "Cart suggestions scroll smoothly on touch screens and trackpads",
        summary:
            "The suggested products inside the cart drawer can now be scrolled horizontally with a finger swipe or two-finger trackpad gesture. Previously, touch swipes were being captured by the drawer itself, making the suggestion cards difficult to browse on phones and tablets.",
        category: "Fix"
    },
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
        date: "2026-04-21",
        headline: "Wishlist sort order and item count are now saved between visits",
        summary:
            "Your preferred sort on the wishlist page — by date saved, lowest price, or highest price — is now remembered so the page opens the same way next time. The page also shows how many items you have saved, and the sort control uses the same styled selector as the rest of the store.",
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
        headline: "Customer reviews section launched on all product pages",
        summary:
            "Product pages now include a dedicated reviews section where customers can share star ratings, a review title, and written feedback. An overall rating score and score distribution are shown at a glance. Reviews are pulled from the store's content management system and appear automatically when published.",
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
        date: "2026-04-15",
        headline: "Newsletter sign-up now shows a privacy notice and account link",
        summary:
            "The email sign-up form now includes a short consent note explaining what subscribers receive and how to unsubscribe. If you already have an account, a direct log-in link is shown so you don't need to sign up twice. The form also clears itself after a successful submission and hides the confirmation message automatically after a few seconds.",
        category: "Improvement"
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
        date: "2026-04-14",
        headline: "Contact page retired — use the live chat buttons instead",
        summary:
            "The contact form page has been removed. The floating WhatsApp and Messenger buttons on every page connect you directly to support and get faster responses than a form submission. Any saved or shared links to the contact page now redirect to the FAQ.",
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
        headline: "Changelog page launched — track every store update in one place",
        summary:
            "A new Changelog page is now linked in the store navigation. Every meaningful update, fix, and new feature is listed here in plain language so you can always see what changed and when. The page is updated with each release.",
        category: "New Feature"
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
    },
    {
        date: "2026-04-05",
        headline: "Blank sections no longer appear on store pages",
        summary:
            "Some page sections were rendering as empty white gaps when no content had been set up for them in the store settings. Those sections now hide themselves automatically, so every page looks complete and intentional with no unexplained blank spaces.",
        category: "Fix"
    },
    {
        date: "2026-04-04",
        headline: "Product listings now show only items you can actually buy",
        summary:
            "All collection pages, search results, and the sale page now automatically filter out products that are unavailable or sold out. The \"In Stock Only\" checkbox that previously required manual toggling has been removed — you will only ever see products you can add to your cart.",
        category: "Improvement"
    },
    {
        date: "2026-04-03",
        headline: "Trackpad horizontal scroll added to product and homepage carousels",
        summary:
            "Swiping left and right with a laptop trackpad or two-finger gesture now scrolls through the featured product carousels, homepage sections, and the product image gallery. The update covers most carousels across the store.",
        category: "Improvement"
    },
    {
        date: "2026-04-03",
        headline: "Homepage video hero now shows the current date and time",
        summary:
            "The video section at the top of the homepage now displays a live date and time that updates in real time as you browse. It adds a sense of immediacy to the hero.",
        category: "New Feature"
    },
    {
        date: "2026-04-03",
        headline: "Product images now load correctly across the entire store",
        summary:
            "Some product images were failing to display due to a problem with how image URLs were being constructed for the Shopify image delivery network. All product images — in carousels, cards, galleries, and the lightbox — now load as expected.",
        category: "Fix"
    },
    {
        date: "2026-04-03",
        headline: "Gallery loading shimmer no longer gets stuck on cached pages",
        summary:
            "When returning to a product page that your browser had already cached, the image gallery could sometimes stay in a loading state — showing the shimmer animation indefinitely even though the images had already loaded. This is now fixed.",
        category: "Fix"
    },
    {
        date: "2026-04-03",
        headline: "Announcement banner now displays correctly",
        summary:
            "The announcement bar at the top of the store was not appearing for some configurations due to a parsing issue. It now handles all supported formats from the store's content settings and renders reliably on every page.",
        category: "Fix"
    },
    {
        date: "2026-04-03",
        headline: "Homepage hero greeting restored and layout made stable",
        summary:
            "The welcome text and greeting on the homepage hero was invisible in some states and caused a visible layout jump as the page first loaded. The greeting now appears immediately and the layout stays fixed throughout the page load.",
        category: "Fix"
    },
    {
        date: "2026-04-02",
        headline: "Account pages fully redesigned",
        summary:
            "Every page in the customer account area — order history, addresses, profile settings, wishlist, and returns — has been given a complete visual overhaul. The layout is now cleaner and more consistent throughout, and all pages work correctly on mobile and tablet.",
        category: "Improvement"
    },
    {
        date: "2026-04-01",
        headline: "Strike-through prices now only appear when there is a genuine saving",
        summary:
            "Some products were showing a crossed-out original price even when it was identical to the selling price, falsely implying a discount. The original price is now only shown when there is a real difference, so every price you see is accurate.",
        category: "Fix"
    },
    {
        date: "2026-04-01",
        headline: "Discount code field removed from the cart panel",
        summary:
            "The discount code input has been removed from the slide-out cart. Discount codes can be applied at checkout, which is where they work most reliably and where Shopify processes them natively.",
        category: "Improvement"
    },
    {
        date: "2026-04-01",
        headline: "Old product and collection links now redirect to the right pages",
        summary:
            "Links that use an older URL format — such as those from shared posts or saved bookmarks — now automatically redirect to the correct product or collection page instead of showing a 404 error.",
        category: "Maintenance"
    },
    {
        date: "2026-04-01",
        headline: "Product image lightbox errors fixed",
        summary:
            "The full-screen image viewer on product pages could throw an error and stop working on some browsers and devices. It now opens and closes reliably across all supported environments.",
        category: "Fix"
    },
    {
        date: "2026-03-26",
        headline: "Buttons lock while a request is processing to prevent accidental double-taps",
        summary:
            "Tapping a button twice quickly — such as Add to Cart, Buy Now, or a form submit — could trigger the action twice. All interactive buttons now disable themselves the moment they are tapped and only re-enable once the action has completed.",
        category: "Fix"
    },
    {
        date: "2026-03-23",
        headline: "Navigation breadcrumbs added to the sale page",
        summary:
            "The sale page now shows a breadcrumb trail at the top so you always know where you are in the store and can navigate back in one tap. Previously the sale page had no breadcrumb navigation.",
        category: "Improvement"
    },
    {
        date: "2026-03-11",
        headline: "Smooth transitions added to all buttons, cards, and interactive elements",
        summary:
            "Every interactive element across the store — product cards, navigation links, cart buttons, input fields, and badges — now transitions smoothly when you hover over or tap it. The effect is consistent and subtle throughout.",
        category: "Improvement"
    },
    {
        date: "2026-03-11",
        headline: "Background page now stays put when a drawer or panel is open",
        summary:
            "Opening the cart, mobile menu, image lightbox, or any overlay panel now locks the background page in place so it doesn't scroll underneath. Your scroll position is preserved exactly where you left it when the panel closes.",
        category: "Improvement"
    },
    {
        date: "2026-03-11",
        headline: "Collections section was showing zero products — now fixed",
        summary:
            "The collections grid on the homepage was displaying a product count of zero beneath every collection, regardless of how many items were inside. It now shows the correct count.",
        category: "Fix"
    },
    {
        date: "2026-03-10",
        headline: "Carousel images now fill their frames without distortion",
        summary:
            "Product images inside carousels were sometimes showing with letterboxing or leaving empty space at the sides when the image proportions didn't match the carousel frame. Images now fill their containers cleanly regardless of their original dimensions.",
        category: "Improvement"
    },
    {
        date: "2026-03-04",
        headline: "\"Buy Now\" and \"Proceed to Checkout\" now go to the correct checkout page",
        summary:
            "The Buy Now and Proceed to Checkout buttons were not correctly navigating to the Shopify checkout page. They now send you to the right URL every time, so the purchase flow works as expected from end to end.",
        category: "Fix"
    },
    {
        date: "2026-03-04",
        headline: "Store logo now appears in the navigation bar",
        summary:
            "The brand logo is now displayed in the top navigation bar, pulled directly from the store's settings. Stores without an uploaded logo fall back to displaying the store name as text.",
        category: "New Feature"
    }
];
