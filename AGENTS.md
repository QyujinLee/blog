<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## 작업 원칙

### 리뷰 → 검증 반복
코드 작성이든 설계/문서 작업이든, 완료 후 바로 끝내지 않는다. 스스로 리뷰해서 문제(모순, 빠진 부분, 과설계, 보안 구멍 등)를 찾고 고친 뒤, 다시 처음부터 검증한다. 이 리뷰→수정→재검증 사이클을 "문제없다"고 확신할 때까지 반복한다. 한 번 훑어보고 끝내는 것은 리뷰가 아니다.

### 추측 금지 — 공식 문서로 검증 후 답변
API 사용법, 설정 방법, 라이브러리 동작 방식 등 확신이 없는 내용을 학습 데이터 기억에 의존해 추측으로 답하지 않는다. 특히 Next.js, Spring Boot, 그 외 버전이 자주 바뀌는 라이브러리는 학습 데이터 시점과 실제 설치된 버전이 다를 수 있으므로, 답변하거나 코드를 쓰기 전에 반드시 공식 문서(필요시 `node_modules` 안의 문서, 웹 검색)를 확인해서 검증된 내용만 답한다. 확인이 어려우면 확인이 안 됐다는 사실을 그대로 말한다 — 그럴듯하게 지어내지 않는다.

### shadcn 컴포넌트는 Radix가 아니라 Base UI(`@base-ui/react`) 기반
`components.json`의 `style: "base-nova"`가 생성한 `src/components/ui/*`는 Radix UI가 아니라 `@base-ui/react`를 씀. 흔한 실수:
- **`asChild` 없음** — 다른 요소로 렌더링하려면 `render={<button ... />}` prop 사용 (`TooltipTrigger asChild><button/></TooltipTrigger>`가 아니라 `<TooltipTrigger render={<button ... />} />`)
- 커스텀 트리거/composable 컴포넌트를 쓰기 전에 해당 `src/components/ui/*.tsx` 소스와 `node_modules/@base-ui/react/*/**.d.ts` 타입을 먼저 확인 — Radix 시절 기억으로 props를 추측하지 않는다

## 커맨드

```bash
yarn dev                            # http://localhost:3000 — blog-api를 localhost:4000에서 같이 띄워야 실제 데이터가 나온다
yarn lint                           # ESLint
yarn tsc --noEmit -p tsconfig.json  # 타입체크
yarn test                           # Vitest (컴포넌트 유닛 테스트 + Storybook 스토리, Browser Mode/Playwright Chromium)
yarn test -- <파일명 또는 패턴>       # 단일 테스트만 실행
yarn test:e2e                       # Playwright E2E (yarn dev 서버 자동 기동)
yarn build                          # 프로덕션 빌드
yarn storybook                      # http://localhost:6006
```

PR을 올리면 `.github/workflows/ci.yml`이 lint → 타입체크 → `yarn test` → `yarn test:e2e`(Chromium) 순서로 돌린다. 배포는 Vercel.

## 아키텍처

- **BFF 패턴**: 브라우저는 NestJS(`blog-api`, 별도 저장소)를 직접 호출하지 않고 항상 `src/app/api/*` Route Handler만 호출한다. 대부분은 `lib/api.ts`의 `proxyToBackend(request, path)`로 쿠키의 JWT를 `Authorization` 헤더로 바꿔 그대로 중계하는 얇은 프록시다(`app/api/posts/*`, `categories`, `tags`, `images`, `stats/*`). 로그인/로그아웃/세션(`app/api/auth/*`)만 쿠키 설정·Draft Mode 전환 같은 추가 로직이 있어 개별 구현되어 있다.
- **인증 흐름**: 로그인 성공 시 NestJS가 내려준 JWT를 httpOnly 쿠키(`token`)로 저장한다 — 브라우저 JS는 절대 값을 못 읽는다. 이후 서버 컴포넌트/Route Handler가 이 쿠키를 읽어 백엔드 호출에 `Authorization: Bearer` 헤더로 실어보낸다. 서명 검증은 NestJS가 하고 이쪽은 통로 역할만 한다.
- **숨김 글 미리보기**: 로그인 성공 시 Next.js Draft Mode도 같이 켠다(`app/api/auth/login/route.ts`). `lib/posts.ts`의 `fetchPosts`/`fetchPostBySlug`는 Draft Mode가 켜져 있을 때만 쿠키의 JWT를 실어 보내고 `cache: "no-store"`로 캐시를 우회해 숨김(`hidden`) 글까지 조회한다. `fetchPublicPosts`(`generateStaticParams` 전용 — 빌드 타임엔 `cookies()`/`draftMode()` 사용 불가)는 항상 공개 글만 정적 캐시로 가져온다.
- **온디맨드 ISR**: 글 CRUD가 일어나면 `blog-api`가 이 저장소의 `app/api/revalidate/route.ts`를 웹훅으로 호출(`x-revalidate-secret` 헤더 검증)해 `revalidatePath("/", "layout")` — 전체 재빌드 없이 즉시 반영된다.
- **데이터는 전부 실제 백엔드**: `src/data/*` 목업은 더 이상 없다(과거 개발 단계 흔적). `Post`/`Category` 타입과 페치 함수(`lib/posts.ts`)는 `blog-api`의 실제 응답 형태 그대로다.
- **디렉터리**: `src/app`은 App Router 페이지 + `app/api/*`(BFF 라우트), `src/components/ui`는 shadcn(Base UI) 생성 컴포넌트, `src/lib`은 API 클라이언트·메타데이터·유틸, `src/hooks`는 TanStack Query 훅, `src/stories`는 Storybook.
- 설계 배경 전체는 `docs/blog-structure-plan.md` 참고. 백엔드 설계는 `blog-api` 저장소의 `docs/blog-api-plan.md`.
