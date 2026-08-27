import { cookies, draftMode } from "next/headers";
import { AUTH_COOKIE_NAME } from "@/lib/api";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);

  const draft = await draftMode();
  draft.disable();

  return Response.json({ success: true });
}
