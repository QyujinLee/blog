"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Post, PostSummary } from "@/lib/posts";

export type SortOption = "relevance" | "latest";

export interface PostSearchParams {
  q?: string;
  category?: string;
  tags?: string[];
  sort?: SortOption;
}

export function usePosts(params: PostSearchParams) {
  const query = params.q?.trim();
  const hasFilter = Boolean(params.category || params.tags?.length);

  return useQuery<PostSummary[]>({
    queryKey: ["posts", "search", params],
    enabled: Boolean(query) || hasFilter,
    queryFn: async ({ signal }) => {
      const search = new URLSearchParams();
      if (params.category) search.set("category", params.category);
      if (params.tags?.length) search.set("tags", params.tags.join(","));

      // 백엔드 /posts/search는 q가 필수라 없으면 400을 낸다. 사이드바·글 상세의 태그 링크는
      // q 없이 /search?tags=...로 들어오므로, 그 경우엔 같은 필터를 지원하는 목록 API로 조회한다
      // (GET /posts는 category/tags 필터 + createdAt desc 정렬을 이미 지원)
      if (query) {
        search.set("q", query);
        if (params.sort) search.set("sort", params.sort);
      }

      const response = await fetch(
        `${query ? "/api/posts/search" : "/api/posts"}?${search.toString()}`,
        { signal },
      );
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
