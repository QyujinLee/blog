import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { categoryLabel } from "@/data/categories";
import { posts, type Post } from "@/data/posts";

export function RelatedPosts({ post }: { post: Post }) {
  const related = posts
    .filter((candidate) => candidate.slug !== post.slug && !candidate.hidden)
    .filter(
      (candidate) =>
        candidate.category === post.category ||
        candidate.tags.some((tag) => post.tags.includes(tag)),
    )
    .slice(0, 3);

  if (related.length === 0) return null;

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-heading text-lg font-semibold">관련 글</h2>
      <ul className="flex flex-col gap-3">
        {related.map((item) => (
          <li key={item.slug}>
            <Link
              href={`/posts/${item.slug}`}
              className="flex flex-col gap-1.5 rounded-lg border border-border bg-card p-4 hover:bg-muted"
            >
              <Badge variant="secondary" className="w-fit">
                {categoryLabel(item.category)}
              </Badge>
              <span className="font-heading font-semibold">{item.title}</span>
              <span className="text-sm text-muted-foreground">{item.summary}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
