"use client";

import { useQuery } from "@tanstack/react-query";
import type { Category } from "@/lib/posts";

export type { Category };

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await fetch("/api/categories");
      // 카테고리는 자동완성용 보조 데이터라 실패해도 전체 화면을 무너뜨릴 필요 없음 —
      // lib/posts.ts의 fetchCategories와 동일하게 빈 배열로 조용히 성능 저하(자유 입력은 계속 가능)
      if (!response.ok) return [];
      return response.json();
    },
  });
}
