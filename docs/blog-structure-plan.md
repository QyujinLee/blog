# 블로그 구조 설계

## 전체 아키텍처

두 개의 저장소로 분리한다.

```
브라우저 (클라이언트)
   │  httpOnly 쿠키 자동 첨부, 항상 같은 도메인의 /api/* 만 호출
   ▼
┌───────────────────────────┐   서버-to-서버 REST    ┌──────────────────────────────┐
│  blog (이 저장소)            │   (Authorization 헤더)  │  blog-api (별도 저장소)          │
│  Next.js Route Handler = BFF │ ──────────────────► │  NestJS + Prisma (TypeScript)  │
│  Vercel 배포 (SSG+ISR)      │ ◄──────────────────  │  PostgreSQL + Redis            │
│  push → Vercel 자동배포       │  on-demand revalidate │  Render(웹서비스) + Neon(DB, 우선)     │
└───────────────────────────┘   웹훅 (글 CRUD 시)     └──────────────────────────────┘
```

- 프론트: Next.js를 **Vercel**에 배포(정적 export 아님, Vercel의 서버리스 런타임 사용). 페이지는 SSG로 사전 렌더링하되, 글 CRUD 시 백엔드가 **온디맨드 ISR 재검증** 웹훅을 호출해 해당 페이지만 즉시 갱신 — 콘텐츠 하나 바뀔 때마다 전체 사이트를 재빌드할 필요 없음.
- 백엔드: NestJS + Prisma REST API, 별도 저장소·별도 배포(Render 무료 웹서비스, 512MB RAM/0.1CPU, 15분 미사용 시 슬립 — Node 런타임이라 재기동은 1~2초). **DB는 Render 자체 Postgres 대신 Neon 무료 Postgres 우선 사용** — Render 무료 Postgres는 일정 기간 후 삭제되는 정책이라 장기 운영 불가. Neon은 미사용 시 컴퓨트만 자동으로 잠들었다 다음 요청에 자동으로 깨어나 사람 개입이 필요 없음(Supabase는 7일 미사용 시 대시보드에서 수동 복구가 필요해 후순위).
- **인증은 BFF(Backend-For-Frontend) 패턴**: 브라우저는 NestJS를 절대 직접 호출하지 않고, 항상 Next.js의 `app/api/*` Route Handler만 호출함. 그 Route Handler가 서버 코드로서 NestJS와 통신함.
  - **소유자(`gyujin89@gmail.com`) 로그인**: 이메일+비밀번호 → Route Handler가 NestJS에 검증 요청 → JWT(role: `OWNER`) 받아서 httpOnly 쿠키로 브라우저에 저장. 글 CRUD/숨김/고정 권한
  - **방문자 로그인(v1 스코프 제외)**: 원래 Google OAuth로 방문자를 인증해 댓글 작성 권한을 주는 설계였으나, 방문자 로그인의 유일한 용도가 댓글이었고 댓글 자체를 v1에서 뺐으므로 방문자 로그인도 같이 보류(아래 "댓글 시스템" 섹션 참고). `blog-api`의 `POST /auth/google`/`User`(VISITOR) 테이블은 이미 구현·검증까지 끝난 상태라 그대로 두고, 필요해지면 이 프론트 쪽만 다시 붙이면 됨
  - 브라우저는 토큰 값을 절대 못 읽음(JS로 접근 불가) — 같은 오리진 요청 시 브라우저가 쿠키를 자동으로 첨부해줄 뿐. 클라이언트 컴포넌트(TanStack Query 훅 포함)는 그냥 `/api/...`를 평범하게 `fetch`하면 됨
  - 로그인 여부를 화면에 표시해야 할 땐 `app/api/auth/session/route.ts`(NestJS에 위임 검증 후 `{ isAuthenticated, role }`만 반환)를 `hooks/use-session.ts`(TanStack Query)로 조회
- **CORS는 사실상 불필요**: 브라우저가 NestJS에 직접 요청을 보내는 경우가 없으므로(전부 Next.js 서버를 경유), NestJS 쪽 CORS 설정은 없어도 됨. 오히려 NestJS를 Vercel 서버 쪽에서만 접근 가능하도록 더 좁혀도 됨 (선택사항).

> 이 문서(`blog` 저장소)는 프론트엔드 구조에 집중한다. 백엔드 상세 설계는 `blog-api` 저장소에서 별도로 문서화.

## 페이지 구성

| 경로 | 성격 |
|---|---|
| `/` | 메인(GitHub 프로필 스타일) — 자기소개 + 대표(고정/pinned) 글 |
| `/posts` | 전체 글 목록 |
| `/posts/[slug]` | 글 상세 |
| `/about` | 소개 페이지 — 프로젝트 이력/스킬/개발 철학 + 이력서 다운로드 |
| `/search` | 검색 결과 — 카테고리·태그 필터도 이 페이지 하나로 통합(아래 "통합 검색" 참고) |
| `/posts/new` | 새 글 작성 (로그인 상태 아니면 로그인 모달 오픈 + 홈으로 리다이렉트) |
| `/posts/[slug]/edit` | 글 수정 |

로그인은 별도 페이지가 아니라 **모달**(자세한 내용은 "로그인 모달" 섹션 참고) — 그래서 `/login` 라우트 자체가 없음.

별도 관리자 화면(`/admin`)은 없음 — 일반 블로그와 똑같은 화면을 쓰고, 본인 계정으로 로그인했을 때만 같은 페이지 안에 수정/삭제/숨김/고정/업로드 컨트롤이 인라인으로 나타남 (아래 "권한 노출 방식" 참고).

## 페이지별 렌더링 전략

Vercel 배포라 SSR/ISR 전부 사용 가능. 아래 두 가지로 구성:

| 전략 | 대상 | 방식 |
|---|---|---|
| **SSG + 온디맨드 ISR** | `/`, `/about`, `/posts`, `/posts/[slug]` | 빌드 시 백엔드 API로 데이터를 가져와 HTML로 사전 렌더링(`generateStaticParams`). 이후 콘텐츠가 바뀌면 전체 재빌드 대신 **해당 페이지만 재검증**(아래 참고). SEO 대상 페이지 전부 여기 해당 |
| **클라이언트 렌더링(CSR)** | `/search`, `/posts/new`, `/posts/[slug]/edit` | 요청 시점 데이터(검색어, 인증 상태)라 사전 렌더링 의미 없음. 브라우저에서 API 호출로 채움 |

**이 Next.js 버전(16.2, `cacheComponents` 미사용)은 `fetch`가 기본적으로 캐시되지 않음** — SSG 대상 페이지(`/`, `/about`, `/posts`, `/posts/[slug]`)에서 백엔드를 호출할 땐 반드시 `{ cache: 'force-cache' }`를 명시해야 빌드/재검증 시점에만 데이터를 가져오고 그 사이엔 캐시된 결과를 씀. 빠뜨리면 매 요청마다 NestJS를 호출하는 사실상 SSR이 되어버려 Render 콜드스타트 문제가 그대로 노출되고 온디맨드 ISR의 이점도 사라짐(단, 아래 "숨김 글 미리보기" Draft Mode가 켜진 요청은 이 옵션과 무관하게 항상 우회됨 — 의도된 동작).

메인(`/`)의 통계 위젯(`stats-widget.tsx`)은 SSG 스냅샷에 포함하지 않고 **클라이언트 아일랜드로 얹어 CSR**로 가져옴(`use-stats.ts`, TanStack Query) — 조회수/방문은 글 CRUD가 아니라 재검증 트리거가 없으므로, SSG에 포함시키면 글을 며칠 안 쓰는 동안 그래프가 그대로 멈춰 있게 됨.

글 상세(`/posts/[slug]`)는 본문만 SSG(+ISR)이고, 댓글/좋아요는 둘 다 v1 스코프 제외(아래 "댓글 시스템", "글 추천(좋아요)" 섹션 참고)라 클라이언트 아일랜드 관련 서술은 지금은 해당 없음.

**온디맨드 ISR 재검증**: 정적 export 때와 달리 "글 하나 바뀔 때마다 사이트 전체 재빌드"를 안 해도 됨(빌드 자체를 다시 안 함, Next.js가 캐시만 무효화하고 다음 요청 때 해당 페이지들을 재생성). `blog-api`가 글 발행/수정/삭제/숨김/고정 성공 시 `blog` 저장소의 `app/api/revalidate/route.ts`를 호출(`POST /api/revalidate`, `x-revalidate-secret` 헤더로 인증 — 쿼리스트링에 시크릿을 넣으면 로그에 남을 수 있어 헤더 사용). 어떤 글이 어떤 카테고리/태그/시리즈 페이지에 노출되는지 일일이 계산해서 선택적으로 무효화하는 대신, **`revalidatePath('/', 'layout')`로 루트 레이아웃 하위 전체를 한 번에 무효화** — 개인 블로그 규모에서 페이지 수가 많지 않아 이 방식이 더 단순하고 "이 글이 어디어디 노출되는지 빠짐없이 계산"하는 로직에서 생기는 버그 여지도 없음. 요청 바디는 필요 없음(무엇이 바뀌었는지 굳이 안 알려줘도 됨), 호출 자체가 트리거.

**글 삭제 시 404 처리**: `/posts/[slug]` 페이지 컴포넌트는 백엔드가 `GET /posts/{slug}`에 404를 반환하면 Next.js의 `notFound()` 헬퍼를 호출해야 함 — 삭제된 글의 재검증된 페이지가 빈 화면이나 에러 대신 정상적인 404로 뜨게 하기 위함.

> **알려진 한계 (E2E 테스트 작성 중 실제로 재현·확인함)**: `/posts/[slug]`처럼 `await params`가 필요한 async 페이지에서 `notFound()`를 호출하면, Next.js가 응답 헤더를 이미 스트리밍으로 보낸 뒤라 실제 HTTP 상태 코드는 200으로 남음(공식 문서에 명시된 동작 — [`loading.js` Status Codes](https://nextjs.org/docs/app/api-reference/file-conventions/loading#status-codes) 참고, 관련 이슈: [vercel/next.js#76474](https://github.com/vercel/next.js/issues/76474)). `generateStaticParams`/`loading.tsx` 유무와 무관하게 재현됨 — 직접 둘 다 제거해보고 확인. **SEO엔 실질적 영향 없음**: Next.js가 스트리밍된 404 응답에 `<meta name="robots" content="noindex">`를 자동으로 삽입해 검색엔진이 색인하지 않도록 막아줌(실제 응답에서 확인함). 진짜 404 상태 코드가 필요하면(컴플라이언스/분석 목적) `proxy`에서 존재 여부를 먼저 확인해야 하는데, 개인 블로그 규모에 비해 과한 복잡도라 도입 안 함.

## 레이아웃

```
┌─────────────────────────────────────────────┐
│           Header (중앙 "gyujin's log")         │
├───────────────┬───────────────────────────────┤
│               │                               │
│   Sidebar     │         Main Content          │
│ (페이지별 상이) │        (children)             │
│               │                               │
├───────────────┴───────────────────────────────┤
│      Footer  (© 연도 gyujin · gyujin89@gmail.com) │
└─────────────────────────────────────────────┘
```

- 데스크톱: 사이드바(고정폭) + 본문 2컬럼 그리드, 사이드바는 상단 고정(sticky)
- 헤더는 `position: sticky; top: 0`으로 항상 화면 상단에 고정 + 스크롤에 반응해 접힘: 페이지 맨 위에서는 넉넉한 높이/큰 타이틀 폰트, 일정 거리(예: 40px) 이상 스크롤하면 높이(패딩)와 타이틀 폰트 크기가 줄어든 "컴팩트" 상태로 전환. `hooks/use-scroll-collapse.ts`(passive 스크롤 리스너, threshold 기반 boolean 반환)로 상태 판단, 패딩/폰트 크기 전환에 `transition-all duration-200`으로 부드럽게 애니메이션 — `prefers-reduced-motion`이면 트랜지션 생략
- 브레이크포인트는 Tailwind 기본값 `md`(768px) 기준 — 그 미만은 모바일 취급, 이상은 데스크톱 취급 (Tailwind 관행)
- 모바일(`md` 미만): 사이드바는 기본적으로 숨겨지고, 헤더 왼쪽 상단의 햄버거 버튼을 누르면 왼쪽에서 슬라이드로 열리는 드로어(shadcn `Sheet`)에 같은 사이드바 컴포넌트(프로필/카테고리 아코디언, 페이지별 구성 동일하게 적용)가 그대로 렌더링됨
- 데스크톱(`md` 이상): 사이드바 고정 노출, 햄버거 버튼은 숨김
- 스타일: shadcn 기본 neutral 대신 아래 "비주얼 아이덴티티" 커스텀 팔레트 적용, 여백 넉넉하게 미니멀 톤

## 로딩 UI

전 구간에서 로딩 표시는 `components/loading-overlay.tsx` 하나로 통일한다 — `--serenity-900` 토큰을 `color-mix()`로 50% 불투명도 처리한 딤 배경 위에 `public/loading-logo.svg`(브랜드 그라데이션 "gyujin's log" 텍스트가 좌→우로 채워졌다가 좌→우로 지워지는 SMIL 애니메이션, 3.2s 루프)를 중앙에 띄우는 전체화면(`fixed inset-0`) 오버레이.

- **페이지 라우팅 시**: `app/loading.tsx`에 그대로 배치 — Next.js `loading` 파일 컨벤션에 따라 해당 세그먼트의 `page.tsx`(+하위)가 Suspense로 감싸져서, 라우트 세그먼트가 아직 서버에서 준비 안 된 동안 자동으로 이 오버레이가 뜸. 헤더/사이드바 같은 공유 레이아웃은 이 Suspense 밖이라 로딩 중에도 계속 인터랙티브함 (Next.js 기본 동작)
- **글 등록/수정/삭제 등 mutation 시**: 이런 액션은 서버 컴포넌트 렌더링이 아니라 클라이언트에서 TanStack Query `useMutation`으로 처리되므로 `loading.tsx`가 관여하지 않음 — 대신 각 트리거 컴포넌트(`markdown-editor.tsx`의 저장 버튼, `owner-actions.tsx`의 삭제 확인 등)가 `mutation.isPending`일 때 `<LoadingOverlay />`를 조건부로 렌더링. 아직 이 컴포넌트들 자체가 구현 전이라 실제 연결은 각각 만들 때 진행 — 여기선 패턴만 확정

## 비주얼 아이덴티티 (컬러 / 타이포그래피 / 아이콘)

미리보기: [gyujin's log — Theme](https://claude.ai/code/artifact/c10c7b45-abf9-447b-b195-ff942642dca3) — 헤더 그라데이션, 팔레트, 타이포그래피, 적용 예시를 실제로 렌더링해서 확인 가능 (다크모드는 시스템 설정 따라 자동 전환).

### 컬러

2016년 팬톤이 처음으로 함께 선정한 두 가지 올해의 색 — Rose Quartz(장미빛 새벽)와 Serenity(고요한 저녁) — 가 겹치는 순간을 헤더 그라데이션으로 삼고, Serenity 하나를 채도·명도만 바꿔 5단계로 풀어 본문/푸터에 적용:

| 토큰 | 역할 | HEX |
|---|---|---|
| `--rose-quartz` | 헤더 그라데이션 시작점 | `#F7CAC9` |
| `--serenity` | 헤더 그라데이션 끝점 + 링크/강조 기준색 | `#92A8D1` |
| `--serenity-50` | 페이지 배경 | `#F4F7FC` |
| `--serenity-200` | 카드/구분선(표면) | `#D7E1F0` |
| `--serenity-600` | 버튼/링크/태그 강조, 푸터 배경 | `#4C6A9C` |
| `--serenity-900` | 본문 텍스트, 코드블럭 배경, 헤더 타이틀 | `#1B2A42` |

- Rose Quartz + Serenity 5단계(50/200/600/900/기준색)로 총 6토큰
- 헤더 그라데이션(`linear-gradient(115deg, var(--rose-quartz), var(--serenity))`)은 라이트/다크 모드 공통 고정 — 브랜드 정체성이라 테마에 따라 안 바뀜. 헤더 위 타이틀 텍스트는 두 모드 모두 `--serenity-900`(가장 짙은 잉크톤)으로 읽힘
- 푸터는 `--serenity-600` 고정 배경(가장 짙은 900이 아니라 강조색과 같은 600) — 테마와 무관하게 항상 같은 톤. 푸터 텍스트는 대비 확보를 위해 밝은 톤이 필요한데, **새 토큰을 만들지 않고 이미 있는 `--serenity-50`을 그대로 재사용**(대비 5.08:1로 WCAG AA 통과 — 새로 값을 하나 더 만들기 전에 기존 팔레트에서 먼저 찾아 쓰는 원칙)
- 코드블럭 문법 강조도 마찬가지로 새 색 없이 기존 토큰 재사용: `--rose-quartz`/`--serenity`를 코드블럭 배경(`--serenity-900`) 위에 직접 얹어도 각각 대비 9.78:1 / 6.0:1로 충분히 읽힘
- **컬러 하드코딩 금지 원칙**: 컴포넌트 코드 어디에서도 `#4C6A9C`같은 hex를 직접 쓰지 않음. 전부 이 토큰(CSS 커스텀 프로퍼티)을 참조하거나, 그걸로도 안 되면(투명도가 필요한 그림자 등) `color-mix(in srgb, var(--serenity-900) 6%, transparent)`처럼 기존 토큰에서 유도. 필요한 색이 토큰에 없으면 그때 이 표에 새로 추가하고, 있는 걸 두고 새로 만들지 않음
- **다크모드 페이지 배경은 이 팔레트에 안 묶임** — 눈부심 방지를 위해 이 브랜드 스케일보다 더 짙은(거의 검정에 가까운) 별도 다크모드 전용 배경/표면 토큰을 씀(예: 배경 `#0F1526`대). 다크모드는 단순 반전이 아니라 배경/표면/텍스트/강조색을 별도로 재정의(대비 유지). 구현 시 `next.js`의 `prefers-color-scheme` + 뷰어 토글용 `data-theme` 양쪽 다 대응 필요
- 실제 구현 시엔 이 팔레트를 shadcn이 기대하는 표준 토큰 이름(`--background`, `--foreground`, `--primary` 등, `components.json`의 `base-nova` 스타일이 생성한 `globals.css`의 실제 변수명·색공간 확인 후)에 매핑 — shadcn 컴포넌트들이 이 값을 자동으로 물려받도록. Tailwind 클래스도 `bg-[#4C6A9C]` 같은 임의값(arbitrary value) 대신 이 토큰에 매핑된 `bg-accent` 같은 시맨틱 클래스만 사용

### 시맨틱 컬러 (성공 / 오류·경고)

브랜드 팔레트(Rose Quartz/Serenity)와는 별개로, 상태 전달 전용으로 팬톤 올해의 컬러에서 하나씩 더 가져옴:

| 토큰 | 역할 | HEX |
|---|---|---|
| `--success` | 성공 (저장/업로드 완료 등) — 2013년 팬톤 올해의 컬러 Emerald | `#009473` |
| `--destructive` | 오류·경고 (실패, 삭제 확인 등) — 2007년 팬톤 올해의 컬러 Chili Pepper | `#9B1B30` |

- 토큰 이름은 `--danger`가 아니라 shadcn 표준 명명인 **`--destructive`**를 그대로 씀(`globals.css`에 이미 이 이름으로 구현되어 있음, `bg-destructive` 등 shadcn 유틸리티 클래스와 자동으로 맞물리도록)
- 각각 옅은 배경 톤(`--success-soft`, `--destructive-soft`)을 같이 정의해 토스트/알림의 배경으로 사용(강조색 텍스트 + 옅은 배경 조합) — 실제 사용 예는 `sonner.tsx`
- 다크모드에서는 어두운 배경 위에서도 읽히도록 더 밝은 변형을 별도 정의(단순 반전 아님) — 예: 다크모드 성공은 `#3DD9B0`, 오류는 `#E8677E` 근방
- `sonner` 토스트, `owner-actions.tsx`의 삭제 확인, 이미지 업로드 실패 메시지 등에 사용

### 타이포그래피

- **Pretendard** — 제목/본문. 무료(SIL Open Font License), 한글+라틴을 함께 잘 다루는 시스템 UI 대체 서체. `next/font/local`로 셀프호스팅(정적 굵기별 `woff2` 3파일 — Regular/SemiBold/Bold — 로 400/600/700 커버. OG 이미지 생성 전용으로 Bold/SemiBold `otf` 2파일이 별도로 더 있음, "OG 이미지" 체크리스트 항목 참고 — `next/og`가 `woff2`를 지원하지 않아서)
- **JetBrains Mono** — 코드블럭(`rehype-pretty-code`), 날짜, hex 코드 등 수치/기술적 텍스트. 무료, 숫자 0과 문자 O 구분이 뚜렷한 고정폭 서체

### 아이콘

`lucide-react` — 1차 shadcn 초기 세팅(`npx shadcn init`) 때 이미 설치됨(무료, MIT 라이선스, shadcn 생태계 기본 아이콘셋). 별도 아이콘 라이브러리 추가 불필요.

### 사이드바는 페이지에 따라 구성이 다름

- **메인(`/`)**: 카테고리 아코디언만. 프로필 카드는 넣지 않음 — 메인 화면 자체가 이미 자기소개를 보여주는 GitHub 프로필 스타일이라 중복이기 때문.
- **그 외 페이지(`/posts`, `/posts/[slug]`, `/search` 등)**: 프로필 카드(상단) + 카테고리 아코디언(하단) 둘 다 노출.
- 카테고리 아코디언 목록 **맨 위**에 `/posts`(전체 글 목록), `/about`(소개 페이지) 링크를 고정으로 둠 — 카테고리처럼 접히는 항목이 아니라 그냥 단일 링크. (문서 리뷰 중 발견) `/posts` 자체는 원래부터 있었지만 헤더/사이드바 어디서도 링크가 없어 UI로는 도달 불가능했음 — E2E 테스트 작성 중 발견해 추가

## 확정 사항 (사용자 결정)

- 헤더 중앙 텍스트: `gyujin's log`
- 푸터: `Copyright © <연도> gyujin. All rights reserved.` + `gyujin89@gmail.com` 연락처(`mailto:` 링크). 저작권자는 **개인 본인** — 소속 회사명을 쓰지 않음(개인 블로그라 회사가 저작권자가 아님)
- 카테고리 목록 = **아코디언**: 클릭 시 하위에 **그 카테고리에 속한 해시태그 목록**이 펼쳐짐(`#태그명 (글 개수)` 형식, shadcn Accordion). 글 제목이 아니라 태그를 보여주는 이유는 아코디언을 "다음 탐색 단계로 좁혀가는 입구"로 쓰기 위함 — 태그 클릭 시 `/search?tags=태그명`으로 라우팅해 그 태그의 글 목록을 보여줌. 이 목록/개수 데이터는 별도 API 없이, 어차피 SSG 렌더링 시 가져오는 전체 글 목록(`GET /posts`)을 `category` → `tags` 순으로 클라이언트에서 그룹핑/카운트해 구성 — `GET /categories`는 이거 말고 글쓰기 화면 자동완성 전용
- 프로필 사진 = 우선 플레이스홀더(이니셜 아바타), 실제 사진은 추후 교체
- 메인 페이지는 GitHub 프로필처럼: 소개 글 + 대표(핀 고정) 글 목록
- 별도 `/admin` 관리자 화면 없음 — 일반 블로그와 동일한 UI, 로그인한 소유자에게만 같은 화면에 인라인으로 수정/삭제/숨김/고정 컨트롤 노출
- 프론트: Next.js → **Vercel** 배포(SSG + 온디맨드 ISR), push 시 Vercel이 자동 빌드/배포. 백엔드가 글 CRUD 시 재검증 웹훅 호출
- 백엔드: **NestJS + Prisma**(TypeScript), 별도 저장소, **Render 무료 웹서비스**에 배포. DB는 Render가 아니라 **Neon 무료 Postgres**(우선, 자동 재개) — Supabase는 7일 미사용 시 수동 복구 필요해 후순위. 처음엔 Spring Boot로 설계했다가, Render 무료 티어에서 JVM 콜드스타트가 30~60초로 길고 프론트와 언어를 통일하는 이점이 커서 착수 직전에 NestJS로 변경(NestJS가 Spring Boot를 본떠 만든 프레임워크라 설계는 거의 그대로 유지됨 — 자세한 내용은 `blog-api` 저장소의 `docs/blog-api-plan.md`)
- 인증: 소유자는 **이메일+비밀번호** → **BFF + httpOnly 쿠키** 패턴. 브라우저는 NestJS를 직접 호출하지 않고 항상 Next.js `app/api/*`만 호출. 방문자 **Google OAuth 로그인은 v1 스코프 제외**(유일한 용도였던 댓글 자체를 뺐음, 아래 "댓글 시스템" 섹션 참고) — `blog-api`엔 이미 구현돼 있으므로 재개 시 프론트만 붙이면 됨
- 소유자 로그인 브루트포스 방어: **기존 Redis** 재사용해 IP별 시도 횟수 카운트
- 댓글 본문은 **순수 텍스트만** 렌더링 (마크다운/HTML 미허용, `white-space: pre-wrap`으로 줄바꿈만 유지) — XSS 방지 (v1 제외, 재개 시 적용)
- JWT는 **1일 만료 + 리프레시 토큰 없음**(초기엔 1시간이었으나 글 작성 중 세션이 끊기는 문제로 늘림) — 만료되면 401 → 재로그인 유도로 단순 처리
- 댓글 삭제는 **소프트 삭제**("삭제된 댓글입니다" 표시), **대댓글(스레드)은 이번 스코프 제외** (댓글 자체가 v1 스코프 제외라 이 항목도 재개 시 적용)
- 이미지 업로드 제한: **5MB, jpg/png/webp/gif만 허용**
- DB는 **Neon 무료 Postgres 우선**(Render 무료 DB는 일정 기간 후 삭제되므로 사용 안 함), 백엔드 앱은 Render 무료 웹서비스(콜드스타트 감수)
- 글 작성은 **마크다운**, 이미지 첨부는 백엔드 경유 업로드 → **Cloudflare R2** 저장
- 유닛 테스트 **Vitest**, E2E 테스트 **Playwright**
- 클라이언트 컴포넌트의 서버 상태 관리는 **TanStack Query(react-query) v5(stable)** — 검색, 통계 위젯, 글 CRUD 등 CSR로 API 호출하는 모든 곳에서 캐싱/리페치/뮤테이션 처리(댓글/좋아요는 v1 스코프 제외)
- 미니 디자인 시스템 문서화용 **Storybook** 도입
- 소개 페이지(`/about`) 텍스트(이력/스킬/철학)와 이력서 PDF 둘 다 **정적 파일로 관리** — 자주 안 바뀌므로 백엔드/DB/업로드 API 없이 git push로 반영(텍스트는 코드에 직접 작성, 이력서는 `public/resume.pdf`로 커밋)
- 포트폴리오 강화 기능 전부 이번 스코프에 포함: 다크모드, OG 이미지, 검색, 조회수, Swagger, 홈페이지 통계 시각화, 코드 하이라이트+복사, 목차, RSS, README 구성 (읽는시간은 제외). **댓글(자체 구현)과 글 좋아요(추천)는 둘 다 v1 스코프 제외** — 로그인 없는 방문자 참여 지표가 조회수 하나로도 충분하다고 판단, 글쓰기 자체에 집중(아래 "댓글 시스템", "글 추천(좋아요)" 섹션 참고). 좋아요는 blog-api API(`Post.likeCount`, `POST /posts/{slug}/like`)까지 만들고 프론트에서 실제로 붙여보기 직전(26번에서 BFF 프록시 라우트까지 구현)에 제외를 결정해서, 그 프록시 라우트(`app/api/posts/[slug]/like/route.ts`)는 다시 지움
- 글마다 **해시태그**(다중) + **시리즈**(연재글 묶음) 부여 가능, 글 하단에 **관련 글 추천** + **최근 수정일** 표시, 목록/공유용 **요약(TL;DR)** 필드 추가
- API 에러 UX: React Query 에러 상태 + shadcn `sonner`(토스트)로 가볍게 처리
- 커스텀 도메인은 v1엔 보류, `*.vercel.app`으로 시작
- 접근성(a11y): shadcn(Radix 기반) 컴포넌트가 기본 접근성을 이미 대부분 제공 — 커스텀 컴포넌트에 `aria-label` 정도만 추가로 신경
- 에러 모니터링(Sentry 등)은 이번 스코프에서 스킵 (YAGNI)
- 날짜/시간대 표시는 라이브러리 없이 `Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul' })`로 통일

## 기능 요구사항 (CRUD / 권한)

로그인한 소유자만 아래 동작 가능, 비로그인 방문자는 읽기만 가능:

- 글 등록 (제목/본문/카테고리/태그/시리즈/요약 지정) — 카테고리·태그 모두 콤보박스로 기존 값 선택 또는 새로 입력 가능 (자유 생성)
- 글 수정
- 글 삭제
- 글 숨김 처리 (목록/상세에서 비공개, 데이터는 유지)
- 핀 고정(pinned) 처리 — 메인 페이지 대표 글로 노출
- (v1 스코프 제외) 부적절한 댓글 삭제(모더레이션) — 댓글 기능 자체가 빠져서 같이 보류

비로그인 방문자도 공개(숨김 처리 안 된) 글은 자유롭게 읽을 수 있음. (댓글, 글 좋아요 둘 다 v1 스코프 제외 — 아래 "댓글 시스템", "글 추천(좋아요)" 섹션 참고)

### 권한 노출 방식 (별도 관리자 화면 없음)

방문자에게 보이는 화면과 소유자에게 보이는 화면은 **같은 페이지**임. 차이는 로그인 여부에 따라 일부 컨트롤이 인라인으로 나타나느냐뿐:

- `hooks/use-session.ts`(TanStack Query, `/api/auth/session` 조회)로 `isOwner` 판단 — JWT는 httpOnly 쿠키라 클라이언트에서 직접 읽을 수 없음. (`VISITOR` role은 방문자 로그인 자체가 v1 스코프 제외라 프론트에서 다룰 일이 없음 — `isOwner`/비로그인 두 상태만 존재)
- `components/post/owner-actions.tsx`: `isOwner`일 때만 렌더링되는 작은 툴바(수정/삭제/숨김 토글/고정 토글) — `/posts/[slug]` 상세, `/posts` 목록 각 항목에 배치. 삭제는 바로 실행되지 않고 `delete-confirm-dialog.tsx`(shadcn `AlertDialog`)로 한 번 더 확인
- 헤더에 `isOwner`일 때만 "새 글 작성" 버튼 노출 → `/posts/new`로 이동
- 로그인 버튼은 헤더 우측 상단에 항상 노출(비로그인 시) — 사실상 소유자 본인만 쓸 일이 있지만(방문자 로그인이 없으므로), 숨길 이유도 없어 그대로 노출 유지. 로그인 상태면 버튼 대신 아바타/이름 + 로그아웃으로 대체 (자세한 내용은 "로그인 모달" 섹션)
- `/posts/new`, `/posts/[slug]/edit`는 CSR 페이지라 `use-session.ts` 조회가 끝나기 전엔 로딩 스켈레톤을 보여주고, 조회 완료 후 `isOwner`가 아니면 로그인 모달을 열고 홈(`/`)으로 리다이렉트 (세션 확인 전에 폼이 잠깐 보이는 걸 방지)

## 숨김 글 미리보기 (Draft Mode)

`/posts/[slug]`가 SSG라 페이지를 렌더링하는 서버 코드는 요청자가 누군지 알 수 없음. 그래서 소유자가 자기 글을 숨겨도(`hidden: true`), 그 상세 페이지는 여전히 익명 요청으로 캐시/재생성되고 백엔드는 hidden 글에 항상 404를 돌려줌(`GET /posts/{slug}`는 hidden이면 OWNER만 조회 가능 — `blog-api` 저장소의 `docs/blog-api-plan.md` 참고) — 결과적으로 소유자 본인도 숨긴 글을 다시 볼 방법이 없어짐. 새 페이지나 라이브러리 없이 Next.js 내장 **Draft Mode**로 해결:

- 소유자 이메일/비밀번호 로그인 성공 시(`login/route.ts`) JWT 쿠키 설정과 함께 `draftMode().enable()`도 호출 — 이 브라우저에만 draft 쿠키(`__prerender_bypass`)가 심어짐
- `logout/route.ts`는 대칭적으로 `draftMode().disable()` 호출
- Draft Mode가 켜진 요청은 Next.js가 모든 `fetch` 캐시를 자동으로 우회함(`{ cache: 'force-cache' }` 옵션과 무관하게 항상 네트워크로 감) — 페이지 컴포넌트는 `draftMode()`의 `isEnabled`를 확인해서, 켜져 있으면 쿠키의 JWT를 `Authorization` 헤더로 실어 백엔드에 요청(hidden 글도 응답에 포함), 꺼져 있으면 기존처럼 익명 요청
- 이 우회는 소유자 세션에만 적용되고 다른 방문자는 그대로 캐시된/404 버전을 봄
- `GET /posts` 목록도 같은 원리로 OWNER `Authorization`이 실려오면 hidden 글을 포함해서 응답 — 소유자가 목록에서 자기 숨김 글을 찾아 들어갈 수 있게 함(`blog-api` 저장소의 `docs/blog-api-plan.md` 참고)

## 로그인 모달

> v1에서 방문자 Google OAuth 로그인이 빠지면서(아래 "댓글 시스템" 섹션 참고), 로그인은 사실상 **소유자 본인 전용** 기능이 됨. 원래 설계는 "Google 버튼이 주 노출, 이메일/비번은 숨겨진 관리자 폼"이었으나 그 구분이 무의미해져서 **이메일/비밀번호 폼 하나만** 있는 모달로 단순화.

로그인은 페이지가 아니라 **모달**(shadcn `Dialog`) — 어느 페이지에서든 페이지 이동 없이 뜨고 닫힘.

```
헤더 우측 상단 "로그인" 버튼 클릭 → 모달 오픈(이메일/비밀번호 폼)
  → fetch로 app/api/auth/login 호출(페이지 이동 없음) → 성공 시 모달만 닫힘, 실패 시 폼 안에 에러 메시지
```

- 모달 열림 상태는 전역 클라이언트 상태라 **zustand**로 관리(`lib/login-modal-store.ts`) — 서버 상태가 아니라 순수 UI 상태라 TanStack Query 대상이 아님. 어느 컴포넌트에서든 `open()`/`close()` 호출 가능

## 인증 구현 (BFF, 라이브러리 없이 자체 구현)

Auth.js 같은 라이브러리 없이 Next.js Route Handler로 직접 구현. 전부 `app/api/auth/` 아래. **방문자 로그인(Google OAuth)은 v1 스코프 제외**라 `google/route.ts`, `google/callback/route.ts`는 안 만듦 — 아래는 소유자 전용으로 남은 3개:

| Route Handler | 역할 |
|---|---|
| `login/route.ts` | 이메일+비밀번호를 받아 NestJS에 검증 요청 → JWT 받아 httpOnly 쿠키 설정 + `draftMode().enable()`(숨김 글 미리보기용, "숨김 글 미리보기" 섹션 참고) (소유자 전용) |
| `session/route.ts` | 쿠키의 JWT를 그대로 NestJS `GET /auth/me`에 전달해 위임 검증 → `{ isAuthenticated, role, name? }` 응답을 그대로 중계 (토큰 자체는 절대 프론트 응답에 안 실음) |
| `logout/route.ts` | 쿠키 삭제 + `draftMode().disable()` |

(구현 완료 — 체크리스트 23번, 위 "다음 단계" 참고)

- 쿠키 속성: `httpOnly`, `Secure`(프로덕션만), `SameSite=Lax`
- **JWT 서명 검증은 Next.js가 하지 않음** — NestJS에 전량 위임. Next.js는 쿠키에서 토큰 문자열을 꺼내 그대로 전달만 하고, 유효하지 않으면 NestJS가 401을 주는 걸 그대로 중계. 덕분에 프론트-백엔드 간 JWT 서명 시크릿을 공유할 필요가 없고, 검증 로직도 NestJS 한 곳에만 존재
- 인증이 필요한 다른 모든 API(`app/api/posts/*`, `app/api/images` 등)는 공용 헬퍼 `lib/api.ts`의 `proxyToBackend(request, path)`를 사용 — 쿠키에서 토큰 꺼내 `Authorization` 헤더 붙여 NestJS 호출 후 응답 그대로 반환. 매 Route Handler마다 이 로직을 반복하지 않기 위한 공용화
- 소유자 로그인 브루트포스 방어는 **NestJS `/auth/login` 쪽에서** Redis로 IP별 시도 횟수를 카운트해 처리(백엔드 트랙) — `login/route.ts`는 자격증명을 그대로 전달만 하는 얇은 프록시, 초과 시 NestJS가 429 반환하면 그대로 중계. Redis는 NestJS에서만 접근(Next.js는 직접 안 붙음)
- JWT는 1일 만료, 리프레시 토큰 없음 — 만료되면 인증 필요한 요청이 401 → 프론트가 로그아웃 처리 후 재로그인 유도

## 댓글 시스템 (v1 스코프 제외)

> 원래는 giscus(임베드형) 대신 자체 구현하기로 설계했으나, 초기 개인 블로그는 댓글 참여가 거의 없어 실질 가치가 낮고 `/about` 페이지에 연락처가 이미 노출돼 있어 피드백 경로도 따로 있다고 판단해 **v1 스코프에서 제외**. 아래는 재개할 때를 위해 남겨둔 설계 — `blog-api`의 `Comment`/`User`(VISITOR) API는 이미 구현·테스트까지 끝나 있어(item 8) 이 프론트 쪽만 다시 붙이면 됨.

giscus(임베드형) 대신 자체 구현 — giscus는 iframe 위젯이라 우리 UI에 자연스럽게 못 녹임. 댓글에는 추천/비추천이 없음(아래 "글 추천(좋아요)" 참고, 그건 댓글이 아니라 글 단위 기능).

```
방문자가 Google 로그인 (httpOnly 쿠키 발급, BFF 경유)
  → 댓글 작성
  → 브라우저가 app/api/posts/[slug]/comments 호출 (쿠키 자동 첨부)
  → Route Handler가 쿠키에서 JWT 꺼내 NestJS에 Authorization 헤더로 전달
  → 댓글 목록은 클라이언트에서 재조회(TanStack Query, CSR)
```

- 댓글 본문은 **순수 텍스트만** 렌더링 (마크다운/HTML 미허용) — XSS 방지
- 소유자는 로그인 시 모든 댓글에 삭제 버튼이 추가로 보임 (모더레이션) — **소프트 삭제**로 처리, "삭제된 댓글입니다" placeholder 표시
- 대댓글(스레드)은 이번 스코프 제외 — 플랫 목록만
- 비로그인 방문자: 댓글 읽기만 가능, 작성 버튼은 "Google로 로그인" 유도로 대체

## 글 추천(좋아요) (v1 스코프 제외)

> 로그인 없는 방문자 참여 지표를 조회수와 좋아요 둘 다 가져갈 필요는 없다고 판단해 v1 스코프에서 제외 — 글쓰기 자체에 집중. `blog-api`의 `Post.likeCount`/`POST /posts/{slug}/like`는 이미 구현·검증 끝난 상태(제거 안 함), 프론트 쪽 BFF 프록시(`app/api/posts/[slug]/like/route.ts`)는 26번에서 만들었다가 이 결정 이후 다시 지움 — 아래는 재개할 때를 위해 남겨둔 설계.

댓글이 아니라 **글 단위**로 하트 아이콘 하나만 누르는 가벼운 추천 기능. 로그인 불필요.

```
방문자가 글 상세(또는 목록 카드)에서 하트 클릭
  → sessionStorage에 이미 누른 글인지 확인 (liked-posts: string[] of slugs)
  → 이미 눌렀으면 버튼 비활성화 상태로 아무 것도 안 함
  → 처음이면: sessionStorage에 slug 추가 + 화면에 즉시 낙관적으로 카운트 +1(재조회 없이 바로 반영)
      + app/api/posts/[slug]/like(BFF) 호출 → NestJS가 likeCount 증가
```

- **로그인 없음, 인증 불필요** — 좋아요 버튼은 누구나 클릭 가능
- **세션스토리지로 클라이언트 측 중복 방지**: 브라우저 탭/세션이 살아있는 동안은 같은 글에 다시 못 누름(빨간 하트로 표시), 세션 종료 후 다시 들어오면 다시 누를 수 있음 — 로그인 상태 추적 자체가 없으므로 이게 자연스러운 한계
- **서버 측에서도 가벼운 어뷰징 방지**: 조회수 카운터와 동일한 Redis IP+day 중복방지 패턴 재사용 — 같은 IP는 하루에 한 번만 카운트됨. 완벽한 방지는 아니지만(스크립트로 IP를 계속 바꾸면 뚫림), 이 정도 캐주얼한 지표엔 충분하고 기존 인프라 재사용이라 추가 비용 없음
- 좋아요 수 자체는 SSG로 빌드/재검증 시점 값을 보여주고, 클릭 시 재조회 없이 낙관적 +1만 표시 — 실시간 카운트 조회 API는 따로 안 둠(글 읽기 API 응답에 `likeCount` 필드로 이미 포함되어 있음)

## 통합 검색

카테고리/태그 필터 결과와 텍스트 검색 결과를 **같은 `/search` 페이지 하나로 통합**한다. `/category/[slug]`, `/tags/[tag]` 같은 별도 정적 라우트를 두지 않는 이유는, 목록 렌더링/정렬/페이지네이션 로직을 페이지마다 중복 구현하지 않기 위함 — 백엔드 `GET /posts/search?q=&sort=&category=&tags=`가 이미 `category`/`tags` 파라미터를 지원하므로, "카테고리 글 목록"과 "태그 글 목록"도 결국 `q` 없이 `category`/`tags`만 채운 검색 결과일 뿐이라는 관점.

- 사이드바 카테고리 아코디언의 태그(`#태그명 (개수)`) 클릭 → `/search?tags=태그명`
- **검색바 컴포넌트** (`components/layout/search-bar.tsx`): 헤더와 `/search` 페이지 상단에 동일하게 재사용
  - **Enter 입력 또는 검색 버튼 클릭 시에만 검색 실행** — `/search` 페이지 목록 결과를 갱신(입력 중 실시간 디바운스 방식 아님)
  - 내부에 **검색 초기화 버튼**(입력값 지우기, 값이 없으면 비활성화)과 **검색 버튼**(submit)을 함께 배치
  - **모양은 pill(알약형)** — 좌우 끝 `border-radius: 50%`에 해당하는 `rounded-full`
- **헤더 노출 방식**: 평소엔 검색 아이콘 버튼만 노출(헤더 공간 절약, 모바일도 동일). 클릭하면 그 자리에 `search-bar.tsx`가 펼쳐지고, 제출(Enter/버튼)하면 `/search?q=`로 이동

## 소개 페이지 (`/about`) + 이력서

- 텍스트(프로젝트 이력, 스킬, 개발 철학)는 `src/app/about/page.tsx`에 직접 작성하는 정적 콘텐츠 — 자주 바뀌지 않으므로 백엔드/DB 불필요, 수정 시 git push하면 CI가 자동 반영
- 이력서도 같은 이유로 **정적 파일**로 관리 — `public/resume.pdf`에 커밋해두고 "이력서 다운로드" 버튼이 그 경로(`/resume.pdf`)를 그대로 링크. 몇 달에 한 번 바뀔까 말까 한 파일이라 백엔드 업로드 API·R2 저장·소유자 전용 교체 UI까지 만들 필요가 없음(교체는 새 PDF로 git push) — 이미지 업로드(글 작성 중 첨부)는 빌드 시점에 존재하지 않는 콘텐츠라 이 패턴이 안 통하지만, 이력서는 그런 제약이 없음

## 데이터 모델 (프론트에서 바라보는 형태, 백엔드 API 응답 기준)

```ts
type Post = {
  id: string;
  slug: string;
  title: string;
  summary: string;      // 목록/OG카드/RSS에 공용으로 쓰는 한줄 요약
  body: string;          // 마크다운
  category: string;      // Category.slug
  tags: string[];         // 해시태그, 다중
  series?: {
    slug: string;          // 같은 시리즈 글끼리 공유하는 값
    title: string;
    order: number;          // 시리즈 내 순서 (1부, 2부, ...)
  };
  pinned: boolean;
  hidden: boolean;
  viewCount: number;
  likeCount: number;    // 좋아요 수, 로그인 불필요 기능이라 myLiked 같은 필드 없음(세션스토리지가 클라이언트에서 담당)
  createdAt: string;
  updatedAt: string;
};

type Category = {
  slug: string;
  label: string;
};
// 카테고리는 태그처럼 자유 생성 — 글쓰기 화면 콤보박스에서 기존 카테고리 선택 또는 새 이름 입력,
// 새로 입력하면 백엔드가 slug를 자동 생성(label을 slugify)해 저장. 별도 카테고리 관리 화면 없음.

type Comment = {
  id: string;
  author: { name: string; avatarUrl: string };  // Google 프로필에서 가져옴
  body: string;         // deleted가 true면 빈 문자열, 프론트가 placeholder로 대체 표시
  deleted: boolean;      // 소프트 삭제 여부
  createdAt: string;
};
```

- **태그**: 카테고리(큰 분류)와 별개로 붙이는 다중 라벨. `/search?tags=태그명`에서 해당 태그 글 모아보기 ("통합 검색" 섹션 참고)
- **시리즈**: 연재글 묶음. 같은 `series.slug`를 가진 글들을 모아 상세 페이지에 "시리즈 목차"(N부작, 현재 몇 부인지) + 이전/다음 글 네비게이션 표시. 편집기에선 시리즈 이름만 입력(신규/기존 상관없이 텍스트 입력, 카테고리처럼 자동완성 콤보박스까지는 불필요 — 사용 빈도가 낮아 오타 나면 그때 수정하면 그만), **`order`는 소유자가 직접 안 적고 백엔드가 "그 시리즈의 기존 최대 order + 1"로 자동 계산** (수동 입력 시 번호 꼬임 방지)
- `Comment`에는 `postId`가 없음 — 댓글은 항상 `GET /posts/{slug}/comments`로 특정 글 컨텍스트 안에서만 조회되니 프론트가 이미 slug를 알고 있어 불필요

실제 API 스펙(엔드포인트, 요청/응답 필드)은 `blog-api` 저장소 작업 시 확정하고, 이 저장소엔 그 시점에 `src/lib/api.ts` 클라이언트로 반영.

## 이미지 업로드 (글 작성 중 첨부)

프로필 사진 같은 정적 자산과는 다른 흐름. 글 작성 중 "이미지 첨부"로 올리는 이미지는 빌드 시점에 존재하지 않으므로, 프론트 배포와 무관하게 별도 저장소가 필요함.

```
글쓰기 화면 "이미지 첨부" 클릭
  → app/api/images/route.ts(BFF)로 업로드 (쿠키 자동 첨부, 로그인한 본인만 가능)
  → Route Handler가 NestJS에 Authorization 헤더 붙여 전달
  → NestJS가 Cloudflare R2에 업로드
  → R2가 반환한 공개 URL을 응답
  → 프론트 에디터가 커서 위치에 `![](url)` 마크다운으로 자동 삽입
```

- 스토리지: **Cloudflare R2** (S3 호환 API, 저장용량 10GB까지 무료, egress 비용 없음)
- NestJS 로컬 디스크에는 저장하지 않음 — Render 같은 PaaS는 재배포 시 파일시스템이 초기화될 수 있어 데이터 유실 위험
- 업로드 제한: **5MB, jpg/png/webp/gif만 허용** (프론트 1차 검증 + 백엔드 재검증)
- 백엔드 저장소(`blog-api`) 작업 항목: R2 버킷 연동, 업로드 API(`POST /api/images`), 파일 크기/타입 검증
- **업로드 시점엔 포맷 변환(WebP/AVIF) 안 함** — 원본(jpg/png/webp/gif) 그대로 R2에 저장. Vercel 배포라 `next/image` 최적화가 정상 동작하므로(정적 export 때와 달리 `unoptimized: true` 불필요) `next.config.ts`의 `images.remotePatterns`에 R2 도메인만 등록하면, 실제 화면에 그릴 때(서빙 시점) 브라우저에 맞는 포맷/사이즈로 자동 즉석 변환됨 — 업로드 시 미리 변환해두는 것과 결과는 비슷한데 별도 이미지 처리 라이브러리가 필요 없음. 원본을 그대로 두는 이유는 RSS 피드나 소셜 크롤러처럼 `next/image`를 거치지 않고 R2 URL을 직접 읽는 소비자와의 호환성 때문. 프로필 사진 등 정적 자산도 마찬가지로 수동 최적화(`npx @squoosh/cli`) 없이 원본만 넣으면 됨

## 마크다운 작성 / 렌더링

- 저장: `Post.body`는 마크다운 텍스트 그대로 DB(PostgreSQL)에 저장
- 작성 화면(`/posts/new`, `/posts/[slug]/edit`): 무거운 WYSIWYG 에디터 없이 `<textarea>` + 실시간 미리보기 분할 화면
- 렌더링: `react-markdown` + `remark-gfm`(표, 취소선 등 GFM 문법) + `rehype-pretty-code`(Shiki 기반 코드 문법 강조, VS Code와 동일한 하이라이터) + 코드블럭 우측 상단 복사 버튼 컴포넌트
- **본문 이미지도 `next/image` 최적화를 받아야 함**: `react-markdown`은 기본적으로 `![]()`를 평범한 `<img>`로 렌더링해서 그대로 두면 WebP/AVIF 자동 변환을 못 받음 — `markdown-renderer.tsx`에서 `components={{ img: ... }}` 옵션으로 `img` 태그를 `next/image`의 `<Image>`로 교체
- 목차(TOC): 마크다운 헤딩(h2/h3) 파싱해서 사이드/상단에 자동 생성, 스크롤 위치에 따라 현재 섹션 하이라이트(`IntersectionObserver`)

## 포트폴리오 강화 기능

| 기능 | 구현 방식 |
|---|---|
| 다크모드 토글 | `next-themes` + shadcn 다크모드 가이드, 헤더에 토글 버튼 |
| OG 이미지 자동 생성 | App Router `opengraph-image.tsx` 컨벤션(`next/og`) — 알려진 글은 `generateStaticParams`로 빌드타임 생성, 새 글은 첫 요청 시 자동 생성 후 캐시(`dynamicParams` 기본 동작) |
| RSS 피드 | `app/rss.xml/route.ts` Route Handler로 실제 서버 라우트 구현, ISR로 캐시 (빌드 스크립트 불필요) |
| 검색 기능 | `/search`에서 `app/api/posts/search`(BFF) 경유해 백엔드 `GET /posts/search?q=&sort=&category=&tags=` 호출 → ILIKE 부분문자열 매칭, 제목/태그 가중치를 본문보다 높게 부여해 랭킹(원래 Postgres full-text search로 설계했으나 한글 부분검색이 안 되는 걸 실제 DB로 확인 후 변경 — 백엔드 트랙, `blog-api` 저장소 `docs/blog-api-plan.md` 참고). 프론트는 정렬(관련도/최신) 드롭다운 + 카테고리·태그 체크박스 필터 제공 |
| 조회수 카운터 | 글 상세 진입 시 `app/api/posts/[slug]/view`(BFF) 경유해 조회 기록 → Redis로 IP+글+day 단위 중복 방지 후 Postgres `viewCount` 증가 (백엔드 트랙) |
| 댓글 (v1 스코프 제외) | 자체 구현(giscus 아님) 설계는 남아있음 — Google OAuth 로그인 방문자만 작성, 소유자는 모더레이션(소프트 삭제) 가능. 상세는 "댓글 시스템" 섹션 참고 |
| 글 추천(좋아요) (v1 스코프 제외) | 로그인 불필요, 세션스토리지로 클라이언트 중복방지 + Redis IP+day로 서버 측 가벼운 어뷰징 방지 설계는 남아있음. 상세는 "글 추천(좋아요)" 섹션 참고 |
| Swagger | 백엔드에 `@nestjs/swagger` 추가, `/docs`로 API 문서 자동 노출 (백엔드 트랙) |
| 홈페이지 통계 | 홈(`/`)에 위젯으로 배치: 조회수 TOP5 글, 최근 글 조회 추이 그래프(일별 조회수 합계 — 순수 방문자 수는 아님, `blog-api` 저장소 `docs/blog-api-plan.md`의 `DailyVisit` 참고). shadcn `chart`(Recharts 래퍼) 컴포넌트 사용, 데이터는 백엔드 통계 API에서 조회 |
| README 구성 | 아키텍처 다이어그램(mermaid), 기술 스택 뱃지, 스크린샷, 라이브 데모 링크, 로컬 실행법 정리 |
| SEO / 메타데이터 | 글 상세는 SSG+ISR로 사전 렌더링되어 크롤링 문제 없음. 공통 `lib/metadata.ts`로 `title`/`description`(=`summary` 재사용)/`og:site_name`/`twitter:card`/canonical을 페이지마다 일관되게 생성. `app/sitemap.ts` + `app/robots.ts`(Next.js 내장 컨벤션, ISR로 캐시). `/search`는 CSR라 색인 대상 아님 — 별도 작업 불필요 |
| 구조화된 데이터(JSON-LD) | 글 상세: `BlogPosting`(제목/작성일/수정일/작성자/대표이미지). 홈/소개: `Person`. 검색결과 리치 스니펫 노출용 |
| 태그 / 시리즈 | `Post.tags`, `Post.series`로 부여. `/search?tags=` 모아보기, 시리즈 글은 상세 페이지에 목차+이전/다음 네비게이션 |
| 관련 글 추천 | 글 하단에 같은 태그/카테고리 공유하는 글 2~3개 노출 (프론트에서 목록 데이터 기준 클라이언트 계산, 별도 API 불필요) |
| 최근 수정일 표시 | 기존 `updatedAt` 재사용, "최초 작성 / 최근 수정" 뱃지로 상세 페이지에 표시 |

백엔드 트랙 표시된 항목(검색/조회수/Swagger)은 `blog-api` 저장소 작업. 이 저장소에선 그 API를 소비하는 프론트만 구현.

## 에러 처리

- **React 자체엔 에러 바운더리 컴포넌트가 없음** — `static getDerivedStateFromError`/`componentDidCatch`를 구현하는 클래스 컴포넌트를 직접 작성해야 함(React 19도 동일, 함수형 1st-party 대안 없음)
- **`app/error.tsx`(Next.js 내장 컨벤션)**: 라우트 세그먼트를 감싸는 React 에러 바운더리를 자동으로 만들어줌 — 새 의존성 없이 대부분의 렌더링 에러를 커버하므로 루트에 하나(`src/app/error.tsx`) 두는 것으로 충분. `unstable_retry()`(Next 16.2 신규, `reset()`보다 우선 권장)로 재시도 버튼 구현
  - 단, **이벤트 핸들러/비동기 콜백 에러는 못 잡음**(공식 문서 명시) — 라우트 전체가 아니라 위젯 하나만 부분적으로 복구하려는 경우에도 부족
- **`react-error-boundary`는 4차(백엔드 연동)로 보류**: 지금은 `use-posts.ts`뿐이고 목업 데이터라 던질 에러가 없음. TanStack Query 공식 문서가 `QueryErrorResetBoundary` + `react-error-boundary`의 `<ErrorBoundary onReset={reset}>` 조합을 쿼리 에러 복구 표준 패턴으로 제시하므로, `use-stats.ts` 등 실제 API 훅이 붙는 4차에서 함께 도입 — 위젯 하나가 실패해도 글 본문까지 무너지지 않도록 위젯 단위로 감싸는 용도

## 테스트

- 유닛 테스트: **Vitest**(Browser Mode, 실제 Playwright Chromium) + **`vitest-browser-react`** — Jest보다 설정 간단하고 빠름, Vite/Next.js 생태계 기본 픽. 이미 Storybook 스토리 테스트가 이 Browser Mode 조합을 쓰고 있어서, 공식 문서가 새 프로젝트에 권장하는 `vitest-browser-react`로 통일(React Testing Library는 이 조합에서 동작은 하지만 Locator 자동 재시도 등 Browser Mode 전용 이점이 없음)
- E2E 테스트: **Playwright** — 로그인 → 글 작성 → 목록 반영 같은 핵심 플로우 검증
- 백엔드(`blog-api`)는 별도로 **Jest** (NestJS 기본 포함) 사용

## Storybook (미니 디자인 시스템)

`npx storybook@latest init`으로 추가. shadcn 컴포넌트(`src/components/ui`)와 레이아웃 컴포넌트(`header`, `footer`, `profile-card`, `category-nav` 등)에 스토리 작성 — 컴포넌트를 페이지 맥락 없이 독립적으로 확인/문서화하는 용도.

## 컴포넌트 / 파일 구조

```
src/
  app/
    layout.tsx                    # Header + Footer 뼈대 (Sidebar는 페이지별 구성) + Providers 래핑 + login-modal.tsx 전역 마운트
    providers.tsx                  # QueryClientProvider('use client') — 루트 layout(서버 컴포넌트)에서 클라이언트 컴포넌트로 분리
    loading.tsx                    # 전 라우트 공통 로딩 폴백 — loading-overlay.tsx 렌더링 ("로딩 UI" 섹션 참고)
    error.tsx                     # 루트 에러 바운더리 ("에러 처리" 섹션 참고)
    not-found.tsx                  # notFound() 및 매칭 안 되는 URL 전부에 대한 커스텀 404 UI(브랜드 스타일)
    page.tsx                      # 메인: 소개 + 대표 글
    posts/
      page.tsx                    # 전체 글 목록
      new/page.tsx                 # 새 글 작성 (isOwner 아니면 로그인 모달 오픈 + 홈으로 리다이렉트)
      [slug]/
        page.tsx                    # 글 상세 — generateStaticParams로 빌드타임 SSG
        opengraph-image.tsx           # 글별 OG 이미지 자동 생성(`next/og`), 마찬가지로 generateStaticParams로 SSG
        edit/page.tsx                # 글 수정 (위와 동일 가드)
    about/page.tsx                 # 소개 페이지 (하드코딩 텍스트 + 정적 이력서 다운로드)
    search/
      page.tsx                    # 서버 컴포넌트 — search-content.tsx를 Suspense로 감싸기만 함
      search-content.tsx           # 실제 검색 UI/로직('use client') — useSearchParams는 정적 빌드 시 Suspense 필수라 분리 ("통합 검색" 섹션 참고)
    rss.xml/route.ts               # RSS Route Handler — GET 핸들러는 Next 15+부터 기본 dynamic이라 `revalidate = 3600`으로 명시 캐시
    sitemap.ts                    # Next.js 내장 sitemap 컨벤션
    robots.ts                     # Next.js 내장 robots 컨벤션
    api/
      revalidate/route.ts          # 백엔드가 글 CRUD 시 호출하는 온디맨드 ISR 재검증 웹훅 (secret 헤더로 보호)
      auth/
        login/route.ts              # 소유자 이메일+비번 로그인 → httpOnly 쿠키 설정 [완료]
        session/route.ts              # 현재 로그인 상태 조회 ({isAuthenticated, role}) [완료]
        logout/route.ts                # 쿠키 삭제 [완료]
        # google/route.ts, google/callback/route.ts는 안 만듦 — 방문자 로그인(Google OAuth) v1 스코프 제외
      posts/route.ts                # 글 CRUD 프록시 (목록/등록)
      posts/[slug]/route.ts          # 글 수정/삭제/숨김/고정 프록시 (slug는 최초 생성 후 안 바뀌므로 식별자로 안정적)
      posts/[slug]/view/route.ts      # 조회수 기록 프록시
      posts/search/route.ts           # 검색 프록시
      # posts/[slug]/like/route.ts는 안 만듦 — 글 좋아요 v1 스코프 제외
      categories/route.ts            # 카테고리 목록(자동완성용) 프록시
      tags/route.ts                  # 태그 목록(자동완성용) 프록시
      stats/popular-posts/route.ts     # 인기글 TOP N 프록시
      stats/visits/route.ts            # 글 조회 추이 프록시
      images/route.ts                # 이미지 업로드 프록시
      # posts/[slug]/comments/route.ts, comments/[id]/route.ts는 안 만듦 — 댓글 기능 v1 스코프 제외
  components/
    layout/
      header.tsx                  # sticky + 스크롤 시 컴팩트 전환(use-scroll-collapse.ts). 중앙 "gyujin's log"(클릭 시 `/`로 이동, home 링크 겸용) + 왼쪽 mobile-nav.tsx(모바일에서만) + 우측: 검색 아이콘(클릭 시 그 자리에 search-bar.tsx가 펼쳐짐, 데스크톱/모바일 공통 — 평소엔 아이콘만 노출해 헤더 공간 절약), 다크모드 토글, (isOwner) 새 글 작성 버튼(아바타 바로 왼쪽, 모바일은 아이콘만+툴팁), 로그인 버튼(로그인 시 아바타/로그아웃으로 대체)
      footer.tsx                  # 카피라이트 + 이메일
      sidebar.tsx                 # withProfile prop으로 프로필 노출 여부 제어. 데스크톱은 고정 배치, 모바일은 이 컴포넌트를 그대로 mobile-nav.tsx의 Sheet 안에 재사용
      mobile-nav.tsx               # 햄버거 버튼 + shadcn Sheet(왼쪽 슬라이드) 안에 sidebar.tsx 렌더링 — 버튼/Sheet 상태를 이 컴포넌트가 전부 캡슐화, `md:hidden`으로 768px 이상에선 자체적으로 숨김 (반대로 데스크톱 고정 사이드바 쪽은 `hidden md:block`)
      profile-card.tsx            # 아바타(플레이스홀더) + 소개 문구
      category-nav.tsx            # 맨 위 고정 `/posts`, `/about` 링크 + Accordion 기반 카테고리 > 해시태그(#태그명 (개수)) 목록, 태그 클릭 시 `/search?tags=`로 이동
      search-bar.tsx               # pill 모양 검색바(Enter/버튼 submit 시에만 검색, 내부에 초기화+검색 버튼) — 헤더와 `/search` 페이지 상단에서 재사용
    auth/
      login-modal.tsx               # shadcn Dialog — 이메일/비번 폼(소유자 전용, 방문자 로그인 없음). loginModalStore 상태로 열림/닫힘, app/layout.tsx에 한 번만 마운트
    editor/
      markdown-editor.tsx         # textarea + 실시간 미리보기 분할 화면
      image-upload-button.tsx     # 업로드 → 본문에 `![]()` 삽입
      category-combobox.tsx        # 기존 카테고리 선택 또는 새로 입력 (자유 생성)
      tag-input.tsx                 # 태그 다중 입력 (기존 값 자동완성 + 새로 추가)
      series-fields.tsx             # 시리즈 이름 텍스트 입력 (order는 백엔드가 자동 계산, 프론트 입력 없음)
    post/
      markdown-renderer.tsx        # react-markdown + remark-gfm + rehype-pretty-code 래퍼
      code-block-copy-button.tsx    # 코드블럭 복사 버튼
      table-of-contents.tsx         # 헤딩 파싱 + 스크롤 하이라이트
      tag-list.tsx                    # 해시태그 배지 목록
      series-nav.tsx                   # 시리즈 목차 + 이전/다음 글
      related-posts.tsx                 # 같은 태그/카테고리 글 추천
      last-updated.tsx                   # 최초 작성 / 최근 수정 뱃지
      owner-actions.tsx               # isOwner일 때만 노출되는 수정/삭제/숨김/고정 툴바
      # like-button.tsx는 안 만듦 — 글 좋아요 v1 스코프 제외
      delete-confirm-dialog.tsx         # shadcn AlertDialog — 글 삭제 확인 모달
      # comment-list.tsx / comment-form.tsx / comment-item.tsx는 안 만듦 — 댓글 기능 v1 스코프 제외
    home/
      stats-widget.tsx              # 인기글 TOP5 + 글 조회 추이 (shadcn chart, CSR — "페이지별 렌더링 전략" 섹션 참고)
    theme-toggle.tsx                # next-themes 다크모드 토글
    loading-overlay.tsx             # 딤 배경 + loading-logo.svg 중앙 배치 — 라우팅(app/loading.tsx)과 mutation pending 상태 공용 ("로딩 UI" 섹션 참고)
    ui/                           # shadcn 컴포넌트 (accordion, avatar, separator, button, chart, ...)
    seo/
      json-ld.tsx                  # BlogPosting / Person 구조화 데이터 <script> 삽입
  lib/
    api.ts                        # proxyToBackend(request, path) — Route Handler들이 공용으로 쓰는 NestJS 호출 헬퍼 (쿠키→Authorization 헤더 변환, 서명 검증은 안 함)
    # liked-posts.ts는 안 만듦 — 글 좋아요 v1 스코프 제외
    metadata.ts                    # 페이지 공통 메타데이터(title/description/OG/canonical) 생성 헬퍼 + PERSON_JSON_LD
    site.ts                        # SITE_URL 상수 (배포 전 임시 플레이스홀더, 배포 시 교체)
    extract-headings.ts             # 마크다운에서 h2/h3 파싱해 TOC 아이템(id 포함) 추출 — markdown-renderer.tsx는 이 id를 문서 순서대로 그대로 소비해 재계산 없이 항상 1:1 대응
    slugify.ts                      # 헤딩 텍스트 → id 변환 헬퍼, extract-headings.ts 전용
    query-client.ts                 # TanStack Query QueryClient 인스턴스 설정
    fonts.ts                        # next/font/local로 Pretendard 정적 굵기별 파일(400/600/700)/JetBrains Mono 로드 + CSS 변수 export
    login-modal-store.ts             # zustand — 로그인 모달 열림/닫힘 전역 상태 (isOpen, open(), close())
  assets/
    fonts/                          # Pretendard-{Regular,SemiBold,Bold}.woff2(사이트 전체), JetBrainsMono-Regular.woff2, Pretendard-{Bold,SemiBold}.otf(OG 이미지 전용, next/og가 woff2 미지원이라 별도)
  hooks/
    use-session.ts                  # `/api/auth/session` 조회 (useQuery) — isOwner 판단(비로그인 방문자 로그인이 없어 isOwner/비로그인 두 상태만 존재)
    use-scroll-collapse.ts          # 스크롤 threshold 넘으면 true — 헤더 컴팩트 전환용 (passive 리스너)
    # use-comments.ts는 안 만듦 — 댓글 기능 v1 스코프 제외
    use-posts.ts                    # 검색 결과, 글 CRUD 뮤테이션 (`/api/posts/*` 호출) — 2차 시점엔 목업 데이터 검색/필터/정렬만 구현, 4차에서 실 API로 교체(좋아요 뮤테이션은 v1 스코프 제외로 없음)
    use-categories.ts                # 카테고리 자동완성 목록 (`/api/categories`)
    use-tags.ts                      # 태그 자동완성 목록 (`/api/tags`)
    use-stats.ts                     # 홈페이지 통계 위젯 데이터 (`/api/stats/*`)
  data/
    categories.ts                 # 카테고리 목업 데이터 (백엔드 연동 전까지 임시)
    posts.ts                      # 글 목업 데이터 (백엔드 연동 전까지 임시, `Post` 타입 정의도 여기)
.storybook/                       # Storybook 설정
e2e/                              # Playwright E2E 테스트 (navigation.spec.ts, search.spec.ts)
playwright.config.ts               # 프로젝트 루트, testDir: ./e2e, Chromium만, webServer로 yarn dev 자동 기동
```

컴포넌트 단위 유닛 테스트는 `*.test.tsx`로 대상 파일 옆에 배치 (Vitest Browser Mode + `vitest-browser-react`, "테스트" 섹션 참고).

## 필요 shadcn 컴포넌트

- [x] `accordion` — 카테고리 토글 목록
- [x] `avatar` — 프로필 플레이스홀더
- [x] `separator` — 사이드바 섹션 구분선
- [x] `button` — 전반적으로 사용 중
- [x] `input` — `search-bar.tsx`에서 사용 중
- [x] `sonner` — API 에러 토스트, 성공/실패 색상 커스터마이징 완료
- [x] `tooltip` — 새 글 작성 버튼이 아이콘만 보일 때(모바일) 라벨 대체
- [x] `switch` — 다크모드 토글
- [x] `badge` — 태그, 최근 수정일 뱃지
- [ ] `textarea`, `form` — 로그인 폼(이메일/비번), 글 작성 에디터 (관리자 기능 단계에서 추가)
- [ ] `chart` — 홈페이지 글 조회 추이/인기글 통계 (Recharts 래퍼)
- [ ] `command`, `popover` — `category-combobox.tsx`/`tag-input.tsx` 자동완성 (shadcn 콤보박스는 이 둘의 조합 패턴)
- [x] `sheet` — 모바일 햄버거 메뉴 드로어 (`mobile-nav.tsx`)
- [ ] `dialog` — 로그인 모달 (`login-modal.tsx`)
- [ ] `alert-dialog` — 삭제 확인 모달 (`delete-confirm-dialog.tsx`)

나머지(`textarea`/`form`/`chart`/`command`/`popover`/`dialog`/`alert-dialog`)는 해당 기능 만들 때 그때그때 `npx shadcn@latest add <이름>`으로 추가.

추가 npm 의존성: `@tanstack/react-query`(v5, 서버 상태 관리 — 1차 단계부터 필요), `zustand`(로그인 모달 등 순수 클라이언트 UI 상태), `next-themes`(다크모드), `react-markdown` `remark-gfm` `rehype-pretty-code`(마크다운/코드 하이라이트)

## 배포 / CI-CD

- **프론트 (`blog`)**: Vercel이 GitHub 저장소와 직접 연동 — `main` push 시 Vercel이 알아서 빌드+배포 (별도 GitHub Actions 배포 워크플로우 불필요). PR마다 미리보기 URL도 자동 생성됨.
  - 동적 라우트(`[slug]`)는 여전히 `generateStaticParams`로 빌드타임에 알려진 글을 미리 생성, 새 글은 첫 방문 시 자동 생성 후 캐시
  - Vercel 환경변수(서버 전용, `NEXT_PUBLIC_` 아님): `API_URL`(NestJS 주소, 브라우저엔 노출 안 됨), `REVALIDATE_SECRET` — JWT 서명 검증은 NestJS에 위임하므로 `JWT_SECRET`은 프론트에 불필요. `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`/`INTERNAL_SECRET`(Google OAuth 콜백용)은 방문자 로그인이 v1 스코프 제외라 지금은 불필요 — 재개 시 추가
  - 테스트/린트는 별도 가벼운 GitHub Actions 워크플로우(`.github/workflows/ci.yml`)로 PR 시 실행 — 배포와는 무관한 품질 게이트
- **백엔드 (`blog-api`, 별도 저장소)**: Render **무료 웹서비스**에 배포, `main` push 시 Render 자동 배포. **DB는 Render가 아니라 Neon 무료 Postgres 우선**(Render 무료 DB는 일정 기간 후 삭제되는 정책이라 미사용).
  - 글 CRUD(등록/수정/삭제/숨김/고정) 성공 시 `POST https://<vercel-domain>/api/revalidate`(헤더: `x-revalidate-secret`, 바디 불필요) 호출 → `revalidatePath('/', 'layout')`로 전체 무효화
  - 무료 웹서비스 특성상 15분 미사용 시 슬립 → 첫 요청 콜드스타트 지연 감수 (트래픽 늘면 유료 전환, 대략 웹서비스+DB 합쳐 월 $13~16 선)
  - CORS 설정 불필요 — 브라우저가 NestJS를 직접 호출하지 않으므로 (BFF가 전담)

## 향후 고도화 아이디어 (지금 스코프 아님, 돈이 드는 것부터 나중으로 보류)

- **이메일 구독 알림**: 새 글 올라올 때마다 구독자에게 메일 발송. **Resend** 추천 — 무료 티어 월 3,000통/일 100통(개인 블로그 구독자 규모면 충분). 단, 무료 티어라도 DKIM/SPF 도메인 인증 때문에 **직접 소유한 커스텀 도메인**이 필요함(`*.vercel.app`은 Vercel 소유라 DNS를 못 건드려서 불가). 사이트 배포 도메인은 그대로 `*.vercel.app`을 유지하고, 이메일 발송 전용으로만 저렴한 도메인(연 1만원대)을 별도로 사는 것도 가능 — 사이트 도메인과 이메일 도메인은 독립적으로 결정 가능

## 다음 단계 (단계별)

**1차 — 레이아웃/뼈대**
1. [x] shadcn 컴포넌트 설치 — `accordion avatar separator switch badge` + `button input sonner tooltip` + `sheet` 완료, `chart`는 아직("필요 shadcn 컴포넌트" 체크리스트 참고)
2. [x] `@tanstack/react-query` 설치, `lib/query-client.ts` + `app/providers.tsx` 작성해 `app/layout.tsx`에 연결
3. [x] `src/data/categories.ts` 목업 데이터 작성
4. [x] Pretendard/JetBrains Mono 폰트 파일을 `assets/fonts/`에 두고 `lib/fonts.ts`(`next/font/local`)로 로드, "비주얼 아이덴티티" 섹션 팔레트를 shadcn `globals.css` 토큰에 매핑
4-1. [x] (계획에 없었지만 먼저 진행) `app/loading.tsx` + `components/loading-overlay.tsx` — "로딩 UI" 섹션 참고
4-2. [x] (계획에 없었지만 먼저 진행) `app/icon.png` / `app/apple-icon.png` 파비콘
5. [x] 레이아웃 구현: `header.tsx`(다크모드 토글 + `use-scroll-collapse.ts`로 sticky 컴팩트 전환 포함) / `footer.tsx` / `profile-card.tsx` / `category-nav.tsx` / `sidebar.tsx` / `mobile-nav.tsx`(햄버거 + Sheet)
6. [x] `next-themes` 세팅, 다크모드 토글 동작 확인 (`theme-toggle.tsx`)
7. [x] `app/layout.tsx` 조립 + 메인(`/`) 페이지 구성 (소개 + 대표 글 자리 + 통계 위젯 자리, 데이터는 목업)
8. [x] `/about` 페이지 작성 (하드코딩 텍스트 + 이력서 다운로드 버튼, `public/resume.pdf` 파일 추가 전까진 비활성화 상태로 하드코딩 — 이력서는 정적 파일로 관리하기로 결정해 "임시"가 아니라 최종 방식, "소개 페이지" 섹션 참고)

**2차 — 글 콘텐츠 기능**
9. [x] `markdown-renderer.tsx`(`react-markdown` + `remark-gfm` + `rehype-pretty-code`) + 코드 복사 버튼 + `img` 렌더러를 `next/image`로 교체
10. [x] `table-of-contents.tsx` 구현, 글 상세 페이지에 배치
11. [x] `tag-list.tsx`, `series-nav.tsx`, `related-posts.tsx`, `last-updated.tsx` 구현 (+ `/posts`, `/posts/[slug]` 페이지 신설, `src/data/posts.ts` 목업 데이터). (문서 리뷰 중 추가 수정) `/posts/[slug]`에 `generateStaticParams` 누락돼 있어 실제로는 SSG 아니라 매 요청 dynamic 렌더링이었던 걸 발견해 추가 — 이제 빌드 시 목업 글 4개 전부 정적 생성됨(`yarn build` 출력의 `●` 마커로 확인), "페이지별 렌더링 전략" 표의 SSG 전략과 일치
12. [x] `app/rss.xml/route.ts`, `app/sitemap.ts`, `app/robots.ts` 구현 (Next.js 내장 컨벤션) — `SITE_URL`은 `src/lib/site.ts`에 임시 플레이스홀더(`ponytail:` 주석), 배포 시 교체. (문서 리뷰 중 추가 수정) GET 라우트 핸들러는 Next 15+부터 기본이 dynamic이라(공식 체인지로그 확인) `rss.xml`이 실제로는 캐시 안 되고 있던 걸 발견 — `export const revalidate = 3600` 추가해 문서에 적힌 "ISR로 캐시"와 실제 동작을 맞춤
13. [x] OG 이미지: `opengraph-image.tsx` 컨벤션으로 글별 자동 생성 — `next/og`(satori)가 `ttf/otf/woff`만 지원해 기존 Pretendard `woff2`를 못 써서, 공식 Pretendard 저장소에서 Bold/SemiBold `otf`를 받아 `assets/fonts/`에 추가(OG 이미지 전용, 사이트 CSS 폰트 로딩과는 별개). ImageResponse는 CSS 커스텀 프로퍼티를 못 읽어 팔레트 hex를 직접 씀(컬러 하드코딩 금지 원칙의 예외). (문서 리뷰 중 추가 수정) 이 라우트도 `generateStaticParams` 누락으로 dynamic이었던 걸 11번과 같이 발견해 추가, 빌드 시 정적 생성 확인. JSON-LD `BlogPosting`에 빠져있던 `image` 필드도 이 OG 이미지 URL로 채움("포트폴리오 강화 기능" 표의 JSON-LD 행과 일치시킴)
14. [x] `/search` 페이지: `use-posts.ts`(useQuery, `search-bar.tsx`의 Enter/버튼 submit 시에만 쿼리 갱신) + `AbortController`, 정렬 드롭다운 + 카테고리/태그 필터 UI (백엔드 검색 API 붙기 전까진 목업 데이터로 UI만 검증) — 정렬/체크박스는 "필요 shadcn 컴포넌트" 목록에 select/checkbox가 없어 네이티브 `<select>`/`<input type="checkbox">` 사용. `useSearchParams`는 정적 빌드 시 Suspense 경계 필수(공식 문서 확인)라 `search/page.tsx`(서버, Suspense) + `search-content.tsx`(클라이언트)로 분리
15. [x] `lib/metadata.ts` 공통 헬퍼 + `generateMetadata`로 페이지별 title/description(`summary` 재사용)/OG/canonical 설정 — 동적 정보가 없는 `/about`, `/posts`는 공식 문서 권장대로 정적 `metadata` export 사용, 라우트 파라미터에 의존하는 `/posts/[slug]`만 `generateMetadata` 사용. `/search`는 CSR이라 색인 대상 아니라서 범위 제외("페이지별 렌더링 전략" 섹션 참고). 루트 레이아웃에 `metadataBase`(`SITE_URL`) + `title.template` 추가
16. [x] `components/seo/json-ld.tsx` — 글 상세 `BlogPosting`, 홈/소개 `Person` 구조화 데이터 삽입 (공식 JSON-LD 가이드대로 `<script type="application/ld+json">` + `JSON.stringify(...).replace(/</g, "\\u003c")`로 XSS 방지)

**3차 — 검증/문서화**
16-1. [x] (계획에 없었지만 먼저 진행) `src/app/error.tsx` — 루트 에러 바운더리, "에러 처리" 섹션 참고
17. [x] Vitest + `vitest-browser-react` 세팅, 레이아웃/렌더러 컴포넌트 유닛 테스트 — 이미 Storybook용 Vitest Browser Mode(실제 Playwright Chromium)가 설정돼 있어, 공식 문서 확인 결과 이 조합엔 `@testing-library/react`보다 `vitest-browser-react`가 새 프로젝트 권장 방식이라 이걸로 진행(플랜 초안엔 RTL로 적혀 있었지만 검증 후 변경, "테스트" 섹션 참고). `vitest.config.ts`에 `unit` 프로젝트 추가(+ `resolve.alias`로 `@/*` 매핑, 새 플러그인 의존성 없이 tsconfig 경로 재사용), `search-bar.test.tsx`(레이아웃) / `code-block-copy-button.test.tsx`(렌더러) 작성, `yarn test` 스크립트 추가. 전체 스위트(스토리북 11개 + 신규 2개) 27개 테스트 통과
18. [x] Storybook 세팅 (`npx storybook@latest init`) — ui 컴포넌트 스토리 작성 완료(`Vitest` 연동 테스트 포함, 11개 스토리 파일 통과). `header`/`footer` 등 미구현 레이아웃 컴포넌트 스토리는 5번 항목 완료 후 추가
19. [x] `app/api/revalidate/route.ts` 구현 — `x-revalidate-secret` 헤더 검증(시크릿 미설정 시 항상 거부) 후 `revalidatePath('/', 'layout')`. `yarn build` 확인(`ƒ` dynamic, request-time 헤더 사용이라 정상) + 로컬에서 무헤더/오답/정답/GET 405까지 curl로 실동작 검증. **Vercel 프로젝트 연결 + `REVALIDATE_SECRET` 환경변수 설정은 Vercel 계정 접근이 필요해 사용자가 직접 진행**(Vercel 대시보드 → 이 저장소 import → 프로젝트 설정 → Environment Variables에 `REVALIDATE_SECRET` 추가)
20. [x] Playwright 세팅, 핵심 플로우 E2E 테스트 뼈대 작성 (백엔드 붙기 전까진 모킹 또는 보류) — 로그인/글쓰기는 4차 전까진 검증 불가라, 지금 실제로 동작하는 탐색/검색 플로우로 뼈대만 작성. `@playwright/test` 추가(vitest 브라우저 모드용 `playwright`와는 별개 패키지), `playwright.config.ts`(Chromium만 — 개인 블로그라 크로스브라우저 매트릭스는 과함), `e2e/navigation.spec.ts` + `e2e/search.spec.ts`(총 4개), `yarn test:e2e` 스크립트. 테스트 작성 중 실제 버그 2개 발견해 같이 수정: **(1)** 헤더/사이드바 어디에도 `/posts` 링크가 없어 UI로 도달 불가능했음 → `category-nav.tsx`에 "전체 글" 링크 추가. **(2)** `app/not-found.tsx`가 없어 `notFound()` 호출 시 Next.js 기본 영어 "This page could not be found" UI가 뜨고 있었음(사이트 전체가 한글인데) → 브랜드 스타일 맞춘 `not-found.tsx` 추가. 이 과정에서 `notFound()`의 HTTP 상태 코드 관련 알려진 한계도 발견("페이지별 렌더링 전략" 섹션에 기록)
21. [x] `.github/workflows/ci.yml` 작성 (PR 시 lint+test 실행, 배포는 Vercel이 전담) — `yarn lint` + `tsc --noEmit`(빠르고 이번 세션에서 실제 타입 에러를 여러 번 잡아준 체크라 build 없이도 포함) + `yarn test`(Vitest) + `yarn test:e2e`(Playwright, `--with-deps chromium`만 설치 — 프로젝트가 Chromium만 쓰므로) + 실패 시 `playwright-report` 아티팩트 업로드. `.nvmrc` 버전으로 Node 세팅. **검증 한계**: `act` 등 로컬 GitHub Actions 러너가 없어 워크플로 자체의 실제 실행은 확인 못 함 — YAML 문법 검증(`pyyaml` 파싱)과 각 스텝 커맨드를 로컬에서 개별적으로 통과시키는 것까지만 확인, 실제 동작은 PR을 열어야 최종 확인됨
22. [x] README 구성 (아키텍처 다이어그램, 기술 스택, 스크린샷, 데모 링크) — 기존 `create-next-app` 기본 템플릿 그대로였던 걸 전면 교체. mermaid 아키텍처 다이어그램(전체 아키텍처 섹션의 ASCII 다이어그램을 옮김), 기술 스택 표, `docs/screenshots/`에 실제로 캡처한 스크린샷 4장(홈/글 상세/검색/다크모드), 로컬 개발·테스트 명령어, `docs/blog-structure-plan.md` 링크. 데모 링크는 아직 미배포라 자리만 만들어두고 정직하게 명시. mermaid 다이어그램은 실제 GitHub 페이지를 스크린샷으로 확인해 정상 렌더링(박스/화살표/라벨 전부 정상) 검증 완료

**4차 — 백엔드 연동** (인증, 글쓰기, 통계 — 실제 `blog-api` 붙은 뒤)

> **24번(Google OAuth), 31/32번(댓글)은 v1 스코프에서 제외**(grill 세션에서 결정) — 방문자 로그인의 유일한 용도가 댓글이었고, 개인 블로그 초기엔 댓글 참여가 거의 없어 실질 가치가 낮다고 판단. `/about`에 연락처가 이미 있어 피드백 경로는 확보돼 있음. `blog-api`의 Google OAuth/Comment API는 이미 구현·검증 끝난 상태라 그대로 둠 — 나중에 필요해지면 이 프론트 쪽만 다시 붙이면 됨.

23. [x] `app/api/auth/login`, `app/api/auth/session`, `app/api/auth/logout` 구현 (소유자 이메일+비번, httpOnly 쿠키) — `lib/api.ts`에 `API_URL`/`AUTH_COOKIE_NAME` 상수 신설. `login`은 NestJS `POST /auth/login` 호출 후 성공 시 `token` 쿠키(`httpOnly`, `secure: NODE_ENV==='production'`, `sameSite: 'lax'`) 설정 + `draftMode().enable()`, 실패 시 NestJS 에러(상태 코드/바디)를 그대로 중계. 쿠키에 만료 시간은 따로 안 둠 — JWT 자체가 만료(1일)되니 쿠키 수명은 의미 없고 브라우저 세션 쿠키로 충분(YAGNI). `session`은 쿠키 없으면 즉시 `{isAuthenticated:false}`, 있으면 NestJS `GET /auth/me`에 위임 검증 후 `{isAuthenticated, role, name}` 변환 응답(토큰 자체는 응답에 안 실음), 401이면 쓸모없어진 쿠키를 그 자리에서 삭제. `logout`은 쿠키 삭제 + `draftMode().disable()`(서버 측 토큰 무효화는 없음 — 무상태 JWT라 로그아웃은 클라이언트/BFF 쪽 정리만으로 충분). Next.js 16의 `cookies()`/`draftMode()`가 전부 async 함수로 바뀐 걸 설치된 공식 문서(`node_modules/next/dist/docs`)로 확인 후 반영. 로컬에서 실제 blog-api(`localhost:4000`) + Next dev 서버 둘 다 띄워서 로그인 전/후 세션 조회, 오답 비번(401)·형식 오류(400) 에러 중계, 로그아웃 후 쿠키 삭제, 위조 토큰으로 세션 조회 시 자동 쿠키 정리까지 실제 HTTP 요청으로 검증
   - (grill 세션에서 발견) JWT 만료가 1시간이라 글 쓰는 도중 세션이 끊길 수 있는 문제 → `blog-api`의 `JWT_EXPIRATION`을 1일로 변경(로컬 `.env` + Render 배포 환경변수 둘 다 갱신)
24. **(v1 스코프 제외)** ~~`app/api/auth/google`, `app/api/auth/google/callback` 구현~~ — 방문자 로그인 자체를 안 씀
25. [x] `zustand`(이미 설치돼 있었음) + `login-modal-store.ts`(isOpen/open/close) + `login-modal.tsx`(이메일/비번 폼 — Google 버튼과 숨겨진 관리자 폼 구분은 무의미해져서 뺌, 소유자 전용 로그인 폼 하나만) 구현, 헤더 우측 상단 로그인 버튼에 연결. shadcn `dialog` 신규 설치(Base UI 기반 — `open`/`onOpenChange`로 외부(zustand) 상태 제어, `DialogTrigger` 안 씀). `app/api/auth/login` 호출 실패 시 응답의 `message`(문자열 또는 class-validator 배열)를 `sonner` 토스트로 표시, 성공 시 모달만 닫힘(헤더가 로그인 상태를 반영하는 건 `use-session.ts`가 붙는 26번에서 처리 — 아직은 로그인해도 헤더 버튼이 "로그인"으로 남아있는 게 정상). 실제 blog-api + Next dev 서버 띄우고 Playwright로 브라우저에서 직접 검증: 모달 열림, 오답 비번 시 토스트 에러 노출, 정답 시 모달 닫힘까지 스크린샷으로 확인
26. [x] `hooks/use-session.ts` + `lib/api.ts`의 `proxyToBackend` 헬퍼로 `app/api/posts/*`, `app/api/images`, `app/api/categories`, `app/api/tags`, `app/api/stats/*` 프록시 라우트 구현 (`app/api/comments/*`는 댓글 기능 제외로 안 만듦). `proxyToBackend(request, path)`는 쿠키의 JWT를 `Authorization` 헤더로 붙이고, `multipart/form-data`는 `request.formData()`로 버퍼링해 그대로 전달(스트리밍 안 씀 — Node fetch가 스트림 body엔 `duplex: 'half'`를 요구하는 걸 피하려고 5MB 이하 이미지 업로드엔 버퍼링으로 충분하다고 판단), 그 외엔 `request.text()`로 JSON 문자열 그대로 중계. 204는 바디 없이, 나머지는 JSON으로 상태코드까지 그대로 릴레이. `posts/[slug]/route.ts`(GET/PUT/PATCH/DELETE), `posts/[slug]/view`, `posts/[slug]/like`, `posts/search`, `categories`, `tags`, `stats/popular-posts`, `stats/visits`, `images` 전부 구현. `use-session.ts`는 TanStack Query로 `/api/auth/session` 조회 + `isOwner` 파생값 반환 — 겸사겸사 헤더(`header.tsx`)를 이 훅에 연결해 로그인/로그아웃 상태에 따라 버튼을 로그인 ↔ 아바타+로그아웃으로 전환(23/25번에서 미뤄뒀던 부분), 로그인 성공/로그아웃 시 `queryClient.invalidateQueries(["session"])`로 즉시 반영. 실제 blog-api + Next dev 서버로 전부 검증: 무인증 글 생성 401, 글 생성/조회/수정/숨김토글/삭제, 숨긴 글 소유자만 조회 가능, 조회수/좋아요 기록, 한글 검색, `posts/search`와 `posts/[slug]` 라우트 충돌 없음(정적 경로가 동적 세그먼트보다 우선), 이미지 업로드(무인증 401 + 실제 R2 업로드 후 공개 URL 접근), Playwright로 브라우저에서 로그인→헤더 로그아웃 버튼 전환→로그아웃→헤더 로그인 버튼 복귀까지 스크린샷 확인. 테스트로 만든 글/이미지는 검증 후 정리
26-1. `react-error-boundary` 설치 + `QueryErrorResetBoundary`와 연동, `use-stats.ts` 등 실제 API 훅에 위젯 단위 에러 바운더리 적용 ("에러 처리" 섹션 참고)
27. [x] `use-categories.ts`/`use-tags.ts`(TanStack Query, `/api/categories`·`/api/tags` 조회) + `category-combobox.tsx`/`tag-input.tsx`/`series-fields.tsx` 구현. shadcn `command`+`popover` 신규 설치(`command`는 `cmdk` 기반, `popover`는 Base UI — `PopoverTrigger`에 `render={<Button role="combobox" .../>}`로 커스텀 트리거 연결, `Command shouldFilter={false}`로 직접 필터링해 "새로 추가" 아이템이 cmdk 자동 필터에 걸러지지 않게 함). `category-combobox`는 기존 카테고리 선택 또는 자유 입력(백엔드가 label로 upsert), `tag-input`은 다중 선택+자유 추가+제거, `series-fields`는 시리즈 이름 텍스트 입력 하나만(order는 백엔드 자동 계산). 아직 소비하는 폼이 없어(28번에서 에디터에 조립) 임시 페이지(`app/tmp-verify-27/`, Next.js는 `_`로 시작하는 폴더가 라우팅에서 제외되는 private folder 컨벤션이라 언더스코어 없이 명명)에 로컬 state로 렌더링해 실제 blog-api 시드 데이터(카테고리/태그)로 Playwright 검증 후 삭제: 기존 항목 선택, 자유 입력으로 새 항목 추가, 태그 제거, 시리즈 입력까지 전부 실제 값 반영 확인. 이 과정에서 이전 세션(26번) 테스트 때 정리 안 하고 남겨뒀던 orphan 카테고리("검증")도 발견해 같이 정리
28. [x] `markdown-editor.tsx` + `image-upload-button.tsx` 조립해 `/posts/new`, `/posts/[slug]/edit` 실제 폼 완성, `delete-confirm-dialog.tsx` + `owner-actions.tsx`(수정/삭제/숨김/고정)도 `use-posts.ts` 뮤테이션에 연결
    - **스코프 확장**: 원래 문항엔 없었지만 진행하다 보니 `/posts`, `/posts/[slug]`, 홈 대표글이 여전히 `src/data/posts.ts` 목업을 보고 있어서(26번은 프록시 라우트만 만들었을 뿐 읽는 쪽 페이지는 안 바꿈) 에디터로 글을 써도 사이트 어디에도 안 보이는 문제를 미리 발견 — 그래서 이 항목에 읽는 쪽 페이지 전체를 실제 blog-api 데이터로 전환하는 작업까지 포함시킴(`lib/posts.ts` 신설: `fetchPosts`/`fetchPostBySlug`/`fetchCategories`, Draft Mode 인식). `src/data/posts.ts`/`categories.ts` 목업 걷어내고 `page.tsx`(홈), `posts/page.tsx`, `posts/[slug]/page.tsx`, `opengraph-image.tsx`, `sitemap.ts`, `rss.xml/route.ts`, `related-posts.tsx`, `series-nav.tsx`, `category-nav.tsx`(사이드바 카테고리 아코디언 — `MobileNav`가 이미 `"use client"`라 그 트리 안에서 서버 컴포넌트로 못 만들어서 `use-category-groups.ts` 훅으로 클라이언트 전환), `search-content.tsx`(`usePosts`/`useCategories`/`useTags` 실 API 연결, 백엔드에 없는 `views` 정렬 옵션 제거) 전부 교체
    - **`next.config.ts`에 `images.remotePatterns` 추가**: R2 업로드 이미지(`*.r2.dev`)가 `next/image` 기본 설정에선 최적화 대상 도메인이 아니라서 그대로 두면 발행된 글의 이미지가 깨짐 — 실제로 빠뜨렸다가 발견하고 추가
    - **실제로 재현해서 고친 진짜 버그**: `generateStaticParams`에 없는 슬러그(=방금 만든 새 글)로 들어가면 `params.slug`가 이미 percent-encode된 채로 들어오는 경우가 있어 `encodeURIComponent`를 또 씌우면 이중 인코딩되어 백엔드가 404 → `notFound()` 호출. `lib/posts.ts`의 `fetchPostBySlug`에서 `decodeURIComponent`로 먼저 정규화한 뒤 다시 인코딩하도록 고침(`fetchPostBySlug`/`fetchPublicPosts` 양쪽에서 안전)
    - **검증하다 스스로 낚였던 삽질**: 위 버그를 고친 뒤 "글 숨김 처리한 걸 로그아웃 상태에서 봐도 계속 공개로 보인다"고 오판해 `force-cache`→`no-store`, `generateStaticParams` 제거, `force-dynamic` 추가까지 했었음 — 원인은 캐시가 아니라 이 프로젝트에서 **이미 20번에서 발견해 문서화해둔** `notFound()`의 HTTP 상태 코드 한계(스트리밍 응답이라 실제 상태는 200으로 남음, 위 "페이지별 렌더링 전략" 참고)였음. `curl -w "%{http_code}"`로만 검증하다 이 알려진 한계에 또 걸려서 캐시 버그로 오인한 것 — Playwright로 실제 화면에 보이는 텍스트(`getByText(...).isVisible()`)까지 확인하고서야 원래 설계(`force-cache` + `revalidatePath('/', 'layout')` + `generateStaticParams`)가 처음부터 올바르게 동작하고 있었다는 걸 뒤늦게 확인, 불필요했던 변경은 전부 되돌리고 `decodeURIComponent` 수정 하나만 남김. **교훈**: 이 프로젝트에서 `notFound()` 관련 페이지를 검증할 땐 HTTP 상태 코드를 신뢰하지 말고 반드시 화면에 실제로 보이는 내용으로 확인할 것
    - `owner-actions.tsx`: 수정(`/posts/[slug]/edit`로 이동)/숨김·고정 토글(`usePatchPost` + `router.refresh()`)/삭제(`useDeletePost` + `delete-confirm-dialog.tsx` 확인 후 `/posts`로 리다이렉트) — `/posts/[slug]` 상세 헤더에만 배치(목록 카드마다 넣으려면 카드 전체를 감싸는 `Link` 구조를 다시 짜야 해서 이번 스코프에선 보류, 상세 페이지에서 전부 처리 가능)
    - `post-form.tsx`: 제목/요약/카테고리/태그/시리즈/본문 공용 폼(생성·수정 겸용), `useCreatePost`/`useUpdatePost` 연결. `markdown-editor.tsx`의 실시간 미리보기는 `react-markdown`의 동기 `Markdown` 컴포넌트만 사용(발행 페이지의 `MarkdownAsync`+`rehype-pretty-code`는 서버 전용이라 클라이언트 에디터에서 못 씀 — 공식 타입 주석으로 확인) — 코드 하이라이트 없이 일반 텍스트로만 보이는 건 의도된 단순화
    - `/posts/new`, `/posts/[slug]/edit`는 `owner-only.tsx` 가드로 감쌈(세션 로딩 중 스켈레톤, 소유자 아니면 로그인 모달 열고 홈으로 리다이렉트 — 설계 문서 그대로)
    - 헤더에 (isOwner) "새 글 작성" 버튼도 이 항목에서 같이 배치(아바타 왼쪽, `Tooltip`+`SquarePen` 아이콘, 모바일은 아이콘만)
    - shadcn `alert-dialog` 신규 설치(Base UI, `AlertDialogAction`은 자동 닫힘이 없어 `onConfirm` 후 직접 `onOpenChange(false)` 호출)
    - **실제 blog-api + 프로덕션 빌드로 Playwright 전체 플로우 검증**: 로그인 → 새 글 작성(카테고리/태그 자유 입력 포함) → 등록 → `/posts` 목록에 노출 확인 → 수정(기존 값 프리필 확인) → 수정 반영 확인 → 숨김 처리 → 로그아웃 상태에서 실제로 안 보임(화면 텍스트로 확인) → 재로그인 후 Draft Mode로 숨김 글 미리보기 가능 확인 → 삭제 후 목록에서 사라짐 확인, 콘솔 에러 0개. 테스트로 만든 글/카테고리는 전부 정리
29. `use-stats.ts` + `stats-widget.tsx`를 실제 API로 전환 (목업 데이터 제거)
30. **(v1 스코프 제외)** ~~`lib/liked-posts.ts` + `like-button.tsx` 구현~~ — 로그인 없는 방문자 참여 지표가 조회수 하나로 충분하다고 판단해 좋아요도 댓글과 함께 제외, 글쓰기에 집중. 26번에서 만든 `app/api/posts/[slug]/like/route.ts` 프록시는 이 결정 이후 삭제
31. **(v1 스코프 제외)** ~~`use-comments.ts` + `comment-list.tsx`/`comment-item.tsx`/`comment-form.tsx` 구현~~ — 댓글 기능 자체를 안 씀
32. **(v1 스코프 제외)** ~~비로그인 상태 UI(로그인 유도), 소유자 모더레이션(소프트 삭제 버튼) 처리~~ — 전부 댓글 UX에 딸린 항목이라 31번과 함께 제외

**별도 트랙 — `blog-api` 저장소** (이 저장소 1~3차 완료 후 착수) — **12번까지 전부 완료, Render 배포 및 실제 프로덕션 검증까지 끝남**(상세는 `blog-api` 저장소 `docs/blog-api-plan.md` 참고). 아래는 원래 계획 요약:
- 인증: 소유자 이메일+비밀번호 검증 API(+Redis 기반 로그인 시도 제한), 방문자는 Next.js BFF가 넘겨주는 Google 프로필로 유저 조회/생성 후 JWT 발급 API — **둘 다 구현·검증 완료**. 다만 방문자 로그인은 프론트에서 v1 스코프 제외라 지금은 안 쓰임(위 "4차" 섹션 참고)
- 글 CRUD API, 숨김/고정 처리
- 댓글 API: `Comment`(소프트 삭제 지원), 방문자(`User`) 테이블, 소유자 모더레이션(삭제) 권한 — **구현·검증 완료, 프론트에서 v1 스코프 제외라 지금은 안 쓰임**
- 글 좋아요 API: `Post.likeCount` 증가, Redis IP+day 중복방지 (인증 불필요) — **구현·검증 완료, 프론트에서 v1 스코프 제외라 지금은 안 쓰임**(댓글과 동일한 이유)
- R2 이미지 업로드 API(파일 크기/타입 서버 재검증)
- `GET /categories`, `GET /tags` (자동완성용)
- 검색(ILIKE 부분문자열 매칭, 제목/태그 가중치 + 정렬/카테고리/태그 필터 파라미터 — 한글은 Postgres `to_tsvector`/`pg_trgm` 모두 부분검색이 안 되는 걸 실제 DB로 확인 후 ILIKE로 변경, `blog-api` 저장소 `docs/blog-api-plan.md` 참고), 조회수 카운터(Redis 중복방지 + Postgres 집계), 통계 조회 API
- `@nestjs/swagger`로 Swagger 문서화
- CORS 설정 불필요 (Next.js BFF만 호출하므로) — 대신 Vercel 서버발 요청만 받도록 좁히는 것도 선택적으로 고려
- DB는 Neon 무료 Postgres 연동 우선 (Render 자체 DB 아님, Supabase는 7일 미사용 시 수동 복구 필요해 후순위)
- 글 CRUD(등록/수정/삭제/숨김/고정) 성공 시 프론트 `/api/revalidate` 웹훅 호출해 온디맨드 ISR 재검증
