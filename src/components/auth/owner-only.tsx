"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/hooks/use-session";
import { useLoginModalStore } from "@/lib/login-modal-store";

// posts/new, posts/[slug]/edit처럼 소유자 전용 CSR 페이지를 감싸는 가드 —
// 세션 조회 끝나기 전엔 로딩, 소유자가 아니면 로그인 모달 열고 홈으로 리다이렉트
export function OwnerOnly({ children }: { children: React.ReactNode }) {
  const { isOwner, isLoading } = useSession();
  const router = useRouter();
  const openLoginModal = useLoginModalStore((state) => state.open);

  useEffect(() => {
    if (!isLoading && !isOwner) {
      openLoginModal();
      router.push("/");
    }
  }, [isLoading, isOwner, router, openLoginModal]);

  if (isLoading || !isOwner) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        확인 중...
      </div>
    );
  }

  return <>{children}</>;
}
