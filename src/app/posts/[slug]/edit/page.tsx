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
  const { data: post, isLoading: postLoading, isError: postError } = useQuery<Post | null>({
    queryKey: ["posts", slug],
    queryFn: async () => {
      const response = await fetch(`/api/posts/${encodeURIComponent(slug)}`);
      // 404만 "없는 글" — 5xx까지 null로 삼키면 장애가 "글을 찾을 수 없습니다"로 둔갑함
      if (response.status === 404) return null;
      if (!response.ok) throw new Error("글을 불러오지 못했습니다.");
      return response.json();
    },
  });

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <OwnerOnly>
        <h1 className="mb-6 font-heading text-2xl font-bold">글 수정</h1>
        {/* post를 에러보다 먼저 본다 — 작성 중 창 포커스 재조회가 실패해도 TanStack Query는
            기존 data를 유지한 채 isError만 켜므로, 에러를 먼저 보면 폼이 언마운트돼 입력이 날아감 */}
        {postLoading || categoriesLoading ? (
          <p className="text-sm text-muted-foreground">불러오는 중...</p>
        ) : post ? (
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
        ) : postError ? (
          <p className="text-sm text-destructive">
            글을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">글을 찾을 수 없습니다.</p>
        )}
      </OwnerOnly>
    </div>
  );
}
