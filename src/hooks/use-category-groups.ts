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
      if (!response.ok) return [];
      return response.json();
    },
    // ponytail: 사이드바가 모든 페이지에 떠 있어서 매 마운트마다 전체 글 목록을 다시 불러오면
    // 낭비가 커짐 — 카테고리/태그 집계가 초 단위로 안 바뀌어도 되는 데이터라 1분 정도는 캐시.
    // 더 정확히 하려면 서버에서 미리 그룹핑해서 내려주는 구조로 바꿔야 하는데 지금은 과함(YAGNI)
    staleTime: 60 * 1000,
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
