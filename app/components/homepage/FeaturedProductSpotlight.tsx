import {Image} from "@shopify/hydrogen";
import {ArrowRight} from "lucide-react";
import {Link} from "react-router";
import {Button} from "~/components/ui/button";
import {ParallaxLayer} from "~/components/motion/ParallaxLayer";
import {formatShopifyMoney} from "~/lib/currency-formatter";
import {parseProductTitle} from "~/lib/product";
import type {FeaturedProductSection} from "~/lib/metaobject-parsers";

type FeaturedProductSpotlightProps = {
    product: FeaturedProductSection;
    sectionNumber?: string;
};

const getDescription = (description: string) => {
    const trimmed = description.trim();
    if (!trimmed) {
        return "A merchant-picked product that deserves the front-row spot on the homepage.";
    }

    return trimmed.length > 220 ? `${trimmed.slice(0, 217).trimEnd()}...` : trimmed;
};

const getDiscountPercentage = (
    price: FeaturedProductSection["price"],
    compareAtPrice: FeaturedProductSection["compareAtPrice"]
) => {
    if (!compareAtPrice) return null;

    const current = Number(price.amount);
    const original = Number(compareAtPrice.amount);

    if (!Number.isFinite(current) || !Number.isFinite(original) || original <= current) {
        return null;
    }

    return Math.round(((original - current) / original) * 100);
};

export function FeaturedProductSpotlight({product, sectionNumber}: FeaturedProductSpotlightProps) {
    const displayImage = product.featuredImage;
    const discountPercentage = getDiscountPercentage(product.price, product.compareAtPrice);
    const {primary, secondary} = parseProductTitle(product.title);

    return (
        <section className="bg-background py-16">
            <div className="mx-auto max-w-[2000px] px-2 md:px-4">
                <div className="mb-8 md:mb-12">
                    <div className="flex items-center gap-4 md:gap-6">
                        <div className="flex flex-col items-start gap-1">
                            <h2 className="text-foreground font-serif text-xl font-bold uppercase md:text-3xl lg:text-4xl">
                                Featured
                            </h2>
                            <p className="text-primary text-left font-serif text-xl font-bold uppercase md:text-3xl lg:text-4xl">
                                One product. Full attention.
                            </p>
                        </div>
                        <div className="bg-primary relative h-px flex-1 overflow-hidden">
                            <div className="bg-primary animate-in slide-in-from-left absolute top-0 left-0 h-full w-full origin-left duration-1000" />
                        </div>
                        {sectionNumber ? (
                            <div className="group relative flex items-center">
                                <span className="text-primary font-serif text-4xl leading-none font-bold transition-all duration-500 group-hover:scale-105 md:text-6xl lg:text-7xl">
                                    {sectionNumber}
                                </span>
                                <div className="from-primary to-primary absolute right-0 -bottom-1 left-0 mx-auto h-0.5 w-0 bg-gradient-to-r transition-all duration-500 group-hover:w-full" />
                            </div>
                        ) : null}
                    </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)] lg:gap-6">
                    <Link
                        to={`/products/${product.handle}`}
                        prefetch="intent"
                        className="group relative overflow-hidden rounded-[var(--radius-3xl-raw)] bg-muted/35"
                    >
                        <ParallaxLayer
                            className="h-full w-full"
                            contentClassName="h-full w-full"
                            amplitude={18}
                            scale={1.04}
                        >
                            {displayImage ? (
                                <Image
                                    data={{
                                        url: displayImage.url,
                                        altText: displayImage.altText || product.title
                                    }}
                                    sizes="(min-width: 1280px) 60vw, (min-width: 1024px) 55vw, 100vw"
                                    className="aspect-[4/5] h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                                />
                            ) : (
                                <div className="flex aspect-[4/5] h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted/30 px-10 text-center">
                                    <div>
                                        <p className="text-primary font-serif text-3xl uppercase md:text-4xl">
                                            Featured pick
                                        </p>
                                        <p className="text-muted-foreground mt-3 text-sm uppercase tracking-[0.28em]">
                                            Product image unavailable
                                        </p>
                                    </div>
                                </div>
                            )}
                        </ParallaxLayer>

                        {discountPercentage ? (
                            <div className="absolute left-4 top-4 rounded-[var(--radius-pill-raw)] bg-background/92 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-foreground backdrop-blur">
                                Save {discountPercentage}%
                            </div>
                        ) : null}
                    </Link>

                    <div className="flex h-full flex-col justify-between rounded-[var(--radius-3xl-raw)] border border-border/60 bg-card/65 p-6 shadow-sm backdrop-blur md:p-8">
                        <div className="space-y-5">
                            {product.vendor ? (
                                <p className="text-muted-foreground text-xs uppercase tracking-[0.35em]">
                                    {product.vendor}
                                </p>
                            ) : null}

                            <div className="space-y-3">
                                <h3 className="font-serif text-3xl uppercase md:text-5xl">{primary}</h3>
                                {secondary && (
                                    <h4 className="font-serif text-xl uppercase opacity-50 md:text-3xl">{secondary}</h4>
                                )}
                                <p className="text-muted-foreground max-w-xl text-sm leading-7 md:text-base">
                                    {getDescription(product.description)}
                                </p>
                            </div>

                            <div className="flex flex-wrap items-end gap-3">
                                <span className="font-mono text-2xl font-bold tracking-tight md:text-4xl">
                                    {formatShopifyMoney(product.price)}
                                </span>
                                {product.compareAtPrice ? (
                                    <span className="text-muted-foreground font-mono text-base line-through md:text-lg">
                                        {formatShopifyMoney(product.compareAtPrice)}
                                    </span>
                                ) : null}
                            </div>
                        </div>

                        <div className="mt-8 space-y-3">
                            <Button
                                asChild
                                size="lg"
                                className="w-full justify-between rounded-[var(--radius-pill-raw)] px-6 py-6 text-sm uppercase tracking-[0.22em]"
                            >
                                <Link to={`/products/${product.handle}`} prefetch="intent">
                                    Shop the featured product
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
