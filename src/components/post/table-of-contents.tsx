"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export type TocItem = { id: string; text: string; depth: 2 | 3 };

export function TableOfContents({ items }: { items: TocItem[] }) {
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    if (items.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        setActiveId((current) => {
          const visibleIds = new Set(
            entries.filter((entry) => entry.isIntersecting).map((entry) => entry.target.id),
          );
          if (visibleIds.size === 0) return current;
          // 관측 영역이 넓어 헤딩 여러 개가 한 번에 걸릴 수 있음 — 그중 문서 순서상 가장 위(=경계선에
          // 가장 먼저 닿은, 지금 읽고 있는) 헤딩을 활성 섹션으로 삼음
          const topmost = items.find((item) => visibleIds.has(item.id));
          return topmost?.id ?? current;
        });
      },
      { rootMargin: "-96px 0px -70% 0px", threshold: 0 },
    );

    for (const item of items) {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  return (
    <nav aria-label="목차" className="flex flex-col gap-1 text-sm">
      {items.map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          className={cn(
            "rounded px-2 py-1 text-muted-foreground hover:text-foreground",
            item.depth === 3 && "pl-5",
            activeId === item.id && "font-medium text-primary",
          )}
        >
          {item.text}
        </a>
      ))}
    </nav>
  );
}
