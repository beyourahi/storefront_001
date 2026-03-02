type PolicySection = {
    title: string;
    content: string;
    index: number;
};

export const parsePolicySections = (htmlContent: string): PolicySection[] => {
    if (!htmlContent?.trim()) {
        return [];
    }

    if (typeof window === "undefined") {
        return parsePolicySectionsSSR(htmlContent);
    }

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlContent;

    const headers = tempDiv.querySelectorAll("h1, h2, h3, h4, h5, h6");

    if (headers.length === 0) {
        return [
            {
                title: "",
                content: htmlContent,
                index: 1
            }
        ];
    }

    const sections: PolicySection[] = [];

    headers.forEach((header, index) => {
        const title = header.textContent?.trim() || `Section ${index + 1}`;
        let content = "";

        let currentElement = header.nextElementSibling;
        const contentElements: Element[] = [];

        while (currentElement && !currentElement.matches("h1, h2, h3, h4, h5, h6")) {
            contentElements.push(currentElement);
            currentElement = currentElement.nextElementSibling;
        }

        if (contentElements.length > 0) {
            const contentDiv = document.createElement("div");
            contentElements.forEach(el => {
                contentDiv.appendChild(el.cloneNode(true));
            });
            content = contentDiv.innerHTML;
        }

        sections.push({
            title,
            content: content || "",
            index: index + 1
        });
    });

    return sections;
};

export const parsePolicySectionsSSR = (htmlContent: string): PolicySection[] => {
    if (!htmlContent?.trim()) {
        return [];
    }

    const headerRegex = /<(h[1-6])(?:[^>]*)>(.*?)<\/\1>/gi;
    const headers: Array<{tag: string; title: string; position: number}> = [];

    let match;
    while ((match = headerRegex.exec(htmlContent)) !== null) {
        headers.push({
            tag: match[1],
            title: match[2].replace(/<[^>]*>/g, "").trim(),
            position: match.index
        });
    }

    if (headers.length === 0) {
        return [
            {
                title: "",
                content: htmlContent,
                index: 1
            }
        ];
    }

    const sections: PolicySection[] = [];

    headers.forEach((header, index) => {
        const start = header.position;
        const end = index < headers.length - 1 ? headers[index + 1].position : htmlContent.length;

        let sectionHtml = htmlContent.slice(start, end);

        sectionHtml = sectionHtml.replace(/<h[1-6](?:[^>]*)>.*?<\/h[1-6]>/i, "").trim();

        sections.push({
            title: header.title || `Section ${index + 1}`,
            content: sectionHtml,
            index: index + 1
        });
    });

    return sections;
};
