import { proxyToBackend } from "@/lib/api";

export async function GET(request: Request) {
  return proxyToBackend(request, "/posts");
}

export async function POST(request: Request) {
  return proxyToBackend(request, "/posts");
}
