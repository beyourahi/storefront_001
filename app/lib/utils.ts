/**
 * @fileoverview General Utility Functions
 *
 * @description
 * Common utility functions used throughout the application.
 * Currently provides the `cn` function for merging Tailwind CSS classes.
 *
 * @architecture
 * This is the central utility module. Keep functions here only if they are:
 * - Used across multiple unrelated parts of the codebase
 * - Simple and single-purpose
 * - Not specific to any domain (product, cart, etc.)
 *
 * @dependencies
 * - clsx - Conditional class name construction
 * - tailwind-merge - Intelligent Tailwind class merging
 *
 * @related
 * - All components - Use cn() for className props
 * - shadcn/ui components - Also use this utility
 *
 * @example
 * ```tsx
 * <div className={cn(
 *   "base-class",
 *   isActive && "active-class",
 *   props.className
 * )} />
 * ```
 */

import {type ClassValue, clsx} from "clsx";
import {twMerge} from "tailwind-merge";

// =============================================================================
// CLASS NAME UTILITIES
// =============================================================================

/**
 * Merges class names with Tailwind-aware conflict resolution.
 *
 * Combines the power of clsx (conditional classes) with tailwind-merge
 * (intelligent Tailwind class merging). This prevents issues like:
 * - "p-2 p-4" → only p-4 is applied
 * - "text-red-500 text-blue-500" → only last one wins
 *
 * @param inputs - Class values (strings, objects, arrays, conditionals)
 *
 * @returns Merged class string with Tailwind conflicts resolved
 *
 * @example
 * ```tsx
 * // Basic usage
 * cn("px-4", "py-2")
 * // → "px-4 py-2"
 *
 * // Conditional classes
 * cn("base", isActive && "active", isFocused && "ring-2")
 * // → "base active" (if isActive is true)
 *
 * // Override pattern (common in component APIs)
 * cn("bg-primary text-white", props.className)
 * // → If className includes "bg-secondary", only bg-secondary is kept
 *
 * // Object syntax
 * cn({ "hidden": !isVisible, "block": isVisible })
 * ```
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

