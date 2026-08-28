"use client";

import { useState } from "react";
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
        toast.success("수정했습니다.");
        router.push(`/posts/${slug}`);
      } else {
        const created = await createPost.mutateAsync(values);
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
