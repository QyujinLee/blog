"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { OwnerOnly } from "@/components/auth/owner-only";
import { PostForm } from "@/components/editor/post-form";
import { useCategories } from "@/hooks/use-categories";
import type { Post } from "@/lib/posts";

export default function EditPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const { data: post, isLoading: postLoading } = useQuery<Post | null>({
    queryKey: ["posts", slug],
    queryFn: async () => {
      const response = await fetch(`/api/posts/${encodeURIComponent(slug)}`);
      if (!response.ok) return null;
      return response.json();
    },
  });

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <OwnerOnly>
        <h1 className="mb-6 font-heading text-2xl font-bold">글 수정</h1>
        {postLoading || categoriesLoading ? (
          <p className="text-sm text-muted-foreground">불러오는 중...</p>
        ) : !post ? (
          <p className="text-sm text-muted-foreground">글을 찾을 수 없습니다.</p>
        ) : (
          <PostForm
            key={post.slug}
            slug={post.slug}
            initialValues={{
              title: post.title,
              summary: post.summary,
              body: post.body,
              category:
                categories.find((c) => c.slug === post.categorySlug)?.label ??
                post.categorySlug,
              tags: post.tags,
              seriesTitle: post.seriesTitle ?? "",
            }}
          />
        )}
      </OwnerOnly>
    </div>
  );
}
