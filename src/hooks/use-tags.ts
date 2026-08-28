"use client";

import { useQuery } from "@tanstack/react-query";

export function useTags() {
  return useQuery<string[]>({
    queryKey: ["tags"],
    queryFn: async () => {
      const response = await fetch("/api/tags");
      return response.json();
    },
  });
}
