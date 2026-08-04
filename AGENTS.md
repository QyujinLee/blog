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
