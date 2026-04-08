import {useState, useEffect, useMemo, useCallback} from "react";
import {Minus, Plus} from "lucide-react";
import {parseProductTitle} from "~/lib/product";
import {cn} from "~/lib/utils";

type ProductDescriptionAccordionProps = {
    product: {
        title: string;
        description?: string;
        descriptionHtml?: string;
    };
    className?: string;
};

export const ProductDescriptionAccordion = ({product, className = ""}: ProductDescriptionAccordionProps) => {
    const [isMobile, setIsMobile] = useState(false);
    const [openItems, setOpenItems] = useState<string[]>([]);
    const [hasInteracted, setHasInteracted] = useState(false);
    const [showHint, setShowHint] = useState(false);

    useEffect(() => {
        const checkViewport = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkViewport();
        window.addEventListener("resize", checkViewport);
        return () => window.removeEventListener("resize", checkViewport);
    }, []);

    useEffect(() => {
        const interactionKey = "product-description-accordion-interacted";
        const hasInteractedBefore = localStorage.getItem(interactionKey) === "true";

        if (!hasInteractedBefore) {
            const showTimer = setTimeout(() => setShowHint(true), 1000);
            const hideTimer = setTimeout(() => setShowHint(false), 6000);
            return () => {
                clearTimeout(showTimer);
                clearTimeout(hideTimer);
            };
        }
    }, []);

    const productFirstPart = useMemo(() => {
        if (!product?.title) return "Product";
        return parseProductTitle(product.title).primary || "Product";
    }, [product]);

    const descriptionPreview = useMemo(() => {
        if (!product?.description && !product?.descriptionHtml) return "";

        let text = "";
        if (product.descriptionHtml) {
            text = product.descriptionHtml.replace(/<[^>]*>/g, "").trim();
        } else if (product.description) {
            text = product.description.trim();
        }

        if (text.length > 70) {
            return text.substring(0, 70) + "...";
        }
        return text;
    }, [product]);

    const accordionSections = useMemo(() => {
        const sections = [];

        if (product.descriptionHtml || product.description) {
            sections.push({
                id: "description",
                title: `${productFirstPart}'s Details`,
                content: product.descriptionHtml || product.description || "",
                defaultOpen: false
            });
        }

        return sections;
    }, [product, productFirstPart]);

    const handleAccordionClick = useCallback(
        (sectionId: string) => {
            setOpenItems(prev =>
                prev.includes(sectionId) ? prev.filter(id => id !== sectionId) : [...prev, sectionId]
            );

            if (!hasInteracted) {
                setHasInteracted(true);
                setShowHint(false);
                localStorage.setItem("product-description-accordion-interacted", "true");
            }
        },
        [hasInteracted]
    );

    const renderHtmlContent = (html: string) => {
        return (
            <div
                className="prose prose-sm text-muted-foreground leading-relaxed"
                dangerouslySetInnerHTML={{__html: html}}
            />
        );
    };

    if (isMobile) {
        return (
            <div className={`mt-6 ${className}`}>
                {accordionSections.length > 0 && (
                    <div>
                        {accordionSections.map(section => (
                            <div
                                key={section.id}
                                className="group bg-card border-border/50 hover:border-border/80 relative overflow-hidden rounded-xl border bg-gradient-to-br p-4 shadow-sm backdrop-blur-sm sleek hover:shadow-md"
                            >
                                <button
                                    className={cn(
                                        "flex w-full select-none items-start justify-between text-left",
                                        "sleek text-foreground"
                                    )}
                                    onClick={() => handleAccordionClick(section.id)}
                                >
                                    <div className="min-w-0 flex-1">
                                        <h3 className="group-hover:text-primary mb-2 text-lg font-bold sleek">
                                            {section.title}
                                        </h3>
                                        {descriptionPreview && !openItems.includes(section.id) && (
                                            <p className="text-muted-foreground/80 mb-3 text-sm leading-relaxed">
                                                {descriptionPreview}
                                            </p>
                                        )}
                                        {showHint && !openItems.includes(section.id) && (
                                            <div className="flex animate-pulse items-center gap-2">
                                                <div className="bg-primary/60 h-2 w-2 rounded-full" />
                                                <span className="text-primary/80 text-xs font-medium">
                                                    Tap to explore details
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="ml-4 shrink-0">
                                        <div
                                            className={cn(
                                                "group-hover:bg-primary/10 rounded-full p-2 sleek",
                                                !hasInteracted && !openItems.includes(section.id)
                                                    ? "bg-primary/5 animate-pulse"
                                                    : ""
                                            )}
                                        >
                                            {openItems.includes(section.id) ? (
                                                <Minus className="sleek text-foreground h-5 w-5" />
                                            ) : (
                                                <Plus className="sleek text-foreground h-5 w-5 group-hover:scale-110" />
                                            )}
                                        </div>
                                    </div>
                                </button>
                                {openItems.includes(section.id) && (
                                    <div className="pb-4">
                                        {typeof section.content === "string" && section.content.includes("<") ? (
                                            renderHtmlContent(section.content)
                                        ) : (
                                            <p className="text-muted-foreground leading-relaxed">{section.content}</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className={`mt-6 ${className}`}>
            {product.descriptionHtml ? (
                renderHtmlContent(product.descriptionHtml)
            ) : product.description ? (
                <p className="text-muted-foreground leading-relaxed">{product.description}</p>
            ) : null}
        </div>
    );
};
