/**
 * @fileoverview Policy Content Section Component
 *
 * @description
 * Parser wrapper that:
 * - Takes HTML content from Shopify policies
 * - Parses into structured sections based on headers (h1-h6)
 * - Falls back to single prose block if no headers found
 * - Delegates to PolicySectionsGrid for rendering
 *
 * @parsing
 * Uses parsePolicySections() from ~/lib/policy — a single regex-based parser
 * that runs identically on server and client (no DOM dependency), preventing
 * the hydration mismatch a DOM-based parser would cause.
 *
 * @behavior
 * - If parsing succeeds: Renders multi-section layout with TOC
 * - If parsing fails: Renders single normalized prose block as fallback
 * - Automatically determines if section indexes should be shown (multi-section only)
 *
 * @security
 * HTML content is from Shopify's ShopPolicy.body — a trusted first-party source
 * authored by the store owner in Shopify admin and sanitized by Shopify. This is
 * the same pattern used by Shopify's canonical Hydrogen demo-store.
 */

import {useMemo} from "react";
import {PolicySectionsGrid} from "./PolicySectionsGrid";
import {parsePolicySections} from "~/lib/policy";

/** Collapse inter-tag whitespace to prevent SSR/client hydration mismatches. */
const normalizeHtml = (html: string): string =>
    html.replace(/>\s+</g, "><").trim();

type PolicyContentSectionProps = {
    content: string;
};

export const PolicyContentSection = ({content}: PolicyContentSectionProps) => {
    const sections = useMemo(() => {
        if (!content) return [];
        return parsePolicySections(content);
    }, [content]);

    const showIndexes = sections.length > 1;

    if (sections.length > 0) {
        return <PolicySectionsGrid sections={sections} showIndexes={showIndexes} />;
    }

    /* Fallback: render raw Shopify policy HTML as a single prose block.
     * Content is from ShopPolicy.body — trusted first-party Shopify HTML. */
    return (
        <section className="bg-background py-8">
            <div className="mx-auto max-w-[2000px] px-2 md:px-4">
                <div
                    className="prose prose-sm md:prose-base mx-auto max-w-4xl"
                    dangerouslySetInnerHTML={{__html: normalizeHtml(content)}}
                />
            </div>
        </section>
    );
};
