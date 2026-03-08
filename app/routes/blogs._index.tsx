import {Link, useLoaderData} from "react-router";
import type {Route} from "./+types/blogs._index";
import {getPaginationVariables, getSeoMeta} from "@shopify/hydrogen";
import {ArticleCard, type ArticleCardData} from "~/components/blog/ArticleCard";
import {ArticleHero} from "~/components/blog/ArticleHero";
import {Carousel, CarouselContent, CarouselItem} from "~/components/ui/carousel";
import {Button} from "~/components/ui/button";
import {Tabs, TabsList, TabsTrigger, TabsContent} from "~/components/ui/tabs";
import {useSiteSettings} from "~/lib/site-content-context";
import {GiantText} from "~/components/common/GiantText";
import {PageBreadcrumbs} from "~/components/common/PageBreadcrumbs";
import {AnimatedSection} from "~/components/sections/AnimatedSection";
import {cn} from "~/lib/utils";

interface BlogWithArticles {
    title: string;
    handle: string;
    seo?: {
        title?: string | null;
        description?: string | null;
    } | null;
    articles: {
        nodes: ArticleCardData[];
    };
}

export const meta: Route.MetaFunction = ({data, matches}) => {
    const shopName =
        (matches.find(m => m?.id === "root") as
            | {data?: {siteContent?: {siteSettings?: {brandName?: string}}}}
            | undefined)?.data?.siteContent?.siteSettings?.brandName ?? "Store";
    const featuredArticle = data?.featuredArticle;

    const rootMatch = matches.find(m => m?.id === "root");
    const rootData = rootMatch?.data as
        | {siteContent?: {siteSettings?: {blogPageHeading?: string; blogPageDescription?: string}}}
        | undefined;
    const pageTitle = rootData?.siteContent?.siteSettings?.blogPageHeading || "The Journal";
    const pageDescription =
        rootData?.siteContent?.siteSettings?.blogPageDescription || "Explore stories, inspiration, and ideas.";

    return (
        getSeoMeta({
            title: pageTitle,
            description: pageDescription,
            media: featuredArticle?.image?.url
                ? {
                      url: featuredArticle.image.url,
                      width: featuredArticle.image.width,
                      height: featuredArticle.image.height,
                      altText: featuredArticle.image.altText || `${shopName} ${pageTitle}`,
                      type: "image" as const,
                  }
                : undefined,
        }) ?? []
    );
};

export async function loader({context, request}: Route.LoaderArgs) {
    const paginationVariables = getPaginationVariables(request, {
        pageBy: 10,
    });

    const [{blogs}, {articles: latestArticles}] = await Promise.all([
        context.dataAdapter.query(BLOGS_WITH_ARTICLES_QUERY, {
            variables: {
                ...paginationVariables,
            },
        }),
        context.dataAdapter.query(LATEST_ARTICLES_QUERY, {
            variables: {
                first: 1,
            },
        }),
    ]);

    const featuredArticle = latestArticles?.nodes?.[0] || null;

    const hasRealContent =
        blogs?.nodes?.length > 0 &&
        blogs.nodes.some((blog: {articles?: {nodes?: unknown[]}}) => (blog.articles?.nodes?.length ?? 0) > 0);

    if (!hasRealContent) {
        throw new Response("Not found", {status: 404});
    }

    return {
        blogs,
        featuredArticle,
    };
}

export default function Blogs() {
    const {blogs, featuredArticle} = useLoaderData<typeof loader>();
    const {blogPageHeading, blogPageDescription} = useSiteSettings();
    const blogNodes = blogs.nodes as BlogWithArticles[];
    const hasMultipleCategories = blogNodes.length > 1;
    const blogTitle = blogPageHeading || "The Journal";

    return (
        <>
            <PageBreadcrumbs />

            <AnimatedSection animation="fade" threshold={0.08}>
                <section className="py-8">
                    <div className="mx-auto max-w-[2000px] px-2 md:px-4">
                        <div className="flex w-full flex-col items-center justify-center gap-2 text-center xl:gap-4">
                            <GiantText
                                text={blogTitle}
                                className={cn("w-full font-black", blogTitle.length <= 7 ? "lg:w-[30%]" : "lg:w-[60%]")}
                            />
                            {blogPageDescription && (
                                <p className="text-muted-foreground w-full text-xs lg:w-[60%] lg:text-sm 2xl:text-base">
                                    {blogPageDescription}
                                </p>
                            )}
                        </div>
                    </div>
                </section>
            </AnimatedSection>

            <div className="mx-auto max-w-[2000px] px-2 md:px-4 pb-12 md:pb-20">
            {featuredArticle && (
                <AnimatedSection animation="slide-up" threshold={0.1}>
                    <ArticleHero article={featuredArticle} variant="listing" />
                </AnimatedSection>
            )}

            {hasMultipleCategories && blogNodes.some(b => b.articles?.nodes?.length > 0) && (
                <AnimatedSection animation="slide-up" threshold={0.12}>
                    <div className="mt-10 md:mt-16 space-y-8">
                        <Tabs defaultValue={blogNodes[0]?.handle}>
                            <TabsList className="flex flex-wrap h-auto gap-2 bg-transparent p-0 mb-6">
                                {blogNodes.map((blog: BlogWithArticles) => (
                                    <TabsTrigger
                                        key={blog.handle}
                                        value={blog.handle}
                                        className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                                    >
                                        {blog.title} ({blog.articles?.nodes?.length || 0})
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                            {blogNodes.map((blog: BlogWithArticles) => (
                                <TabsContent key={blog.handle} value={blog.handle} className="space-y-8">
                                    <ArticleCarousel articles={blog.articles?.nodes || []} categoryHandle={blog.handle} />
                                    <div className="flex justify-center">
                                        <Button variant="outline" asChild>
                                            <Link viewTransition to={`/blogs/${blog.handle}`} prefetch="viewport">
                                                View all {blog.title} articles
                                            </Link>
                                        </Button>
                                    </div>
                                </TabsContent>
                            ))}
                        </Tabs>
                    </div>
                </AnimatedSection>
            )}

            {!hasMultipleCategories && blogNodes[0]?.articles?.nodes?.length > 0 && (
                <AnimatedSection animation="slide-up" threshold={0.12}>
                    <div className="mt-10 md:mt-16">
                        <ArticleCarousel articles={blogNodes[0].articles.nodes} categoryHandle={blogNodes[0].handle} />
                    </div>
                </AnimatedSection>
            )}

            {!featuredArticle && blogNodes.every(b => !b.articles?.nodes?.length) && (
                <AnimatedSection animation="fade" threshold={0.1}>
                    <div className="text-center py-12">
                        <p className="text-sm text-muted-foreground">No articles published yet.</p>
                    </div>
                </AnimatedSection>
            )}
            </div>
        </>
    );
}

const ArticleCarousel = ({articles, categoryHandle}: {articles: ArticleCardData[]; categoryHandle: string}) => {
    return (
        <div key={categoryHandle} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Carousel
                opts={{
                    align: "start",
                    loop: true,
                }}
                className="w-full"
            >
                <CarouselContent className="-ml-3 sm:-ml-4 md:-ml-6">
                    {articles.map((article, index) => (
                        <CarouselItem
                            key={article.handle}
                            className="pl-3 sm:pl-4 md:pl-6 basis-[80%] sm:basis-[45%] lg:basis-[32%] xl:basis-[27%] 2xl:basis-[22%]"
                        >
                            <ArticleCard
                                article={article}
                                index={index}
                                loading={index < 3 ? "eager" : "lazy"}
                                variant="default"
                                showTags={true}
                                showReadingTime={true}
                            />
                        </CarouselItem>
                    ))}
                </CarouselContent>
            </Carousel>

            {articles.length > 1 && (
                <div className="flex items-center justify-center gap-1.5 mt-4 sm:mt-6 md:hidden" aria-hidden="true">
                    {articles.slice(0, Math.min(articles.length, 5)).map(article => (
                        <div
                            key={`scroll-dot-${article.handle}`}
                            className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary/30"
                        />
                    ))}
                    {articles.length > 5 && (
                        <span className="text-sm text-muted-foreground ml-1">+{articles.length - 5}</span>
                    )}
                </div>
            )}
        </div>
    );
};

const BLOGS_WITH_ARTICLES_QUERY = `#graphql
  query BlogsWithArticles(
    $country: CountryCode
    $endCursor: String
    $first: Int
    $language: LanguageCode
    $last: Int
    $startCursor: String
  ) @inContext(country: $country, language: $language) {
    blogs(
      first: $first,
      last: $last,
      before: $startCursor,
      after: $endCursor
    ) {
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      nodes {
        title
        handle
        seo {
          title
          description
        }
        articles(first: 8, sortKey: PUBLISHED_AT, reverse: true) {
          nodes {
            handle
            title
            excerpt
            excerptHtml
            content
            contentHtml
            publishedAt
            tags
            image {
              id
              altText
              url
              width
              height
            }
            blog {
              handle
              title
            }
            author: authorV2 {
              name
            }
          }
        }
      }
    }
  }
` as const;

const LATEST_ARTICLES_QUERY = `#graphql
  query LatestArticles(
    $first: Int
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    articles(first: $first, sortKey: PUBLISHED_AT, reverse: true) {
      nodes {
        handle
        title
        excerpt
        excerptHtml
        content
        contentHtml
        publishedAt
        tags
        image {
          id
          altText
          url
          width
          height
        }
        blog {
          handle
          title
        }
        author: authorV2 {
          name
        }
      }
    }
  }
` as const;
