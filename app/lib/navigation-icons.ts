import {Images, Newspaper, Package, ShoppingCart, Sparkles, Star, TrendingUp} from "lucide-react";

export const navigationIcons: Record<string, React.ComponentType<{className?: string}>> = {
    "/collections/all-products": ShoppingCart,
    "/gallery": Images,
    "/blogs": Newspaper
};

export const specialCollectionIcons: Record<string, React.ComponentType<{className?: string}>> = {
    featured: Sparkles,
    "best-sellers": Star,
    "new-arrivals": Package,
    trending: TrendingUp
};
