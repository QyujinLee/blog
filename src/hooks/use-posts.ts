"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Post } from "@/lib/posts";

export type SortOption = "relevance" | "latest";

export interface PostSearchParams {
  q?: string;
  category?: string;
  tags?: string[];
  sort?: SortOption;
}

export function usePosts(params: PostSearchParams) {
  return useQuery<Post[]>({
    queryKey: ["posts", "search", params],
    enabled: Boolean(params.q?.trim()),
    queryFn: async ({ signal }) => {
      const search = new URLSearchParams();
      search.set("q", params.q!.trim());
      if (params.sort) search.set("sort", params.sort);
      if (params.category) search.set("category", params.category);
      if (params.tags?.length) search.set("tags", params.tags.join(","));

      const response = await fetch(`/api/posts/search?${search.toString()}`, {
        signal,
      });
      if (!response.ok) throw new Error("검색에 실패했습니다.");
      return response.json();
    },
  });
}

export interface PostFormValues {
  title: string;
  summary: string;
  body: string;
  category: string;
  tags: string[];
  seriesTitle?: string;
}

async function postJson<T>(
  url: string,
  method: string,
  body?: unknown,
): Promise<T> {
  const response = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const message = Array.isArray(error.message)
      ? error.message[0]
      : (error.message ?? "요청에 실패했습니다.");
    throw new Error(message);
  }

  if (response.status === 204) return null as T;
  return response.json();
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: PostFormValues) =>
      postJson<Post>("/api/posts", "POST", values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}

export function useUpdatePost(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: PostFormValues) =>
      postJson<Post>(`/api/posts/${encodeURIComponent(slug)}`, "PUT", values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}

export function usePatchPost(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: { hidden?: boolean; pinned?: boolean }) =>
      postJson<Post>(`/api/posts/${encodeURIComponent(slug)}`, "PATCH", values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) =>
      postJson<null>(`/api/posts/${encodeURIComponent(slug)}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}
