/**
 * @fileoverview Policy Table of Contents Component
 *
 * @description
 * Sticky sidebar navigation for multi-section policy pages with:
 * - Intersection Observer for active section tracking
 * - Auto-scroll to center active button
 * - Smooth scroll navigation
 * - Active state highlighting
 * - Section number badges
 *
 * @behavior
 * - Tracks which section is currently in viewport
 * - Highlights active section with blue primary color
 * - Auto-scrolls TOC to keep active item centered
 * - Smooth scrolls page to section on click
 *
 * @design
 * - Card wrapper with semi-transparent background
 * - Blue highlight for active section
 * - Badge transitions on hover
 * - Hidden on mobile (lg:block)
 */

import {useState, useEffect, useRef} from "react";
import {Badge} from "~/components/ui/badge";
import {Card, CardContent} from "~/components/ui/card";
import {cn} from "~/lib/utils";
import type {PolicySection} from "./PolicySectionCard";

type PolicyTableOfContentsProps = {
    sections: PolicySection[];
    activeSection?: number;
};

export const PolicyTableOfContents = ({sections, activeSection = 1}: PolicyTableOfContentsProps) => {
    const [currentActiveSection, setCurrentActiveSection] = useState(activeSection);
    const tocContainerRef = useRef<HTMLDivElement>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);

    const getSectionTitle = (section: PolicySection): string => {
        if (section.title?.trim()) {
            return section.title.trim();
        }
        return `Section ${section.index}`;
    };

    const scrollToSection = (index: number) => {
        const element = document.getElementById(`policy-section-${index}`);
        if (element) {
            element.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }
    };

    // Intersection Observer for active section tracking
    useEffect(() => {
        const observerOptions: IntersectionObserverInit = {
            root: null,
            rootMargin: "-20% 0px -70% 0px",
            threshold: 0.1
        };

        observerRef.current = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const sectionId = entry.target.id;
                    const match = sectionId.match(/policy-section-(\d+)/);
                    if (match) {
                        setCurrentActiveSection(parseInt(match[1]));
                    }
                }
            });
        }, observerOptions);

        sections.forEach(section => {
            const element = document.getElementById(`policy-section-${section.index}`);
            if (element && observerRef.current) {
                observerRef.current.observe(element);
            }
        });

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [sections]);

    // Auto-scroll TOC to center active button
    useEffect(() => {
        if (!tocContainerRef.current || !currentActiveSection) return;

        const timeoutId = setTimeout(() => {
            const activeButton = document.getElementById(`toc-button-${currentActiveSection}`);
            const tocContainer = tocContainerRef.current;

            if (activeButton && tocContainer) {
                const buttonRect = activeButton.getBoundingClientRect();
                const containerRect = tocContainer.getBoundingClientRect();

                const relativeTop = buttonRect.top - containerRect.top + tocContainer.scrollTop;
                const containerHeight = tocContainer.clientHeight;
                const buttonHeight = activeButton.clientHeight;

                const scrollTarget = relativeTop - containerHeight / 2 + buttonHeight / 2;

                tocContainer.scrollTo({
                    top: scrollTarget,
                    behavior: "smooth"
                });
            }
        }, 100);

        return () => clearTimeout(timeoutId);
    }, [currentActiveSection]);

    return (
        <Card className="bg-card/95 border-border/30 h-full py-0">
            <CardContent className="h-full p-4">
                <div ref={tocContainerRef} className="h-full overflow-y-auto scrollbar-none">
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
                                        "group flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm",
                                        "transition-all duration-200",
                                        "hover:bg-muted/50",
                                        isActive
                                            ? "bg-primary/10 border-l-2 border-primary text-primary"
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
