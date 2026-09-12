// 브라우저에서 터진 에러는 Vercel 로그에 안 남아 사용자만 보고 개발자는 모른다.
// error.tsx가 여기로 한 줄 보내면 서버 로그(Vercel Functions 로그)에 남는다.
// 외부 수집 서비스(Sentry 등)를 붙이지 않은 건 개인 블로그에 비용·의존성이 과해서다.
// 인증 없는 공개 엔드포인트라 여기 들어오는 값은 전부 남이 보낸 것으로 취급한다.
// 개행/제어문자를 그대로 흘리면 로그 한 줄을 여러 줄로 위조할 수 있어 먼저 제거하고,
// 길이도 자른다. ponytail: 호출 빈도 제한은 없음 — 필요해지면 Upstash 레이트리밋 추가
function clean(value: string, max: number): string {
  return String(value).replace(/[\u0000-\u001f\u007f]/g, " ").slice(0, max);
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    message?: string;
    digest?: string;
    url?: string;
  } | null;

  if (!body?.message) return new Response(null, { status: 400 });

  console.error("[client-error]", {
    message: clean(body.message, 500),
    digest: body.digest ? clean(body.digest, 100) : undefined,
    url: body.url ? clean(body.url, 300) : undefined,
  });

  return new Response(null, { status: 204 });
}
