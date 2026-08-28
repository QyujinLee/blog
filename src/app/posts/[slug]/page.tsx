import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Sidebar } from "@/components/layout/sidebar";
import { LastUpdated } from "@/components/post/last-updated";
import { MarkdownRenderer } from "@/components/post/markdown-renderer";
import { RelatedPosts } from "@/components/post/related-posts";
import { SeriesNav } from "@/components/post/series-nav";
import { TableOfContents } from "@/components/post/table-of-contents";
import { TagList } from "@/components/post/tag-list";
import { OwnerActions } from "@/components/post/owner-actions";
import { JsonLd } from "@/components/seo/json-ld";
import {
  fetchPostBySlug,
  fetchPosts,
  fetchPublicPosts,
  fetchCategories,
  categoryLabel,
} from "@/lib/posts";
import { extractHeadings } from "@/lib/extract-headings";
import { buildMetadata } from "@/lib/metadata";
import { SITE_URL } from "@/lib/site";

// hidden 글은 정적 생성 대상에서 뺌 — Draft Mode(소유자 미리보기)로 요청되면
// dynamicParams 기본 동작으로 그때 동적 렌더링됨 ("숨김 글 미리보기" 섹션 참고).
// generateStaticParams는 빌드 타임이라 draftMode()를 못 쓰는 fetchPublicPosts만 사용 가능
export async function generateStaticParams() {
  const posts = await fetchPublicPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await fetchPostBySlug(slug);

  if (!post) {
    return buildMetadata({ title: "글을 찾을 수 없습니다", description: "", path: `/posts/${slug}` });
  }

  return buildMetadata({ title: post.title, description: post.summary, path: `/posts/${post.slug}` });
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await fetchPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const [categories, seriesEntries] = await Promise.all([
    fetchCategories(),
    post.seriesSlug ? fetchPosts({ series: post.seriesSlug }) : Promise.resolve([]),
  ]);
  const headings = extractHeadings(post.body);

  return (
    <div className="mx-auto grid w-full max-w-5xl flex-1 gap-8 px-4 py-8 md:grid-cols-[240px_1fr]">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: post.title,
          description: post.summary,
          url: `${SITE_URL}/posts/${post.slug}`,
          image: `${SITE_URL}/posts/${post.slug}/opengraph-image`,
          datePublished: post.createdAt,
          dateModified: post.updatedAt,
          author: { "@type": "Person", name: "gyujin", url: SITE_URL },
        }}
      />

      <aside className="hidden md:block">
        <div className="sticky top-20">
          <Sidebar />
        </div>
      </aside>

      <article className="flex flex-col gap-6">
        <header className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <Badge variant="secondary" className="w-fit">
              {categoryLabel(categories, post.categorySlug)}
            </Badge>
            <OwnerActions post={post} />
          </div>
          <h1 className="font-heading text-2xl font-bold">{post.title}</h1>
          <p className="text-muted-foreground">{post.summary}</p>
          <LastUpdated createdAt={post.createdAt} updatedAt={post.updatedAt} />
          <TagList tags={post.tags} />
        </header>

        {post.seriesSlug && post.seriesTitle && (
          <SeriesNav
            seriesTitle={post.seriesTitle}
            entries={seriesEntries}
            currentSlug={post.slug}
          />
        )}

        {headings.length > 0 && (
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="mb-2 text-sm font-semibold">목차</p>
            <TableOfContents items={headings} />
          </div>
        )}

        <MarkdownRenderer body={post.body} headings={headings} />

        {post.seriesSlug && post.seriesTitle && (
          <SeriesNav
            seriesTitle={post.seriesTitle}
            entries={seriesEntries}
            currentSlug={post.slug}
          />
        )}

        <RelatedPosts post={post} categories={categories} />
      </article>
    </div>
  );
}
