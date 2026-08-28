import { cookies } from "next/headers";

export const API_URL = process.env.API_URL ?? "http://localhost:4000";
export const AUTH_COOKIE_NAME = "token";

// Route Handler들이 공용으로 쓰는 NestJS 호출 헬퍼 — 쿠키의 JWT를 Authorization 헤더로 바꿔 붙이고
// 요청/응답을 그대로 중계. 서명 검증은 안 함(NestJS가 함) — 그냥 통로 역할만.
export async function proxyToBackend(
  request: Request,
  path: string,
): Promise<Response> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const headers: Record<string, string> = token
    ? { Authorization: `Bearer ${token}` }
    : {};

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

  const data = await backendResponse.json().catch(() => null);
  return Response.json(data, { status: backendResponse.status });
}
