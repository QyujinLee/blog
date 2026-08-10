"use client";

import { useQuery } from "@tanstack/react-query";
import { posts as allPosts, type Post } from "@/data/posts";

export type SortOption = "relevance" | "latest" | "views";

export interface PostSearchParams {
  q?: string;
  category?: string;
  tags?: string[];
  sort?: SortOption;
}

// TODO(4차 — 백엔드 연동): GET /posts/search?q=&sort=&category=&tags= 프록시 호출로 교체
function searchPosts({ q, category, tags, sort }: PostSearchParams): Post[] {
  const query = q?.trim().toLowerCase();

  const filtered = allPosts.filter((post) => {
    if (post.hidden) return false;
    if (category && post.category !== category) return false;
    if (tags?.length && !tags.every((tag) => post.tags.includes(tag))) return false;
    if (
      query &&
      !post.title.toLowerCase().includes(query) &&
      !post.summary.toLowerCase().includes(query)
    ) {
      return false;
    }
    return true;
  });

  if (sort === "views") {
    return [...filtered].sort((a, b) => b.viewCount - a.viewCount);
  }
  if (sort === "latest") {
    return [...filtered].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }
  // relevance: 실제 랭킹(ts_rank)은 백엔드 full-text search 담당, 목업은 필터링 순서 그대로 반환
  return filtered;
}

export function usePosts(params: PostSearchParams) {
  return useQuery({
    queryKey: ["posts", "search", params],
    queryFn: async ({ signal }) => {
      void signal; // 실제 fetch로 교체 시 이 signal을 전달해 취소를 지원
      return searchPosts(params);
    },
  });
}
