import Link from "next/link";
import type { Post } from "@/lib/posts";

interface SeriesNavProps {
  seriesTitle: string;
  entries: Post[];
  currentSlug: string;
}

export function SeriesNav({ seriesTitle, entries, currentSlug }: SeriesNavProps) {
  const sorted = [...entries].sort(
    (a, b) => (a.seriesOrder ?? 0) - (b.seriesOrder ?? 0),
  );
  const currentIndex = sorted.findIndex((post) => post.slug === currentSlug);
  const prev = currentIndex > 0 ? sorted[currentIndex - 1] : undefined;
  const next = currentIndex < sorted.length - 1 ? sorted[currentIndex + 1] : undefined;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
      <p className="text-sm font-medium text-muted-foreground">
        {seriesTitle} · {sorted.length}부작 중 {currentIndex + 1}부
      </p>
      {(prev || next) && (
        <div className="grid gap-2 sm:grid-cols-2">
          {prev && (
            <Link
              href={`/posts/${prev.slug}`}
              className="rounded-md border border-border p-2 text-sm hover:bg-muted"
            >
              <span className="block text-xs text-muted-foreground">이전 글</span>
              {prev.title}
            </Link>
          )}
          {next && (
            <Link
              href={`/posts/${next.slug}`}
              className="rounded-md border border-border p-2 text-sm hover:bg-muted sm:col-start-2 sm:text-right"
            >
              <span className="block text-xs text-muted-foreground">다음 글</span>
              {next.title}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
