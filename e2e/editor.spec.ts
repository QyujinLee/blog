import { test, expect } from "@playwright/test";

// 긴 글을 쓰다 새로고침·뒤로가기로 날리는 사고를 막는 임시저장 배너.
// 사용자가 모르는 사이 덮어쓰지 않도록 자동 복원이 아니라 선택형으로 만들었으므로,
// "배너가 뜨고 불러오기를 누르면 실제로 채워지는가"까지 확인한다.
test("저장 못 한 작성 내용이 남아 있으면 배너에서 복구할 수 있다", async ({
  page,
  context,
}) => {
  // /posts/new는 소유자 전용 — 스텁이 Authorization 헤더를 보고 OWNER로 응답한다
  await context.addCookies([
    { name: "token", value: "stub-owner-token", url: "http://localhost:3000" },
  ]);
  await page.addInitScript(() => {
    localStorage.setItem(
      "post-draft:new",
      JSON.stringify({
        title: "임시저장된 제목",
        summary: "임시저장된 요약",
        body: "## 본문",
        category: "백엔드",
        tags: ["jwt"],
        seriesTitle: "",
      }),
    );
  });

  await page.goto("/posts/new");

  await expect(
    page.getByText("저장하지 않고 나간 작성 내용이 남아 있습니다."),
  ).toBeVisible();

  await page.getByRole("button", { name: "불러오기" }).click();

  await expect(page.getByPlaceholder("제목")).toHaveValue("임시저장된 제목");
  await expect(page.getByPlaceholder(/요약/)).toHaveValue("임시저장된 요약");
  await expect(
    page.getByText("저장하지 않고 나간 작성 내용이 남아 있습니다."),
  ).not.toBeVisible();
});

test("임시저장본이 없으면 배너가 뜨지 않는다", async ({ page, context }) => {
  await context.addCookies([
    { name: "token", value: "stub-owner-token", url: "http://localhost:3000" },
  ]);

  await page.goto("/posts/new");

  await expect(page.getByRole("heading", { name: "새 글 작성" })).toBeVisible();
  await expect(
    page.getByText("저장하지 않고 나간 작성 내용이 남아 있습니다."),
  ).not.toBeVisible();
});
