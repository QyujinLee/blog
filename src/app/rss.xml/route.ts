import { SITE_URL } from "@/lib/site";
import { posts } from "@/data/posts";

function escapeXml(value: string): string {
  return value.replace(/[<>&'"]/g, (char) => {
    switch (char) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      default:
        return "&quot;";
    }
  });
}

export async function GET() {
  const items = posts
    .filter((post) => !post.hidden)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map((post) => {
      const url = `${SITE_URL}/posts/${post.slug}`;
      return `<item>
  <title>${escapeXml(post.title)}</title>
  <link>${url}</link>
  <guid>${url}</guid>
  <description>${escapeXml(post.summary)}</description>
  <pubDate>${new Date(post.createdAt).toUTCString()}</pubDate>
</item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>gyujin's log</title>
  <link>${SITE_URL}</link>
  <description>실무에서 마주친 문제와 해결 과정을 정리합니다</description>
  ${items}
</channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml" },
  });
}
