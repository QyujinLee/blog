import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { fetchPublicPosts } from "@/lib/posts";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // fetchPosts()는 draftMode 활성 시(소유자 로그인 상태) hidden 글까지 포함해서 응답함 —
  // sitemap은 무조건 공개 글만 나와야 하므로 draft 인식이 없는 fetchPublicPosts를 써야 함
  // (코드 리뷰로 실제로 발견한 버그: fetchPosts를 쓰면 소유자가 로그인한 채로 이 라우트가
  // 렌더링될 때 숨김 글 URL이 공개 sitemap.xml에 노출될 수 있었음)
  const posts = await fetchPublicPosts();
  const postEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${SITE_URL}/posts/${post.slug}`,
    lastModified: post.updatedAt,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/posts`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.5 },
    ...postEntries,
  ];
}
