import { defineConfig } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

const testDir = defineBddConfig({
  features: 'docs/features/desktop_app/**/*.feature',
  steps: ['e2e/steps/desktop_app/**/*.ts', 'e2e/fixtures.ts'],
});

export default defineConfig({
  testDir,
  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',
  workers: 1,
  reporter: [['html', { outputFolder: 'e2e/report-electron', open: 'never' }]],
  use: {
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'electron-chromium',
      use: { browserName: 'chromium' },
    },
  ],
});
