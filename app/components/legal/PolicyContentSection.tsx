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
 * Uses utilities from ~/lib/policy:
 * - parsePolicySections() - Client-side DOM-based parsing (preferred)
 * - parsePolicySectionsSSR() - Server-side regex-based parsing (fallback)
 *
 * @behavior
 * - If parsing succeeds: Renders multi-section layout with TOC
 * - If parsing fails: Renders single prose block as fallback
 * - Automatically determines if section indexes should be shown (multi-section only)
 */

import {useMemo} from "react";
import {PolicySectionsGrid} from "./PolicySectionsGrid";
import {parsePolicySections, parsePolicySectionsSSR} from "~/lib/policy";

type PolicyContentSectionProps = {
    content: string;
};

export const PolicyContentSection = ({content}: PolicyContentSectionProps) => {
    const sections = useMemo(() => {
        if (!content) return [];

        try {
            return parsePolicySections(content);
        } catch {
            // Fallback to server-side regex parsing if DOM parsing fails
            return parsePolicySectionsSSR(content);
        }
    }, [content]);

    const showIndexes = sections.length > 1;

    if (sections.length > 0) {
        return <PolicySectionsGrid sections={sections} showIndexes={showIndexes} />;
    }

    // Fallback to original layout if parsing fails completely
    return (
        <section className="bg-background py-8">
            <div className="mx-auto max-w-[2000px] px-2 md:px-4">
                <div
                    className="prose prose-sm md:prose-base mx-auto max-w-4xl"
                    dangerouslySetInnerHTML={{__html: content}}
                />
            </div>
        </section>
    );
};
