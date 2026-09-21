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
      // 빈 배열로 조용히 성능 저하(자유 입력은 계속 가능). 서버의 fetchCategories는 반대로
      // 던진다 — 빌드/렌더에서 백엔드 장애를 "카테고리 0개"로 삼키면 안 되기 때문
      if (!response.ok) return [];
      return response.json();
    },
  });
}
