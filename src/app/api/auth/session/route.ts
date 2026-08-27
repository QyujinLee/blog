import { cookies } from "next/headers";
import { API_URL, AUTH_COOKIE_NAME } from "@/lib/api";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return Response.json({ isAuthenticated: false });
  }

  const backendResponse = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!backendResponse.ok) {
    // 만료/위조 토큰 — 더 들고 있어봤자 매번 401만 나므로 정리
    cookieStore.delete(AUTH_COOKIE_NAME);
    return Response.json({ isAuthenticated: false });
  }

  const user = (await backendResponse.json()) as {
    role: string;
    name: string;
  };

  return Response.json({
    isAuthenticated: true,
    role: user.role,
    name: user.name,
  });
}
