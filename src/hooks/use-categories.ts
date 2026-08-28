"use client";

import { useQuery } from "@tanstack/react-query";

export interface Category {
  slug: string;
  label: string;
}

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await fetch("/api/categories");
      return response.json();
    },
  });
}
