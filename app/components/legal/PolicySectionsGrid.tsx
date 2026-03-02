/**
 * @fileoverview Policy Sections Grid Component
 *
 * @description
 * Wrapper component that delegates to PolicyPageWithTOC.
 * Exists for consistency but adds no additional logic.
 * Can be extended in the future if mobile-specific grid behavior is needed.
 *
 * @usage
 * ```tsx
 * <PolicySectionsGrid sections={sections} showIndexes={true} />
 * ```
 */

import {PolicyPageWithTOC} from "./PolicyPageWithTOC";
import type {PolicySection} from "./PolicySectionCard";

type PolicySectionsGridProps = {
    sections: PolicySection[];
    showIndexes?: boolean;
};

export const PolicySectionsGrid = ({sections, showIndexes = false}: PolicySectionsGridProps) => {
    return <PolicyPageWithTOC sections={sections} showIndexes={showIndexes} />;
};
