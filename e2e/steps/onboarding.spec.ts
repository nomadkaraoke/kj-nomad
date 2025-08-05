import { test, expect, _electron as electron, ElectronApplication, Page } from '@playwright/test';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Desktop Application Onboarding and Setup', () => {
  let electronApp: ElectronApplication;
  let page: Page;

  test.beforeAll(() => {
    // Build the server before running the tests
    execSync('npm run build:server', { stdio: 'inherit' });

    // Create a dummy media library and setup file to simulate a completed setup
    const dataDir = path.join(__dirname, '..', '..', 'server', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(path.join(dataDir, 'media-library.json'), JSON.stringify({ songs: [] }));
    fs.writeFileSync(path.join(dataDir, 'setup.json'), JSON.stringify({ setupComplete: true, mediaDirectory: dataDir }));
  });

  test.beforeEach(async () => {
    // Launch the electron app before each test
    electronApp = await electron.launch({ args: ['electron/main.mjs'], env: { ...process.env, E2E_TESTING: 'true' } });
    page = await electronApp.firstWindow();
  });

  test.afterEach(async () => {
    // Close the app after each test
    await electronApp.close();
  });

  test('KJ launches the app and chooses to start an Offline Session', async () => {
    await expect(page.getByText('Welcome to KJ-Nomad')).toBeVisible();
    await page.getByRole('button', { name: 'Start Offline Session' }).click();
    
    await expect(page.getByRole('heading', { name: 'Welcome to KJ-Nomad' })).toBeVisible({ timeout: 15000 });
  });

  test('KJ launches the app and chooses to connect to an Online Session', async () => {
    await expect(page.getByText('Welcome to KJ-Nomad')).toBeVisible();
    await page.getByRole('button', { name: 'Connect to Online Session' }).click();
    await expect(page.getByPlaceholder('Admin Key')).toBeVisible({ timeout: 15000 });
  });

  test('KJ launches the app and chooses to set it up as a Player', async () => {
    await expect(page.getByText('Welcome to KJ-Nomad')).toBeVisible();

    const newPagePromise = electronApp.waitForEvent('window');
    await page.getByRole('button', { name: 'Set up as Player' }).click();
    const newPage = await newPagePromise;
    await newPage.pause();
    await expect(newPage.getByTestId('player-setup-page')).toBeVisible({ timeout: 15000 });
    await expect(newPage.getByText('Scanning for KJ-Nomad server on your network...')).toBeVisible();
  });
});
