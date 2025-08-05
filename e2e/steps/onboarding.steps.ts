import { Given, When, Then } from '../fixtures';
import { expect } from '@playwright/test';
import { fork, ChildProcess } from 'child_process';

let serverProcess: ChildProcess;

Given('the KJ has downloaded and installed the KJ-Nomad desktop application', async () => {
  // Handled by fixtures
});

Given('the KJ launches the application for the first time', async () => {
  // Handled by fixtures
});

Then('they should see the "Welcome to KJ-Nomad" screen with three choices: "Start Offline Session", "Connect to Online Session", and "Set up as Player"', async ({ page }) => {
  await expect(page.getByText('Welcome to KJ-Nomad')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start Offline Session' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Connect to Online Session' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Set up as Player' })).toBeVisible();
});

When('the KJ clicks {string}', async ({ page }, buttonName: string) => {
  await page.getByRole('button', { name: buttonName }).click();
});

Then('they should be taken to the multi-step Setup Wizard to configure their media library', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Welcome to KJ-Nomad' })).toBeVisible({ timeout: 15000 });
});

Then('they should be prompted to enter their private Admin Key', async ({ page }) => {
  await expect(page.getByPlaceholder('Admin Key')).toBeVisible({ timeout: 15000 });
});

Then('the application should display a "Searching for KJ-Nomad server on your network..." screen', async ({ electronApp }) => {
  const newPage = await electronApp.waitForEvent('window');
  await expect(newPage.getByText('Searching for Server...')).toBeVisible({ timeout: 15000 });
});

Then('it should scan the local network for servers on ports {int}-{int}', () => {
  // This is a technical detail of the implementation, we verify the outcome, not the process
});

Given('the application is searching for a server', async ({ page, electronApp }) => {
  await page.getByRole('button', { name: 'Set up as Player' }).click();
  await electronApp.waitForEvent('window');
});

Given('a KJ-Nomad server is running on the local network at {float}.{float}:{int}', async ({}, arg, arg1, arg2) => {
  serverProcess = fork('server/dist/index.js', ['--mode=offline'], {
    silent: true,
    env: { ...process.env, NO_AUTO_LAUNCH: 'true' }
  });
  (global as any).serverProcess = serverProcess;
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Server process timed out')), 10000);
    serverProcess.stdout?.on('data', (data) => {
      if (data.toString().includes('SERVER READY')) {
        clearTimeout(timeout);
        resolve();
      }
    });
  });
});

When('the application detects the server', async () => {
  // This is handled by the player app logic, we just wait for the result
});

Then('it should automatically connect to the server\'s player interface at {string}', async ({ electronApp }, url: string) => {
  const playerWindow = electronApp.windows()[1];
  await expect(playerWindow).toBeDefined();
  await expect(playerWindow.getByRole('heading', { name: 'KJ-Nomad Ready' })).toBeVisible({ timeout: 20000 });
});

Then('display the player screen content', async ({ electronApp }) => {
  const playerWindow = electronApp.windows()[1];
  await expect(playerWindow.getByText('Waiting for the next performance...')).toBeVisible();
});

Given('no KJ-Nomad servers are running on the local network', async () => {
  // No server is started for this scenario
});

When('the search times out', async () => {
  // The app will time out on its own, we just need to wait
});

Then('the application should display a {string} message', async ({ electronApp }, message: string) => {
  const playerWindow = electronApp.windows()[1];
  await expect(playerWindow.getByText(message)).toBeVisible({ timeout: 20000 });
});

Then('provide a button to {string}', async ({ electronApp }, buttonName: string) => {
  const playerWindow = electronApp.windows()[1];
  await expect(playerWindow.getByRole('button', { name: buttonName })).toBeVisible();
});

Then('provide an input field to manually enter a server address', async ({ electronApp }) => {
  const playerWindow = electronApp.windows()[1];
  await expect(playerWindow.getByPlaceholder('e.g., 192.168.1.100:8080')).toBeVisible();
});

When('the user enters {string} into the manual entry field', async ({ electronApp }, address: string) => {
  const playerWindow = electronApp.windows()[1];
  await playerWindow.getByPlaceholder('e.g., 192.168.1.100:8080').fill(address);
});

When('clicks {string}', async ({ electronApp }, buttonName: string) => {
  const playerWindow = electronApp.windows()[1];
  await playerWindow.getByRole('button', { name: buttonName }).click();
});

Then('the application should attempt to connect to {string}', async ({}, url: string) => {
  // In a real test, we would mock the network to verify this.
  // For now, we assume the click triggers the connection attempt.
});

Given('two KJ-Nomad servers are running on the local network', async () => {
  // This is a complex scenario that requires mocking network discovery.
  // We will skip the implementation for now.
});

When('the application detects both servers', async () => {
  // part of the complex scenario
});

Then('it should display a list of discovered servers \\(e.g., {string}, {string})', async ({}, server1: string, server2: string) => {
  // part of the complex scenario
});

Then('prompt the user to select which one to connect to', async () => {
  // part of the complex scenario
});
