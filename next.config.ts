import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // blog-api가 업로드한 이미지를 Cloudflare R2 Public Development URL(pub-<hash>.r2.dev)로 서빙
    remotePatterns: [{ protocol: "https", hostname: "**.r2.dev" }],
  },
};

export default nextConfig;
