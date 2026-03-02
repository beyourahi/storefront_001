import {useState, useEffect, useRef, useCallback} from "react";
import {Badge} from "~/components/ui/badge";
import {Card, CardContent} from "~/components/ui/card";
import {cn} from "~/lib/utils";

type PolicySection = {
    title: string;
    content: string;
    index: number;
};

type PolicyTableOfContentsProps = {
    sections: PolicySection[];
    activeSection?: number;
};

export const PolicyTableOfContents = ({sections, activeSection = 1}: PolicyTableOfContentsProps) => {
    const [currentActiveSection, setCurrentActiveSection] = useState(activeSection);
    const tocContainerRef = useRef<HTMLDivElement>(null);

    const getSectionTitle = useCallback((section: PolicySection): string => {
        if (section.title?.trim()) {
            return section.title.trim();
        }
        return `Section ${section.index}`;
    }, []);

    const scrollToSection = useCallback((index: number) => {
        const element = document.getElementById(`policy-section-${index}`);
        if (element) {
            element.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }
    }, []);

    useEffect(() => {
        setCurrentActiveSection(activeSection);
    }, [activeSection]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        const sectionId = entry.target.id;
                        const match = sectionId.match(/policy-section-(\d+)/);
                        if (match) {
                            setCurrentActiveSection(parseInt(match[1]));
                        }
                    }
                }
            },
            {
                root: null,
                rootMargin: "-20% 0px -70% 0px",
                threshold: 0.1
            }
        );

        sections.forEach(section => {
            const element = document.getElementById(`policy-section-${section.index}`);
            if (element) {
                observer.observe(element);
            }
        });

        return () => {
            observer.disconnect();
        };
    }, [sections]);

    useEffect(() => {
        if (!tocContainerRef.current || !currentActiveSection) return;

        const timeout = setTimeout(() => {
            const activeButton = document.getElementById(`toc-button-${currentActiveSection}`);
            if (activeButton && tocContainerRef.current) {
                const buttonRect = activeButton.getBoundingClientRect();
                const containerRect = tocContainerRef.current.getBoundingClientRect();

                const relativeTop = buttonRect.top - containerRect.top + tocContainerRef.current.scrollTop;
                const containerHeight = tocContainerRef.current.clientHeight;
                const buttonHeight = activeButton.clientHeight;

                const scrollTarget = relativeTop - containerHeight / 2 + buttonHeight / 2;

                tocContainerRef.current.scrollTo({
                    top: scrollTarget,
                    behavior: "smooth"
                });
            }
        }, 100);

        return () => clearTimeout(timeout);
    }, [currentActiveSection]);

    return (
        <Card className="bg-card/95 border-border/30 h-full py-0">
            <CardContent className="h-full p-4">
                <div
                    ref={tocContainerRef}
                    className="h-full overflow-y-auto"
                    style={{scrollbarWidth: "none", msOverflowStyle: "none"}}
                >
                    <nav className="space-y-2">
                        {sections.map(section => {
                            const title = getSectionTitle(section);
                            const isActive = currentActiveSection === section.index;

                            return (
                                <button
                                    key={section.index}
                                    id={`toc-button-${section.index}`}
                                    type="button"
                                    onClick={() => scrollToSection(section.index)}
                                    className={cn(
                                        "group hover:bg-muted/50 flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-all duration-200",
                                        isActive
                                            ? "bg-primary/10 border-primary text-primary border-l-2"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <Badge
                                        variant={isActive ? "default" : "secondary"}
                                        className={cn(
                                            "shrink-0 text-xs",
                                            isActive
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-muted text-muted-foreground group-hover:bg-muted-foreground/20"
                                        )}
                                    >
                                        {section.index}
                                    </Badge>
                                    <span className="line-clamp-2 leading-tight">{title}</span>
                                </button>
                            );
                        })}
                    </nav>
                </div>
            </CardContent>
        </Card>
    );
};
