import {CommandGroup, CommandGroupHeading, CommandItem} from "~/components/ui/command";

type SearchCollection = {
    id: string;
    title: string;
    handle: string;
    image?: {url: string; altText: string | null} | null;
};

type SearchCollectionGroupProps = {
    collections: SearchCollection[];
    onCollectionClick: (collection: SearchCollection, event?: React.MouseEvent) => void;
};

export const SearchCollectionGroup = ({collections, onCollectionClick}: SearchCollectionGroupProps) => {
    return (
        <CommandGroup>
            <CommandGroupHeading>Collections</CommandGroupHeading>
            {collections.map(collection => (
                <CommandItem
                    key={collection.id}
                    className="py-2"
                    onClick={e => onCollectionClick(collection, e)}
                >
                    <div className="flex w-full items-center gap-3">
                        {collection.image ? (
                            <div className="bg-muted relative h-10 w-10 overflow-hidden rounded-sm">
                                <img
                                    src={collection.image.url}
                                    alt={collection.title}
                                    className="h-full w-full object-cover"
                                />
                            </div>
                        ) : (
                            <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-sm">
                                <span className="text-muted-foreground pointer-events-none text-xs">
                                    &#128193;
                                </span>
                            </div>
                        )}
                        <span className="text-base font-medium lg:text-sm">{collection.title}</span>
                    </div>
                </CommandItem>
            ))}
        </CommandGroup>
    );
};
