import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: "line",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  // ponytail: Chromium만 — 개인 블로그 포트폴리오라 크로스브라우저 매트릭스는 과함, 필요해지면 devices['Desktop Firefox'] 등 추가
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // 실제 백엔드에 붙이면 CI가 남의 배포 상태와 DB 내용에 휘둘린다 — 고정 픽스처를 주는
  // 가짜 API(e2e/stub-api.mjs)를 함께 띄우고 그걸 보게 한다
  webServer: [
    {
      command: "node e2e/stub-api.mjs",
      url: "http://127.0.0.1:4100/categories",
      reuseExistingServer: !process.env.CI,
      timeout: 30 * 1000,
    },
    {
      command: "yarn dev",
      url: "http://localhost:3000",
      env: { API_URL: "http://127.0.0.1:4100" },
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
  ],
});
