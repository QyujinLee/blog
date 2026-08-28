import { proxyToBackend } from "@/lib/api";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  return proxyToBackend(request, `/posts/${encodeURIComponent(slug)}/view`);
}
