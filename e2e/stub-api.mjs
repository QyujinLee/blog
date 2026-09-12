// E2E 전용 가짜 blog-api. 실제 백엔드(Render)나 DB에 의존하면 CI가 남의 상태에 휘둘리고,
// 지금처럼 글이 0개면 아예 돌지 않는다. 고정 픽스처를 주는 최소 서버로 대체한다.
import { createServer } from "node:http";

const POSTS = [
  {
    id: "1",
    slug: "spring-boot-jwt-auth",
    title: "Spring Boot에서 JWT 인증 직접 구현하기",
    summary: "필터 체인을 직접 만들며 배운 것",
    body: "## 들어가며\n본문입니다.\n\n## 정리\n끝.",
    categorySlug: "backend",
    tags: ["jwt", "spring"],
    seriesSlug: null, seriesTitle: null, seriesOrder: null,
    pinned: true, hidden: false, viewCount: 120, likeCount: 3,
    createdAt: "2026-01-02T00:00:00.000Z", updatedAt: "2026-01-02T00:00:00.000Z",
  },
  {
    id: "2",
    slug: "on-demand-isr",
    title: "온디맨드 ISR로 즉시 반영하기",
    summary: "전체 재빌드 없이 페이지만 갱신",
    body: "## 개요\n본문입니다.",
    categorySlug: "frontend",
    tags: ["nextjs"],
    seriesSlug: null, seriesTitle: null, seriesOrder: null,
    pinned: false, hidden: false, viewCount: 80, likeCount: 1,
    createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

const CATEGORIES = [
  { slug: "backend", label: "백엔드" },
  { slug: "frontend", label: "프론트엔드" },
];

// 실제 API와 마찬가지로 목록 응답에는 body를 싣지 않는다
function summary(post) {
  const copy = { ...post };
  delete copy.body;
  return copy;
}

function list({ category, tags }) {
  return POSTS.filter(
    (post) =>
      (!category || post.categorySlug === category) &&
      (!tags?.length || tags.every((tag) => post.tags.includes(tag))),
  ).map(summary);
}

const server = createServer((request, response) => {
  const url = new URL(request.url, "http://localhost");
  const query = url.searchParams;
  const tags = query.get("tags")?.split(",").filter(Boolean);
  const send = (status, data) => {
    const payload = JSON.stringify(data);
    response.writeHead(status, {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(payload),
    });
    response.end(payload);
  };

  if (url.pathname === "/posts" && request.method === "GET") {
    return send(200, list({ category: query.get("category"), tags }));
  }
  if (url.pathname === "/posts/search") {
    const q = query.get("q")?.trim();
    if (!q) return send(400, { message: "검색어(q)는 필수입니다." });
    const lowered = q.toLowerCase();
    return send(
      200,
      list({ category: query.get("category"), tags }).filter(
        (post) =>
          post.title.toLowerCase().includes(lowered) ||
          post.tags.some((tag) => tag.toLowerCase() === lowered),
      ),
    );
  }
  if (url.pathname === "/categories") return send(200, CATEGORIES);
  if (url.pathname === "/tags") return send(200, ["jwt", "nextjs", "spring"]);
  if (url.pathname === "/stats/popular-posts") {
    return send(200, POSTS.map(({ slug, title, viewCount }) => ({ slug, title, viewCount })));
  }
  if (url.pathname === "/stats/visits") {
    return send(200, [{ date: "2026-01-01T00:00:00.000Z", count: 5 }]);
  }
  if (url.pathname === "/auth/me") {
    // BFF는 token 쿠키가 있을 때만 Authorization을 붙인다 — 그 헤더 유무로 소유자 로그인을 흉내낸다
    return request.headers.authorization
      ? send(200, { role: "OWNER", name: "gyujin" })
      : send(401, { message: "Unauthorized" });
  }

  const viewMatch = url.pathname.match(/^\/posts\/([^/]+)\/view$/);
  if (viewMatch) return send(200, { viewCount: 1 });

  const slugMatch = url.pathname.match(/^\/posts\/([^/]+)$/);
  if (slugMatch) {
    const post = POSTS.find((item) => item.slug === decodeURIComponent(slugMatch[1]));
    return post ? send(200, post) : send(404, { message: "글을 찾을 수 없습니다." });
  }

  send(404, { message: "Not Found" });
});

server.listen(Number(process.env.STUB_PORT ?? 4100), "127.0.0.1");
