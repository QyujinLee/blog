import { revalidatePath } from "next/cache";

export async function POST(request: Request) {
  const secret = request.headers.get("x-revalidate-secret");

  if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
    return Response.json({ revalidated: false, message: "Invalid secret" }, { status: 401 });
  }

  revalidatePath("/", "layout");

  return Response.json({ revalidated: true, now: Date.now() });
}
