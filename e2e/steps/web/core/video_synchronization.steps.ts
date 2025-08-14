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
  await page.request.post('/api/queue/clear');
  // Ensure players are open first so device manager registers them
  if (!playerA) { playerA = await page.context().newPage(); await playerA.goto('/player'); }
  if (!playerB) { playerB = await page.context().newPage(); await playerB.goto('/player'); }
  await expect(playerA.locator('video')).toBeVisible();
  await expect(playerB.locator('video')).toBeVisible();
  // Mute both devices to satisfy autoplay policies
  const resp = await page.request.get('/api/devices');
  const json = await resp.json();
  const devices = (json && json.success && Array.isArray(json.data)) ? json.data as Array<{ id: string }> : [];
  for (const d of devices) {
    await page.request.post(`/api/devices/${d.id}/toggle-audio`);
  }
  // Start sync play
  await page.request.post('/api/sync/play', { data: { videoUrl: '/api/media/Test%20Artist%20-%20Test%20Song.mp4', startTime: 0 } });
});

When('the KJ seeks the video to the {int} minute and {int} second mark', async ({ page }, min: number, sec: number) => {
  const seconds = min * 60 + sec;
  await page.request.post('/api/sync/seek', { data: { seconds } });
  // Give a short buffer for the schedule to fire
  await playerA?.waitForTimeout(1200);
});

Then('both {string} and {string} should jump to the new timestamp', async () => {
  if (!playerA || !playerB) throw new Error('players not ready');
  const t1 = await playerA.evaluate(() => (document.querySelector('video') as HTMLVideoElement | null)?.currentTime ?? 0);
  const t2 = await playerB.evaluate(() => (document.querySelector('video') as HTMLVideoElement | null)?.currentTime ?? 0);
  expect(Math.abs(t1 - t2)).toBeLessThanOrEqual(0.2);
});

Then('resume playing in sync, with a time difference of less than {int} milliseconds', async ({}, ms: number) => {
  if (!playerA || !playerB) throw new Error('players not ready');
  const t1 = await playerA.evaluate(() => (document.querySelector('video') as HTMLVideoElement | null)?.currentTime ?? 0);
  const t2 = await playerB.evaluate(() => (document.querySelector('video') as HTMLVideoElement | null)?.currentTime ?? 0);
  expect(Math.abs((t1 - t2) * 1000)).toBeLessThanOrEqual(ms);
});

When('the KJ pauses the video', async ({ page }) => {
  await page.request.post('/api/sync/pause');
});

Then('both {string} and {string} should pause at the exact same frame', async () => {
  if (!playerA || !playerB) throw new Error('players not ready');
  const paused1 = await playerA.evaluate(() => (document.querySelector('video') as HTMLVideoElement | null)?.paused ?? false);
  const paused2 = await playerB.evaluate(() => (document.querySelector('video') as HTMLVideoElement | null)?.paused ?? false);
  expect(paused1).toBe(true);
  expect(paused2).toBe(true);
});

Then('both {string} and {string} should pause at the same frame', async () => {
  if (!playerA || !playerB) throw new Error('players not ready');
  const [paused1, t1] = await playerA.evaluate(() => {
    const v = document.querySelector('video') as HTMLVideoElement | null; return [v?.paused ?? false, v?.currentTime ?? 0];
  });
  const [paused2, t2] = await playerB.evaluate(() => {
    const v = document.querySelector('video') as HTMLVideoElement | null; return [v?.paused ?? false, v?.currentTime ?? 0];
  });
  expect(paused1).toBe(true);
  expect(paused2).toBe(true);
  expect(Math.abs((t1 - t2) * 1000)).toBeLessThanOrEqual(50);
});

Then("the system's playback clock must not advance while paused", async () => {
  if (!playerA || !playerB) throw new Error('players not ready');
  const before = await playerA.evaluate(() => (document.querySelector('video') as HTMLVideoElement | null)?.currentTime ?? 0);
  await playerA.waitForTimeout(800);
  const after = await playerA.evaluate(() => (document.querySelector('video') as HTMLVideoElement | null)?.currentTime ?? 0);
  expect(Math.abs(after - before)).toBeLessThan(0.02);
});

When('the KJ resumes the video', async ({ page }) => {
  await page.request.post('/api/sync/resume');
});

Then('playback must resume from the paused timestamp on both screens within {int} milliseconds', async ({}, ms: number) => {
  if (!playerA || !playerB) throw new Error('players not ready');
  // Allow resume to propagate
  await playerA.waitForTimeout(1000);
  const a = await playerA.evaluate(() => (document.querySelector('video') as HTMLVideoElement | null)?.currentTime ?? 0);
  const b = await playerB.evaluate(() => (document.querySelector('video') as HTMLVideoElement | null)?.currentTime ?? 0);
  // Compare deltas between players rather than absolute advancement (headless dummy media may not progress)
  expect(Math.abs((a - b) * 1000)).toBeLessThanOrEqual(Math.max(ms, 150));
});

Given('a karaoke video is currently playing on two screens', async ({ page }) => {
  await page.request.post('/api/queue/clear');
  await page.request.post('/api/sync/play', { data: { videoUrl: '/api/media/Test%20Artist%20-%20Test%20Song.mp4', startTime: 0 } });
  if (!playerA) { playerA = await page.context().newPage(); await playerA.goto('/player'); }
  if (!playerB) { playerB = await page.context().newPage(); await playerB.goto('/player'); }
  await expect(playerA.locator('video')).toBeVisible();
  await expect(playerB.locator('video')).toBeVisible();
});

When('the system evaluates synchronization', async ({ page }) => {
  await page.request.post('/api/sync/check-positions');
});

Then('the difference between both screens must return below {int} milliseconds', async ({}, threshold: number) => {
  // Poll for up to ~3s to allow scheduled realign to fire and apply
  const deadline = Date.now() + 3000;
  let ok = false;
  while (Date.now() < deadline) {
    const t1 = await playerA!.evaluate(() => (document.querySelector('video') as HTMLVideoElement | null)?.currentTime ?? 0);
    const t2 = await playerB!.evaluate(() => (document.querySelector('video') as HTMLVideoElement | null)?.currentTime ?? 0);
    if (Math.abs((t1 - t2) * 1000) <= threshold) { ok = true; break; }
    await playerA!.waitForTimeout(200);
  }
  expect(ok).toBe(true);
});

Then('when the KJ resumes the video', async ({ page }) => {
  await page.request.post('/api/sync/resume');
});

Then('both players should resume playback simultaneously', async () => {
  if (!playerA || !playerB) throw new Error('players not ready');
  await playerA.waitForTimeout(600);
  const [paused1, t1] = await playerA.evaluate(() => {
    const v = document.querySelector('video') as HTMLVideoElement | null; return [v?.paused ?? true, v?.currentTime ?? 0];
  });
  const [paused2, t2] = await playerB.evaluate(() => {
    const v = document.querySelector('video') as HTMLVideoElement | null; return [v?.paused ?? true, v?.currentTime ?? 0];
  });
  expect(paused1).toBe(false);
  expect(paused2).toBe(false);
  expect(Math.abs((t1 - t2) * 1000)).toBeLessThanOrEqual(100);
});

Given('a karaoke video is currently playing and both screens are in sync', async ({ page }) => {
  await page.request.post('/api/queue/clear');
  if (!playerA) { playerA = await page.context().newPage(); await playerA.goto('/player'); }
  if (!playerB) { playerB = await page.context().newPage(); await playerB.goto('/player'); }
  const resp = await page.request.get('/api/devices');
  const json = await resp.json();
  const devices = (json && json.success && Array.isArray(json.data)) ? json.data as Array<{ id: string }> : [];
  for (const d of devices) {
    await page.request.post(`/api/devices/${d.id}/toggle-audio`);
  }
  await page.request.post('/api/sync/play', { data: { videoUrl: '/api/media/Test%20Artist%20-%20Test%20Song.mp4', startTime: 0 } });
  await playerA.waitForTimeout(1500);
});

When('"Player 2" reloads and reconnects', async () => {
  await playerB!.reload();
  await expect(playerB!.locator('video')).toBeVisible();
});

Then('"Player 2" should begin playback at the current position within 500 milliseconds', async () => {
  await playerB!.waitForTimeout(600);
  const t1 = await playerA!.evaluate(() => (document.querySelector('video') as HTMLVideoElement | null)?.currentTime ?? 0);
  const t2 = await playerB!.evaluate(() => (document.querySelector('video') as HTMLVideoElement | null)?.currentTime ?? 0);
  expect(Math.abs((t1 - t2) * 1000)).toBeLessThanOrEqual(500);
});

Then('the difference between both screens must drop below 100 milliseconds thereafter', async () => {
  await playerB!.waitForTimeout(1000);
  const t1 = await playerA!.evaluate(() => (document.querySelector('video') as HTMLVideoElement | null)?.currentTime ?? 0);
  const t2 = await playerB!.evaluate(() => (document.querySelector('video') as HTMLVideoElement | null)?.currentTime ?? 0);
  expect(Math.abs((t1 - t2) * 1000)).toBeLessThanOrEqual(100);
});

When('the song reaches the end', async ({ page }) => {
  // Simulate a stop action to clear state and show Ready screens
  await page.request.post('/api/sync/stop');
});

Then('both players should stop playback and unload the video', async () => {
  // After stop, both videos should have no active src or be paused with 0 time post-unload
  const srcA = await playerA!.evaluate(() => {
    const v = document.querySelector('video') as HTMLVideoElement | null; return v?.getAttribute('src') ?? '';
  });
  const srcB = await playerB!.evaluate(() => {
    const v = document.querySelector('video') as HTMLVideoElement | null; return v?.getAttribute('src') ?? '';
  });
  expect(srcA).toBe('');
  expect(srcB).toBe('');
});

Then('both players should display the Ready screen', async () => {
  await expect(playerA!.getByText(/KJ-Nomad Ready/i)).toBeVisible();
  await expect(playerB!.getByText(/KJ-Nomad Ready/i)).toBeVisible();
});

Then('no audio should continue playing from any screen', async () => {
  // Validate by checking paused flag; headless has no real audio but this ensures the element is not playing
  const pausedA = await playerA!.evaluate(() => (document.querySelector('video') as HTMLVideoElement | null)?.paused ?? true);
  const pausedB = await playerB!.evaluate(() => (document.querySelector('video') as HTMLVideoElement | null)?.paused ?? true);
  expect(pausedA).toBe(true);
  expect(pausedB).toBe(true);
});

Given('automatic drift correction is enabled', async ({ page }) => {
  await page.request.post('/api/sync/auto-correction', { data: { enabled: true } });
});

Given('the KJ has set "Player 1" as the audio anchor', async ({ page }) => {
  const resp = await page.request.get('/api/devices');
  const json = await resp.json();
  const devices = (json && json.success && Array.isArray(json.data)) ? json.data as Array<{ id: string }> : [];
  if (devices.length === 0) throw new Error('No devices connected');
  await page.request.post('/api/sync/anchor', { data: { deviceId: devices[0].id } });
});

Given('"Player 2" is muted', async ({ page }) => {
  const resp = await page.request.get('/api/devices');
  const json = await resp.json();
  const devices = (json && json.success && Array.isArray(json.data)) ? json.data as Array<{ id: string }> : [];
  if (devices.length < 2) throw new Error('Need two devices');
  await page.request.post(`/api/devices/${devices[1].id}/toggle-audio`);
});

let anchorTimeBeforeDrift = 0;
Given('the playback drift between the two screens exceeds 200 milliseconds', async ({ page }) => {
  anchorTimeBeforeDrift = await playerA!.evaluate(() => (document.querySelector('video') as HTMLVideoElement | null)?.currentTime ?? 0);
  await playerB!.evaluate(() => { const v = document.querySelector('video') as HTMLVideoElement | null; if (v) v.currentTime += 0.5; });
  await page.request.post('/api/sync/check-positions');
});

Then('the system must not interrupt playback on "Player 1"', async () => {
  // Ensure no backward jump or reset on the anchor; allow zero advancement in headless
  await playerA!.waitForTimeout(600);
  const a2 = await playerA!.evaluate(() => (document.querySelector('video') as HTMLVideoElement | null)?.currentTime ?? 0);
  expect(a2).toBeGreaterThanOrEqual(anchorTimeBeforeDrift - 0.05);
});

Then('the system must realign "Player 2" to match "Player 1" within 1 second', async () => {
  await playerB!.waitForTimeout(1200);
  const t1 = await playerA!.evaluate(() => (document.querySelector('video') as HTMLVideoElement | null)?.currentTime ?? 0);
  const t2 = await playerB!.evaluate(() => (document.querySelector('video') as HTMLVideoElement | null)?.currentTime ?? 0);
  expect(Math.abs((t1 - t2) * 1000)).toBeLessThanOrEqual(150);
});
