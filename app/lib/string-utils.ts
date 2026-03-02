/**
 * String manipulation utilities
 */

/**
 * Converts kebab-case string to camelCase
 * @param str - The kebab-case string to convert
 * @returns The camelCase version of the input string
 * @example
 * kebabToCamelCase("privacy-policy") // → "privacyPolicy"
 * kebabToCamelCase("terms-of-service") // → "termsOfService"
 */
export function kebabToCamelCase(str: string): string {
    return str.replace(/-([a-z])/g, (_: string, letter: string) =>
        letter.toUpperCase()
    );
}
