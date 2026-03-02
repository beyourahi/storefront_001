/**
 * @fileoverview Legal Page Layout Component
 *
 * @description
 * Top-level wrapper for legal pages that combines:
 * - Breadcrumb navigation
 * - Hero section with title and description
 * - Policy content sections with TOC
 *
 * @structure
 * 1. PageBreadcrumbs (navigation)
 * 2. LegalPageHero (title + description)
 * 3. PolicyContentSection (parsed content with TOC)
 *
 * @props
 * - title: Page title (required)
 * - description: Optional subtitle/description
 * - content: HTML content from Shopify policy
 */

import {PageBreadcrumbs} from "~/components/common/PageBreadcrumbs";
import {LegalPageHero} from "./LegalPageHero";
import {PolicyContentSection} from "./PolicyContentSection";

type LegalPageLayoutProps = {
    title: string;
    description?: string;
    content: string;
};

export const LegalPageLayout = ({title, description, content}: LegalPageLayoutProps) => {
    return (
        <>
            <PageBreadcrumbs customTitle={title} />
            <LegalPageHero title={title} description={description} />
            <PolicyContentSection content={content} />
        </>
    );
};
