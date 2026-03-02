const escapeHtml = (text: string): string =>
    text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#039;");

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

        result += `<a href="${safeUrl}" class="text-primary underline hover:no-underline transition-all" target="_blank" rel="noopener noreferrer">${safeLinkText}</a>`;

        lastIndex = matchIndex + fullMatch.length;
    }

    result += escapeHtml(text.slice(lastIndex));

    return result;
};
