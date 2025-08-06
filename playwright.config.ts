import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// ES module-safe way to get __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read from default ".env" file.
dotenv.config();

// Read from ".env.test" file.
dotenv.config({ path: path.resolve(__dirname, '.env.test') });

const testDir = defineBddConfig({
  features: 'docs/features/!(desktop_app)/**/*.feature',
  steps: 'e2e/steps/web/**/*.ts',
});

export default defineConfig({
  testDir,
  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',
  testIgnore: 'docs/features/desktop_app/**',
  reporter: [['html', { outputFolder: 'e2e/report', open: 'never' }]],
  use: {
    baseURL: 'http://localhost:8080',
    trace: 'on-first-retry',
    ...devices['Desktop Chrome'],
  },
  webServer: {
    command: 'npm run dev:server:debug',
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    env: {
      E2E_TESTING: 'true',
      MEDIA_DIR: process.env.MEDIA_DIR || '',
    },
  },
});
