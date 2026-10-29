import { defineConfig, devices } from '@playwright/test'

const chromiumExecutablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?.trim()
const chromiumLaunchOptions = chromiumExecutablePath
  ? { executablePath: chromiumExecutablePath, chromiumSandbox: true }
  : undefined
const externalBaseUrl = process.env.E2E_BASE_URL?.trim()
const previewUrl = externalBaseUrl || 'http://127.0.0.1:5189'

export default defineConfig({
  testDir: './e2e',
  testMatch: ['**/hero-prerender.spec.ts', '**/homepage-hydration.spec.ts', '**/inline-css.spec.ts', '**/qr-release.spec.ts', '**/font-loading.spec.ts'],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }], ['list']],
  timeout: 60_000,
  use: {
    baseURL: previewUrl,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    navigationTimeout: 30_000,
  },
  projects: [{
    name: 'chromium',
    use: {
      ...devices['Desktop Chrome'],
      launchOptions: chromiumLaunchOptions,
    },
  }],
  webServer: externalBaseUrl ? undefined : {
    command: 'npm run preview -- --host 127.0.0.1 --port 5189 --strictPort',
    url: previewUrl,
    reuseExistingServer: false,
    timeout: 180_000,
  },
})
