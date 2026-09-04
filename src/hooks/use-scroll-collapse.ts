"use client";

import { useEffect, useState } from "react";

// 헤더는 sticky = 문서 흐름에 남아있어서, 접히며 줄어든 높이(h-20 → h-12, 32px)만큼
// 문서가 짧아진다. 페이지 끝에서 이게 일어나면 브라우저가 scrollY를 그만큼 강제로
// 줄이는데, 그 값이 다시 임계값 밑으로 내려가면 펴짐 → 문서가 길어짐 → 다시 접힘…
// 이 되어 사용자가 스크롤을 안 건드려도 헤더가 무한히 떨렸다. 그래서 두 임계값을
// 32px보다 크게 벌려, 클램프가 반대쪽 임계값을 넘지 못하게 한다.
const COLLAPSE_AT = 80;
const EXPAND_AT = 40;

export function useScrollCollapse() {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    function onScroll() {
      setCollapsed((prev) => window.scrollY > (prev ? EXPAND_AT : COLLAPSE_AT));
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return collapsed;
}
