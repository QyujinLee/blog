"use client";

import { Input } from "@/components/ui/input";

interface SeriesFieldsProps {
  value: string;
  onChange: (value: string) => void;
}

// 시리즈 이름만 입력받음 — order는 백엔드가 자동 계산(같은 이름의 기존 최대 order + 1)해서 프론트 입력 없음
export function SeriesFields({ value, onChange }: SeriesFieldsProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="series-title" className="text-sm font-medium">
        시리즈 (선택)
      </label>
      <Input
        id="series-title"
        placeholder="예: JWT 완전정복"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
