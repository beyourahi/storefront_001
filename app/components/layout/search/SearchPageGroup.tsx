import {CommandGroup, CommandGroupHeading, CommandItem} from "~/components/ui/command";

type SearchPage = {
    id: string;
    title: string;
    handle: string;
};

type SearchPageGroupProps = {
    pages: SearchPage[];
    onPageClick: (page: SearchPage, event?: React.MouseEvent) => void;
};

export const SearchPageGroup = ({pages, onPageClick}: SearchPageGroupProps) => {
    return (
        <CommandGroup>
            <CommandGroupHeading>Pages</CommandGroupHeading>
            {pages.map(page => (
                <CommandItem key={page.id} className="py-2" onClick={e => onPageClick(page, e)}>
                    <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-sm">
                        <span className="text-muted-foreground pointer-events-none text-xs">&#128196;</span>
                    </div>
                    <span className="truncate text-left font-medium">{page.title}</span>
                </CommandItem>
            ))}
        </CommandGroup>
    );
};
