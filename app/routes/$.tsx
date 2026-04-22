import {Link, useRouteError, isRouteErrorResponse, useRouteLoaderData} from "react-router";
import type {Route} from "./+types/$";
import {redirectLegacyProductUrl} from "~/lib/legacy-redirect";
import type {RootLoader} from "~/root";
import type {CollectionCardData} from "~/lib/types/collections";
import {CollectionCard} from "~/components/display/CollectionCard";
import {OfflineAwareErrorPage} from "~/components/OfflineAwareErrorPage";

export const meta: Route.MetaFunction = () => [
    {title: "Page Not Found"},
    {name: "robots", content: "noindex"}
];
import {Button} from "~/components/ui/button";
import {Badge} from "~/components/ui/badge";
import {WheelGesturesPlugin} from "embla-carousel-wheel-gestures";
import {Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext} from "~/components/ui/carousel";

export const loader = async ({request, context}: Route.LoaderArgs) => {
    await redirectLegacyProductUrl(request, context.dataAdapter);
    throw new Response("Not Found", {status: 404, statusText: "Not Found"});
};

export default function CatchAllPage() {
    return null;
}

export function ErrorBoundary() {
    const error = useRouteError();
    const rootData = useRouteLoaderData<RootLoader>("root");

    let status = 500;
    let message: string | undefined;

    if (isRouteErrorResponse(error)) {
        status = error.status;
        message = error.data?.message ?? error.data;
    } else if (error instanceof Error) {
        message = error.message;
    }

    // If no root data available, fall back to the offline-aware error page
    if (!rootData) {
        return <OfflineAwareErrorPage statusCode={status} title={undefined} message={message} />;
    }

    // Map menuCollections to CollectionCardData format
    const collections: CollectionCardData[] = (rootData.menuCollections ?? []).map(
        (col: {
            id: string;
            handle: string;
            title: string;
            productsCount: number;
            image?: {url: string; altText?: string | null} | null;
        }) => ({
            id: col.id,
            title: col.title,
            handle: col.handle,
            productCount: col.productsCount,
            image: col.image ?? null
        })
    );

    if (status === 404) {
        return (
            <section className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-4 pt-6 pb-10">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--color-primary)_0%,_transparent_50%)] opacity-[0.03]" />
                <div className="relative mx-auto w-full max-w-2xl text-center">
                    <div className="space-y-6">
                        <div className="inline-flex items-center">
                            <Badge variant="outline" className="px-4 py-1.5 text-xs font-medium">
                                Error 404
                            </Badge>
                        </div>
                        <div className="space-y-4">
                            <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
                                Page Not Found
                            </h1>
                            <p className="mx-auto max-w-lg text-lg leading-relaxed text-muted-foreground">
                                The page you&apos;re looking for doesn&apos;t exist or has been moved.
                            </p>
                            <p className="text-sm font-medium text-primary/80">
                                But our collection is still here, waiting for you
                            </p>
                        </div>
                        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4">
                            <Button asChild>
                                <Link to="/">Back to Home</Link>
                            </Button>
                        </div>
                        <div className="sr-only">
                            <h3>Error 404</h3>
                            <p>Navigate to: Homepage, Collections</p>
                        </div>
                    </div>
                </div>

                {collections.length > 0 && (
                    <div className="relative mt-12 w-full">
                        <Carousel opts={{align: "start", loop: false, dragFree: true}} plugins={[WheelGesturesPlugin({forceWheelAxis: "x"})]} className="w-full">
                            <CarouselContent className="-ml-4">
                                {collections.map(collection => (
                                    <CarouselItem
                                        key={collection.id}
                                        className="basis-3/5 pl-4 md:basis-1/2 lg:basis-1/3 xl:basis-1/4 2xl:basis-1/5"
                                    >
                                        <CollectionCard collection={collection} />
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                            <CarouselPrevious />
                            <CarouselNext />
                        </Carousel>
                    </div>
                )}
            </section>
        );
    }

    return <OfflineAwareErrorPage statusCode={status} title={undefined} message={message} />;
}
