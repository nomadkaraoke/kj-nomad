import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e/steps',
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
