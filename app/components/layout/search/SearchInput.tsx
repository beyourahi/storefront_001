import {useRef, useEffect} from "react";
import {CommandInput} from "~/components/ui/command";

type SearchInputProps = {
    placeholder?: string;
    query: string;
    onSubmit: () => void;
    onQueryChange: (value: string) => void;
    onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
};

export const SearchInput = ({placeholder = "Search", query, onSubmit, onQueryChange, onKeyDown}: SearchInputProps) => {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        requestAnimationFrame(() => {
            inputRef.current?.focus();
        });
    }, []);

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter") {
            event.preventDefault();
            onSubmit();
        }
        onKeyDown?.(event);
    };

    return (
        <div className="relative">
            <CommandInput
                ref={inputRef}
                placeholder={placeholder}
                value={query}
                onChange={e => onQueryChange(e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-12 pr-16"
            />
            <div className="pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 items-center sm:flex">
                <kbd className="bg-muted text-muted-foreground rounded border px-1.5 py-0.5 font-mono text-[10px] leading-none">
                    ⌘K
                </kbd>
            </div>
        </div>
    );
};
