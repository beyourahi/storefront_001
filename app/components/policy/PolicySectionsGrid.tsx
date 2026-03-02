import {PolicyPageWithTOC} from "~/components/policy/PolicyPageWithTOC";

type PolicySection = {
    title: string;
    content: string;
    index: number;
};

type PolicySectionsGridProps = {
    sections: PolicySection[];
    showIndexes?: boolean;
};

export const PolicySectionsGrid = ({sections, showIndexes = false}: PolicySectionsGridProps) => {
    return <PolicyPageWithTOC sections={sections} showIndexes={showIndexes} />;
};
