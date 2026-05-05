import {useState, useEffect} from "react";

/**
 * Returns `true` when the page has been scrolled past `threshold` pixels.
 * Uses a passive scroll listener for performance. Useful for showing
 * a sticky navbar shadow or a "scroll to top" button.
 *
 * @param threshold - Scroll distance in pixels before returning `true` (default: 50)
 */
export const useScrolled = (threshold = 50) => {
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > threshold);
        };

        handleScroll();
        window.addEventListener("scroll", handleScroll, {passive: true});
        return () => window.removeEventListener("scroll", handleScroll);
    }, [threshold]);

    return isScrolled;
};
