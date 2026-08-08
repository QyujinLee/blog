import type { Heading, Root } from "mdast";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { visit } from "unist-util-visit";
import { toString as mdastToString } from "mdast-util-to-string";
import type { TocItem } from "@/components/post/table-of-contents";
import { slugify } from "@/lib/slugify";

// MarkdownRenderer(react-markdown)가 실제로 파싱하는 것과 같은 remark-gfm 트리를 걸어서
// h2/h3 텍스트를 뽑음 — 정규식으로 직접 파싱하면 링크/강조/취소선 등 GFM 문법마다
// 렌더러의 id 계산과 어긋날 여지가 생기므로, 파서 자체를 공유해 근본적으로 맞춤
export function extractHeadings(body: string): TocItem[] {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(body) as Root;
  const items: TocItem[] = [];
  // 같은 글 안에 같은 제목("정리", "결론" 등)이 두 번 나오면 슬러그가 겹치므로 -2, -3 ... 접미사로 구분
  const seenCount = new Map<string, number>();
  visit(tree, "heading", (node: Heading) => {
    if (node.depth !== 2 && node.depth !== 3) return;
    const text = mdastToString(node);
    const base = slugify(text);
    const count = (seenCount.get(base) ?? 0) + 1;
    seenCount.set(base, count);
    const id = count === 1 ? base : `${base}-${count}`;
    items.push({ id, text, depth: node.depth });
  });
  return items;
}
