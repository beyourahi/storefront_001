import type {FC} from "react";
import {Link} from "react-router";

type CollectionWithCount = {
    handle: string;
    title: string;
    productsCount: number;
};

type CollectionSidebarProps = {
    collections: CollectionWithCount[];
    activeHandle?: string;
    showAllProducts?: boolean;
    allProductsCount?: number;
};

export const CollectionSidebar: FC<CollectionSidebarProps> = ({
    collections,
    activeHandle,
    showAllProducts = false,
    allProductsCount = 0
}) => (
    <aside className="hidden w-48 shrink-0 lg:block">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Collections</h2>
        <nav className="flex flex-col gap-1">
            {showAllProducts && (
                <Link
                    to="/collections/all-products"
                    className={`rounded-md px-2 py-1.5 text-sm transition-colors ${
                        activeHandle === "all-products"
                            ? "bg-primary/10 font-medium text-primary"
                            : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                    All Products
                    <span className="ml-1 text-xs opacity-60">{allProductsCount}</span>
                </Link>
            )}
            {collections.map(collection => (
                <Link
                    key={collection.handle}
                    to={`/collections/${collection.handle}`}
                    className={`rounded-md px-2 py-1.5 text-sm transition-colors ${
                        collection.handle === activeHandle
                            ? "bg-primary/10 font-medium text-primary"
                            : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                    {collection.title}
                    <span className="ml-1 text-xs opacity-60">{collection.productsCount}</span>
                </Link>
            ))}
        </nav>
    </aside>
);
