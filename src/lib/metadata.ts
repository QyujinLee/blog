import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";

const SITE_NAME = "gyujin's log";

export const PERSON_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "gyujin",
  url: SITE_URL,
  description: "실무에서 마주친 문제와 해결 과정을 정리합니다",
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
