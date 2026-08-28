"use client";

import { useQuery } from "@tanstack/react-query";

export interface PopularPost {
  slug: string;
  title: string;
  viewCount: number;
}

export interface VisitPoint {
  date: string;
  count: number;
}

export function usePopularPosts(limit = 5) {
  return useQuery<PopularPost[]>({
    queryKey: ["stats", "popular-posts", limit],
    queryFn: async () => {
      const response = await fetch(`/api/stats/popular-posts?limit=${limit}`);
      if (!response.ok) throw new Error("인기글을 불러오지 못했습니다.");
      return response.json();
    },
    throwOnError: true,
  });
}

export function useVisits(days = 30) {
  return useQuery<VisitPoint[]>({
    queryKey: ["stats", "visits", days],
    queryFn: async () => {
      const response = await fetch(`/api/stats/visits?days=${days}`);
      if (!response.ok) throw new Error("조회 추이를 불러오지 못했습니다.");
      return response.json();
    },
    throwOnError: true,
  });
}
