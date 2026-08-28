import { proxyToBackend } from "@/lib/api";

type Params = Promise<{ slug: string }>;

export async function GET(request: Request, { params }: { params: Params }) {
  const { slug } = await params;
  return proxyToBackend(request, `/posts/${slug}`);
}

export async function PUT(request: Request, { params }: { params: Params }) {
  const { slug } = await params;
  return proxyToBackend(request, `/posts/${slug}`);
}

export async function PATCH(
  request: Request,
  { params }: { params: Params },
) {
  const { slug } = await params;
  return proxyToBackend(request, `/posts/${slug}`);
}

export async function DELETE(
  request: Request,
  { params }: { params: Params },
) {
  const { slug } = await params;
  return proxyToBackend(request, `/posts/${slug}`);
}
