// BFF(app/api/*)는 백엔드 에러 바디를 그대로 중계한다. NestJS의 ValidationPipe는 검증 실패 시
// message를 문자열 배열로 내려주므로(main.ts의 기본 exceptionFactory), 그 경우 첫 줄만 보여준다
export async function errorMessageFromResponse(
  response: Response,
  fallback: string,
): Promise<string> {
  const body = await response.json().catch(() => ({}));
  const message = Array.isArray(body?.message) ? body.message[0] : body?.message;
  return typeof message === "string" && message ? message : fallback;
}
