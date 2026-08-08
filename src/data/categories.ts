// 백엔드 연동 전까지 임시 목업 — 실제로는 GET /posts 결과를 category → tags 순으로 클라이언트에서 그룹핑해 만듦 (docs/blog-structure-plan.md "확정 사항" 참고)
export type CategoryGroup = {
  slug: string;
  label: string;
  tags: { name: string; count: number }[];
};

export function categoryLabel(slug: string): string {
  return categories.find((category) => category.slug === slug)?.label ?? slug;
}

export const categories: CategoryGroup[] = [
  {
    slug: "backend",
    label: "백엔드",
    tags: [
      { name: "spring-boot", count: 5 },
      { name: "jpa", count: 3 },
      { name: "postgresql", count: 2 },
    ],
  },
  {
    slug: "frontend",
    label: "프론트엔드",
    tags: [
      { name: "nextjs", count: 4 },
      { name: "react", count: 6 },
      { name: "typescript", count: 5 },
    ],
  },
  {
    slug: "infra",
    label: "인프라",
    tags: [
      { name: "docker", count: 2 },
      { name: "aws", count: 3 },
    ],
  },
];
