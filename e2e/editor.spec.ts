import { test, expect } from "@playwright/test";

// 긴 글을 쓰다 새로고침·뒤로가기로 날리는 사고를 막는 임시저장 배너.
// 사용자가 모르는 사이 덮어쓰지 않도록 자동 복원이 아니라 선택형으로 만들었으므로,
// "배너가 뜨고 불러오기를 누르면 실제로 채워지는가"까지 확인한다.
test("저장 못 한 작성 내용이 남아 있으면 배너에서 복구할 수 있다", async ({
  page,
  context,
  baseURL,
}) => {
  // /posts/new는 소유자 전용 — 스텁이 Authorization 헤더를 보고 OWNER로 응답한다
  await context.addCookies([
    { name: "token", value: "stub-owner-token", url: baseURL },
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

test("임시저장본이 없으면 배너가 뜨지 않는다", async ({ page, context, baseURL }) => {
  await context.addCookies([
    { name: "token", value: "stub-owner-token", url: baseURL },
  ]);

  await page.goto("/posts/new");

  await expect(page.getByRole("heading", { name: "새 글 작성" })).toBeVisible();
  await expect(
    page.getByText("저장하지 않고 나간 작성 내용이 남아 있습니다."),
  ).not.toBeVisible();
});

// 글 수정 페이지는 "없는 글(404)"과 "불러오기 실패(5xx)"를 구분해서 보여줘야 한다 —
// 예전엔 둘 다 "글을 찾을 수 없습니다"라 장애가 없는 글로 둔갑했다
test("수정할 글을 불러오다 서버가 실패하면 없는 글이 아니라 오류로 알려준다", async ({
  page,
  context,
  baseURL,
}) => {
  await context.addCookies([{ name: "token", value: "stub-owner-token", url: baseURL }]);
  await page.route("**/api/posts/spring-boot-jwt-auth", (route) =>
    route.fulfill({ status: 500, body: "{}" }),
  );

  await page.goto("/posts/spring-boot-jwt-auth/edit");

  // TanStack Query 기본 재시도(3회, 1+2+4초 백오프)를 기다려야 에러 상태가 된다
  await expect(page.getByText(/글을 불러오지 못했습니다/)).toBeVisible({ timeout: 15_000 });
});

test("수정할 글이 없으면 글을 찾을 수 없다고 알려준다", async ({ page, context, baseURL }) => {
  await context.addCookies([{ name: "token", value: "stub-owner-token", url: baseURL }]);

  await page.goto("/posts/no-such-post/edit");

  await expect(page.getByText("글을 찾을 수 없습니다.")).toBeVisible();
});

// 작성 중 창 포커스로 재조회가 일어나 실패해도 TanStack Query는 기존 data를 유지한 채
// isError만 켠다. 에러를 먼저 그리면 폼이 언마운트돼 쓰던 내용이 날아간다
test("수정 중 재조회가 실패해도 입력하던 내용이 남아 있다", async ({ page, context, baseURL }) => {
  await context.addCookies([{ name: "token", value: "stub-owner-token", url: baseURL }]);
  await page.clock.install();
  let fail = false;
  let failedRequests = 0;
  await page.route("**/api/posts/spring-boot-jwt-auth", (route) => {
    if (!fail) return route.fallback();
    failedRequests++;
    return route.fulfill({ status: 500, body: "{}" });
  });

  await page.goto("/posts/spring-boot-jwt-auth/edit");
  const title = page.getByPlaceholder("제목");
  await expect(title).not.toHaveValue("");
  await title.fill("수정 중인 제목");

  fail = true;
  // staleTime(1분)을 넘긴 뒤 포커스 복귀 — focusManager는 window의 visibilitychange를 듣는다
  await page.clock.fastForward("02:00");
  await page.evaluate(() => window.dispatchEvent(new Event("visibilitychange")));
  await page.clock.runFor(30_000); // 재시도 백오프까지 흘려보냄

  // 재조회가 실제로 일어나지 않으면 아래 단언이 아무것도 검증하지 못한다
  await expect.poll(() => failedRequests).toBeGreaterThan(0);
  await expect(title).toHaveValue("수정 중인 제목");
});

// 헤더가 먼저 hydration되며 세션을 받아 두면, 뒤늦게 hydration되는 소유자 전용 화면은
// 서버가 그린 "확인 중..."과 다른 폼을 그려 hydration이 깨졌다 (use-session.ts 참고)
test("소유자 전용 페이지가 hydration 오류 없이 뜬다", async ({ page, context, baseURL }) => {
  await context.addCookies([{ name: "token", value: "stub-owner-token", url: baseURL }]);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  // React 19는 복구한 hydration 오류를 throw 대신 console.error로 보고한다
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/posts/new");
  await expect(page.getByPlaceholder("제목")).toBeVisible();

  expect(errors.filter((message) => message.includes("Hydration"))).toEqual([]);
});
