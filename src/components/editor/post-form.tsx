"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownEditor } from "./markdown-editor";
import { CategoryCombobox } from "./category-combobox";
import { TagInput } from "./tag-input";
import { SeriesFields } from "./series-fields";
import {
  useCreatePost,
  useUpdatePost,
  type PostFormValues,
} from "@/hooks/use-posts";

interface PostFormInitialValues {
  title: string;
  summary: string;
  body: string;
  category: string; // 카테고리 label (slug 아님 — CategoryCombobox와 동일 규칙)
  tags: string[];
  seriesTitle: string;
}

interface PostFormProps {
  slug?: string; // 있으면 수정 모드
  initialValues?: PostFormInitialValues;
}

// localStorage는 사용자가 직접 고칠 수 있다 — 형태가 어긋난 값을 그대로 state에 넣으면
// tags.map 같은 데서 렌더가 터지므로 복원 전에 확인한다
function isDraft(value: unknown): value is PostFormInitialValues {
  if (typeof value !== "object" || value === null) return false;
  const draft = value as Record<string, unknown>;
  return (
    typeof draft.title === "string" &&
    typeof draft.summary === "string" &&
    typeof draft.body === "string" &&
    typeof draft.category === "string" &&
    typeof draft.seriesTitle === "string" &&
    Array.isArray(draft.tags) &&
    draft.tags.every((tag) => typeof tag === "string")
  );
}

const EMPTY_VALUES: PostFormInitialValues = {
  title: "",
  summary: "",
  body: "",
  category: "",
  tags: [],
  seriesTitle: "",
};

export function PostForm({ slug, initialValues = EMPTY_VALUES }: PostFormProps) {
  const router = useRouter();
  const isEdit = Boolean(slug);
  const [title, setTitle] = useState(initialValues.title);
  const [summary, setSummary] = useState(initialValues.summary);
  const [body, setBody] = useState(initialValues.body);
  const [category, setCategory] = useState(initialValues.category);
  const [tags, setTags] = useState<string[]>(initialValues.tags);
  const [seriesTitle, setSeriesTitle] = useState(initialValues.seriesTitle);

  const createPost = useCreatePost();
  const updatePost = useUpdatePost(slug ?? "");
  const pending = createPost.isPending || updatePost.isPending;

  // 긴 글을 쓰다 새로고침·뒤로가기로 통째로 날리는 사고를 막는 임시저장.
  // 서버에 저장하는 게 아니라 이 브라우저의 localStorage에만 두고, 저장에 성공하면 지운다.
  const draftKey = `post-draft:${slug ?? "new"}`;
  const dirty =
    title !== initialValues.title ||
    summary !== initialValues.summary ||
    body !== initialValues.body ||
    category !== initialValues.category ||
    seriesTitle !== initialValues.seriesTitle ||
    tags.join("\u0000") !== initialValues.tags.join("\u0000");

  function clearDraft() {
    try {
      localStorage.removeItem(draftKey);
    } catch {
      // 사생활 보호 모드 등에서 localStorage가 막혀 있어도 글쓰기 자체는 계속돼야 함
    }
  }

  // localStorage는 서버 렌더 때 없다. effect에서 setState하면 되살린 내용이 사용자 모르게
  // 덮어써지는 데다 react-hooks/set-state-in-effect에도 걸려서, 값만 구독해두고
  // 복원 여부는 사용자가 배너에서 고르게 한다 (theme-toggle.tsx와 같은 useSyncExternalStore 패턴)
  const savedDraft = useSyncExternalStore(
    () => () => {},
    () => {
      try {
        return localStorage.getItem(draftKey);
      } catch {
        return null;
      }
    },
    () => null,
  );
  const [draftHandled, setDraftHandled] = useState(false);

  function restoreDraft() {
    setDraftHandled(true);

    let draft: unknown = null;
    try {
      draft = JSON.parse(savedDraft ?? "");
    } catch {
      draft = null;
    }

    if (!isDraft(draft)) {
      clearDraft();
      toast.error("임시저장본이 손상돼 불러오지 못했습니다.");
      return;
    }

    setTitle(draft.title);
    setSummary(draft.summary);
    setBody(draft.body);
    setCategory(draft.category);
    setTags(draft.tags);
    setSeriesTitle(draft.seriesTitle);
  }

  function discardDraft() {
    setDraftHandled(true);
    clearDraft();
  }

  useEffect(() => {
    if (!dirty) return;
    // 키 입력마다 동기로 쓰면 본문이 길어질수록 입력이 끊긴다(localStorage는 동기 API) —
    // 잠깐 멈췄을 때만 저장한다
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(
          draftKey,
          JSON.stringify({ title, summary, body, category, tags, seriesTitle }),
        );
      } catch {
        // 저장 공간이 꽉 찼거나 막힌 경우 — 임시저장만 포기하고 작성은 계속
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [dirty, draftKey, title, summary, body, category, tags, seriesTitle]);

  // 탭 닫기/새로고침은 임시저장만으로는 사용자가 눈치채지 못하므로 브라우저 기본 경고도 띄움
  useEffect(() => {
    if (!dirty) return;
    function warn(event: BeforeUnloadEvent) {
      event.preventDefault();
    }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!title.trim() || !summary.trim() || !body.trim() || !category.trim()) {
      toast.error("제목·요약·본문·카테고리는 필수입니다.");
      return;
    }

    const values: PostFormValues = {
      title: title.trim(),
      summary: summary.trim(),
      body,
      category: category.trim(),
      tags,
      ...(seriesTitle.trim() ? { seriesTitle: seriesTitle.trim() } : {}),
    };

    try {
      if (isEdit) {
        await updatePost.mutateAsync(values);
        clearDraft();
        toast.success("수정했습니다.");
        router.push(`/posts/${slug}`);
      } else {
        const created = await createPost.mutateAsync(values);
        clearDraft();
        toast.success("글을 등록했습니다.");
        router.push(`/posts/${created.slug}`);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "저장에 실패했습니다.",
      );
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {savedDraft && !draftHandled && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-muted p-3 text-sm">
          <span className="flex-1 break-keep">
            저장하지 않고 나간 작성 내용이 남아 있습니다.
          </span>
          <Button type="button" variant="outline" size="sm" onClick={restoreDraft}>
            불러오기
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={discardDraft}>
            버리기
          </Button>
        </div>
      )}

      <Input
        placeholder="제목"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        className="h-11 text-lg font-heading"
        required
      />

      <Textarea
        placeholder="요약 (목록/공유 카드에 노출됩니다)"
        value={summary}
        onChange={(event) => setSummary(event.target.value)}
        className="min-h-16"
        required
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">카테고리</span>
          <CategoryCombobox value={category} onChange={setCategory} />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">태그</span>
          <TagInput value={tags} onChange={setTags} />
        </div>
      </div>

      <SeriesFields value={seriesTitle} onChange={setSeriesTitle} />

      <MarkdownEditor value={body} onChange={setBody} />

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={pending}
        >
          취소
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "저장 중..." : isEdit ? "수정 완료" : "글 등록"}
        </Button>
      </div>
    </form>
  );
}
