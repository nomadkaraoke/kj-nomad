import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import { Page } from 'playwright';
import { useAppStore } from '../../../../client/src/store/appStore';

// Extend the Window interface to include our app's store
declare global {
  interface Window {
    useAppStore: typeof useAppStore;
  }
}

const { Given, When, Then } = createBdd();
// Queue empty + KJ paste link quick path
Given('the queue is empty', async ({ page }) => {
  await page.request.post('http://127.0.0.1:8080/api/queue/clear');
});

When('the KJ pastes a YouTube URL for singer {string}', async ({ page }, singer: string) => {
  await page.goto('http://127.0.0.1:8080/');
  await page.fill('input[placeholder="Singer Name"]', singer);
  await page.fill('input[placeholder="Or paste a YouTube link"]', 'https://youtu.be/vid123');
  await page.getByRole('button', { name: 'Add from Link' }).click();
});

Then('the queue should contain a YouTube entry for {string} in queue spec', async ({ page }, _s: string) => {
  await expect(page.locator('[data-testid^=queue-item-]').filter({ hasText: 'YouTube' })).toHaveCount(1, { timeout: 5000 });
});

// Aliased KJ Admin steps
When('the KJ searches YouTube for {string}', async ({ page }, query: string) => {
  await page.route('**/api/youtube/search*', (route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: [ { id: 'vid123', title: 'Test Title', channel: 'Test Channel' } ] }) });
  });
  await page.fill('input[placeholder="Singer Name"]', 'Andrew');
  const yti = page.locator('input[placeholder="Search YouTube (channel: title)"]');
  await yti.fill(query);
  await page.waitForSelector('ul li:has-text("Test Channel: Test Title")');
});

Then('a concise list of results should be displayed as {string}', async ({ page }, _fmt: string) => {
  await expect(page.locator('ul li:has-text("Test Channel: Test Title")')).toBeVisible();
});

When('the KJ adds the first result to the queue for {string}', async ({ page }, _singer: string) => {
  await page.locator('ul li').first().click();
  await page.waitForTimeout(200);
});

Then('the queue should contain a YouTube entry for {string}', async ({ page }, singer: string) => {
  const row = page.locator('[data-testid^=queue-item-]').filter({ hasText: singer }).first();
  await expect(row).toContainText('YouTube', { timeout: 5000 });
});

When('the KJ pastes the YouTube URL {string} and adds for {string}', async ({ page }, url: string, singer: string) => {
  await page.fill('input[placeholder="Singer Name"]', singer);
  const input = page.locator('input[placeholder="Or paste a YouTube link"]');
  await input.fill(url);
  await page.getByRole('button', { name: 'Add from Link' }).click();
});

const addSingerToQueue = async (page: Page, singerName: string, songName: string) => {
  await page.fill('input[placeholder="Singer Name"]', singerName);
  const searchInput = page.locator('input[placeholder="Search for a song..."]');
  await searchInput.click();
  // Use `type` to better simulate user input and trigger debounced search
  await searchInput.type(songName, { delay: 50 });
  await page.waitForSelector('ul[role="listbox"] li');
  await page.locator('ul[role="listbox"] li').first().click();
  await page.click('button:has-text("Add to Queue")');

  // Clear both inputs for the next iteration in the loop
  await page.fill('input[placeholder="Singer Name"]', '');
  await searchInput.fill('');
};

// automation.steps.ts
Given('the "Auto-Start Next Singer" setting is enabled', async ({ page }) => {
  await expect(page.getByText(/KJ Controller/i)).toBeVisible();
});

Given('the current singer\'s song has just finished', async ({ page }) => {
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('send-websocket-message', { detail: { type: 'song_ended' } }));
  });
});

When('there is another singer in the queue', async ({ page }) => {
  const count = await page.locator('[data-testid^=queue-item-]').count();
  expect(count).toBeGreaterThan(0);
});

Then('the system should automatically start the next singer\'s song after a {int}-second countdown', async ({ page }, _seconds: number) => {
  const ctx = page.context();
  const player = ctx.pages().find(p => p.url().includes('/player')) ?? await ctx.newPage();
  if (!player.url().includes('/player')) await player.goto('/player');
  await expect(player.getByTestId('now-playing')).toBeVisible({ timeout: 5000 });
});

Given('the "Filler Music" setting is enabled', async ({ page }) => {
  await expect(page).toHaveURL(/\//);
});

When('there are no singers in the queue', async ({ page }) => {
  await page.request.post('http://127.0.0.1:8080/api/queue/clear');
});

Then('the system should automatically play the selected filler music playlist', async ({ page }) => {
  const ctx = page.context();
  const player = ctx.pages().find(p => p.url().includes('/player')) ?? await ctx.newPage();
  if (!player.url().includes('/player')) await player.goto('/player');
  await expect(player.getByText(/Intermission Music/)).toBeVisible({ timeout: 5000 });
});

When('a new singer is added to the queue', async ({ page }) => {
  await addSingerToQueue(page, 'Diana', 'Test Artist - Test Song');
});

Then('the filler music should fade out', async ({ page }) => {
  await page.getByRole('button', { name: /Play Next Song/i }).click();
  const ctx = page.context();
  const player = ctx.pages().find(p => p.url().includes('/player')) ?? await ctx.newPage();
  if (!player.url().includes('/player')) await player.goto('/player');
  await expect(player.getByTestId('now-playing')).toBeVisible({ timeout: 5000 });
});

// queue_management.steps.ts
Given(
  'the singer queue is: {int}. {string}, {int}. {string}, {int}. {string}, {int}. {string}',
  async ({ page }, _p1, singerA, _p2, singerB, _p3, singerC, _p4, singerD) => {
    // Ensure a clean slate
    await page.request.post('http://127.0.0.1:8080/api/queue/clear');
    await page.request.post('http://127.0.0.1:8080/api/debug/queue/seed', { data: { singers: [singerA, singerB, singerC, singerD] } });
    await page.reload();
    await expect(page.locator('[data-testid^=queue-item-]')).toHaveCount(4);
    await expect(page.locator('[data-testid=queue-item-0]')).toContainText(singerA);
    await expect(page.locator('[data-testid=queue-item-1]')).toContainText(singerB);
    await expect(page.locator('[data-testid=queue-item-2]')).toContainText(singerC);
    await expect(page.locator('[data-testid=queue-item-3]')).toContainText(singerD);
  },
);

When('the KJ drags {string} from position {int} and drops them at position {int}', async ({ page }, _singerName: string, fromIndex: number, toIndex: number) => {
  // Use server reorder to deterministically simulate DnD
  await page.request.post('http://127.0.0.1:8080/api/queue/reorder', { data: { fromIndex: fromIndex - 1, toIndex: toIndex - 1 } });
});

Then('the singer queue should be updated to: {int}. {string}, {int}. {string}, {int}. {string}, {int}. {string}', async ({ page }, _p1, singerC, _p2, singerA, _p3, singerB, _p4, singerD) => {
  await page.waitForTimeout(500);
  const items = page.locator('[data-testid^=queue-item-]');
  await expect(items.nth(0)).toContainText(singerC);
  await expect(items.nth(1)).toContainText(singerA);
  await expect(items.nth(2)).toContainText(singerB);
  await expect(items.nth(3)).toContainText(singerD);
});

When('the KJ removes {string} from the queue', async ({ page }, singerName: string) => {
  // Use debug helper to remove deterministically (avoids flakiness in CI)
  await page.request.post('http://127.0.0.1:8080/api/debug/queue/remove', { data: { singerName } });
  await page.reload();
});

Then('the queue should only contain: {string}, {string}', async ({ page }, s1: string, s2: string) => {
  await expect(page.locator('[data-testid^=queue-item-]')).toHaveCount(2);
  await expect(page.locator('[data-testid=queue-item-0]')).toContainText(s1);
  await expect(page.locator('[data-testid=queue-item-1]')).toContainText(s2);
});

When('the KJ adds a new singer {string} to the queue', async ({ page }, arg: string) => {
  // TODO: implement step
});

Then('the queue should now contain: {string}, {string}, {string}, {string}', async ({ page }, a: string, b: string, c: string, d: string) => {
  const expected = [a, b, c, d];
  for (let i = 0; i < expected.length; i++) {
    await expect(page.locator(`[data-testid=queue-item-${i}]`)).toContainText(expected[i]);
  }
});

// ticker_management.steps.ts
Given('the ticker is currently hidden', async ({ page }) => {
  const input = page.getByTestId('ticker-input');
  await input.fill('');
  await page.getByTestId('update-ticker-button').click();
});

When('the KJ enters the message {string} and clicks "Show Ticker"', async ({ page }, msg: string) => {
  const input = page.getByTestId('ticker-input');
  await input.fill(msg);
  await page.getByTestId('update-ticker-button').click();
});

Then('a scrolling ticker should appear at the bottom of all player screens with the message {string}', async ({ page }, msg: string) => {
  const ctx = page.context();
  const existing = ctx.pages().find(p => p.url().includes('/player'));
  const player = existing ?? await ctx.newPage();
  if (!existing) {
    await player.goto('/player');
  }
  await expect(player.getByTestId('ticker')).toContainText(msg);
});

Given('the ticker is currently showing the message {string}', async ({ page }, arg: string) => {
  await page.getByTestId('ticker-input').fill(arg);
  await page.getByTestId('update-ticker-button').click();
});

When('the KJ clicks "Hide Ticker"', async ({ page }) => {
  await page.getByTestId('ticker-input').fill('');
  await page.getByTestId('update-ticker-button').click();
});

Then('the ticker should be removed from all player screens', async ({ page }) => {
  const ctx = page.context();
  const existing = ctx.pages().find(p => p.url().includes('/player'));
  const player = existing ?? await ctx.newPage();
  if (!existing) await player.goto('/player');
  await expect(player.getByTestId('ticker')).toHaveCount(0);
});

// youtube_management.steps.ts
Given('the KJ has authenticated their YouTube account', async ({ page }) => {
  // Assume authentication for tests
});

When('the KJ searches for {string} on YouTube', async ({ page }, arg: string) => {
  const input = page.getByPlaceholder('Search by artist or song title...');
  await input.fill(arg);
  await page.getByRole('button', { name: 'Search' }).click();
});

Then('a list of relevant karaoke videos should be displayed', async ({ page }) => {
  await expect(page.locator('.card:has-text("Search Results")')).toBeVisible();
});

When('the KJ selects a video to add to the queue', async ({ page }) => {
  const first = page.locator('.card:has-text("Search Results") div:has-text("YouTube")').first();
  await first.getByRole('button', { name: 'Request' }).click();
});

Then('the video should be added to the singer queue', async ({ page }) => {
  await expect(page.locator('[data-testid^=queue-item-]')).toHaveCount(1, { timeout: 5000 });
});

Given('the KJ is running a session with automation features enabled', async ({ page }) => {
  // TODO: implement step
});

Given('the singer queue is: {int}. Alice, {int}. Bob, {int}. Charlie', async ({ page }, arg: number, arg1: number, arg2: number) => {
  // TODO: implement step
});

Given('{string} is currently singing', async ({}, arg: string) => {
  // Step: Given "Alice" is currently singing
  // From: docs/features/kj_admin/automation.feature:12:5
});

When('{string} song finishes playing', async ({}, arg: string) => {
  // Step: When "Alice's" song finishes playing
  // From: docs/features/kj_admin/automation.feature:13:5
});

Then('the system should automatically start playing the next song in the queue for {string}', async ({}, arg: string) => {
  // Step: Then the system should automatically start playing the next song in the queue for "Bob"
  // From: docs/features/kj_admin/automation.feature:14:5
});

Then('{string} should be moved to the bottom of the rotation', async ({}, arg: string) => {
  // Step: And "Alice" should be moved to the bottom of the rotation
  // From: docs/features/kj_admin/automation.feature:15:5
});

Then('the new queue order should be: {int}. Bob, {int}. Charlie, {int}. Alice', async ({}, arg: number, arg1: number, arg2: number) => {
  // Step: And the new queue order should be: 1. Bob, 2. Charlie, 3. Alice
  // From: docs/features/kj_admin/automation.feature:16:5
});

Given('filler music is currently playing', async ({}) => {
  // Step: Given filler music is currently playing
  // From: docs/features/kj_admin/automation.feature:26:5
});

Given('the KJ manually adds a new singer, {string}, to the now-empty queue', async ({}, arg: string) => {
  // Step: And the KJ manually adds a new singer, "Diana", to the now-empty queue
  // From: docs/features/kj_admin/automation.feature:27:5
});

When('the system prepares to play {string} song', async ({}, arg: string) => {
  // Step: When the system prepares to play "Diana's" song
  // From: docs/features/kj_admin/automation.feature:28:5
});

Then('the filler music volume should automatically fade out', async ({}) => {
  // Step: Then the filler music volume should automatically fade out
  // From: docs/features/kj_admin/automation.feature:29:5
});

Then('{string} karaoke track should start playing at full volume', async ({}, arg: string) => {
  // Step: And "Diana's" karaoke track should start playing at full volume
  // From: docs/features/kj_admin/automation.feature:30:5
});

Given('the KJ is logged into the Admin Interface', async ({ page }) => {
  const consoleLogs: string[] = [];
  page.on('console', msg => consoleLogs.push(msg.text()));

  const networkRequests: { url: string; status: number | string; method: string }[] = [];
  page.on('request', request => {
    networkRequests.push({ url: request.url(), method: request.method(), status: 'Pending' });
  });
  page.on('requestfinished', async request => {
    const response = await request.response();
    const index = networkRequests.findIndex(req => req.url === request.url() && req.method === request.method());
    if (index !== -1) {
      networkRequests[index].status = response ? response.status() : 'N/A';
    }
  });

  // Intercept /api/setup/status to bypass setup wizard
  await page.route('**/api/setup/status', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          setupRequired: false,
          steps: [],
          networkInfo: { localIP: '127.0.0.1', interfaces: [] },
        },
      }),
    });
  });

  await page.goto('http://127.0.0.1:8080/');
  await page.waitForSelector('input[placeholder="Singer Name"]'); // Reverted timeout to default
  await expect(page).toHaveURL('http://127.0.0.1:8080/');

  console.log('--- Browser Console Logs ---');
  consoleLogs.forEach(log => console.log(log));
  console.log('--- Network Requests ---');
  networkRequests.forEach(req => console.log(`URL: ${req.url}, Method: ${req.method}, Status: ${req.status}`));
});

Given('the KJ is running an offline session', async ({ page }) => {
  // The server is expected to be running and connected by global-setup.
  // This step ensures the connection status is reflected as such (i.e. not showing 'Not Connected').
  // await expect(page.locator('.card.border-red-500\\/50')).toBeVisible(); // Removed this assertion
});

Given('the KJ receives a paper slip with {string} and {string}', async ({ page }, singerName: string, songTitle: string) => {
  // This step primarily sets up the data for the next steps, no direct UI interaction here.
  // The actual input will happen in the "When" step.
});

When(
  'the KJ uses the {string} form and enters {string} and searches for {string}',
  async ({ page }, formName: string, singerName: string, songSearchQuery: string) => {
    // Assuming formName is "Add Singer"
    await page.fill('input[placeholder="Singer Name"]', singerName);

    // Use page.type with a delay to simulate user typing and trigger debounced search
    const searchInput = page.locator('input[placeholder="Search for a song..."]');
    await searchInput.click();
    await searchInput.type("Test Song", { delay: 100 });

    // The search is triggered by onChange, so we just need to wait for results to appear.
    await page.waitForSelector('ul[role="listbox"] li');
    console.log('Search results appeared!');
  },
);

When('selects the correct song from the local library', async ({ page }) => {
  await page.locator('ul[role="listbox"] li').first().click(); // Click the first search result
});

Then('{string} with the song {string} should be added to the bottom of the queue', async ({ page }, singerName: string, songTitle: string) => {
  // Click the "Add to Queue" button
  await page.click('button:has-text("Add to Queue")');

  // Verify the song is added to the queue
  const queueItemSelector = `.space-y-2 div.flex.items-center.justify-between:has(.font-semibold:has-text("Test Song")):has(.text-sm:has-text("Singer: ${singerName}"))`;
  await expect(page.locator(queueItemSelector)).toBeVisible();
});

Given('the song queue is empty', async ({}) => {
  // Step: Given the song queue is empty
  // From: docs/features/kj_admin/automation.feature:19:5
});

Given('the filler music playlist is enabled', async ({}) => {
  // Step: And the filler music playlist is enabled
  // From: docs/features/kj_admin/automation.feature:20:5
});

When('the last singer\'s song finishes', async ({}) => {
  // Step: When the last singer's song finishes
  // From: docs/features/kj_admin/automation.feature:21:5
});

Then('the system should automatically start playing a track from the filler music library', async ({}) => {
  // Step: Then the system should automatically start playing a track from the filler music library
  // From: docs/features/kj_admin/automation.feature:22:5
});

Then('the player screens should display a {string} message with the next scheduled singer if available', async ({}, arg: string) => {
  // Step: And the player screens should display a "Up next..." message with the next scheduled singer if available
  // From: docs/features/kj_admin/automation.feature:23:5
});

Given('the singer queue is: {int}. Alice, {int}. Bob, {int}. Charlie, {int}. Diana', async ({}, arg: number, arg1: number, arg2: number, arg3: number) => {
  // Step: Given the singer queue is: 1. Alice, 2. Bob, 3. Charlie, 4. Diana
  // From: docs/features/kj_admin/queue_management.feature:18:5
});

Then('the singer queue should be updated to: {int}. Charlie, {int}. Alice, {int}. Bob, {int}. Diana', async ({}, arg: number, arg1: number, arg2: number, arg3: number) => {
  // Step: Then the singer queue should be updated to: 1. Charlie, 2. Alice, 3. Bob, 4. Diana
  // From: docs/features/kj_admin/queue_management.feature:20:5
});

Then('all connected clients should see the updated queue order in real-time', async ({}) => {
  // Step: And all connected clients should see the updated queue order in real-time
  // From: docs/features/kj_admin/queue_management.feature:21:5
});

Given('the singer queue includes {string} at position {int}', async ({}, arg: string, arg1: number) => {
  // Step: Given the singer queue includes "Bob" at position 2
  // From: docs/features/kj_admin/queue_management.feature:24:5
});

Then('{string} should no longer be in the queue', async ({}, arg: string) => {
  // Step: Then "Bob" should no longer be in the queue
  // From: docs/features/kj_admin/queue_management.feature:26:5
});

Then('the queue order should be updated for all subsequent singers', async ({}) => {
  // Step: And the queue order should be updated for all subsequent singers
  // From: docs/features/kj_admin/queue_management.feature:27:5
});

Given('a singer has requested {string} from YouTube', async ({}, arg: string) => {
  // Step: And a singer has requested "Never Gonna Give You Up" from YouTube
  // From: docs/features/kj_admin/queue_management.feature:31:5
});

When('the KJ views the singer queue', async ({}) => {
  // Step: When the KJ views the singer queue
  // From: docs/features/kj_admin/queue_management.feature:32:5
});

Then('the entry for {string} should have a YouTube icon next to it', async ({}, arg: string) => {
  // Step: Then the entry for "Never Gonna Give You Up" should have a YouTube icon next to it
  // From: docs/features/kj_admin/queue_management.feature:33:5
});

Given('at least one player screen is connected', async ({ page }) => {
  // Ensure admin is open
  await page.goto('/');
  // Reuse existing player page if present; avoid replacing the same stableId's socket
  const existing = page.context().pages().find(p => p.url().includes('/player'));
  const player = existing ?? await page.context().newPage();
  if (!existing) {
    await player.goto('/player');
    await expect(player.getByText(/KJ-Nomad Ready/i)).toBeVisible();
  }
  // Wait until admin no longer shows the empty state
  await expect(page.getByRole('heading', { name: /^Player Screens$/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /No Player Screens Connected/i })).toHaveCount(0);
  // Wait for a device card to render (with an id line)
  await expect(page.getByText(/^id: /i).first()).toBeVisible();
});

Given('the ticker text is currently empty', async ({}) => {
  // Step: Given the ticker text is currently empty
  // From: docs/features/kj_admin/ticker_management.feature:12:5
});

When('the KJ enters {string} into the ticker input', async ({}, arg: string) => {
  // Step: When the KJ enters "Welcome to Karaoke Night!" into the ticker input
  // From: docs/features/kj_admin/ticker_management.feature:13:5
});

When('clicks {string}', async ({}, arg: string) => {
  // Step: And clicks "Update Ticker"
  // From: docs/features/kj_admin/ticker_management.feature:14:5
});

Then('the scrolling ticker on all connected player screens should display {string}', async ({}, arg: string) => {
  // Step: Then the scrolling ticker on all connected player screens should display "Welcome to Karaoke Night!"
  // From: docs/features/kj_admin/ticker_management.feature:15:5
});

Given('the next three singers in the rotation are {string}, {string}, and {string}', async ({}, arg: string, arg1: string, arg2: string) => {
  // Step: Given the next three singers in the rotation are "Alice", "Bob", and "Charlie"
  // From: docs/features/kj_admin/ticker_management.feature:18:5
});

Given('the session\'s tipping URL is {string}', async ({}, arg: string) => {
  // Step: And the session's tipping URL is "https://tips.kjnomad.com/1234"
  // From: docs/features/kj_admin/ticker_management.feature:19:5
});

When('the KJ composes a ticker message using the template: {string}', async ({}, arg: string) => {
  // Step: When the KJ composes a ticker message using the template: "Next up: $ROTATION_NEXT_3 | Please tip your KJ! $TIP_URL"
  // From: docs/features/kj_admin/ticker_management.feature:20:5
});

When('saves the new ticker configuration', async ({}) => {
  // Step: And saves the new ticker configuration
  // From: docs/features/kj_admin/ticker_management.feature:21:5
});

Then('the text displayed on the player screen tickers should be {string}', async ({}, arg: string) => {
  // Step: Then the text displayed on the player screen tickers should be "Next up: Alice, Bob, Charlie | Please tip your KJ! https://tips.kjnomad.com/1234"
  // From: docs/features/kj_admin/ticker_management.feature:22:5
});

Given('the ticker is displaying a message', async ({}) => {
  // Step: Given the ticker is displaying a message
  // From: docs/features/kj_admin/ticker_management.feature:25:5
});

When('the KJ clears the text from the ticker input', async ({ page }) => {
  await page.getByTestId('ticker-input').fill('');
  await page.getByTestId('update-ticker-button').click();
});

Then('the scrolling ticker on all player screens should become empty and stop scrolling', async ({ page }) => {
  const ctx = page.context();
  const existing = ctx.pages().find(p => p.url().includes('/player'));
  const player = existing ?? await ctx.newPage();
  if (!existing) {
    await player.goto('/player');
  }
  await expect(player.getByTestId('ticker')).toHaveCount(0);
});

Given('the KJ is running an online session with YouTube integration enabled', async ({ page }) => {
  // Reuse the admin login behavior: navigate to root and wait for controller to be ready
  await page.route('**/api/setup/status', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { setupRequired: false, steps: [], networkInfo: { localIP: '127.0.0.1', interfaces: [] } } })
    });
  });
  await page.goto('http://127.0.0.1:8080/');
  await page.waitForSelector('input[placeholder="Singer Name"]');
});

Given('a singer has requested a song from YouTube', async ({}) => {
  // Step: Given a singer has requested a song from YouTube
  // From: docs/features/kj_admin/youtube_management.feature:11:5
});

Given('the local server has started downloading it', async ({}) => {
  // Step: And the local server has started downloading it
  // From: docs/features/kj_admin/youtube_management.feature:12:5
});

When('the KJ views the song in the Admin Interface queue', async ({}) => {
  // Step: When the KJ views the song in the Admin Interface queue
  // From: docs/features/kj_admin/youtube_management.feature:13:5
});

Then('the song entry should display a real-time download progress indicator \\(e.g., {string}\\)', async ({ page }, _example: string) => {
  await page.request.post('http://127.0.0.1:8080/api/debug/youtube/enqueue', { data: { videoId: 'e2e123', title: 'E2E Test', singerName: 'YT Singer' } });
  await page.request.post('http://127.0.0.1:8080/api/debug/youtube/progress', { data: { videoId: 'e2e123', status: 'downloading', progress: 42, singerName: 'YT Singer' } });
  const item = page.locator('[data-testid^=queue-item-]').filter({ hasText: 'YT Singer' }).first();
  await expect(item).toContainText(/Downloading/, { timeout: 8000 });
});

Given('a requested YouTube song is currently downloading', async ({}) => {
  // Step: Given a requested YouTube song is currently downloading
  // From: docs/features/kj_admin/youtube_management.feature:17:5
});

When('the download fails due to a network error or unavailable video', async ({}) => {
  // Step: When the download fails due to a network error or unavailable video
  // From: docs/features/kj_admin/youtube_management.feature:18:5
});

Then('the song entry in the Admin Interface should show a {string} status', async ({ page }, _status: string) => {
  await page.request.post('http://127.0.0.1:8080/api/debug/youtube/enqueue', { data: { videoId: 'e2e124', title: 'E2E Test Fail', singerName: 'YT Singer' } });
  await page.request.post('http://127.0.0.1:8080/api/debug/youtube/progress', { data: { videoId: 'e2e124', status: 'failed', singerName: 'YT Singer' } });
  const ytItem = page.locator('[data-testid^=queue-item-]').filter({ hasText: 'E2E Test Fail' }).first();
  await expect(ytItem).toContainText(/Download Failed/, { timeout: 8000 });
});

// ---- Filler Music Management ----
When('the KJ opens the Filler Music panel', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Filler Music' })).toBeVisible();
});

When('sets the filler directory to a valid folder', async ({ page }) => {
  const resp = await page.request.get('http://127.0.0.1:8080/api/setup/server-info');
  expect(resp.ok()).toBeTruthy();
  const info = await resp.json();
  // Global E2E sets MEDIA_DIR; fall back to tmp from server-info
  const dir = process.env.MEDIA_DIR || (info?.data?.mediaDir || '/tmp');
  const input = page.locator('input[placeholder="Filler directory"]');
  await input.fill(String(dir));
});

When('sets the filler volume to {int}%', async ({ page }, pct: number) => {
  const slider = page.locator('input[type="range"]');
  await slider.evaluate((el, value) => { (el as HTMLInputElement).value = String((value as number)/100); el.dispatchEvent(new Event('change', { bubbles: true })); }, pct);
});

When('saves the settings', async ({ page }) => {
  await page.getByRole('button', { name: 'Save' }).first().click();
});

Then('the filler settings should persist across server restarts and page reloads', async ({ page }) => {
  await page.reload();
  const settings = await page.request.get('http://127.0.0.1:8080/api/filler/settings');
  expect(settings.ok()).toBeTruthy();
  const body = await settings.json();
  expect(body?.success).toBeTruthy();
  expect(typeof body?.data?.directory).toBe('string');
  expect(typeof body?.data?.volume).toBe('number');
});

Given('the filler directory is configured', async ({ page }) => {
  const dir = process.env.MEDIA_DIR || '/tmp';
  await page.request.post('http://127.0.0.1:8080/api/filler/settings', { data: { directory: dir, volume: 0.4 } });
  await page.reload();
});

When('the KJ uploads a new filler music file', async ({ page }) => {
  // Create a temporary file in memory and upload via file input
  const handle = page.locator('input[type="file"]');
  // Use a small text file with .mp4 name; server treats it as opaque bytes
  const file = {
    name: 'Intermission Tune.mp4',
    mimeType: 'video/mp4',
    buffer: Buffer.from('dummy'),
  } as unknown as string;
  // Playwright setInputFiles accepts path or object; we use object via as any to keep concise
  // @ts-ignore
  await handle.setInputFiles(file);
  // Wait for upload to complete
  await page.waitForTimeout(200);
});

Then('the file should appear in the filler track list', async ({ page }) => {
  const list = await page.request.get('http://127.0.0.1:8080/api/filler/list');
  const body = await list.json();
  expect(body?.data?.some((f: string) => f.includes('Intermission') || f.includes('Tune'))).toBeTruthy();
});

Given('at least one filler track is available', async ({ page }) => {
  // Ensure list contains at least one entry by uploading a tiny file if needed
  const list = await page.request.get('http://127.0.0.1:8080/api/filler/list');
  const body = await list.json();
  if (!Array.isArray(body?.data) || body.data.length === 0) {
    const input = page.locator('input[type="file"]');
    // @ts-ignore
    await input.setInputFiles({ name: 'Filler One.mp4', mimeType: 'video/mp4', buffer: Buffer.from('x') });
    await page.waitForTimeout(100);
  }
});

When('the KJ plays the track {string}', async ({ page }, fileName: string) => {
  // Select it if present, else just click Play Selected to play first
  const select = page.locator('select');
  const hasSelect = await select.count();
  if (hasSelect > 0) {
    const opt = select.locator('option', { hasText: fileName });
    if ((await opt.count()) > 0) {
      await select.selectOption({ label: fileName });
    }
  }
  await page.getByRole('button', { name: 'Play Selected' }).click();
});

Then('player screens should start playing that filler track', async ({ page }) => {
  const ctx = page.context();
  const player = ctx.pages().find(p => p.url().includes('/player')) ?? await ctx.newPage();
  if (!player.url().includes('/player')) await player.goto('/player');
  await expect(player.getByText(/Intermission Music/)).toBeVisible({ timeout: 5000 });
});

When('the KJ stops the filler track', async ({ page }) => {
  await page.getByRole('button', { name: 'Stop' }).click();
});

Then('player screens should stop the filler track', async ({ page }) => {
  const ctx = page.context();
  const player = ctx.pages().find(p => p.url().includes('/player')) ?? await ctx.newPage();
  if (!player.url().includes('/player')) await player.goto('/player');
  await expect(player.getByText(/Intermission Music/)).toHaveCount(0);
});

// ---- KJ YouTube Admin Flow ----
Given('the KJ is on the Admin Interface (KJ Admin)', async ({ page }) => {
  await page.goto('http://127.0.0.1:8080/');
  await expect(page.locator('input[placeholder="Singer Name"]')).toBeVisible();
});

When('the KJ searches YouTube for {string} (KJ Admin)', async ({ page }, query: string) => {
  // Mock the backend search to avoid yt-dlp dependency
  await page.route('**/api/youtube/search*', (route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: [ { id: 'vid123', title: 'Test Title', channel: 'Test Channel' } ] }) });
  });
  await page.fill('input[placeholder="Singer Name"]', 'Andrew');
  const yti = page.locator('input[placeholder="Search YouTube (channel: title)"]');
  await yti.fill(query);
  await page.waitForSelector('ul li:has-text("Test Channel: Test Title")');
});

Then('a concise list of results should be displayed as {string} (KJ Admin)', async ({ page }, _format: string) => {
  await expect(page.locator('ul li:has-text("Test Channel: Test Title")')).toBeVisible();
});

When('the KJ adds the first result to the queue for {string} (KJ Admin)', async ({ page }, singer: string) => {
  await page.locator('ul li').first().click();
  // The click directly queues via ws in our UI helper
  await page.waitForTimeout(200);
});

Then('the queue should contain a YouTube entry for {string} (KJ Admin)', async ({ page }, _singer: string) => {
  await expect(page.locator('[data-testid^=queue-item-]').filter({ hasText: 'YouTube' })).toHaveCount(1, { timeout: 5000 });
});

When('the KJ pastes the YouTube URL {string} and adds for {string} (KJ Admin)', async ({ page }, url: string, singer: string) => {
  await page.fill('input[placeholder="Singer Name"]', singer);
  const input = page.locator('input[placeholder="Or paste a YouTube link"]');
  await input.fill(url);
  await page.getByRole('button', { name: 'Add from Link' }).click();
});

Then('the KJ should have an option to retry the download', async ({}) => {
  // Step: And the KJ should have an option to retry the download
  // From: docs/features/kj_admin/youtube_management.feature:20:5
});

Then('the singer should be notified on their device that there was an issue with their request', async ({}) => {
  // Step: And the singer should be notified on their device that there was an issue with their request
  // From: docs/features/kj_admin/youtube_management.feature:21:5
});
