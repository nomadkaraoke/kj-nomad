import { defineConfig, devices } from '@playwright/test';

import { defineBddConfig } from 'playwright-bdd';

const testDir = defineBddConfig({
  features: 'docs/features/!(desktop_app)/**/*.feature',
  steps: 'e2e/steps/web/**/*.ts',
});

export default defineConfig({
  testDir,
  testIgnore: 'docs/features/desktop_app/**',
  reporter: [['html', { outputFolder: 'e2e/report', open: 'never' }]],
  use: {
    baseURL: 'http://localhost:8080',
    trace: 'on-first-retry',
    ...devices['Desktop Chrome'],
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
  },
});
