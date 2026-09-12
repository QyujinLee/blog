"use client";

import { useState } from "react";

// 아이콘은 외부 서비스(skillicons.dev)가 그려준다 — 그 서비스가 죽으면 소개 페이지에
// 깨진 이미지만 남으므로, 실패하면 기술 이름 텍스트로 대체한다.
// ponytail: 하이드레이션 전에 이미 실패한 이미지는 onError를 놓쳐 대체가 안 된다.
// 그때까지 막으려면 마운트 시 naturalWidth를 확인해야 하는데, 그 정도로 잦은 장애가
// 아니라 여기까지만 한다 — 실제로 문제가 되면 그때 추가.
export function SkillIcons({ icons }: { icons: string }) {
  const [failed, setFailed] = useState(false);
  const names = icons.split(",");

  if (failed) {
    return (
      <p className="text-sm break-keep text-muted-foreground">
        {names.join(", ")}
      </p>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- 외부 서비스가 합성해 주는 이미지라 next/image 최적화 대상이 아님
    <img
      src={`https://skillicons.dev/icons?i=${icons}`}
      alt={names.join(", ")}
      className="h-10 w-auto"
      width={48 * names.length}
      height={48}
      onError={() => setFailed(true)}
    />
  );
}
