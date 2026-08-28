import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { fetchPosts, categoryLabel, type Post, type Category } from "@/lib/posts";

interface RelatedPostsProps {
  post: Post;
  categories: Category[];
}

export async function RelatedPosts({ post, categories }: RelatedPostsProps) {
  // blog-api에 "카테고리 OR 태그 겹침" 같은 복합 쿼리가 없어 같은 카테고리 글로 단순화(태그 겹침 우선 정렬)
  const sameCategory = await fetchPosts({ category: post.categorySlug });

  const related = sameCategory
    .filter((candidate) => candidate.slug !== post.slug)
    .sort((a, b) => {
      const aOverlap = a.tags.some((tag) => post.tags.includes(tag)) ? 1 : 0;
      const bOverlap = b.tags.some((tag) => post.tags.includes(tag)) ? 1 : 0;
      return bOverlap - aOverlap;
    })
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
                {categoryLabel(categories, item.categorySlug)}
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
