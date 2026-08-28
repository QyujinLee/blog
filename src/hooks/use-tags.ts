"use client";

import { useQuery } from "@tanstack/react-query";

export function useTags() {
  return useQuery<string[]>({
    queryKey: ["tags"],
    queryFn: async () => {
      const response = await fetch("/api/tags");
      // 태그도 자동완성용 보조 데이터라 실패해도 빈 배열로 조용히 성능 저하(use-categories.ts와 동일한 이유)
      if (!response.ok) return [];
      return response.json();
    },
  });
}
