import * as React from "react";
import {useNavigate} from "react-router";
import {Pagination} from "@shopify/hydrogen";
import {useInView} from "react-intersection-observer";
import {Spinner} from "~/components/ui/spinner";
import {Skeleton} from "~/components/ui/skeleton";
import {cn} from "~/lib/utils";

type Connection<T> = {
    nodes: T[];
    pageInfo: {
        hasNextPage: boolean;
        hasPreviousPage: boolean;
        startCursor?: string | null;
        endCursor?: string | null;
    };
};

interface InfiniteScrollSectionProps<T> {
    connection: Connection<T>;
    resourcesClassName?: string;
    children: (props: {node: T; index: number}) => React.ReactNode;
    showSkeletons?: boolean;
    skeletonCount?: number;
    renderSkeleton?: () => React.ReactNode;
    endMessage?: string;
    threshold?: string;
    sortNodes?: (nodes: T[]) => T[];
}

export function InfiniteScrollSection<T extends {id: string}>({
    connection,
    resourcesClassName,
    children,
    showSkeletons = false,
    skeletonCount = 4,
    renderSkeleton,
    endMessage,
    threshold = "200px",
    sortNodes
}: InfiniteScrollSectionProps<T>) {
    const {ref, inView} = useInView({
        rootMargin: threshold,
        triggerOnce: false
    });

    const previousNodesCountRef = React.useRef(0);

    const defaultSkeleton = () => (
        <div className="flex flex-col gap-3">
            <Skeleton className="aspect-square w-full rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
        </div>
    );

    const SkeletonComponent = renderSkeleton || defaultSkeleton;

    return (
        <Pagination connection={connection}>
            {({nodes, isLoading, PreviousLink, NextLink, state, nextPageUrl, hasNextPage}) => {
                const sortedNodes = sortNodes ? sortNodes(nodes) : nodes;

                return (
                    <PaginationContent<T>
                        nodes={sortedNodes}
                        isLoading={isLoading}
                        PreviousLink={PreviousLink}
                        NextLink={NextLink}
                        state={state}
                        nextPageUrl={nextPageUrl}
                        hasNextPage={hasNextPage}
                        inView={inView}
                        intersectionRef={ref}
                        resourcesClassName={resourcesClassName}
                        previousNodesCountRef={previousNodesCountRef}
                        showSkeletons={showSkeletons}
                        skeletonCount={skeletonCount}
                        SkeletonComponent={SkeletonComponent}
                        endMessage={endMessage}
                    >
                        {children}
                    </PaginationContent>
                );
            }}
        </Pagination>
    );
}

function PaginationContent<T extends {id: string}>({
    nodes,
    isLoading,
    PreviousLink,
    NextLink,
    state,
    nextPageUrl,
    hasNextPage,
    inView,
    intersectionRef,
    resourcesClassName,
    previousNodesCountRef,
    showSkeletons,
    skeletonCount,
    SkeletonComponent,
    endMessage,
    children
}: {
    nodes: T[];
    isLoading: boolean;
    PreviousLink: React.ComponentType<{children: React.ReactNode}>;
    NextLink: React.ForwardRefExoticComponent<
        {children: React.ReactNode; className?: string} & React.RefAttributes<HTMLAnchorElement>
    >;
    state: unknown;
    nextPageUrl: string;
    hasNextPage: boolean;
    inView: boolean;
    intersectionRef: (node?: Element | null) => void;
    resourcesClassName?: string;
    previousNodesCountRef: React.MutableRefObject<number>;
    showSkeletons: boolean;
    skeletonCount: number;
    SkeletonComponent: () => React.ReactNode;
    endMessage?: string;
    children: (props: {node: T; index: number}) => React.ReactNode;
}) {
    const prevCount = previousNodesCountRef.current;
    const isNewBatch = nodes.length > prevCount;

    React.useEffect(() => {
        previousNodesCountRef.current = nodes.length;
    }, [nodes.length, previousNodesCountRef]);

    return (
        <div className="flex flex-col gap-6">
            <nav className="sr-only" aria-label="Load previous items">
                <PreviousLink>Load previous</PreviousLink>
            </nav>

            <ItemsGrid<T>
                nodes={nodes}
                inView={inView}
                hasNextPage={hasNextPage}
                nextPageUrl={nextPageUrl}
                state={state}
                resourcesClassName={resourcesClassName}
                previousNodesCount={prevCount}
                isNewBatch={isNewBatch}
            >
                {children}
            </ItemsGrid>

            {isLoading && showSkeletons && resourcesClassName && (
                <div className={resourcesClassName}>
                    {Array.from({length: skeletonCount}).map((_, skeletonIndex) => {
                        const uniqueKey = `skeleton-${nodes.length}-${skeletonIndex}`;
                        return (
                            <div
                                key={uniqueKey}
                                className="animate-product-fade-in"
                                style={{animationDelay: `${skeletonIndex * 50}ms`}}
                            >
                                <SkeletonComponent />
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="flex flex-col items-center justify-center py-6 min-h-20 md:min-h-25">
                {isLoading && !showSkeletons && (
                    <div className="flex flex-col items-center gap-2">
                        <Spinner className="size-6 md:size-7" />
                        <span className="text-sm text-muted-foreground">Loading more...</span>
                    </div>
                )}

                {hasNextPage && !isLoading && (
                    <nav aria-label="Load more items">
                        <NextLink ref={intersectionRef} className="text-sm text-muted-foreground hover:underline">
                            Load more
                        </NextLink>
                    </nav>
                )}

                {!hasNextPage && !isLoading && nodes.length > 0 && endMessage && (
                    <div className="flex flex-col items-center gap-2 py-4">
                        <div className="w-12 h-px bg-border" />
                        <span className="text-sm text-muted-foreground">{endMessage}</span>
                    </div>
                )}
            </div>
        </div>
    );
}

function ItemsGrid<T extends {id: string}>({
    nodes,
    inView,
    hasNextPage,
    nextPageUrl,
    state,
    resourcesClassName,
    previousNodesCount,
    isNewBatch,
    children
}: {
    nodes: T[];
    inView: boolean;
    hasNextPage: boolean;
    nextPageUrl: string;
    state: unknown;
    resourcesClassName?: string;
    previousNodesCount: number;
    isNewBatch: boolean;
    children: (props: {node: T; index: number}) => React.ReactNode;
}) {
    const navigate = useNavigate();

    React.useEffect(() => {
        if (inView && hasNextPage) {
            void navigate(nextPageUrl, {
                replace: true,
                preventScrollReset: true,
                state
            });
        }
    }, [inView, navigate, state, nextPageUrl, hasNextPage]);

    const renderItems = () =>
        nodes.map((node, index) => {
            const isNew = isNewBatch && index >= previousNodesCount;

            const staggerIndex = isNew ? index - previousNodesCount : 0;
            const staggerDelay = Math.min(staggerIndex, 7) * 50;

            return (
                <div
                    key={node.id}
                    className={cn(isNew && "animate-product-fade-in")}
                    style={isNew ? {animationDelay: `${staggerDelay}ms`} : undefined}
                >
                    {children({node, index})}
                </div>
            );
        });

    if (resourcesClassName) {
        return <div className={resourcesClassName}>{renderItems()}</div>;
    }

    return <>{renderItems()}</>;
}
