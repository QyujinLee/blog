import { draftMode } from "next/headers";
import { cookies } from "next/headers";
import { API_URL, AUTH_COOKIE_NAME } from "./api";

// blog-api GET /posts, GET /posts/{slug} 등이 실제로 내려주는 응답 그대로 (blog-api-plan.md "데이터 모델" 참고)
export interface Post {
  id: string;
  slug: string;
  title: string;
  summary: string;
  body: string;
  categorySlug: string;
  tags: string[];
  seriesSlug: string | null;
  seriesTitle: string | null;
  seriesOrder: number | null;
  pinned: boolean;
  hidden: boolean;
  viewCount: number;
  likeCount: number;
  createdAt: string;
  updatedAt: string;
}

// 목록 응답(GET /posts)엔 body가 없다 — 사이드바가 모든 페이지에서 이 목록으로 태그 개수를
// 집계하는데 본문까지 실려 오면 글이 쌓일수록 매 페이지 수백 KB가 오간다. 본문이 필요한
// 상세/수정 화면은 fetchPostBySlug(단건)로 따로 가져간다.
export type PostSummary = Omit<Post, "body">;

export interface Category {
  slug: string;
  label: string;
}

// Draft Mode(소유자가 로그인 상태로 미리보기 중)일 때만 쿠키의 JWT를 Authorization으로 실어보냄 —
// hidden 글까지 보여줘야 하고, 캐시도 우회해야 해서(숨김 글 미리보기" 섹션 참고)
async function authHeaders(): Promise<{
  headers: Record<string, string>;
  isDraft: boolean;
}> {
  const { isEnabled } = await draftMode();

  if (!isEnabled) {
    return { headers: {}, isDraft: false };
  }

  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
  return {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    isDraft: true,
  };
}

// 예전엔 non-2xx를 빈 배열로 삼켜서, 백엔드가 5xx(Render 콜드스타트 502, DB 다운 등)일 때
// "글이 0개인 정상 사이트"와 구분이 안 됐다 — 빌드가 경고 하나 없이 exit 0으로 통과하고
// 빈 사이트가 배포된다. 온디맨드 ISR이라 그렇게 한 번 배포되면 재검증 웹훅이 올 때까지 계속
// 빈 상태로 남는다. 그래서 던져서 빌드를 실패시킨다. (연결 자체가 실패하는 경우는 fetch가
// 이미 throw하지만, .next/cache의 fetch 캐시가 살아있으면 그마저 조용히 넘어간다.)
// 글이 없는 것(200 + [])은 정상이므로 그대로 통과한다.
async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`blog-api ${init?.method ?? "GET"} ${url} 실패: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

interface FetchPostsParams {
  category?: string;
  tags?: string[];
  series?: string;
}

export async function fetchPosts(params: FetchPostsParams = {}): Promise<PostSummary[]> {
  const { headers, isDraft } = await authHeaders();
  const search = new URLSearchParams();
  if (params.category) search.set("category", params.category);
  if (params.tags?.length) search.set("tags", params.tags.join(","));
  if (params.series) search.set("series", params.series);
  const query = search.toString();

  return fetchJson<PostSummary[]>(`${API_URL}/posts${query ? `?${query}` : ""}`, {
    headers,
    cache: isDraft ? "no-store" : "force-cache",
  });
}

export async function fetchPostBySlug(slug: string): Promise<Post | null> {
  const { headers, isDraft } = await authHeaders();
  // 실제로 재현해서 발견한 버그: generateStaticParams에 없는 슬러그(=새로 만든 글)로
  // 진입하면, 두 번 호출되는 params.slug(generateMetadata용/페이지 본문용) 중 한쪽이
  // 이미 percent-encode된 채로 들어옴 — 그대로 encodeURIComponent하면 이중 인코딩되어
  // 백엔드가 404를 내고 notFound()가 호출됨. decodeURIComponent로 먼저 정규화한 뒤
  // 다시 인코딩해서 두 경우 다 안전하게 처리
  const normalizedSlug = decodeURIComponent(slug);

  const response = await fetch(
    `${API_URL}/posts/${encodeURIComponent(normalizedSlug)}`,
    { headers, cache: isDraft ? "no-store" : "force-cache" },
  );

  // 404는 "없는 글" — notFound()로 이어져야 할 정상 흐름이라 null. 그 외 5xx 등은 장애이므로 던짐
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`blog-api GET /posts/${normalizedSlug} 실패: ${response.status}`);
  }
  return response.json();
}

// generateStaticParams 전용 — 빌드 타임엔 요청 컨텍스트가 없어 draftMode()/cookies()를 못 씀
// (공식 에러 메시지로 확인: "draftMode() inside generateStaticParams is not supported").
// 어차피 정적 생성 대상은 공개 글 목록이라 draft 인식이 필요하지도 않음
export async function fetchPublicPosts(params: FetchPostsParams = {}): Promise<PostSummary[]> {
  const search = new URLSearchParams();
  if (params.category) search.set("category", params.category);
  if (params.tags?.length) search.set("tags", params.tags.join(","));
  if (params.series) search.set("series", params.series);
  const query = search.toString();

  return fetchJson<PostSummary[]>(`${API_URL}/posts${query ? `?${query}` : ""}`, {
    cache: "force-cache",
  });
}

export async function fetchCategories(): Promise<Category[]> {
  return fetchJson<Category[]>(`${API_URL}/categories`, { cache: "force-cache" });
}

export function categoryLabel(categories: Category[], slug: string): string {
  return categories.find((category) => category.slug === slug)?.label ?? slug;
}
