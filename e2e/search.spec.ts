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
  await page.goto("/search");

  await page.getByRole("checkbox", { name: "백엔드" }).click();

  await expect(page).toHaveURL(/category=backend/);
  await expect(page.getByRole("link", { name: /Spring Boot에서 JWT/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /온디맨드 ISR/ })).not.toBeVisible();
});
