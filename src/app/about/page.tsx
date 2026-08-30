import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sidebar } from "@/components/layout/sidebar";
import { JsonLd } from "@/components/seo/json-ld";
import { buildMetadata, PERSON_JSON_LD } from "@/lib/metadata";

export const metadata = buildMetadata({
  title: "소개",
  description: "운영 중인 서비스에서 마주한 문제를 끝까지 추적해 해결하는 풀스택 개발자 이규진입니다.",
  path: "/about",
});

const HIGHLIGHTS = [
  {
    title: "아키텍처를 스스로 설계하고 서비스를 처음부터 세웁니다.",
    items: [
      "Next.js 14 App Router 기반 커머스 구매자 웹을 아키텍처·기술 선택·컨벤션 단독 설계로 신규 구축",
      "이후 453개 파일 규모 하이브리드 렌더링 리팩토링(순삭제 -1,069라인)을 단독 수행해 API 호출을 단일 레이어(24개 도메인 파일)로 통합",
    ],
  },
  {
    title: "장애·성능 문제의 원인을 끝까지 추적해 해결합니다.",
    items: [
      "Edge Runtime 메모리 누수로 인한 pod 급증 장애를 Elasticsearch 로그로 직접 추적·해결, 서버 요청 폭증 원인을 A/B로 직접 규명해 팀 정책화",
      "SEO 3년 단독 오너십 - GSC 모바일 노출수 44.7만·색인 페이지 171K 관리, 스팸 크롤 급증(Crawled-Not-Indexed 192만 건, +162%)에 차단 키워드를 12→372개(약 31배) 확장해 대응",
    ],
  },
  {
    title: "프론트엔드부터 서버·인프라까지 다룹니다.",
    items: [
      "(오픈잇) PHP 레거시를 Spring Boot + React 전면 재구성, MSA(Feign Client) 기반 FE/BE 개발",
      "(크로켓) fetch 캐싱 인프라 설계, Edge Runtime 미들웨어 디버깅·운영, 관세청 연동 서버 프록시 구성",
    ],
  },
  {
    title: "AI를 검증 가능한 개발 프로세스로 운영합니다.",
    items: [
      "개발 계획서 선작성 → 리뷰·검증 반복 → 코드 정리로 이어지는 AI 활용 개발 프로세스를 CLAUDE.md로 규약화해 운영",
    ],
  },
];

const CAREERS = [
  {
    company: "(주) 와이오엘오",
    period: "2023.06 ~ 재직중",
    logo: { src: "/BI_croket.svg", alt: "크로켓", chip: "bg-white" },
    items: [
      "Nuxt 2 → Next.js 무중단 마이그레이션 단독 주도 - 보안 지원 종료에 선제 대응해 기술 선정부터 전환까지 단독 수행. 신규/레거시 공존 전략으로 핵심 8개 페이지를 서비스 중단 없이 전환하고 이후 신규 개발을 전량 Next.js로 전환. 클라이언트(Jotai)·서버(TanStack Query v5) 상태를 분리하고 컨벤션 문서화·PR 코드리뷰로 팀 표준 환경을 정립했습니다.",
      "성능·SEO 체계 구축으로 모바일 검색 노출 사실상 0 → 44.7만 - Core Web Vitals 개선(빠른 URL 99.1%), 인덱싱 페이지 171K 확대, 전 페이지 Lighthouse SEO 100 달성. Lighthouse 주기 측정 + GSC 모니터링으로 성능 회귀 방지 체계를 정착시켰습니다.",
      "프로덕트 디자인팀과 디자인 시스템 공동 구축 (24개 카테고리·21개 공통 컴포넌트) - 컴포넌트 특성에 따라 Compound/Props 패턴을 선택 적용하고 Figma 명세-코드 1:1 대응 구조를 확립해 기획-개발 커뮤니케이션 비용을 줄이고 중복 코드 누적 사이클 탈피를 주도 개발하였습니다.",
    ],
  },
  {
    company: "(주) 오픈잇",
    period: "2018.11 ~ 2023.05",
    logo: { src: "/CI_openit.svg", alt: "오픈잇", chip: "bg-neutral-900" },
    items: [
      "PHP 레거시를 Spring Boot + React로 전면 재구성 (쥬비스 상담 시스템) - 함수형 컴포넌트·Hooks 구조로 현대화하고, 스키마당 100개 이상 테이블의 복잡한 DB 환경에서 기존 시스템 에러 없이 전환. UX·유지보수성 개선",
      "SKT 5GX Cloud Platform FE/BE 개발 - MSA(Feign Client) 기반 — 고객사 VDI 환경에 맞춘 세션 로그인 및 계약 파트를 개발하며 복잡한 엔터프라이즈 인프라 환경에 대한 이해를 확보",
      "SK 전사 그룹웨어 HAPP Admin 시스템 단독 개발 - 구성원 의견/서베이, 파일·메뉴 관리 기능을 단독으로 고도화·개발",
    ],
  },
];

const CERTIFICATIONS = [
  {
    name: "APEX Essential 인증시험 (생성형 AI 역량 인증)",
    issuer: "Day1 Company",
    date: "발행일: 2026년 8월 · 만료일: 2027년 8월",
    id: "APEX-202608-000033",
  },
  {
    name: "정보처리기사",
    issuer: "한국산업인력공단(HRD Korea)",
    date: "발행일: 2018년 8월",
    id: "18202010905A",
  },
];

const SKILL_GROUPS = [
  { label: "Frontend", icons: "ts,js,react,nextjs,vuejs,nuxtjs,styledcomponents" },
  { label: "Backend", icons: "java,spring" },
  { label: "Infra / Performance", icons: "vercel" },
];

// skillicons.dev에 아이콘이 없는 기술 — 텍스트로만 표기
const ICONLESS_SKILLS = ["Jotai", "TanStack Query"];

function SectionHeading({ children }: { children: string }) {
  return (
    <h2 className="font-heading text-2xl font-bold">{children}</h2>
  );
}

export default function AboutPage() {
  return (
    <div className="mx-auto grid w-full max-w-5xl flex-1 gap-8 px-4 py-8 md:grid-cols-[240px_1fr]">
      <JsonLd data={PERSON_JSON_LD} />

      <aside className="hidden md:block">
        <div className="sticky top-20">
          <Sidebar withProfile={false} />
        </div>
      </aside>

      <div className="flex flex-col gap-20">
        <section className="flex flex-col items-center gap-8 text-center">
          <h1 className="sr-only">소개</h1>
          <Avatar className="size-80">
            <AvatarImage src="/profile.jpeg" alt="이규진" />
            <AvatarFallback className="text-8xl">G</AvatarFallback>
          </Avatar>
          <p className="leading-[1.45] text-lg text-muted-foreground">
            운영 중인 서비스에서 마주한 문제를 끝까지 추적해 해결하는 풀스택
            개발자 이규진입니다.
          </p>
          <ol className="flex w-full flex-col gap-4 text-left">
            {HIGHLIGHTS.map((highlight, index) => (
              <li key={highlight.title} className="flex flex-col gap-1.5">
                <p className="text-lg font-medium leading-[1.45]">
                  {index + 1}. {highlight.title}
                </p>
                <ul className="flex flex-col gap-1.5 pl-4">
                  {highlight.items.map((item) => (
                    <li
                      key={item}
                      className="leading-[1.45] text-base text-muted-foreground before:mr-1.5 before:content-['▪︎']"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </section>

        <section className="flex flex-col gap-5">
          <SectionHeading>이력</SectionHeading>
          <div className="flex flex-col">
            {CAREERS.map((career, index) => {
              const isLast = index === CAREERS.length - 1;
              return (
                <div key={career.company} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <span className="mt-3 size-2.5 shrink-0 rounded-full bg-primary" />
                    {!isLast && <span className="w-px flex-1 bg-border" />}
                  </div>
                  <div className={`flex flex-col gap-2 ${isLast ? "" : "pb-12"}`}>
                    <div className="flex flex-wrap items-center gap-x-3">
                      <div
                        className={`flex h-10 items-center rounded-md px-3 ${career.logo.chip}`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={career.logo.src}
                          alt={career.logo.alt}
                          className="h-5 w-auto"
                        />
                      </div>
                      <p className="text-lg font-medium">{career.company}</p>
                      <p className="text-sm text-muted-foreground">
                        {career.period}
                      </p>
                    </div>
                    <ul className="flex flex-col gap-2">
                      {career.items.map((item) => (
                        <li
                          key={item}
                          className="leading-[1.45] text-base text-muted-foreground before:mr-1.5 before:content-['-']"
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <SectionHeading>스킬</SectionHeading>
          <div className="flex flex-col gap-3">
            {SKILL_GROUPS.map((group) => (
              <div key={group.label} className="flex flex-col gap-1.5">
                <p className="text-base font-medium text-muted-foreground">
                  {group.label}
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://skillicons.dev/icons?i=${group.icons}`}
                  alt={group.icons.split(",").join(", ")}
                  className="h-10 w-auto"
                  width={48 * group.icons.split(",").length}
                  height={48}
                />
              </div>
            ))}
            <p className="text-xs text-muted-foreground">
              그 외: {ICONLESS_SKILLS.join(", ")}
            </p>
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <SectionHeading>자격증</SectionHeading>
          <ul className="flex flex-col gap-3">
            {CERTIFICATIONS.map((cert) => (
              <li key={cert.id} className="flex flex-col gap-0.5">
                <p className="text-lg font-medium leading-[1.45]">{cert.name}</p>
                <p className="leading-[1.45] text-base text-muted-foreground">
                  {cert.issuer} · {cert.date}
                </p>
                <p className="text-sm text-muted-foreground">
                  식별번호: {cert.id}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="flex flex-col gap-2">
          <SectionHeading>학력</SectionHeading>
          <p className="leading-[1.45] text-base text-muted-foreground">
            국립 한경대학교 컴퓨터공학과 졸업 (2012.03 ~ 2018.02)
          </p>
        </section>
      </div>
    </div>
  );
}
