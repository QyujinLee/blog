"use client";

import { OwnerOnly } from "@/components/auth/owner-only";
import { PostForm } from "@/components/editor/post-form";

export default function NewPostPage() {
  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <OwnerOnly>
        <h1 className="mb-6 font-heading text-2xl font-bold">새 글 작성</h1>
        <PostForm />
      </OwnerOnly>
    </div>
  );
}
