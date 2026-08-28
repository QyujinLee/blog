"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2, Eye, EyeOff, Pin, PinOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeleteConfirmDialog } from "./delete-confirm-dialog";
import { useSession } from "@/hooks/use-session";
import { useDeletePost, usePatchPost } from "@/hooks/use-posts";
import type { Post } from "@/lib/posts";

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

// isOwner일 때만 노출되는 수정/삭제/숨김/고정 툴바 — 글 상세 헤더에 배치
export function OwnerActions({ post }: { post: Post }) {
  const { isOwner } = useSession();
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const deletePost = useDeletePost();
  const patchPost = usePatchPost(post.slug);

  if (!isOwner) return null;

  async function handleDelete() {
    try {
      await deletePost.mutateAsync(post.slug);
      toast.success("삭제했습니다.");
      router.push("/posts");
    } catch (error) {
      toast.error(errorMessage(error, "삭제에 실패했습니다."));
    }
  }

  async function toggleHidden() {
    try {
      await patchPost.mutateAsync({ hidden: !post.hidden });
      toast.success(post.hidden ? "공개로 전환했습니다." : "숨김 처리했습니다.");
      router.refresh();
    } catch (error) {
      toast.error(errorMessage(error, "처리에 실패했습니다."));
    }
  }

  async function togglePinned() {
    try {
      await patchPost.mutateAsync({ pinned: !post.pinned });
      toast.success(post.pinned ? "고정을 해제했습니다." : "대표 글로 고정했습니다.");
      router.refresh();
    } catch (error) {
      toast.error(errorMessage(error, "처리에 실패했습니다."));
    }
  }

  return (
    <>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="수정"
          render={<Link href={`/posts/${post.slug}/edit`} />}
        >
          <Pencil />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={post.hidden ? "공개로 전환" : "숨기기"}
          onClick={toggleHidden}
        >
          {post.hidden ? <Eye /> : <EyeOff />}
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={post.pinned ? "고정 해제" : "대표 글로 고정"}
          onClick={togglePinned}
        >
          {post.pinned ? <PinOff /> : <Pin />}
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="삭제"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 />
        </Button>
      </div>
      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
        title="이 글을 삭제할까요?"
        description={`"${post.title}" 글이 영구적으로 삭제됩니다.`}
      />
    </>
  );
}
