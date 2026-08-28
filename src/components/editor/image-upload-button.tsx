"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageUploadButtonProps {
  onUploaded: (markdown: string) => void;
}

// 업로드 성공 시 본문에 삽입할 마크다운(![]())을 콜백으로 넘김 — 커서 위치 삽입은 호출부(에디터) 책임
export function ImageUploadButton({ onUploaded }: ImageUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ""; // 같은 파일을 연달아 선택해도 change 이벤트가 다시 뜨게 초기화

    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/images", { method: "POST", body: formData });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        const message = Array.isArray(error.message)
          ? error.message[0]
          : (error.message ?? "이미지 업로드에 실패했습니다.");
        throw new Error(message);
      }

      const { url } = await response.json();
      onUploaded(`![${file.name}](${url})`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "이미지 업로드에 실패했습니다.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleChange}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        <ImagePlus className="size-3.5" />
        {uploading ? "업로드 중..." : "이미지 삽입"}
      </Button>
    </>
  );
}
