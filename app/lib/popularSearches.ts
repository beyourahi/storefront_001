const STOP_WORDS = new Set([
    "a",
    "an",
    "the",
    "and",
    "or",
    "but",
    "in",
    "on",
    "at",
    "to",
    "for",
    "of",
    "with",
    "by",
    "new",
    "best",
    "top",
    "great",
    "good",
    "nice",
    "beautiful",
    "amazing",
    "small",
    "medium",
    "large",
    "xl",
    "xxl",
    "xs",
    "one",
    "two",
    "three",
    "set",
    "pack",
    "product",
    "item",
    "style",
    "design",
    "collection",
    "edition",
    "version",
    "sale",
    "deal",
    "offer",
    "discount",
    "free",
    "shipping",
    "is",
    "it",
    "be",
    "are",
    "was",
    "were",
    "been",
    "being",
    "have",
    "has",
    "had",
    "do",
    "does",
    "did",
    "will",
    "would",
    "could",
    "should",
    "may",
    "might",
    "must",
    "this",
    "that",
    "these",
    "those",
    "my",
    "your",
    "his",
    "her",
    "its",
    "our",
    "their",
    "all",
    "each",
    "every",
    "both",
    "few",
    "more",
    "most",
    "other",
    "some",
    "such",
    "no",
    "not",
    "only",
    "own",
    "same",
    "so",
    "than",
    "too",
    "very",
    "just",
    "can",
    "",
    "-",
    "&",
    "|",
    "/",
    "+"
]);

const MIN_WORD_LENGTH = 3;
const MAX_TERMS = 12;

interface ProductData {
    title: string;
    productType?: string | null;
    availableForSale: boolean;
}

interface CollectionData {
    title: string;
    handle: string;
}

export function extractPopularSearchTerms(products: ProductData[], collections: CollectionData[]): string[] {
    const wordFrequency = new Map<string, number>();
    const productTypes = new Set<string>();

    const availableProducts = products.filter(p => p.availableForSale);

    for (const product of availableProducts) {
        const words = tokenize(product.title);
        for (const word of words) {
            if (isValidKeyword(word)) {
                wordFrequency.set(word, (wordFrequency.get(word) ?? 0) + 1);
            }
        }

        if (product.productType && product.productType.trim()) {
            const type = product.productType.toLowerCase().trim();
            productTypes.add(type);
        }
    }

    for (const collection of collections) {
        if (["all", "all-collections", "frontpage"].includes(collection.handle.toLowerCase())) {
            continue;
        }

        const words = tokenize(collection.title);
        for (const word of words) {
            if (isValidKeyword(word)) {
                wordFrequency.set(word, (wordFrequency.get(word) ?? 0) + 3);
            }
        }
    }

    const sortedWords = Array.from(wordFrequency.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([word]) => word);

    const result: string[] = [];
    const seen = new Set<string>();

    for (const type of productTypes) {
        if (!seen.has(type) && result.length < MAX_TERMS) {
            result.push(type);
            seen.add(type);
        }
    }

    for (const word of sortedWords) {
        if (!seen.has(word) && result.length < MAX_TERMS) {
            result.push(word);
            seen.add(word);
        }
    }

    const collectionKeywords = collections
        .filter(c => !["all", "all-collections", "frontpage"].includes(c.handle.toLowerCase()))
        .map(c => c.title.toLowerCase().trim())
        .filter(title => title.length >= MIN_WORD_LENGTH && !seen.has(title));

    for (const keyword of collectionKeywords) {
        if (result.length < MAX_TERMS && !seen.has(keyword)) {
            if (keyword.split(/\s+/).length <= 2) {
                result.push(keyword);
                seen.add(keyword);
            }
        }
    }

    return result.slice(0, MAX_TERMS);
}

function tokenize(text: string): string[] {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, " ")
        .split(/\s+/)
        .filter(Boolean);
}

function isValidKeyword(word: string): boolean {
    return word.length >= MIN_WORD_LENGTH && !STOP_WORDS.has(word) && !/^\d+$/.test(word);
}
