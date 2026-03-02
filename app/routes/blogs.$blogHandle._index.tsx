import {Link, useLoaderData} from "react-router";
import type {Route} from "./+types/blogs.$blogHandle._index";
import {getPaginationVariables, getSeoMeta, Pagination} from "@shopify/hydrogen";
import {redirectIfHandleIsLocalized} from "~/lib/redirect";
import {ArticleCard, type ArticleCardData} from "~/components/blog/ArticleCard";
import {ArticleHero} from "~/components/blog/ArticleHero";
import {Badge} from "~/components/ui/badge";
import {Button} from "~/components/ui/button";
import {ChevronLeft, ChevronRight} from "lucide-react";
import {GiantText} from "~/components/common/GiantText";
import {PageBreadcrumbs} from "~/components/common/PageBreadcrumbs";
import {cn} from "~/lib/utils";

export const meta: Route.MetaFunction = ({data, matches}) => {
    const shopName =
        (matches.find(m => m?.id === "root") as {data?: {header?: {shop?: {name?: string}}}} | undefined)?.data?.header
            ?.shop?.name ?? "Store";
    const blog = data?.blog;
    const featuredArticle = data?.featuredArticle;

    if (!blog) return [{title: `Blog | ${shopName}`}];

    const title = blog.seo?.title || `${blog.title} | Blog`;
    const description = blog.seo?.description || `Explore articles from ${blog.title}.`;

    return (
        getSeoMeta({
            title,
            description,
            media: featuredArticle?.image?.url
                ? {
                      url: featuredArticle.image.url,
                      width: featuredArticle.image.width,
                      height: featuredArticle.image.height,
                      altText: featuredArticle.image.altText || blog.title,
                      type: "image" as const,
                  }
                : undefined,
        }) ?? []
    );
};

export async function loader({context, request, params}: Route.LoaderArgs) {
    const paginationVariables = getPaginationVariables(request, {
        pageBy: 10,
    });

    if (!params.blogHandle) {
        throw new Response("blog not found", {status: 404});
    }

    const url = new URL(request.url);
    const tagFilter = url.searchParams.get("tag");

    const [{blog}] = await Promise.all([
        context.dataAdapter.query(BLOG_QUERY, {
            variables: {
                blogHandle: params.blogHandle,
                tagQuery: tagFilter ? `tag:${tagFilter}` : null,
                ...paginationVariables,
            },
        }),
    ]);

    if (!blog?.articles?.nodes || blog.articles.nodes.length === 0) {
        throw new Response("Not found", {status: 404});
    }

    redirectIfHandleIsLocalized(request, {handle: params.blogHandle, data: blog});

    const allArticles = blog.articles.nodes as ArticleCardData[];

    const featuredArticle = tagFilter ? null : allArticles[0] || null;

    const remainingArticles = {
        ...blog.articles,
        nodes: tagFilter ? allArticles : allArticles.slice(1),
    };

    const allTags = [...new Set(allArticles.flatMap(a => a.tags || []))].sort();

    return {
        blog,
        featuredArticle,
        articles: remainingArticles,
        allTags,
        activeTag: tagFilter,
    };
}

export default function Blog() {
    const {blog, featuredArticle, articles, allTags, activeTag} = useLoaderData<typeof loader>();

    return (
        <>
            <PageBreadcrumbs />

            <section className="py-8">
                <div className="mx-auto max-w-[2000px] px-2 md:px-4">
                    <div className="flex w-full flex-col items-center justify-center gap-2 text-center xl:gap-4">
                        <GiantText
                            text={blog.title}
                            className={cn(
                                "w-full font-black",
                                blog.title.length <= 7 ? "lg:w-[30%]" : "lg:w-[60%]",
                            )}
                        />
                        {blog.seo?.description && (
                            <p className="text-muted-foreground w-full text-xs lg:w-[60%] lg:text-sm 2xl:text-base">
                                {blog.seo.description}
                            </p>
                        )}
                    </div>
                </div>
            </section>

            <div className="mx-auto max-w-[2000px] px-2 md:px-4 pb-12 md:pb-20">
            {featuredArticle && <ArticleHero article={featuredArticle} variant="listing" />}

            {allTags.length > 0 && (
                <nav className="flex flex-wrap items-center gap-2 mt-8 md:mt-12" aria-label="Filter by topic">
                    <Badge variant={!activeTag ? "default" : "outline"} asChild>
                        <Link to={`/blogs/${blog.handle}`} prefetch="viewport" className="cursor-pointer">
                            All
                        </Link>
                    </Badge>
                    {allTags.map(tag => (
                        <Badge key={tag} variant={activeTag === tag ? "default" : "outline"} asChild>
                            <Link
                                to={`/blogs/${blog.handle}?tag=${encodeURIComponent(tag)}`}
                                prefetch="viewport"
                                className="cursor-pointer"
                            >
                                {tag}
                            </Link>
                        </Badge>
                    ))}
                </nav>
            )}

            {articles.nodes.length > 0 && (
                <section className="mt-8 md:mt-12 space-y-8">
                    <h2 className="font-serif text-xl font-bold uppercase text-foreground md:text-3xl">
                        {activeTag ? `Tagged: ${activeTag}` : "More Articles"}
                    </h2>

                    <Pagination connection={articles}>
                        {({nodes, NextLink, PreviousLink, hasNextPage, hasPreviousPage}) => (
                            <>
                                {hasPreviousPage && (
                                    <div className="mb-6 flex justify-center">
                                        <Button variant="outline" asChild>
                                            <PreviousLink>
                                                <ChevronLeft className="mr-2 h-4 w-4" /> Previous
                                            </PreviousLink>
                                        </Button>
                                    </div>
                                )}

                                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                                    {(nodes as ArticleCardData[]).map((article: ArticleCardData, index: number) => (
                                        <ArticleCard
                                            key={article.handle}
                                            article={article}
                                            index={index}
                                            loading={index < 6 ? "eager" : "lazy"}
                                            variant="default"
                                            showTags={true}
                                            showReadingTime={true}
                                        />
                                    ))}
                                </div>

                                {hasNextPage && (
                                    <div className="mt-8 flex justify-center">
                                        <Button variant="outline" asChild>
                                            <NextLink>
                                                Next <ChevronRight className="ml-2 h-4 w-4" />
                                            </NextLink>
                                        </Button>
                                    </div>
                                )}
                            </>
                        )}
                    </Pagination>
                </section>
            )}

            {!featuredArticle && articles.nodes.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-sm text-muted-foreground">No articles published yet.</p>
                </div>
            )}
            </div>
        </>
    );
}

const BLOG_QUERY = `#graphql
  query Blog(
    $language: LanguageCode
    $blogHandle: String!
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
    $tagQuery: String
  ) @inContext(language: $language) {
    blog(handle: $blogHandle) {
      title
      handle
      seo {
        title
        description
      }
      articles(
        first: $first,
        last: $last,
        before: $startCursor,
        after: $endCursor,
        sortKey: PUBLISHED_AT,
        reverse: true,
        query: $tagQuery
      ) {
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
        pageInfo {
          hasPreviousPage
          hasNextPage
          endCursor
          startCursor
        }
      }
    }
  }
` as const;
