import { test, expect } from "@playwright/test";

// 데이터는 e2e/stub-api.mjs가 주는 고정 픽스처다 — 실제 백엔드를 보면 배포 상태와
// DB 내용에 휘둘리므로. 픽스처를 바꾸면 아래 제목/슬러그 기대값도 같이 바꿀 것.
test("홈에서 전체 글 목록으로 이동해 글 상세까지 들어갈 수 있다", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "gyujin" })).toBeVisible();

  await page.getByRole("link", { name: "전체 글" }).first().click();
  await expect(page).toHaveURL("/posts");

  const firstPost = page.getByRole("link").filter({ hasText: "Spring Boot에서 JWT" });
  await firstPost.click();

  await expect(page).toHaveURL("/posts/spring-boot-jwt-auth");
  await expect(page.getByRole("heading", { name: "Spring Boot에서 JWT 인증 직접 구현하기" })).toBeVisible();
});

test("존재하지 않는 글은 404 UI를 보여준다", async ({ page }) => {
  // notFound()가 이 라우트에서 실제 HTTP 상태를 404로 못 바꾸는 Next.js 자체 한계가 있어(아래 참고)
  // 상태 코드 대신 화면에 실제로 뜨는 404 콘텐츠로 검증한다.
  await page.goto("/posts/no-such-slug");
  await expect(page.getByRole("heading", { name: "글을 찾을 수 없습니다" })).toBeVisible();
});
