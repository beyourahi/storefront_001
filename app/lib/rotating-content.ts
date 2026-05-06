export interface RotatingContentVariation {
    blogSectionTitle: string;
    collectionsTitle: string;
    relatedProductsTitle: string;
    recommendedTitle: string;
    instagramTitle: string;
    galleryPageHeading: string;
    galleryPageDescription: string;
    blogPageHeading: string;
    blogPageDescription: string;
}

// Rotates every 5 minutes. Deterministic — derived from wall-clock time only,
// so SSR and client always agree on the same variation for a given request.
const INTERVAL_MS = 5 * 60 * 1000;

const VARIATIONS: RotatingContentVariation[] = [
    {
        blogSectionTitle: "Stories Worth Your Time",
        collectionsTitle: "Curated Collections",
        relatedProductsTitle: "You Might Like These",
        recommendedTitle: "Recommended For You",
        instagramTitle: "From the Feed",
        galleryPageHeading: "A Closer Look",
        galleryPageDescription: "Moments, details, and everything in between.",
        blogPageHeading: "Insights & Ideas",
        blogPageDescription: "Thoughtful reads, curated for clarity and curiosity."
    },
    {
        blogSectionTitle: "Latest Reads",
        collectionsTitle: "Explore Categories",
        relatedProductsTitle: "Pairs Well With",
        recommendedTitle: "Handpicked Picks",
        instagramTitle: "In Real Life",
        galleryPageHeading: "Visual Stories",
        galleryPageDescription: "Snapshots that capture the essence of it all.",
        blogPageHeading: "Fresh Perspectives",
        blogPageDescription: "Simple ideas, better ways, and useful thoughts."
    },
    {
        blogSectionTitle: "From the Journal",
        collectionsTitle: "Browse Collections",
        relatedProductsTitle: "Complete the Look",
        recommendedTitle: "Top Picks",
        instagramTitle: "Latest Moments",
        galleryPageHeading: "The Gallery",
        galleryPageDescription: "A collection of details that matter.",
        blogPageHeading: "The Journal",
        blogPageDescription: "Notes, ideas, and useful reads."
    },
    {
        blogSectionTitle: "What's New",
        collectionsTitle: "Discover More",
        relatedProductsTitle: "You May Also Like",
        recommendedTitle: "Editor's Picks",
        instagramTitle: "Behind the Scenes",
        galleryPageHeading: "Explore More",
        galleryPageDescription: "A visual take on what we're building.",
        blogPageHeading: "Latest Updates",
        blogPageDescription: "Short reads that keep you in the loop."
    },
    {
        blogSectionTitle: "Featured Stories",
        collectionsTitle: "Shop by Collection",
        relatedProductsTitle: "Good Together",
        recommendedTitle: "You'll Probably Like",
        instagramTitle: "Community Highlights",
        galleryPageHeading: "Highlights",
        galleryPageDescription: "A closer look at what defines the experience.",
        blogPageHeading: "Stories & Updates",
        blogPageDescription: "A mix of ideas, updates, and inspiration."
    }
];

export function getRotatingVariation(): RotatingContentVariation {
    const index = Math.floor(Date.now() / INTERVAL_MS) % VARIATIONS.length;
    return VARIATIONS[index];
}
