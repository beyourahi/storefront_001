import {FileText} from "lucide-react";
import {CommandGroup, CommandGroupHeading, CommandItem} from "~/components/ui/command";

type PolicyItem = {
    id: string;
    title: string;
    description: string;
    href: string;
};

type SearchPolicyGroupProps = {
    policies: PolicyItem[];
    onPolicyClick: (policy: PolicyItem, event?: React.MouseEvent) => void;
};

export const SearchPolicyGroup = ({policies, onPolicyClick}: SearchPolicyGroupProps) => {
    return (
        <CommandGroup>
            <CommandGroupHeading>Legal & Policies</CommandGroupHeading>
            {policies.map(policy => (
                <CommandItem key={policy.id} className="py-2" onClick={e => onPolicyClick(policy, e)}>
                    <div className="flex w-full items-center gap-3">
                        <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-sm">
                            <FileText className="text-muted-foreground pointer-events-none h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="text-left font-medium">{policy.title}</div>
                            <div className="text-muted-foreground truncate text-left text-xs">{policy.description}</div>
                        </div>
                    </div>
                </CommandItem>
            ))}
        </CommandGroup>
    );
};
