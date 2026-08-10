"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <h1 className="font-heading text-2xl font-bold">문제가 발생했습니다</h1>
      <p className="text-muted-foreground">페이지를 불러오는 중 오류가 발생했습니다.</p>
      <Button onClick={() => unstable_retry()}>다시 시도</Button>
    </div>
  );
}
