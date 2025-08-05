import { test, expect, _electron as electron, ElectronApplication, Page } from '@playwright/test';
import { execSync, fork, ChildProcess } from 'child_process';

test.describe('Desktop Application Onboarding and Setup', () => {
  let electronApp: ElectronApplication;
  let page: Page;
  let serverProcess: ChildProcess;

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
    // Kill the server process if it's running
    if (serverProcess) {
      serverProcess.kill();
    }
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
    // Start a local server process for the player to discover
    // We use a separate server process to simulate a real network environment
    serverProcess = fork('server/dist/index.js', ['--mode=offline'], { silent: true });

    // Wait for the server to be ready by listening for a specific output message
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Server process timed out after 10 seconds'));
      }, 10000);

      serverProcess.stdout?.on('data', (data) => {
        const output = data.toString();
        // Match the actual server output
        if (output.includes('[Server] Starting in offline mode.')) {
          clearTimeout(timeout);
          resolve();
        }
      });

      serverProcess.stderr?.on('data', (data) => {
        console.error(`Server Process Error: ${data}`);
      });
    });

    await expect(page.getByText('Welcome to KJ-Nomad')).toBeVisible();

    // The "Set up as Player" button opens a new window
    const newPagePromise = electronApp.waitForEvent('window');
    await page.getByRole('button', { name: 'Set up as Player' }).click();
    const newPage = await newPagePromise;

    // The player window should eventually find the server and display the ready screen
    // We give it a generous timeout to allow for network discovery
    await expect(newPage.getByRole('heading', { name: 'KJ-Nomad Ready' })).toBeVisible({ timeout: 20000 });
    await expect(newPage.getByText('Waiting for the next performance...')).toBeVisible();
  });
});
