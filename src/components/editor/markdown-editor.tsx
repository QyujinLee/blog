"use client";

import { useRef } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploadButton } from "./image-upload-button";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
}

// textarea + 실시간 미리보기 분할 화면. 미리보기는 react-markdown의 동기 컴포넌트(Markdown)만 사용 —
// 발행 페이지(markdown-renderer.tsx)의 MarkdownAsync+rehype-pretty-code는 서버 전용이라
// 클라이언트 에디터에서는 못 씀(react-markdown 공식 타입 주석: 클라이언트 비동기는 MarkdownHooks 필요).
// 코드블럭 하이라이트 없이 일반 텍스트로만 보이는 건 의도된 단순화 — 정확한 렌더링은 저장 후 실제 글 페이지에서 확인
export function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function insertAtCursor(text: string) {
    const textarea = textareaRef.current;
    if (!textarea) {
      onChange(value + text);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const next = value.slice(0, start) + text + value.slice(end);
    onChange(next);

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + text.length;
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div>
        <ImageUploadButton onUploaded={insertAtCursor} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="마크다운으로 작성하세요..."
          className="min-h-[500px] font-mono text-sm"
        />
        <div className="markdown-body min-h-[500px] overflow-y-auto rounded-lg border border-border p-4">
          <Markdown remarkPlugins={[remarkGfm]}>{value}</Markdown>
        </div>
      </div>
    </div>
  );
}
