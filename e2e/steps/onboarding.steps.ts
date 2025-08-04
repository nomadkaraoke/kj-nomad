import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';

const { Given, When, Then } = createBdd();

Given('the KJ has downloaded and installed the KJ-Nomad desktop application', async () => {
  // This step is a prerequisite and may not require automation
});

Given('the KJ launches the application for the first time', async ({ page }) => {
  await page.goto('/');
});

Then('they should see the "Welcome to KJ-Nomad" screen with three choices: "Start Offline Session", "Connect to Online Session", and "Set up as Player"', async ({ page }) => {
  await expect(page.getByText('Welcome to KJ-Nomad')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start Offline Session' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Connect to Online Session' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Set up as Player' })).toBeVisible();
});

When('the KJ clicks "Start Offline Session"', async ({ page }) => {
  await page.getByRole('button', { name: 'Start Offline Session' }).click();
});

Then('they should be taken to the multi-step Setup Wizard to configure their media library', async ({ page }) => {
  // Placeholder for setup wizard verification
  await expect(page.getByText('Setup Wizard')).toBeVisible();
});

When('the KJ clicks "Connect to Online Session"', async ({ page }) => {
  await page.getByRole('button', { name: 'Connect to Online Session' }).click();
});

Then('they should be prompted to enter their private Admin Key', async ({ page }) => {
  // Placeholder for admin key prompt verification
  await expect(page.getByLabel('Admin Key')).toBeVisible();
});

When('the KJ clicks "Set up as Player"', async ({ page }) => {
  await page.getByRole('button', { name: 'Set up as Player' }).click();
});

Then('the application should enter Player Mode', async ({ page }) => {
  // Placeholder for player mode verification
  await expect(page.getByText('Player Mode')).toBeVisible();
});

Then('begin searching for a KJ server on the local network', async ({ page }) => {
  // Placeholder for network search verification
  await expect(page.getByText('Searching for KJ server...')).toBeVisible();
});
