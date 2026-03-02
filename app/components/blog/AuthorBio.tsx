import {cn} from "~/lib/utils";
import {getAuthorInitials} from "~/lib/blog-utils";
import {Avatar, AvatarFallback} from "~/components/ui/avatar";
import {Card, CardContent} from "~/components/ui/card";

export interface ArticleAuthor {
    name?: string | null;
    bio?: string | null;
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
}

interface AuthorBioProps {
    author: ArticleAuthor;
    variant?: "inline" | "card";
    className?: string;
}

export const AuthorBio = ({author, variant = "inline", className}: AuthorBioProps) => {
    const {name, bio, firstName, lastName} = author;

    const displayName = name || [firstName, lastName].filter(Boolean).join(" ") || "Author";
    const initials = getAuthorInitials(displayName);

    if (variant === "inline") {
        return (
            <div className={cn("flex items-center gap-2 min-h-10 sm:min-h-11", className)}>
                <span className="text-sm sm:text-sm md:text-base text-muted-foreground">{displayName}</span>
            </div>
        );
    }

    return (
        <Card className={cn(className)}>
            <CardContent className="flex gap-4 p-4 sm:p-6">
                <Avatar className="h-12 w-12 shrink-0">
                    <AvatarFallback className="font-serif text-lg text-primary bg-primary/10">
                        {initials}
                    </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Written by</p>
                    <h4 className="font-serif text-lg font-semibold">{displayName}</h4>
                    {bio && (
                        <p className="text-sm text-muted-foreground line-clamp-3">{bio}</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
