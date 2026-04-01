import {Link, useLoaderData} from "react-router";
import type {Route} from "./+types/blogs.$blogHandle.$articleHandle";
import {Image, getSeoMeta} from "@shopify/hydrogen";
import {ArrowLeft} from "lucide-react";
import {redirectIfHandleIsLocalized} from "~/lib/redirect";
import {calculateReadingTime, formatArticleDate, filterRelatedArticles} from "~/lib/blog-utils";
import {generateBlogPostingSchema, buildCanonicalUrl, getSiteUrlFromMatches} from "~/lib/seo";
import {PageBreadcrumbs} from "~/components/common/PageBreadcrumbs";
import {TagList} from "~/components/blog/TagBadge";
import {ShareButtons} from "~/components/blog/ShareButtons";
import {AuthorBio} from "~/components/blog/AuthorBio";
import {RelatedArticles} from "~/components/blog/RelatedArticles";
import type {ArticleCardData} from "~/components/blog/ArticleCard";
import {useReadingProgress} from "~/hooks/useReadingProgress";
import {Badge} from "~/components/ui/badge";
import {Button} from "~/components/ui/button";
import {AnimatedSection} from "~/components/sections/AnimatedSection";

export const meta: Route.MetaFunction = ({data, matches}) => {
    const shopName =
        (
            matches.find(m => m?.id === "root") as
                | {data?: {siteContent?: {siteSettings?: {brandName?: string; siteUrl?: string}}}}
                | undefined
        )?.data?.siteContent?.siteSettings?.brandName ?? "Store";
    const article = data?.article;
    const blogHandle = data?.blogHandle;

    if (!article) return [{title: "Article Not Found"}];

    const siteUrl = getSiteUrlFromMatches(matches);
    const title = article.seo?.title || article.title;
    const description = article.seo?.description || (article.excerpt ? article.excerpt.substring(0, 155) : "");
    const articlePath = `/blogs/${blogHandle || "news"}/${article.handle}`;

    return (
        getSeoMeta({
            title,
            description,
            url: buildCanonicalUrl(articlePath, siteUrl),
            media: article.image?.url
                ? {
                      url: article.image.url,
                      width: article.image.width,
                      height: article.image.height,
                      altText: article.image.altText || article.title,
                      type: "image" as const
                  }
                : undefined,
            jsonLd: generateBlogPostingSchema(article, blogHandle || "news", shopName) as any
        }) ?? []
    );
};

export async function loader({context, request, params}: Route.LoaderArgs) {
    const {blogHandle, articleHandle} = params;

    if (!articleHandle || !blogHandle) {
        throw new Response("Not found", {status: 404});
    }

    const [{blog}] = await Promise.all([
        context.dataAdapter.query(ARTICLE_QUERY, {
            variables: {blogHandle, articleHandle}
        })
    ]);

    if (!blog?.articleByHandle) {
        throw new Response(null, {status: 404});
    }

    redirectIfHandleIsLocalized(
        request,
        {handle: articleHandle, data: blog.articleByHandle},
        {handle: blogHandle, data: blog}
    );

    const article = blog.articleByHandle;
    const readingTime = calculateReadingTime(article.contentHtml || article.content || "");
    const allArticles = (blog.articles?.nodes || []) as ArticleCardData[];

    const relatedArticles = filterRelatedArticles(allArticles, article, 4);

    return {
        article,
        blogHandle,
        blogTitle: blog.title,
        readingTime,
        relatedArticles
    };
}

export default function Article() {
    const {article, blogHandle, blogTitle, readingTime, relatedArticles} = useLoaderData<typeof loader>();
    const {title, image, contentHtml, author, tags, publishedAt} = article;

    const publishedDate = formatArticleDate(publishedAt);
    const {contentRef, progress} = useReadingProgress();

    return (
        <div className="pb-16 md:pb-20 lg:pb-24">
            <div
                className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-transparent pointer-events-none"
                role="progressbar"
                aria-valuenow={Math.round(progress)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Reading progress"
            >
                <div
                    className="h-full bg-primary transition-[width] duration-150 ease-out"
                    style={{width: `${progress}%`}}
                />
            </div>

            <PageBreadcrumbs />

            {image && (
                <AnimatedSection animation="fade" threshold={0.08}>
                    <div className="relative w-full overflow-hidden md:rounded-2xl md:mx-auto md:max-w-5xl">
                        <div className="aspect-[16/9] relative">
                            <Image
                                data={image}
                                sizes="(min-width: 1280px) 1024px, (min-width: 768px) 90vw, 100vw"
                                loading="eager"
                                className="h-full w-full object-cover absolute inset-0"
                            />
                            <div
                                className="absolute inset-x-0 bottom-0 h-24 pointer-events-none"
                                style={{background: "linear-gradient(to top, var(--color-background), transparent)"}}
                                aria-hidden="true"
                            />
                        </div>
                    </div>
                </AnimatedSection>
            )}

            <AnimatedSection animation="slide-up" threshold={0.1}>
                <article className="mx-auto max-w-[2000px] px-2 md:px-4">
                    <header className="mx-auto max-w-3xl text-center space-y-5 md:space-y-6 pt-6 md:pt-8 mb-10 md:mb-14 lg:mb-16">
                        {tags && tags.length > 0 && (
                            <div className="flex justify-center">
                                <TagList tags={tags} variant="outline" size="sm" blogHandle={blogHandle} />
                            </div>
                        )}

                        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-medium leading-[1.15] tracking-tight text-primary">
                            {title}
                        </h1>

                        <div className="flex flex-wrap items-center justify-center gap-2">
                            <Badge variant="secondary">
                                <time dateTime={publishedAt}>{publishedDate}</time>
                            </Badge>
                            <Badge variant="secondary">{readingTime} min read</Badge>
                            {author?.name && <Badge variant="outline">{author.name}</Badge>}
                        </div>

                        <div className="flex justify-center pt-2" aria-hidden="true">
                            <div className="w-12 h-px bg-primary/30" />
                        </div>
                    </header>

                    {/* Article HTML content from Shopify admin — trusted source */}
                    <div
                        ref={contentRef}
                        dangerouslySetInnerHTML={{__html: contentHtml}}
                        className="article-content mx-auto max-w-3xl py-8 md:py-10 lg:py-12"
                    />

                    <div className="mx-auto max-w-3xl pt-8 md:pt-10 pb-6 md:pb-8">
                        <ShareButtons
                            article={{
                                title,
                                excerpt: article.excerpt,
                                image: article.image,
                                blog: {handle: blogHandle},
                                handle: article.handle
                            }}
                            variant="inline"
                        />
                    </div>

                    {author?.bio && (
                        <div className="mx-auto max-w-3xl pb-6 md:pb-8">
                            <AuthorBio author={author} variant="card" />
                        </div>
                    )}

                    <div className="mx-auto max-w-3xl pt-4 md:pt-6 pb-8 md:pb-12">
                        <Button variant="ghost" asChild>
                            <Link
                                to={`/blogs/${blogHandle}`}
                                prefetch="viewport"
                                className="inline-flex items-center gap-2"
                            >
                                <ArrowLeft className="size-4" />
                                Back to {blogTitle || "Blog"}
                            </Link>
                        </Button>
                    </div>
                </article>
            </AnimatedSection>

            {relatedArticles && relatedArticles.length > 0 && (
                <AnimatedSection animation="fade" threshold={0.1}>
                    <div className="mt-12 sm:mt-16 md:mt-20 mx-auto max-w-[2000px] px-2 md:px-4">
                        <RelatedArticles articles={relatedArticles} title="More Articles" />
                    </div>
                </AnimatedSection>
            )}
        </div>
    );
}

const ARTICLE_QUERY = `#graphql
  query Article(
    $articleHandle: String!
    $blogHandle: String!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(language: $language, country: $country) {
    blog(handle: $blogHandle) {
      handle
      title
      articleByHandle(handle: $articleHandle) {
        handle
        title
        content
        contentHtml
        excerpt
        excerptHtml
        publishedAt
        tags
        author: authorV2 {
          name
          bio
          firstName
          lastName
        }
        image {
          id
          altText
          url
          width
          height
        }
        seo {
          description
          title
        }
      }
      articles(first: 10, sortKey: PUBLISHED_AT, reverse: true) {
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
` as const;

export {RouteErrorBoundary as ErrorBoundary} from "~/components/RouteErrorBoundary";
