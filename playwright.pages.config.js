import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/pages-e2e',
  timeout: 45_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: 'http://127.0.0.1:4174',
    browserName: 'chromium',
    headless: true,
    serviceWorkers: 'block',
  },
  webServer: {
    command: 'python3 -m http.server 4174 --bind 127.0.0.1 --directory dist',
    url: 'http://127.0.0.1:4174',
    reuseExistingServer: false,
    timeout: 30_000,
  },
  reporter: [['line']],
});
