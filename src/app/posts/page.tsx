import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Sidebar } from "@/components/layout/sidebar";
import { fetchPosts, fetchCategories, categoryLabel } from "@/lib/posts";
import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata({
  title: "전체 글",
  description: "실무에서 마주친 문제와 해결 과정을 정리합니다",
  path: "/posts",
});

export default async function PostsPage() {
  const [posts, categories] = await Promise.all([fetchPosts(), fetchCategories()]);
  const visiblePosts = [...posts].sort((a, b) =>
    a.createdAt < b.createdAt ? 1 : -1,
  );

  return (
    <div className="mx-auto grid w-full max-w-5xl flex-1 gap-8 px-4 py-8 md:grid-cols-[240px_1fr]">
      <aside className="hidden md:block">
        <div className="sticky top-20">
          <Sidebar />
        </div>
      </aside>

      <div className="flex flex-col gap-6">
        <h1 className="font-heading text-2xl font-bold">전체 글</h1>
        <ul className="flex flex-col gap-3">
          {visiblePosts.map((post) => (
            <li key={post.slug}>
              <Link
                href={`/posts/${post.slug}`}
                className="flex flex-col gap-1.5 rounded-lg border border-border bg-card p-4 hover:bg-muted"
              >
                <Badge variant="secondary" className="w-fit">
                  {categoryLabel(categories, post.categorySlug)}
                </Badge>
                <span className="font-heading font-semibold">{post.title}</span>
                <span className="text-sm text-muted-foreground">{post.summary}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
