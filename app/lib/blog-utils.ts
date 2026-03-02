import type {ShareData} from "~/lib/social-share";

export const stripHtml = (html: string): string => {
    return html
        .replace(/<[^>]*>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim();
};

export const calculateReadingTime = (content: string, wordsPerMinute: number = 200): number => {
    const text = stripHtml(content);
    const words = text.split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(words / wordsPerMinute));
};

export const formatArticleDate = (date: string, options?: Intl.DateTimeFormatOptions): string => {
    return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        ...options
    }).format(new Date(date));
};

export const formatArticleDateShort = (date: string): string => {
    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
    }).format(new Date(date));
};

export type ArticleShareInput = {
    title: string;
    excerpt?: string | null;
    image?: {
        url: string;
    } | null;
    blog: {
        handle: string;
    };
    handle: string;
};

export const createArticleShareData = (article: ArticleShareInput, baseUrl: string, shopName?: string): ShareData => {
    const articleUrl = `${baseUrl}/blogs/${article.blog.handle}/${article.handle}`;

    return {
        title: article.title,
        description: article.excerpt || `Read "${article.title}" on our blog.`,
        url: articleUrl,
        imageUrl: article.image?.url,
        price: "",
        shopName
    };
};

export type ArticleForRelated = {
    handle: string;
    tags?: string[];
    id?: string;
};

export const filterRelatedArticles = <T extends ArticleForRelated>(
    articles: T[],
    currentArticle: ArticleForRelated,
    limit: number = 4
): T[] => {
    const currentTags = new Set(currentArticle.tags || []);
    const currentHandle = currentArticle.handle;

    if (currentTags.size === 0) {
        return articles.filter(a => a.handle !== currentHandle).slice(0, limit);
    }

    const scored = articles
        .filter(a => a.handle !== currentHandle)
        .map(article => {
            const articleTags = article.tags || [];
            const matchCount = articleTags.filter(tag => currentTags.has(tag)).length;
            return {article, matchCount};
        })
        .sort((a, b) => b.matchCount - a.matchCount);

    return scored.slice(0, limit).map(item => item.article);
};

export const getAuthorInitials = (name?: string | null): string => {
    if (!name) return "AU";

    return name
        .split(" ")
        .map(part => part[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
};

export const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength).trim() + "...";
};

export const slugify = (text: string): string => {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
};
