import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';

const { Given, When, Then } = createBdd();

let playerA: import('@playwright/test').Page | null = null;
let playerB: import('@playwright/test').Page | null = null;

Given('the KJ has a primary display and a secondary display connected', async ({ page }) => {
  await page.goto('/');
  playerA = await page.context().newPage();
  await playerA.goto('/player');
  playerB = await page.context().newPage();
  await playerB.goto('/player');
  await expect(playerA.getByText(/KJ-Nomad Ready/i)).toBeVisible();
  await expect(playerB.getByText(/KJ-Nomad Ready/i)).toBeVisible();
});

Given('a video is playing on the primary display', async ({ page }) => {
  // TODO: implement step
});

When('the KJ drags the video window to the secondary display', async ({ page }) => {
  // TODO: implement step
});

Then('the video should continue to play smoothly without interruption', async ({ page }) => {
  // TODO: implement step
});

Then('the audio should remain synchronized with the video', async ({ page }) => {
  // TODO: implement step
});

Given('the application is in a multi-screen setup', async ({ page }) => {
  // TODO: implement step
});

When('the KJ initiates a "resync" command', async ({ page }) => {
  // TODO: implement step
});

Then('all connected player screens should reset their video playback to match the current time of the master video', async ({ page }) => {
  // TODO: implement step
});

Given('the KJ is running a session', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Queue/i })).toBeVisible();
});

Given('two player screens, {string} and {string}, are connected', async ({ page }) => {
  playerA = await page.context().newPage();
  await playerA.goto('/player');
  playerB = await page.context().newPage();
  await playerB.goto('/player');
  await expect(playerA.getByText(/KJ-Nomad Ready/i)).toBeVisible();
  await expect(playerB.getByText(/KJ-Nomad Ready/i)).toBeVisible();
});

Given('a karaoke video is ready to be played', async ({ page }) => {
  // Use the server demo media that exists under /api/media in tests
  await expect(page.getByRole('button', { name: /Play/i })).toBeVisible();
});

When('the KJ starts the video playback', async ({ page }) => {
  await page.getByRole('button', { name: /Play/i }).click();
});

Then('the video should begin playing simultaneously on both {string} and {string}', async () => {
  if (!playerA || !playerB) throw new Error('players not ready');
  await expect(playerA.locator('video')).toBeVisible();
  await expect(playerB.locator('video')).toBeVisible();
});

Then('at any point during playback, the `currentTime` of the video on {string} should not differ from {string} by more than {int} milliseconds', async ({}, _n1: string, _n2: string, thresholdMs: number) => {
  if (!playerA || !playerB) throw new Error('players not ready');
  const t1 = await playerA.evaluate(() => (document.querySelector('video') as HTMLVideoElement | null)?.currentTime ?? 0);
  const t2 = await playerB.evaluate(() => (document.querySelector('video') as HTMLVideoElement | null)?.currentTime ?? 0);
  expect(Math.abs((t1 - t2) * 1000)).toBeLessThanOrEqual(thresholdMs);
});

Given('a karaoke video is currently playing on both screens', async ({ page }) => {
  // TODO: implement step
});

When('the KJ seeks the video to the {int} minute and {int} second mark', async ({ page }, arg: number, arg1: number) => {
  // TODO: implement step
});

Then('both {string} and {string} should jump to the new timestamp', async ({ page }, arg: string, arg1: string) => {
  // TODO: implement step
});

Then('resume playing in sync, with a time difference of less than {int} milliseconds', async ({ page }, arg: number) => {
  // TODO: implement step
});

When('the KJ pauses the video', async ({ page }) => {
  // TODO: implement step
});

Then('both {string} and {string} should pause at the exact same frame', async () => {
  if (!playerA || !playerB) throw new Error('players not ready');
  const paused1 = await playerA.evaluate(() => (document.querySelector('video') as HTMLVideoElement | null)?.paused ?? false);
  const paused2 = await playerB.evaluate(() => (document.querySelector('video') as HTMLVideoElement | null)?.paused ?? false);
  expect(paused1).toBe(true);
  expect(paused2).toBe(true);
});

Then('when the KJ resumes the video', async ({ page }) => {
  // TODO: implement step
});

Then('both players should resume playback simultaneously', async ({ page }) => {
  // TODO: implement step
});
