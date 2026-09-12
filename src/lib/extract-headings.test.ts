import { expect, test } from "vitest";
import { extractHeadings } from "./extract-headings";
import { slugify } from "./slugify";

test("h2/h3만 문서 순서대로 뽑고 h1/h4는 제외한다", () => {
  const items = extractHeadings("# 제목\n## 둘\n### 셋\n#### 넷\n## 다시 둘");
  expect(items).toEqual([
    { id: "둘", text: "둘", depth: 2 },
    { id: "셋", text: "셋", depth: 3 },
    { id: "다시-둘", text: "다시 둘", depth: 2 },
  ]);
});

// 목차와 본문 헤딩이 같은 id 목록을 순서대로 나눠 쓰므로, 제목이 겹칠 때 id가
// 갈라지지 않으면 목차 링크가 엉뚱한 곳으로 간다
test("같은 제목이 반복되면 -2, -3 접미사로 구분한다", () => {
  const items = extractHeadings("## 정리\n## 정리\n## 정리");
  expect(items.map((item) => item.id)).toEqual(["정리", "정리-2", "정리-3"]);
});

test("링크·강조 같은 인라인 문법은 텍스트만 남긴다", () => {
  const items = extractHeadings("## [링크](https://example.com) **굵게**");
  expect(items[0].text).toBe("링크 굵게");
  expect(items[0].id).toBe(slugify("링크 굵게"));
});

test("헤딩이 없으면 빈 배열", () => {
  expect(extractHeadings("본문만 있습니다.")).toEqual([]);
});
