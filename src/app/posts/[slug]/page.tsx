import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Sidebar } from "@/components/layout/sidebar";
import { LastUpdated } from "@/components/post/last-updated";
import { MarkdownRenderer } from "@/components/post/markdown-renderer";
import { RelatedPosts } from "@/components/post/related-posts";
import { SeriesNav } from "@/components/post/series-nav";
import { TableOfContents } from "@/components/post/table-of-contents";
import { TagList } from "@/components/post/tag-list";
import { categoryLabel } from "@/data/categories";
import { posts } from "@/data/posts";
import { extractHeadings } from "@/lib/extract-headings";

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = posts.find((candidate) => candidate.slug === slug);

  if (!post || post.hidden) {
    notFound();
  }

  const headings = extractHeadings(post.body);

  return (
    <div className="mx-auto grid w-full max-w-5xl flex-1 gap-8 px-4 py-8 md:grid-cols-[240px_1fr]">
      <aside className="hidden md:block">
        <div className="sticky top-20">
          <Sidebar />
        </div>
      </aside>

      <article className="flex flex-col gap-6">
        <header className="flex flex-col gap-3">
          <Badge variant="secondary" className="w-fit">
            {categoryLabel(post.category)}
          </Badge>
          <h1 className="font-heading text-2xl font-bold">{post.title}</h1>
          <p className="text-muted-foreground">{post.summary}</p>
          <LastUpdated createdAt={post.createdAt} updatedAt={post.updatedAt} />
          <TagList tags={post.tags} />
        </header>

        {post.series && <SeriesNav series={post.series} currentSlug={post.slug} />}

        {headings.length > 0 && (
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="mb-2 text-sm font-semibold">목차</p>
            <TableOfContents items={headings} />
          </div>
        )}

        <MarkdownRenderer body={post.body} headings={headings} />

        {post.series && <SeriesNav series={post.series} currentSlug={post.slug} />}

        <RelatedPosts post={post} />
      </article>
    </div>
  );
}
