import Image from "next/image";
import { MarkdownAsync, type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypePrettyCode from "rehype-pretty-code";
import type { TocItem } from "./table-of-contents";
import { CodeBlockCopyButton } from "./code-block-copy-button";

// h2/h3 id는 여기서 다시 계산하지 않고 extractHeadings(lib/extract-headings.ts)가 뽑은
// 목록을 문서 순서대로 그대로 소비함 — react-markdown이 렌더링하는 h2/h3도 같은 remark-gfm
// 파싱 결과를 문서 순서대로 훑으므로 항상 1:1로 대응됨. id 계산 로직을 두 곳에 따로 두면
// (텍스트 안 이미지/링크/중복 제목 등) 서로 어긋나는 경우가 계속 생겨 아예 소스를 하나로 합침
function buildComponents(headings: TocItem[]): Components {
  let cursor = 0;
  const nextId = () => headings[cursor++]?.id;

  return {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- DOM에 흘려보내지 않기 위해 분리
    h2: ({ children, node: _node, ...props }) => (
      <h2 id={nextId()} {...props}>
        {children}
      </h2>
    ),
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- DOM에 흘려보내지 않기 위해 분리
    h3: ({ children, node: _node, ...props }) => (
      <h3 id={nextId()} {...props}>
        {children}
      </h3>
    ),
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- DOM에 흘려보내지 않기 위해 분리
    img: ({ src, alt, node: _node }) => {
      if (!src || typeof src !== "string") return null;
      // next/image는 next.config.ts의 remotePatterns(**.r2.dev = 에디터 업로드분)에 없는
      // 호스트면 최적화 요청이 400으로 떨어져 이미지가 깨진다. 아무 호스트나 열어주면
      // 이미지 최적화기가 오픈 프록시가 되므로, 외부 URL은 최적화 없이 그대로 렌더한다
      // ponytail: next.config.ts의 remotePatterns와 같은 패턴을 두 곳에 적어둠.
      // 이미지 호스트가 늘어나면 상수로 빼기
      if (!/^https:\/\/[^/]*\.r2\.dev\//.test(src) && !src.startsWith("/")) {
        return (
          // eslint-disable-next-line @next/next/no-img-element -- 위 주석 참고
          <img
            src={src}
            alt={alt ?? ""}
            className="h-auto w-full rounded-lg border border-border object-contain"
          />
        );
      }
      return (
        <Image
          src={src}
          alt={alt ?? ""}
          width={800}
          height={450}
          className="h-auto w-full rounded-lg border border-border object-contain"
        />
      );
    },
    pre: CodeBlockCopyButton,
  };
}

export async function MarkdownRenderer({ body, headings }: { body: string; headings: TocItem[] }) {
  return (
    <div className="markdown-body">
      <MarkdownAsync
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypePrettyCode, { theme: "github-dark-dimmed", keepBackground: false }]]}
        components={buildComponents(headings)}
      >
        {body}
      </MarkdownAsync>
    </div>
  );
}
