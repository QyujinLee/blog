import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Sidebar } from "@/components/layout/sidebar";
import { categoryLabel } from "@/data/categories";
import { posts } from "@/data/posts";

// TODO(4차 — 백엔드 연동): GET /posts?pinned=true 로 교체
const pinnedPosts = posts.filter((post) => post.pinned && !post.hidden);

export default function Home() {
  return (
    <div className="mx-auto grid w-full max-w-5xl flex-1 gap-8 px-4 py-8 md:grid-cols-[240px_1fr]">
      <aside className="hidden md:block">
        <div className="sticky top-20">
          <Sidebar withProfile={false} />
        </div>
      </aside>

      <div className="flex flex-col gap-10">
        <section className="flex flex-col gap-3">
          <h1 className="font-heading text-2xl font-bold">gyujin</h1>
          <p className="text-muted-foreground">
            실무에서 마주친 문제와 해결 과정을 정리합니다. 백엔드/프론트엔드를 오가며
            부딪힌 것들을 기록해두는 공간이에요.
          </p>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="font-heading text-lg font-semibold">대표 글</h2>
          <ul className="flex flex-col gap-3">
            {pinnedPosts.map((post) => (
              <li key={post.slug}>
                <Link
                  href={`/posts/${post.slug}`}
                  className="flex flex-col gap-1.5 rounded-lg border border-border bg-card p-4 hover:bg-muted"
                >
                  <Badge variant="secondary" className="w-fit">
                    {categoryLabel(post.category)}
                  </Badge>
                  <span className="font-heading font-semibold">{post.title}</span>
                  <span className="text-sm text-muted-foreground">{post.summary}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="font-heading text-lg font-semibold">통계</h2>
          {/* TODO(4차 — 백엔드 연동): stats-widget.tsx로 교체, use-stats.ts(CSR)로 실제 데이터 조회 */}
          <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            인기글 TOP5 · 글 조회 추이 위젯 자리
          </div>
        </section>
      </div>
    </div>
  );
}
