// 목차(table-of-contents.tsx)와 마크다운 렌더러의 h2/h3가 같은 id 규칙을 공유하기 위한 헬퍼
export function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-");
}
