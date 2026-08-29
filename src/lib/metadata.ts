import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";

const SITE_NAME = "gyujin's log";

export const PERSON_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "이규진",
  url: SITE_URL,
  jobTitle: "풀스택 개발자",
  description: "운영 중인 서비스에서 마주한 문제를 끝까지 추적해 해결하는 풀스택 개발자입니다.",
};

export function buildMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  const url = `${SITE_URL}${path}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      locale: "ko_KR",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
