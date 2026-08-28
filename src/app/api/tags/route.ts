import { proxyToBackend } from "@/lib/api";

export async function GET(request: Request) {
  return proxyToBackend(request, "/tags");
}
