import {getSeoMeta} from "@shopify/hydrogen";
import {buildCanonicalUrl, getBrandNameFromMatches, getRequiredSocialMeta, getSiteUrlFromMatches, generateBreadcrumbListSchema} from "~/lib/seo";
import {useLoaderData} from "react-router";
import {Breadcrumbs} from "~/components/common/Breadcrumbs";
import {GiantText} from "~/components/common/GiantText";
import {AnimatedSection} from "~/components/sections/AnimatedSection";
import {GalleryMasonrySection} from "~/components/sections/GalleryMasonrySection";
import type {GalleryImageData, GalleryPageInfo} from "~/lib/gallery";
import {transformToGalleryImages} from "~/lib/gallery";
import {cn} from "~/lib/utils";
import type {Route} from "./+types/gallery";

export const meta: Route.MetaFunction = ({matches}) => {
    const siteUrl = getSiteUrlFromMatches(matches);
    const brandName = getBrandNameFromMatches(matches);
    return [
        ...(getSeoMeta({
            title: `Gallery | ${brandName}`,
            description: "Explore our complete collection through a visual gallery of all product images.",
            url: buildCanonicalUrl("/gallery", siteUrl)
        }) ?? []),
        {"script:ld+json": generateBreadcrumbListSchema([
            {name: "Home", url: "/"},
            {name: "Gallery", url: "/gallery"}
        ], siteUrl) as any},
        ...getRequiredSocialMeta("website", brandName)
    ];
};

export const loader = async ({context, request}: Route.LoaderArgs) => {
    const url = new URL(request.url);
    const cursor = url.searchParams.get("cursor");

    const {products} = await context.dataAdapter.query(GALLERY_PRODUCTS_QUERY, {
        variables: {
            first: 250,
            after: cursor
        },
        cache: context.dataAdapter.CacheShort()
    });

    const productImages = transformToGalleryImages(products.nodes);

    const pageInfo: GalleryPageInfo = {
        hasNextPage: products.pageInfo.hasNextPage,
        endCursor: products.pageInfo.endCursor ?? null
    };

    return {productImages, pageInfo};
};

export default function Gallery() {
    const {productImages, pageInfo} = useLoaderData<typeof loader>() as {
        productImages: GalleryImageData[];
        pageInfo: GalleryPageInfo;
    };
    const title = "Visual Showcase";
    const subtitle =
        "Explore our collection of stunning pieces, each telling its own unique story through craftsmanship and design.";

    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="px-2 pt-4 pb-2 md:px-4">
                <Breadcrumbs className="mx-auto max-w-[2000px]" items={[{label: "Gallery"}]} />
            </div>

            <AnimatedSection animation="fade" threshold={0.08}>
                <section className="py-8">
                    <div className="mx-auto max-w-[2000px] px-2 md:px-4">
                        <div className="flex w-full flex-col items-center justify-center gap-2 text-center xl:gap-4">
                            <GiantText
                                text={title}
                                className={cn("w-full font-black", title.length <= 7 ? "lg:w-[30%]" : "lg:w-[60%]")}
                            />

                            <p className="text-muted-foreground w-full text-xs lg:w-[60%] lg:text-sm 2xl:text-base">
                                {subtitle}
                            </p>
                        </div>
                    </div>
                </section>
            </AnimatedSection>

            {productImages.length > 0 ? (
                <AnimatedSection animation="slide-up" threshold={0}>
                    <GalleryMasonrySection productImages={productImages} pageInfo={pageInfo} />
                </AnimatedSection>
            ) : (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <h2 className="text-2xl font-semibold mb-4">No images yet</h2>
                    <p className="text-muted-foreground">Check back soon for new visual content.</p>
                </div>
            )}
        </div>
    );
}

const GALLERY_PRODUCTS_QUERY = `#graphql
  query GalleryProducts(
    $country: CountryCode
    $language: LanguageCode
    $first: Int!
    $after: String
  ) @inContext(country: $country, language: $language) {
    products(first: $first, after: $after) {
      nodes {
        handle
        title
        collections(first: 1) {
          nodes {
            handle
            title
          }
        }
        images(first: 250) {
          nodes {
            id
            url
            altText
            width
            height
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
` as const;

export {RouteErrorBoundary as ErrorBoundary} from "~/components/RouteErrorBoundary";
