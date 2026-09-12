import { test, expect } from "@playwright/test";

test("검색어를 입력하고 제출하면 결과 목록이 갱신된다", async ({ page }) => {
  await page.goto("/search");
  const main = page.getByRole("main");

  await main.getByLabel("검색어", { exact: true }).fill("jwt");
  await main.getByLabel("검색", { exact: true }).click();

  await expect(page).toHaveURL(/\/search\?q=jwt/);
  await expect(page.getByRole("link", { name: /Spring Boot에서 JWT/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /온디맨드 ISR/ })).not.toBeVisible();
});

test("카테고리 체크박스로 필터링하면 URL과 목록이 함께 바뀐다", async ({ page }) => {
  await page.goto("/search?q=jwt");

  const backend = page.getByRole("checkbox", { name: "백엔드" });
  await backend.click();

  await expect(page).toHaveURL(/category=backend/);
  await expect(page.getByRole("link", { name: /Spring Boot에서 JWT/ })).toBeVisible();
  // 필터가 URL에만 반영되고 체크박스는 풀려 보이면 사용자가 지금 무슨 필터가 걸렸는지 알 수 없다
  await expect(backend).toBeChecked();
});

// 사이드바와 글 상세의 태그 링크는 검색어 없이 /search?tags=... 로만 들어온다 —
// 예전엔 이 경우 "검색어를 입력해주세요"만 떠서 태그 클릭이 막다른 길이었다
test("검색어 없이 태그만으로도 글 목록이 나온다", async ({ page }) => {
  await page.goto("/search?tags=nextjs");

  await expect(page.getByRole("link", { name: /온디맨드 ISR/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Spring Boot에서 JWT/ })).not.toBeVisible();
  await expect(page.getByText("검색어를 입력하거나")).not.toBeVisible();
});
