import {useMemo} from "react";
import {PolicySectionsGrid} from "~/components/policy/PolicySectionsGrid";
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
            return parsePolicySectionsSSR(content);
        }
    }, [content]);

    const showIndexes = sections.length > 1;

    if (sections.length > 0) {
        return <PolicySectionsGrid sections={sections} showIndexes={showIndexes} />;
    }

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
