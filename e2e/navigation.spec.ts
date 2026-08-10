import { test, expect } from "@playwright/test";

// 4차(백엔드 연동) 전까지는 로그인/글 작성 같은 "핵심 플로우"를 실제로 검증할 수 없어서,
// 지금 목업 데이터로 이미 동작하는 탐색 플로우로 E2E 뼈대만 검증한다.
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
