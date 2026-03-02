/**
 * @fileoverview Legal Components Barrel Export
 *
 * @description
 * Central export point for all legal page components.
 * Provides clean import paths from a single entry point.
 *
 * @usage
 * ```typescript
 * import {LegalPageLayout, PolicySectionCard} from "~/components/legal";
 * ```
 */

export {LegalPageHero} from "./LegalPageHero";
export {LegalPageLayout} from "./LegalPageLayout";
export {PolicyContentSection} from "./PolicyContentSection";
export {PolicyPageWithTOC} from "./PolicyPageWithTOC";
export {PolicySectionCard} from "./PolicySectionCard";
export {PolicySectionsGrid} from "./PolicySectionsGrid";
export {PolicyTableOfContents} from "./PolicyTableOfContents";

// Re-export type
export type {PolicySection} from "./PolicySectionCard";
