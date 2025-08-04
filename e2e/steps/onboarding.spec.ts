import { test, expect, _electron as electron, ElectronApplication, Page } from '@playwright/test';
import { execSync } from 'child_process';

test.describe('Desktop Application Onboarding and Setup', () => {
  let electronApp: ElectronApplication;
  let page: Page;

  test.beforeAll(() => {
    // Build the server before running the tests
    execSync('npm run build:server', { stdio: 'inherit' });
  });

  test.beforeEach(async () => {
    // Launch the electron app before each test
    electronApp = await electron.launch({ args: ['electron/main.mjs'] });
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

  test.skip('KJ launches the app and chooses to set it up as a Player', async () => {
    await expect(page.getByText('Welcome to KJ-Nomad')).toBeVisible();

    const newPagePromise = electronApp.waitForEvent('window');
    await page.getByRole('button', { name: 'Set up as Player' }).click();
    const newPage = await newPagePromise;

    await expect(newPage.getByRole('heading', { name: 'Setting Up as Player Screen' })).toBeVisible({ timeout: 15000 });
    await expect(newPage.getByText('Scanning for KJ-Nomad server on your network...')).toBeVisible();
  });
});
