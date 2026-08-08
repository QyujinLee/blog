// 백엔드 연동 전까지 임시 목업 (docs/blog-structure-plan.md "데이터 모델" 섹션의 Post 타입을 따름)
export type Post = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  body: string; // 마크다운
  category: string; // Category.slug, src/data/categories.ts 참고
  tags: string[];
  series?: {
    slug: string;
    title: string;
    order: number;
  };
  pinned: boolean;
  hidden: boolean;
  viewCount: number;
  likeCount: number;
  createdAt: string;
  updatedAt: string;
};

export const posts: Post[] = [
  {
    id: "1",
    slug: "spring-boot-jwt-auth",
    title: "Spring Boot에서 JWT 인증 직접 구현하기",
    summary: "라이브러리 없이 필터 체인부터 서명 검증까지 직접 붙여본 기록",
    category: "backend",
    tags: ["spring-boot", "jpa"],
    pinned: true,
    hidden: false,
    viewCount: 482,
    likeCount: 31,
    createdAt: "2026-05-12T09:00:00+09:00",
    updatedAt: "2026-05-12T09:00:00+09:00",
    body: `Spring Security의 필터 체인에 커스텀 JWT 필터를 끼워 넣는 과정을 정리한다.

## 왜 직접 구현했나

기존 라이브러리는 리프레시 토큰 전제가 강해서, 짧은 만료 + 재로그인 전략에는 오히려 코드가 더 복잡해졌다.

### 요구사항 정리

- 로그인 성공 시 서명된 JWT 발급
- 매 요청마다 \`Authorization\` 헤더 검증
- 만료 시 그대로 401

## 필터 구현

\`OncePerRequestFilter\`를 상속해 \`SecurityContext\`에 인증 객체를 직접 채워 넣는다.

\`\`\`kotlin
class JwtAuthFilter(private val jwtProvider: JwtProvider) : OncePerRequestFilter() {
    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        chain: FilterChain,
    ) {
        val token = request.getHeader("Authorization")?.removePrefix("Bearer ")
        if (token != null && jwtProvider.validate(token)) {
            val auth = jwtProvider.getAuthentication(token)
            SecurityContextHolder.getContext().authentication = auth
        }
        chain.doFilter(request, response)
    }
}
\`\`\`

### 서명 검증 옵션 비교

| 방식 | 장점 | 단점 |
| --- | --- | --- |
| HS256 | 구현 간단 | 시크릿 공유 필요 |
| RS256 | 공개키만 배포 가능 | 키 관리 부담 |

## 결론

개인 블로그 규모에선 HS256으로 충분했다.`,
  },
  {
    id: "2",
    slug: "nextjs-isr-revalidate",
    title: "온디맨드 ISR로 재빌드 없이 콘텐츠 갱신하기",
    summary: "글 하나 바뀔 때마다 전체 재빌드하지 않도록 웹훅으로 캐시만 무효화한 이야기",
    category: "frontend",
    tags: ["nextjs", "react"],
    series: { slug: "nextjs-deep-dive", title: "Next.js 파헤치기", order: 1 },
    pinned: true,
    hidden: false,
    viewCount: 915,
    likeCount: 58,
    createdAt: "2026-06-02T10:30:00+09:00",
    updatedAt: "2026-06-20T14:15:00+09:00",
    body: `정적 export와 달리 Vercel 배포에서는 페이지 단위로 캐시를 무효화할 수 있다.

## 문제 상황

글 하나를 고쳐도 사이트 전체를 다시 빌드해야 한다면, 콘텐츠가 늘어날수록 배포 시간이 계속 길어진다.

### 기존 접근의 한계

정적 export는 빌드 시점에 모든 HTML을 고정하기 때문에, 변경분만 갱신하는 방법이 없다.

## 온디맨드 재검증 웹훅

글 CRUD가 성공하면 백엔드가 프론트의 재검증 라우트를 호출한다.

\`\`\`ts
export async function POST(request: Request) {
  const secret = request.headers.get("x-revalidate-secret");
  if (secret !== process.env.REVALIDATE_SECRET) {
    return new Response("unauthorized", { status: 401 });
  }
  revalidatePath("/", "layout");
  return Response.json({ revalidated: true });
}
\`\`\`

### 왜 경로별로 세밀하게 안 나눴나

| 방식 | 구현 난이도 | 버그 여지 |
| --- | --- | --- |
| 경로별 선택적 무효화 | 높음 | 노출 누락 가능 |
| layout 전체 무효화 | 낮음 | 거의 없음 |

개인 블로그 규모에서는 후자가 더 단순하고 안전했다.

## 다음 글 예고

App Router로 옮기며 겪은 삽질은 다음 글에서 이어서 정리한다.`,
  },
  {
    id: "3",
    slug: "nextjs-app-router-migration",
    title: "Pages Router에서 App Router로 옮기며 겪은 것들",
    summary: "레이아웃 중첩과 데이터 페칭 방식이 완전히 달라져서 생긴 시행착오 정리",
    category: "frontend",
    tags: ["nextjs", "typescript"],
    series: { slug: "nextjs-deep-dive", title: "Next.js 파헤치기", order: 2 },
    pinned: false,
    hidden: false,
    viewCount: 603,
    likeCount: 40,
    createdAt: "2026-06-25T11:00:00+09:00",
    updatedAt: "2026-06-25T11:00:00+09:00",
    body: `App Router로 옮기면서 가장 먼저 부딪힌 건 데이터 페칭 위치였다.

## 레이아웃 중첩

\`layout.tsx\`는 페이지 전환 시 다시 렌더링되지 않는다는 걸 감안하고 구조를 짜야 했다.

### 공유 상태를 어디에 둘지

Provider를 루트 레이아웃에 두되, 서버 컴포넌트인 레이아웃 자체는 그대로 두고 별도 클라이언트 컴포넌트로 분리했다.

\`\`\`tsx
export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient());
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
\`\`\`

## 정리

Pages Router 대비 초기 학습 비용은 있었지만, 페이지별 렌더링 전략을 세밀하게 고를 수 있는 점이 결국 더 컸다.`,
  },
  {
    id: "4",
    slug: "docker-multi-stage-build",
    title: "멀티스테이지 빌드로 이미지 용량 1/5로 줄이기",
    summary: "빌드 의존성과 런타임 의존성을 분리해 배포 이미지를 가볍게 만든 기록",
    category: "infra",
    tags: ["docker", "aws"],
    pinned: false,
    hidden: false,
    viewCount: 271,
    likeCount: 19,
    createdAt: "2026-07-10T08:20:00+09:00",
    updatedAt: "2026-07-10T08:20:00+09:00",
    body: `빌드 도구가 통째로 런타임 이미지에 들어가 있던 게 용량 문제의 원인이었다.

## 문제

기존 Dockerfile은 빌드와 실행을 한 스테이지에서 처리해서, 런타임에 필요 없는 컴파일러까지 이미지에 포함됐다.

### 용량 비교

| 이미지 | 크기 |
| --- | --- |
| 기존 단일 스테이지 | 1.2GB |
| 멀티스테이지 적용 후 | 230MB |

## 멀티스테이지로 분리

\`\`\`dockerfile
FROM node:24-alpine AS build
WORKDIR /app
COPY . .
RUN yarn install --frozen-lockfile && yarn build

FROM node:24-alpine AS runtime
WORKDIR /app
COPY --from=build /app/.next/standalone ./
CMD ["node", "server.js"]
\`\`\`

## 결론

런타임 이미지에는 빌드된 결과물만 남기는 게 핵심이었다.`,
  },
];
