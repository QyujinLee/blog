import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/layout/sidebar";
import { JsonLd } from "@/components/seo/json-ld";
import { buildMetadata, PERSON_JSON_LD } from "@/lib/metadata";

// TODO(4차 — 백엔드 연동): GET /resume로 교체
const RESUME_URL: string | null = null;

export const metadata = buildMetadata({
  title: "소개",
  description: "백엔드와 프론트엔드를 오가며 문제를 끝까지 파고드는 걸 좋아하는 개발자입니다.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <div className="mx-auto grid w-full max-w-5xl flex-1 gap-8 px-4 py-8 md:grid-cols-[240px_1fr]">
      <JsonLd data={PERSON_JSON_LD} />

      <aside className="hidden md:block">
        <div className="sticky top-20">
          <Sidebar />
        </div>
      </aside>

      <div className="flex flex-col gap-10">
        <section className="flex flex-col gap-3">
          <h1 className="font-heading text-2xl font-bold">소개</h1>
          <p className="text-muted-foreground">
            백엔드와 프론트엔드를 오가며 문제를 끝까지 파고드는 걸 좋아하는
            개발자입니다.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-heading text-lg font-semibold">이력</h2>
          <p className="text-muted-foreground">
            실무 경험과 프로젝트 이력을 이 자리에 정리할 예정입니다.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-heading text-lg font-semibold">스킬</h2>
          <p className="text-muted-foreground">
            주로 다루는 기술 스택을 이 자리에 정리할 예정입니다.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-heading text-lg font-semibold">개발 철학</h2>
          <p className="text-muted-foreground">
            일하며 중요하게 여기는 원칙을 이 자리에 정리할 예정입니다.
          </p>
        </section>

        <section className="flex items-center gap-3">
          {RESUME_URL ? (
            <Button render={<a href={RESUME_URL} download />} nativeButton={false}>
              이력서 다운로드
            </Button>
          ) : (
            <Button disabled>이력서 준비 중</Button>
          )}
          {/* isOwner일 때만 "이력서 교체" 버튼 노출 — use-session.ts 붙는 4차 단계에서 추가 */}
        </section>
      </div>
    </div>
  );
}
