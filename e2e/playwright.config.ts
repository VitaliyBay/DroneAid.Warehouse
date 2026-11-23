import { defineConfig } from '@playwright/test';

/**
 * Runs against a running stack. `scripts/run-e2e.ps1` starts a disposable one on port 4210;
 * point E2E_BASE_URL elsewhere to test another environment. Tests create their own uniquely
 * named drones, so they never depend on (or clean up) existing data.
 */
export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 7_000 },
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env['E2E_BASE_URL'] ?? 'http://localhost:4210',
    // Use the Chrome already installed on the machine; no browser download needed.
    channel: process.env['E2E_BROWSER_CHANNEL'] ?? 'chrome',
    locale: 'en-US',
    viewport: { width: 1366, height: 768 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  }
});
