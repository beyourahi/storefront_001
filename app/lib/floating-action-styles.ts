/**
 * Shared className tokens for the fixed-position floating action buttons
 * (Scratch trigger, WhatsApp, Messenger) rendered inside `FloatingButtonStack`.
 *
 * Anchors all three buttons to the same hover language used by product cards:
 * the `motion-surface` class drives the standard 220ms cubic-bezier(0.2, 0, 0, 1)
 * transition over `transform` and `box-shadow`, while `transform-gpu` mirrors
 * the GPU-promotion pattern the `product-card` class applies to grid cards.
 *
 * Hover composes a 2px lift with a 4% scale (refined, not aggressive) and
 * `active:scale-[0.97]` matches the design-system `--motion-press-scale` token
 * for press feedback. Tailwind v4 folds the translate + scale utilities into a
 * single transform value, so they animate together through the `motion-surface`
 * easing curve without conflict.
 *
 * @see app/styles/app.css — `.motion-surface`, `.product-card`, motion tokens
 */
export const FLOATING_ACTION_BUTTON_CLASSES = [
    "group flex h-[52px] w-[52px] items-center justify-center",
    "rounded-full shadow-lg",
    "motion-surface transform-gpu",
    "hover:-translate-y-0.5 hover:scale-[1.04] hover:shadow-xl",
    "active:scale-[0.97]"
].join(" ");
