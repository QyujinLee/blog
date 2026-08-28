"use client";

import { useEffect } from "react";

// 글 상세 진입 시 조회 기록 — 서버 컴포넌트(force-cache SSG)에서 직접 부르면 캐시된
// 페이지가 재사용될 때마다 재실행되지 않으므로, 실제 방문마다 확실히 찍히도록 클라이언트에서
// 마운트 시 한 번 호출(중복 방지는 서버의 Redis IP+day 로직이 담당, 여기선 그냥 쏘기만 함)
export function ViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    fetch(`/api/posts/${encodeURIComponent(slug)}/view`, { method: "POST" }).catch(() => {
      // 조회수 기록 실패는 사용자 경험에 영향 없는 부가 기능이라 조용히 무시
    });
  }, [slug]);

  return null;
}
