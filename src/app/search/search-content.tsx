"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { SearchBar } from "@/components/layout/search-bar";
import { Sidebar } from "@/components/layout/sidebar";
import { categories, categoryLabel } from "@/data/categories";
import { usePosts, type SortOption } from "@/hooks/use-posts";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "relevance", label: "관련도" },
  { value: "latest", label: "최신순" },
  { value: "views", label: "조회수" },
];

const ALL_TAGS = Array.from(
  new Set(categories.flatMap((category) => category.tags.map((tag) => tag.name))),
).sort();

export function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const q = searchParams.get("q") ?? "";
  const category = searchParams.get("category") ?? "";
  const tags = searchParams.get("tags")?.split(",").filter(Boolean) ?? [];
  const sort = (searchParams.get("sort") as SortOption | null) ?? "relevance";

  const { data: posts, isLoading } = usePosts({
    q: q || undefined,
    category: category || undefined,
    tags: tags.length ? tags : undefined,
    sort,
  });

  function updateParams(next: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    router.push(`/search?${params.toString()}`);
  }

  function toggleCategory(slug: string) {
    updateParams({ category: category === slug ? null : slug });
  }

  function toggleTag(tag: string) {
    const next = tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag];
    updateParams({ tags: next.length ? next.join(",") : null });
  }

  return (
    <div className="mx-auto grid w-full max-w-5xl flex-1 gap-8 px-4 py-8 md:grid-cols-[240px_1fr]">
      <aside className="hidden md:block">
        <div className="sticky top-20">
          <Sidebar />
        </div>
      </aside>

      <div className="flex flex-col gap-6">
        <SearchBar defaultValue={q} onSearch={(query) => updateParams({ q: query || null })} />

        <div className="flex flex-wrap items-start gap-x-6 gap-y-3">
          <select
            value={sort}
            onChange={(event) => updateParams({ sort: event.target.value })}
            aria-label="정렬"
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <div className="flex flex-wrap gap-x-3 gap-y-1.5">
            {categories.map((c) => (
              <label key={c.slug} className="flex items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  checked={category === c.slug}
                  onChange={() => toggleCategory(c.slug)}
                  className="accent-primary"
                />
                {c.label}
              </label>
            ))}
          </div>

          <div className="flex flex-wrap gap-x-3 gap-y-1.5">
            {ALL_TAGS.map((tag) => (
              <label key={tag} className="flex items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  checked={tags.includes(tag)}
                  onChange={() => toggleTag(tag)}
                  className="accent-primary"
                />
                #{tag}
              </label>
            ))}
          </div>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">검색 중...</p>
        ) : posts && posts.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {posts.map((post) => (
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
        ) : (
          <p className="text-sm text-muted-foreground">검색 결과가 없습니다.</p>
        )}
      </div>
    </div>
  );
}
