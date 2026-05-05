/** Escape HTML special characters to prevent XSS when embedding text in HTML strings. */
const escapeHtml = (text: string): string =>
    text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#039;");

/**
 * Converts markdown-style `[text](url)` links in a plain string to HTML anchor tags.
 * Non-text portions are HTML-escaped. URLs that don't start with a recognised
 * scheme (`http://`, `https://`, `/`, `mailto:`, `tel:`) are replaced with `#`.
 * Used for rendering CMS text fields that embed inline links.
 */
export const parseMarkdownLinks = (text: string): string => {
    const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;

    let result = "";
    let lastIndex = 0;

    for (const match of text.matchAll(linkPattern)) {
        const [fullMatch, linkText, url] = match;
        const matchIndex = match.index ?? 0;

        result += escapeHtml(text.slice(lastIndex, matchIndex));

        const safeUrl =
            url.startsWith("http://") ||
            url.startsWith("https://") ||
            url.startsWith("/") ||
            url.startsWith("mailto:") ||
            url.startsWith("tel:")
                ? url
                : "#";

        const safeLinkText = escapeHtml(linkText);

        result += `<a href="${escapeHtml(safeUrl)}" class="text-primary underline hover:no-underline transition-all" target="_blank" rel="noopener noreferrer">${safeLinkText}</a>`;

        lastIndex = matchIndex + fullMatch.length;
    }

    result += escapeHtml(text.slice(lastIndex));

    return result;
};
