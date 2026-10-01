import Link from "next/link";
import { Badge } from "@/components/ui/badge";

// 홈·전체 글·검색·관련 글이 쓰는 글 카드. 카테고리 라벨을 문자열로 받는 건,
// slug→label 변환 헬퍼(categoryLabel)가 next/headers를 import하는 lib/posts.ts에 있어
// 클라이언트 컴포넌트인 검색 페이지에서는 부를 수 없기 때문이다
export function PostCard({
  slug,
  title,
  summary,
  categoryLabel,
}: {
  slug: string;
  title: string;
  summary: string;
  categoryLabel: string;
}) {
  return (
    <Link
      href={`/posts/${slug}`}
      className="flex flex-col gap-1.5 rounded-lg border border-border bg-card p-4 hover:bg-muted"
    >
      <Badge variant="secondary" className="w-fit">
        {categoryLabel}
      </Badge>
      <span className="font-heading font-semibold">{title}</span>
      <span className="text-sm text-muted-foreground">{summary}</span>
    </Link>
  );
}
