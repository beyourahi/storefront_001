import {getSeoMeta} from "@shopify/hydrogen";
import {useLoaderData} from "react-router";
import {Breadcrumbs} from "~/components/common/Breadcrumbs";
import {GiantText} from "~/components/common/GiantText";
import {AnimatedSection} from "~/components/sections/AnimatedSection";
import {GalleryMasonrySection} from "~/components/sections/GalleryMasonrySection";
import type {GalleryImageData} from "~/lib/gallery";
import {transformToGalleryImages} from "~/lib/gallery";
import {cn} from "~/lib/utils";
import type {Route} from "./+types/gallery";

export const meta: Route.MetaFunction = () => {
    return (
        getSeoMeta({
            title: "Gallery",
            description: "Explore our complete collection through a visual gallery of all product images."
        }) ?? []
    );
};

export const loader = async ({context}: Route.LoaderArgs) => {
    const {products} = await context.dataAdapter.query(GALLERY_PRODUCTS_QUERY, {
        variables: {
            first: 100
        },
        cache: context.dataAdapter.CacheShort()
    });

    const productImages = transformToGalleryImages(products.nodes).map(image => ({
        url: image.url,
        altText: image.altText,
        productHandle: image.productHandle,
        productTitle: image.productTitle
    }));

    return {productImages};
};

export default function Gallery() {
    const {productImages} = useLoaderData<typeof loader>() as {productImages: GalleryImageData[]};
    const title = "Visual Showcase";
    const subtitle =
        "Explore our collection of stunning pieces, each telling its own unique story through craftsmanship and design.";

    return (
        <div className="min-h-dvh bg-background text-foreground">
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

            <AnimatedSection animation="slide-up" threshold={0.1}>
                <GalleryMasonrySection productImages={productImages} />
            </AnimatedSection>
        </div>
    );
}

const GALLERY_PRODUCTS_QUERY = `#graphql
  query GalleryProducts(
    $country: CountryCode
    $language: LanguageCode
    $first: Int!
  ) @inContext(country: $country, language: $language) {
    products(first: $first, query: "available_for_sale:true") {
      nodes {
        handle
        title
        collections(first: 1) {
          nodes {
            handle
            title
          }
        }
        images(first: 10) {
          nodes {
            id
            url
            altText
            width
            height
          }
        }
      }
    }
  }
` as const;
