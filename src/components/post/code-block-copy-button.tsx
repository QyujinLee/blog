"use client";

import { useRef, useState, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

// react-markdown의 `pre` 컴포넌트를 대체 — 코드블럭을 감싸고 우측 상단에 복사 버튼을 얹는다.
// react-markdown이 hast `node`도 같이 넘겨주므로 DOM에 그대로 흘려보내지 않도록 분리해서 받는다.
export function CodeBlockCopyButton({
  className,
  children,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- DOM에 흘려보내지 않기 위해 분리
  node: _node,
  ...props
}: ComponentPropsWithoutRef<"pre"> & { node?: unknown; children?: ReactNode }) {
  const preRef = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const text = preRef.current?.textContent ?? "";
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // 권한 거부·비보안 컨텍스트 등 — 복사 실패는 조용히 넘기고 "복사됨" 표시만 안 함
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="group relative">
      <pre ref={preRef} className={className} {...props}>
        {children}
      </pre>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={copied ? "복사됨" : "코드 복사"}
        onClick={handleCopy}
        // hover가 없는 터치 기기와 키보드 포커스에서도 버튼이 보여야 쓸 수 있음
        className="absolute top-2 right-2 opacity-0 hover:bg-white/10 group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
        style={{ color: "var(--serenity-50)" }}
      >
        {copied ? <Check className="text-success" /> : <Copy />}
      </Button>
    </div>
  );
}
