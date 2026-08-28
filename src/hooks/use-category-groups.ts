"use client";

import { useQuery } from "@tanstack/react-query";
import { useCategories } from "./use-categories";

export interface CategoryGroup {
  slug: string;
  label: string;
  tags: { name: string; count: number }[];
}

interface PublicPost {
  categorySlug: string;
  tags: string[];
}

// 사이드바 카테고리 아코디언용 — GET /posts 결과를 category → tags(개수 포함)로 클라이언트에서 그룹핑
// (blog-api엔 이 그룹 구조를 바로 주는 엔드포인트가 없음)
export function useCategoryGroups() {
  const { data: categories = [] } = useCategories();
  const { data: posts = [] } = useQuery<PublicPost[]>({
    queryKey: ["posts", "all-public"],
    queryFn: async () => {
      const response = await fetch("/api/posts");
      return response.json();
    },
  });

  const groups: CategoryGroup[] = categories.map((category) => {
    const tagCounts = new Map<string, number>();

    for (const post of posts) {
      if (post.categorySlug !== category.slug) continue;
      for (const tag of post.tags) {
        tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
      }
    }

    return {
      slug: category.slug,
      label: category.label,
      tags: Array.from(tagCounts.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
    };
  });

  return groups;
}
