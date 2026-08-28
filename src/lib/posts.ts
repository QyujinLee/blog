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

interface FetchPostsParams {
  category?: string;
  tags?: string[];
  series?: string;
}

export async function fetchPosts(params: FetchPostsParams = {}): Promise<Post[]> {
  const { headers, isDraft } = await authHeaders();
  const search = new URLSearchParams();
  if (params.category) search.set("category", params.category);
  if (params.tags?.length) search.set("tags", params.tags.join(","));
  if (params.series) search.set("series", params.series);
  const query = search.toString();

  const response = await fetch(`${API_URL}/posts${query ? `?${query}` : ""}`, {
    headers,
    cache: isDraft ? "no-store" : "force-cache",
  });

  if (!response.ok) return [];
  return response.json();
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

  if (!response.ok) return null;
  return response.json();
}

// generateStaticParams 전용 — 빌드 타임엔 요청 컨텍스트가 없어 draftMode()/cookies()를 못 씀
// (공식 에러 메시지로 확인: "draftMode() inside generateStaticParams is not supported").
// 어차피 정적 생성 대상은 공개 글 목록이라 draft 인식이 필요하지도 않음
export async function fetchPublicPosts(params: FetchPostsParams = {}): Promise<Post[]> {
  const search = new URLSearchParams();
  if (params.category) search.set("category", params.category);
  if (params.tags?.length) search.set("tags", params.tags.join(","));
  if (params.series) search.set("series", params.series);
  const query = search.toString();

  const response = await fetch(`${API_URL}/posts${query ? `?${query}` : ""}`, {
    cache: "force-cache",
  });

  if (!response.ok) return [];
  return response.json();
}

export async function fetchCategories(): Promise<Category[]> {
  const response = await fetch(`${API_URL}/categories`, { cache: "force-cache" });
  if (!response.ok) return [];
  return response.json();
}

export function categoryLabel(categories: Category[], slug: string): string {
  return categories.find((category) => category.slug === slug)?.label ?? slug;
}
