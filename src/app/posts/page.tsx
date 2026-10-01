import { PostCard } from "@/components/post/post-card";
import { Sidebar } from "@/components/layout/sidebar";
import { fetchPosts, fetchCategories, categoryLabel } from "@/lib/posts";
import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata({
  title: "전체 글",
  description: "실무에서 마주친 문제와 해결 과정을 정리합니다",
  path: "/posts",
});

export default async function PostsPage() {
  // 백엔드가 이미 createdAt desc로 정렬해서 내려줌
  const [posts, categories] = await Promise.all([fetchPosts(), fetchCategories()]);

  return (
    <div className="mx-auto grid w-full max-w-5xl flex-1 gap-8 px-4 py-8 md:grid-cols-[240px_1fr]">
      <aside className="hidden md:block">
        <div className="sticky top-[var(--header-h)] transition-[top] duration-200 motion-reduce:transition-none">
          <Sidebar />
        </div>
      </aside>

      <div className="flex flex-col gap-6">
        <h1 className="font-heading text-2xl font-bold">전체 글</h1>
        {posts.length === 0 && (
          <p className="text-sm text-muted-foreground">아직 등록된 글이 없습니다.</p>
        )}
        <ul className="flex flex-col gap-3">
          {posts.map((post) => (
            <li key={post.slug}>
              <PostCard
                slug={post.slug}
                title={post.title}
                summary={post.summary}
                categoryLabel={categoryLabel(categories, post.categorySlug)}
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
