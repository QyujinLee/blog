import { cookies, draftMode } from "next/headers";
import { API_URL, AUTH_COOKIE_NAME } from "@/lib/api";

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
    headers: { "Content-Type": "application/json" },
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
  });

  // 소유자 로그인 성공 시 Draft Mode도 같이 켜서 숨긴 글을 계속 볼 수 있게 함 ("숨김 글 미리보기" 섹션 참고)
  const draft = await draftMode();
  draft.enable();

  return Response.json({ success: true });
}
