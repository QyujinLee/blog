import { cookies, draftMode } from "next/headers";
import { API_URL, AUTH_COOKIE_NAME, forwardClientHeaders } from "@/lib/api";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body?.email || !body?.password) {
    return Response.json(
      { message: "이메일과 비밀번호를 입력해주세요." },
      { status: 400 },
    );
  }

  const backendResponse = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    // 브루트포스 제한이 IP별로 걸리려면 진짜 방문자 IP를 넘겨야 함 (lib/api.ts 주석 참고)
    headers: { "Content-Type": "application/json", ...forwardClientHeaders(request) },
    body: JSON.stringify({ email: body.email, password: body.password }),
    cache: "no-store",
  });

  if (!backendResponse.ok) {
    const error = await backendResponse.json().catch(() => ({}));
    return Response.json(error, { status: backendResponse.status });
  }

  const { token } = (await backendResponse.json()) as { token: string };

  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    // 없으면 세션 쿠키가 되어 브라우저를 닫을 때마다 로그아웃된다.
    // 백엔드 JWT_EXPIRATION(1d)에 맞춤 — 쿠키가 토큰보다 오래 살면 로그인된 척하다 401만 남음
    maxAge: 60 * 60 * 24,
  });

  // 소유자 로그인 성공 시 Draft Mode도 같이 켜서 숨긴 글을 계속 볼 수 있게 함 ("숨김 글 미리보기" 섹션 참고)
  const draft = await draftMode();
  draft.enable();

  return Response.json({ success: true });
}
