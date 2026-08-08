import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export function TagList({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null;

  return (
    <ul className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <li key={tag}>
          <Badge
            variant="outline"
            render={<Link href={`/search?tags=${encodeURIComponent(tag)}`} />}
          >
            #{tag}
          </Badge>
        </li>
      ))}
    </ul>
  );
}
