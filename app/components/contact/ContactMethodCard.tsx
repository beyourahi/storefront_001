import type {LucideIcon} from "lucide-react";

type ContactMethodCardProps = {
    icon: LucideIcon;
    title: string;
    content: string;
    description: string;
    href: string;
    openInNewTab?: boolean;
};

export const ContactMethodCard = ({
    icon: Icon,
    title,
    content,
    description,
    href,
    openInNewTab = false
}: ContactMethodCardProps) => {
    return (
        <a
            href={href}
            target={openInNewTab ? "_blank" : undefined}
            rel={openInNewTab ? "noopener noreferrer" : undefined}
            className="group bg-muted/95 border-border/30 hover:border-primary/40 hover:bg-foreground/8 hover:shadow-primary/10 focus-visible:ring-primary/20 focus-visible:bg-primary/3 sleek block rounded-lg border p-6 hover:-translate-y-1 hover:shadow-lg focus-visible:ring-2 focus-visible:outline-none"
        >
            <div className="flex items-start space-x-4">
                <div className="shrink-0">
                    <div className="bg-secondary/90 group-hover:bg-secondary group-hover:shadow-secondary/20 sleek flex h-12 w-12 items-center justify-center rounded-lg group-hover:scale-105 group-hover:shadow-md">
                        <Icon className="text-secondary-foreground h-6 w-6" />
                    </div>
                </div>
                <div className="min-w-0 flex-1">
                    <h3 className="text-card-foreground/95 sleek mb-1 font-serif text-lg font-semibold">{title}</h3>
                    <p className="text-foreground/95 sleek mb-2 font-mono font-medium">{content}</p>
                    <p className="text-muted-foreground/85 group-hover:text-foreground/80 sleek text-sm">
                        {description}
                    </p>
                </div>
            </div>
        </a>
    );
};
