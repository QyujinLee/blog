import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { categoryLabel } from "@/data/categories";
import { posts } from "@/data/posts";

export const alt = "gyujin's log";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return posts.filter((post) => !post.hidden).map((post) => ({ slug: post.slug }));
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = posts.find((candidate) => candidate.slug === slug);

  const [bold, semiBold] = await Promise.all([
    readFile(join(process.cwd(), "src/assets/fonts/Pretendard-Bold.otf")),
    readFile(join(process.cwd(), "src/assets/fonts/Pretendard-SemiBold.otf")),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          background: "linear-gradient(115deg, #F7CAC9, #92A8D1)",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 28,
            fontFamily: "Pretendard SemiBold",
            color: "#1B2A42",
          }}
        >
          {post ? categoryLabel(post.category) : "gyujin's log"}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 64,
            fontFamily: "Pretendard Bold",
            color: "#1B2A42",
            lineHeight: 1.3,
          }}
        >
          {post?.title ?? "gyujin's log"}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 28,
            fontFamily: "Pretendard SemiBold",
            color: "#1B2A42",
          }}
        >
          gyujin&apos;s log
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Pretendard Bold", data: bold, weight: 700, style: "normal" },
        { name: "Pretendard SemiBold", data: semiBold, weight: 600, style: "normal" },
      ],
    },
  );
}
