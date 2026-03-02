export const TAG_CONFIG = {
    pin: ["pin", "pinned", "pinproduct", "featuredpin"],
    premium: ["premium", "premiums", "premiumproduct"],
    preorder: ["preorder", "preorders"],
    newArrival: ["newarrival", "new", "newproduct", "newarrivals"],
    clearance: ["clearance", "clearances", "clearancesale", "sale", "onsale"]
} as const;

export type SpecialTagType = keyof typeof TAG_CONFIG;

export type BadgeType = Exclude<SpecialTagType, "pin">;

export const BADGE_CONFIG: Record<BadgeType, {label: string; className: string; ariaLabel: string}> = {
    premium: {
        label: "Premium",
        className: "bg-secondary text-secondary-foreground",
        ariaLabel: "Premium product"
    },
    preorder: {
        label: "Pre-Order",
        className: "bg-muted text-muted-foreground",
        ariaLabel: "Available for pre-order"
    },
    newArrival: {
        label: "New",
        className: "bg-accent text-accent-foreground",
        ariaLabel: "New arrival"
    },
    clearance: {
        label: "Clearance",
        className: "bg-destructive/20 text-foreground",
        ariaLabel: "Clearance item"
    }
};

export function normalizeTag(tag: string): string {
    return tag.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function hasSpecialTag(tags: string[] | undefined | null, tagType: SpecialTagType): boolean {
    if (!tags || tags.length === 0) return false;

    const variations = TAG_CONFIG[tagType];
    const normalizedProductTags = tags.map(normalizeTag);

    return variations.some(variation => normalizedProductTags.includes(variation));
}

export interface SpecialTagInfo {
    isPinned: boolean;
    isPremium: boolean;
    isPreorder: boolean;
    isNewArrival: boolean;
    isClearance: boolean;
    badgeTypes: BadgeType[];
}

export function getSpecialTags(tags: string[] | undefined | null): SpecialTagInfo {
    const isPinned = hasSpecialTag(tags, "pin");
    const isPremium = hasSpecialTag(tags, "premium");
    const isPreorder = hasSpecialTag(tags, "preorder");
    const isNewArrival = hasSpecialTag(tags, "newArrival");
    const isClearance = hasSpecialTag(tags, "clearance");

    const badgeTypes: BadgeType[] = [];
    if (isPremium) badgeTypes.push("premium");
    if (isPreorder) badgeTypes.push("preorder");
    if (isNewArrival) badgeTypes.push("newArrival");
    if (isClearance) badgeTypes.push("clearance");

    return {
        isPinned,
        isPremium,
        isPreorder,
        isNewArrival,
        isClearance,
        badgeTypes
    };
}

const ALL_SPECIAL_TAG_VARIATIONS = new Set(Object.values(TAG_CONFIG).flat().map(normalizeTag));

export function filterDisplayTags(tags: string[] | undefined | null): string[] {
    if (!tags || tags.length === 0) return [];

    return tags.filter(tag => {
        const normalized = normalizeTag(tag);
        return !ALL_SPECIAL_TAG_VARIATIONS.has(normalized);
    });
}

export function getButtonLabel(tags: string[] | undefined | null, defaultLabel: string = "Get it now"): string {
    return hasSpecialTag(tags, "preorder") ? "Pre Order" : defaultLabel;
}

interface ProductWithTags {
    tags?: string[] | null;
    [key: string]: unknown;
}

export function sortWithPinnedFirst<T extends ProductWithTags>(
    products: T[],
    secondarySort?: (a: T, b: T) => number
): T[] {
    return [...products].sort((a, b) => {
        const aHasPin = a.tags?.some(tag => normalizeTag(tag) === "pin" || normalizeTag(tag) === "pinned");
        const bHasPin = b.tags?.some(tag => normalizeTag(tag) === "pin" || normalizeTag(tag) === "pinned");

        if (aHasPin && !bHasPin) return -1;
        if (!aHasPin && bHasPin) return 1;

        if (secondarySort) {
            return secondarySort(a, b);
        }

        return 0;
    });
}
