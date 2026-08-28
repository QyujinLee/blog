import { proxyToBackend } from "@/lib/api";

export async function POST(request: Request) {
  return proxyToBackend(request, "/images");
}
