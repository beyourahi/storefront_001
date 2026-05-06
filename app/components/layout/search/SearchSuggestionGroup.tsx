import {CommandGroup, CommandGroupHeading, CommandItem} from "~/components/ui/command";

type SearchSuggestion = {
    text: string;
};

type SearchSuggestionGroupProps = {
    suggestions: SearchSuggestion[];
    onSuggestionClick: (suggestion: SearchSuggestion, event?: React.MouseEvent) => void;
};

export const SearchSuggestionGroup = ({suggestions, onSuggestionClick}: SearchSuggestionGroupProps) => {
    return (
        <CommandGroup>
            <CommandGroupHeading>Suggestions</CommandGroupHeading>
            {suggestions.map(suggestion => (
                <CommandItem key={suggestion.text} className="py-2" onClick={e => onSuggestionClick(suggestion, e)}>
                    <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-sm">
                        <span className="text-muted-foreground pointer-events-none text-xs">&#128269;</span>
                    </div>
                    <span className="truncate text-left font-medium">{suggestion.text}</span>
                </CommandItem>
            ))}
        </CommandGroup>
    );
};
