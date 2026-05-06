import {useCallback, useMemo} from "react";
import {useLocation} from "react-router";
const FALLBACK_SPECIAL_COLLECTIONS = {
    featured: "featured",
    bestSellers: "best-sellers",
    newArrivals: "new-arrivals",
    trending: "trending"
} as const;
import {useLockBodyScroll} from "~/lib/LenisProvider";
import {useIsMobile} from "~/hooks/useIsMobile";
import {MobileMenuWrapper} from "~/components/layout/MobileMenuWrapper";
import {MobileMenuHeader} from "~/components/layout/MobileMenuHeader";
import {MobileMenuNavigation} from "~/components/layout/MobileMenuNavigation";
import {MobileMenuCollections} from "~/components/layout/MobileMenuCollections";
import {MobileMenuSettings} from "~/components/layout/MobileMenuSettings";

type CollectionCardData = {
    id: string;
    title: string;
    handle: string;
    description: string;
    image?: {url: string; altText: string | null} | null;
    productCount: number;
};

type MobileMenuProps = {
    show: boolean;
    onClose: () => void;
    collections?: CollectionCardData[];
    shopName: string;
};

/**
 * Orchestrator for the mobile navigation overlay. Splits the `collections` prop
 * into "special" (featured, best-sellers, new-arrivals, trending) and "regular"
 * arrays for distinct presentation slots in `MobileMenuCollections`.
 * Applies `useLockBodyScroll` only on desktop — the mobile Drawer primitive
 * handles scroll-lock automatically, but the desktop overlay (no Radix primitive)
 * requires a manual lock.
 */
export const MobileMenu = ({show, onClose, collections = [], shopName}: MobileMenuProps) => {
    const {pathname: currentPath} = useLocation();
    const isMobile = useIsMobile();
    // Mobile path: Drawer primitive handles scroll-lock automatically.
    // Desktop path: uses a custom overlay (no Radix primitive), so lock manually.
    useLockBodyScroll(show && !isMobile);

    const specialCollectionHandles = useMemo(() => Object.values(FALLBACK_SPECIAL_COLLECTIONS) as string[], []);

    const regularCollections = useMemo(
        () => collections.filter(col => !specialCollectionHandles.includes(col.handle) && col.productCount > 0),
        [collections, specialCollectionHandles]
    );

    const specialCollectionsFiltered = useMemo(
        () => collections.filter(col => specialCollectionHandles.includes(col.handle) && col.productCount > 0),
        [collections, specialCollectionHandles]
    );

    const discountStats = useMemo(() => ({count: 0, maxPercentage: 0}), []);

    const handleLinkClick = useCallback(() => {
        onClose();
    }, [onClose]);

    const handleOpenChange = useCallback(
        (open: boolean) => {
            if (!open) onClose();
        },
        [onClose]
    );

    const menuContent = (
        <div className="flex-1 overflow-y-auto px-4 py-4" data-lenis-prevent>
            <MobileMenuHeader shopName={shopName} onClose={onClose} />
            <MobileMenuNavigation currentPath={currentPath} onLinkClick={handleLinkClick} />
            <MobileMenuCollections
                collections={regularCollections}
                specialCollections={specialCollectionsFiltered}
                currentPath={currentPath}
                discountStats={discountStats}
                onLinkClick={handleLinkClick}
            />
            <MobileMenuSettings currentPath={currentPath} onLinkClick={handleLinkClick} />
        </div>
    );

    if (isMobile) {
        return (
            <MobileMenuWrapper open={show} onOpenChange={handleOpenChange}>
                {menuContent}
            </MobileMenuWrapper>
        );
    }

    if (!show) return null;

    return (
        <>
            <div
                className="bg-background/80 fixed inset-0 z-40 block backdrop-blur-sm"
                onClick={onClose}
                onKeyDown={e => e.key === "Escape" && onClose()}
                role="button"
                tabIndex={0}
                aria-label="Close menu"
            />

            <div
                className="bg-background mobile-menu-enter fixed inset-x-0 top-[var(--total-header-height)] z-50 block max-h-[calc(100dvh-var(--total-header-height))] overflow-y-auto border-b shadow-xl"
                data-lenis-prevent
            >
                <div className="mx-auto px-4 py-4 sm:py-6">
                    <MobileMenuHeader shopName={shopName} onClose={onClose} />
                    <MobileMenuNavigation currentPath={currentPath} onLinkClick={handleLinkClick} />
                    <div className="border-border/40 mt-2.5 border-t pt-4">
                        <MobileMenuCollections
                            collections={regularCollections}
                            specialCollections={specialCollectionsFiltered}
                            currentPath={currentPath}
                            discountStats={discountStats}
                            onLinkClick={handleLinkClick}
                        />
                    </div>
                    <MobileMenuSettings currentPath={currentPath} onLinkClick={handleLinkClick} />
                </div>
            </div>
        </>
    );
};
