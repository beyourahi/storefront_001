import {sortWithPinnedFirst} from "~/lib/product-tags";

export type CollectionCategory = "bestSellers" | "newArrivals" | "featured";

export interface CollectionNode {
    id: string;
    handle: string;
    title: string;
    products: {
        nodes: any[];
    };
}

export interface TabConfig {
    key: string;
    label: string;
}

export const COLLECTION_PATTERNS = {
    bestSellers: [
        "best-sellers",
        "bestsellers",
        "best-seller",
        "bestseller",
        "top-sellers",
        "top-selling",
        "most-popular"
    ],
    newArrivals: [
        "new-arrivals",
        "newarrivals",
        "new-arrival",
        "newarrival",
        "new",
        "latest",
        "just-in",
        "fresh-arrivals"
    ],
    featured: [
        "featured",
        "feature",
        "featured-products",
        "featured-items",
        "staff-picks",
        "editors-choice",
        "spotlight"
    ]
} as const;

export const matchCollectionCategory = (handle: string): CollectionCategory | null => {
    const normalizedHandle = handle.toLowerCase();

    for (const [category, patterns] of Object.entries(COLLECTION_PATTERNS)) {
        if (patterns.some(pattern => normalizedHandle.includes(pattern))) {
            return category as CollectionCategory;
        }
    }
    return null;
};

export function findCollectionByCategory<T extends CollectionNode>(
    collections: T[],
    category: CollectionCategory
): T | null {
    return (
        collections.find(col => matchCollectionCategory(col.handle) === category && col.products.nodes.length > 0) ||
        null
    );
}

export const DEFAULT_TABS: Array<{
    category: CollectionCategory;
    config: TabConfig;
}> = [
    {category: "featured", config: {key: "featured", label: "Featured"}},
    {category: "newArrivals", config: {key: "new-arrivals", label: "New Arrivals"}},
    {category: "bestSellers", config: {key: "best-sellers", label: "Best Sellers"}}
];

export function buildCollectionTabs<T extends CollectionNode>(allCollections: T[]): Array<TabConfig & {collection: T}> {
    const validCollections = allCollections.filter(col => col.products.nodes.length > 0);

    const primaryCollections = new Map<CollectionCategory, T | null>();
    for (const {category} of DEFAULT_TABS) {
        primaryCollections.set(category, findCollectionByCategory(validCollections, category));
    }

    const selectedIds = new Set<string>();
    for (const collection of primaryCollections.values()) {
        if (collection) {
            selectedIds.add(collection.id);
        }
    }

    const fallbacks = validCollections.filter(c => !selectedIds.has(c.id));

    const tabs: Array<TabConfig & {collection: T}> = [];

    for (const {category, config} of DEFAULT_TABS) {
        let collection = primaryCollections.get(category);

        if (!collection && fallbacks.length > 0) {
            collection = fallbacks.shift()!;
            selectedIds.add(collection.id);
        }

        if (collection) {
            const sortedCollection = {
                ...collection,
                products: {
                    ...collection.products,
                    nodes: sortWithPinnedFirst(collection.products.nodes as any)
                }
            };

            tabs.push({
                ...config,
                label: primaryCollections.get(category) === collection ? config.label : collection.title,
                collection: sortedCollection
            });
        }
    }

    return tabs;
}

// NOTE: mapSortToCollectionSortKey and mapSortToProductSortKey have been removed
// Collection routes now use server-side GraphQL sortKey and filters parameters
// with sortWithPinnedFirst() applied on top for pin tag precedence
