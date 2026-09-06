import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// 글 상세는 posts/[slug]/opengraph-image.tsx가 따로 만들고, 이건 그 외 모든 경로(홈,
// /posts, /about, 404 …)의 기본 공유 카드 — 없으면 buildMetadata의
// twitter.card="summary_large_image"에 붙일 이미지가 없어 카드가 비어 보인다
export const alt = "gyujin's log";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
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
          justifyContent: "center",
          gap: 20,
          padding: 64,
          background: "linear-gradient(115deg, #F7CAC9, #92A8D1)",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 72,
            fontFamily: "Pretendard Bold",
            color: "#1B2A42",
          }}
        >
          gyujin&apos;s log
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 30,
            fontFamily: "Pretendard SemiBold",
            color: "#1B2A42",
          }}
        >
          실무에서 마주친 문제와 해결 과정을 정리합니다
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
