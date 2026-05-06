import {Image} from "@shopify/hydrogen";
import {CommandGroup, CommandGroupHeading, CommandItem} from "~/components/ui/command";

type SearchArticle = {
    id: string;
    title: string;
    handle: string;
    image?: {url: string; altText: string | null} | null;
    blog?: {handle: string; title: string} | null;
};

type SearchArticleGroupProps = {
    articles: SearchArticle[];
    onArticleClick: (article: SearchArticle, event?: React.MouseEvent) => void;
};

export const SearchArticleGroup = ({articles, onArticleClick}: SearchArticleGroupProps) => {
    return (
        <CommandGroup>
            <CommandGroupHeading>Articles</CommandGroupHeading>
            {articles.map(article => (
                <CommandItem key={article.id} className="py-2" onClick={e => onArticleClick(article, e)}>
                    <div className="flex w-full items-center gap-3">
                        {article.image ? (
                            <div className="bg-muted relative h-10 w-10 overflow-hidden rounded-sm">
                                <Image
                                    src={article.image.url}
                                    alt={article.title}
                                    width={40}
                                    height={40}
                                    className="h-full w-full object-cover"
                                />
                            </div>
                        ) : (
                            <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-sm">
                                <span className="text-muted-foreground pointer-events-none text-xs">&#128240;</span>
                            </div>
                        )}
                        <div className="min-w-0 flex-1">
                            <div className="truncate text-left font-medium">{article.title}</div>
                            {article.blog?.title && (
                                <div className="text-muted-foreground truncate text-left text-xs">
                                    {article.blog.title}
                                </div>
                            )}
                        </div>
                    </div>
                </CommandItem>
            ))}
        </CommandGroup>
    );
};
