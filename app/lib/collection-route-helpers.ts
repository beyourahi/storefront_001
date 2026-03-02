/**
 * Pagination helpers for collection routes
 */

export type PaginationParams = {
    cursor: string | null;
    page: number;
    direction: "forward" | "backward" | null;
};

export type PaginationVariables = {
    first: number | null;
    last: number | null;
    after: string | null;
    before: string | null;
};

export type PaginationData = {
    currentPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    totalProducts: null;
    nextCursor: string | null;
    previousCursor: string | null;
};

type PageInfo = {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor?: string | null;
    endCursor?: string | null;
};

/**
 * Parse pagination parameters from URL
 * @param url - The request URL
 * @returns Parsed pagination params with defaults
 */
export function parsePaginationParams(url: URL): PaginationParams {
    const cursorParam = url.searchParams.get("cursor");
    const pageParam = url.searchParams.get("page");
    const directionParam = url.searchParams.get("direction");

    // Parse page number, default to 1, validate >= 1
    const parsedPage = pageParam ? parseInt(pageParam, 10) : 1;
    const page = !isNaN(parsedPage) && parsedPage >= 1 ? parsedPage : 1;

    // Validate direction
    const direction =
        directionParam === "forward" || directionParam === "backward"
            ? directionParam
            : null;

    return {
        cursor: cursorParam,
        page,
        direction
    };
}

/**
 * Build GraphQL pagination variables for Shopify cursor-based pagination
 * @param cursor - The pagination cursor
 * @param direction - Forward or backward pagination
 * @param count - Number of items to fetch (default: 250)
 * @returns GraphQL variables object
 */
export function buildPaginationVariables(
    cursor: string | null,
    direction: "forward" | "backward" | null,
    count: number = 250
): PaginationVariables {
    if (direction === "backward") {
        // Backward pagination: use last + before
        return {
            first: null,
            last: count,
            after: null,
            before: cursor
        };
    }

    // Forward pagination (default): use first + after
    return {
        first: count,
        last: null,
        after: cursor,
        before: null
    };
}

/**
 * Build pagination data object for components
 * @param pageInfo - GraphQL pageInfo object from Shopify
 * @param currentPage - Current page number
 * @returns Pagination data for components
 */
export function buildPaginationData(
    pageInfo: PageInfo,
    currentPage: number
): PaginationData {
    return {
        currentPage,
        hasNextPage: pageInfo.hasNextPage,
        hasPreviousPage: pageInfo.hasPreviousPage,
        totalProducts: null, // Shopify cursor pagination doesn't provide total count
        nextCursor: pageInfo.endCursor ?? null,
        previousCursor: pageInfo.startCursor ?? null
    };
}

/**
 * Determine if URL should redirect for canonical pagination
 * Redirect rules:
 * 1. Invalid page param (NaN, < 1) → redirect to clean pathname
 * 2. Page 1 with next page available but no page param → redirect to ?page=1
 * 3. Page 1 without next page but page param present → redirect to clean pathname
 *
 * @param url - The request URL
 * @param currentPage - Current page number
 * @param hasNextPage - Whether next page exists
 * @param pageParam - Raw page param from URL (for validation)
 * @returns Redirect URL if needed, null otherwise
 */
export function getCanonicalRedirect(
    url: URL,
    currentPage: number,
    hasNextPage: boolean,
    pageParam: string | null
): string | null {
    // Case 1: Invalid page param → redirect to clean URL
    if (pageParam) {
        const parsedPage = parseInt(pageParam, 10);
        if (isNaN(parsedPage) || parsedPage < 1) {
            return url.pathname;
        }
    }

    // Page 1 specific redirects
    if (currentPage === 1) {
        // Case 2: First page with pagination available → canonicalize to ?page=1
        if (hasNextPage && !pageParam) {
            return `${url.pathname}?page=1`;
        }

        // Case 3: First page without pagination → remove page param
        if (!hasNextPage && pageParam) {
            return url.pathname;
        }
    }

    // No redirect needed
    return null;
}
