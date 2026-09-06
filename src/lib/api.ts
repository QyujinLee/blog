import { cookies } from "next/headers";

export const API_URL = process.env.API_URL ?? "http://localhost:4000";
export const AUTH_COOKIE_NAME = "token";

// 백엔드는 조회수 중복 제거(IP+날짜)와 로그인 시도 제한을 IP 기준으로 하는데, 실제 호출자는
// 브라우저가 아니라 이 BFF라서 그냥 두면 전부 Vercel 함수 IP 하나로 뭉개진다. 진짜 방문자
// IP를 실어보내되, 아무나 헤더만 위조해서 우회하지 못하도록 INTERNAL_SECRET을 같이 보낸다.
// x-forwarded-for는 Vercel이 스푸핑 방지를 위해 항상 덮어써주는 값이라 그대로 믿어도 된다
// (Vercel "Request headers" 문서: "we currently overwrite the X-Forwarded-For header and
// do not forward external IPs. This restriction is in place to prevent IP spoofing").
export function forwardClientHeaders(request: Request): Record<string, string> {
  const ip = request.headers.get("x-forwarded-for");
  const secret = process.env.INTERNAL_SECRET;

  if (!ip || !secret) return {};
  return { "x-client-ip": ip, "x-internal-secret": secret };
}

// Route Handler들이 공용으로 쓰는 NestJS 호출 헬퍼 — 쿠키의 JWT를 Authorization 헤더로 바꿔 붙이고
// 요청/응답을 그대로 중계. 서명 검증은 안 함(NestJS가 함) — 그냥 통로 역할만.
export async function proxyToBackend(
  request: Request,
  path: string,
): Promise<Response> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const headers: Record<string, string> = {
    ...forwardClientHeaders(request),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const hasBody = !["GET", "HEAD", "DELETE"].includes(request.method);
  let body: BodyInit | undefined;

  if (hasBody) {
    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("multipart/form-data")) {
      // FormData로 버퍼링 — fetch가 알아서 올바른 boundary로 Content-Type을 다시 설정해줌
      body = await request.formData();
    } else {
      body = await request.text();
      headers["Content-Type"] = contentType || "application/json";
    }
  }

  const search = new URL(request.url).search;
  const backendResponse = await fetch(`${API_URL}${path}${search}`, {
    method: request.method,
    headers,
    body,
    cache: "no-store",
  });

  if (backendResponse.status === 204) {
    return new Response(null, { status: 204 });
  }

  // 에러 응답 바디가 비어있거나 JSON이 아니면 null이 아니라 {}를 내려줘야
  // 클라이언트의 postJson()이 error.message에 접근할 때 안 터짐
  const data = await backendResponse.json().catch(() => ({}));
  return Response.json(data, { status: backendResponse.status });
}
