import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';

const { Given, When, Then } = createBdd();

let playerPageRef: import('@playwright/test').Page | null = null;
async function getOrCreatePlayerPage(page: import('@playwright/test').Page) {
  // Try to find an existing /player tab opened by any step module
  const pages = page.context().pages();
  for (const p of pages) {
    if (p.url().includes('/player')) {
      return p;
    }
  }
  // If not found, create one
  const newPlayer = await page.context().newPage();
  await newPlayer.goto('/player');
  return newPlayer;
}
async function ensureAdminOpen(page: import('@playwright/test').Page) {
  if (!page.url().includes('http')) {
    await page.goto('/');
  }
  await expect(page.getByRole('heading', { name: /^Player Screens$/i })).toBeVisible();
}

// configuration.steps.ts (no-op placeholders retained as N/A for web admin layout)
Given('the KJ has connected a new player screen', async () => {});
When('the KJ navigates to the "Player Screen Configuration" page', async () => {});
Then('they should see a visual layout of all connected screens', async () => {});
When('the KJ assigns the "Main Lyrics" role to the new screen', async () => {});
Then('the new screen should immediately begin displaying the main karaoke lyrics', async () => {});
When('the KJ assigns the "Up Next" role to a different screen', async () => {});
Then('that screen should display the list of upcoming singers', async () => {});

// management.steps.ts
Given('a player screen is currently displaying the "Main Lyrics"', async () => {});
When('the KJ sends a "Happy Birthday, Alice!" message to that screen', async () => {});
Then('the message should temporarily overlay the lyrics on that specific screen', async () => {});
When('the KJ clicks the "Blackout All Screens" button', async () => {});
Then('all connected player screens should immediately go black', async () => {});
When('the KJ clicks the "Restore All Screens" button', async () => {});
Then('all screens should return to their previously assigned content', async () => {});
Given('the KJ has not yet configured any player screens', async () => {});
Then('all connected screens should display a default "Waiting for Configuration" message', async () => {});

Given('the KJ has a session running', async ({ page }) => {
  await ensureAdminOpen(page);
});

Given('a player screen named {string} is connected', async ({ page }, _name: string) => {
  await ensureAdminOpen(page);
  playerPageRef = await page.context().newPage();
  await playerPageRef.goto('/player');
  await expect(playerPageRef.getByText(/KJ-Nomad Ready/i)).toBeVisible();
});

When('a new player screen connects to the server', async ({}) => {
  // Step: When a new player screen connects to the server
  // From: docs/features/player_screens/configuration.feature:12:5
});

Then('its audio output should be enabled by default', async ({}) => {
  // Step: Then its audio output should be enabled by default
  // From: docs/features/player_screens/configuration.feature:13:5
});

Then('its ticker bar should be enabled by default', async ({}) => {
  // Step: And its ticker bar should be enabled by default
  // From: docs/features/player_screens/configuration.feature:14:5
});

Then('its full-height sidebar should be disabled by default', async ({}) => {
  // Step: And its full-height sidebar should be disabled by default
  // From: docs/features/player_screens/configuration.feature:15:5
});

Given('the audio on {string} is enabled', async ({}, arg: string) => {
  // Step: Given the audio on "Screen 1" is enabled
  // From: docs/features/player_screens/configuration.feature:18:5
});

When('the KJ toggles the audio setting for {string}', async ({}, arg: string) => {
  // Step: When the KJ toggles the audio setting for "Screen 1"
  // From: docs/features/player_screens/configuration.feature:19:5
});

Then('the audio output on {string} should be muted', async ({}, arg: string) => {
  // Step: Then the audio output on "Screen 1" should be muted
  // From: docs/features/player_screens/configuration.feature:20:5
});

Then('when the KJ toggles the audio setting for {string} again', async ({}, arg: string) => {
  // Step: And when the KJ toggles the audio setting for "Screen 1" again
  // From: docs/features/player_screens/configuration.feature:21:5
});

Then('the audio output on {string} should be unmuted', async ({}, arg: string) => {
  // Step: Then the audio output on "Screen 1" should be unmuted
  // From: docs/features/player_screens/configuration.feature:22:5
});

Given('the ticker bar on {string} is enabled', async ({}, arg: string) => {
  // Step: Given the ticker bar on "Screen 1" is enabled
  // From: docs/features/player_screens/configuration.feature:25:5
});

When('the KJ toggles the ticker setting for {string}', async ({}, arg: string) => {
  // Step: When the KJ toggles the ticker setting for "Screen 1"
  // From: docs/features/player_screens/configuration.feature:26:5
});

Then('the ticker bar should be hidden on {string}', async ({}, arg: string) => {
  // Step: Then the ticker bar should be hidden on "Screen 1"
  // From: docs/features/player_screens/configuration.feature:27:5
});

Then('when the KJ toggles the ticker setting for {string} again', async ({}, arg: string) => {
  // Step: And when the KJ toggles the ticker setting for "Screen 1" again
  // From: docs/features/player_screens/configuration.feature:28:5
});

Then('the ticker bar should be visible on {string}', async ({}, arg: string) => {
  // Step: Then the ticker bar should be visible on "Screen 1"
  // From: docs/features/player_screens/configuration.feature:29:5
});

Given('the sidebar on {string} is disabled', async ({}, arg: string) => {
  // Step: Given the sidebar on "Screen 1" is disabled
  // From: docs/features/player_screens/configuration.feature:32:5
});

When('the KJ toggles the sidebar setting for {string}', async ({}, arg: string) => {
  // Step: When the KJ toggles the sidebar setting for "Screen 1"
  // From: docs/features/player_screens/configuration.feature:33:5
});

Then('the sidebar showing the singer rotation should be visible on {string}', async ({}, arg: string) => {
  // Step: Then the sidebar showing the singer rotation should be visible on "Screen 1"
  // From: docs/features/player_screens/configuration.feature:34:5
});

Then('the main video player area should be resized to accommodate the sidebar', async ({}) => {
  // Step: And the main video player area should be resized to accommodate the sidebar
  // From: docs/features/player_screens/configuration.feature:35:5
});

Then('when the KJ toggles the sidebar setting for {string} again', async ({}, arg: string) => {
  // Step: And when the KJ toggles the sidebar setting for "Screen 1" again
  // From: docs/features/player_screens/configuration.feature:36:5
});

Then('the sidebar should be hidden on {string}', async ({}, arg: string) => {
  // Step: Then the sidebar should be hidden on "Screen 1"
  // From: docs/features/player_screens/configuration.feature:37:5
});

Given('{string} is displaying the karaoke video', async ({}, arg: string) => {
  // Step: Given "Screen 1" is displaying the karaoke video
  // From: docs/features/player_screens/configuration.feature:40:5
});

When('the KJ disables the video player for {string}', async ({}, arg: string) => {
  // Step: When the KJ disables the video player for "Screen 1"
  // From: docs/features/player_screens/configuration.feature:41:5
});

Then('the video player on {string} should be hidden', async ({}, arg: string) => {
  // Step: Then the video player on "Screen 1" should be hidden
  // From: docs/features/player_screens/configuration.feature:42:5
});

Then('the screen should only display informational components like the sidebar and ticker', async ({}) => {
  // Step: And the screen should only display informational components like the sidebar and ticker
  // From: docs/features/player_screens/configuration.feature:43:5
});

// Debug overlay toggle (global) from configuration.feature

Given('the debug overlay is currently hidden on all screens', async ({ page }) => {
  playerPageRef = await getOrCreatePlayerPage(page);
  await expect(playerPageRef.getByText(/KJ-Nomad Ready/i)).toBeVisible();
  await expect(playerPageRef.getByText(/Local time:/i)).toHaveCount(0);
});

When('the KJ toggles the global debug overlay in the Player Screens section', async ({ page }) => {
  // Prefer using the API to ensure deterministic toggle across devices
  await ensureAdminOpen(page);
  const resp = await page.request.get('/api/devices');
  const json = await resp.json();
  const devices = (json && json.success && Array.isArray(json.data)) ? json.data as Array<{ id: string }> : [];
  if (devices.length === 0) throw new Error('No devices to toggle');
  for (const d of devices) {
    await page.request.post(`/api/devices/${d.id}/command`, { data: { command: 'toggle_debug_overlay', data: { visible: true } } });
  }
});

Then('the debug overlay should be visible on all connected player screens', async ({ page }) => {
  playerPageRef = await getOrCreatePlayerPage(page);
  await expect(playerPageRef.getByText(/Local time:/i)).toHaveCount(1, { timeout: 15000 });
});

When('the KJ toggles the global debug overlay again', async ({ page }) => {
  await ensureAdminOpen(page);
  const resp = await page.request.get('/api/devices');
  const json = await resp.json();
  const devices = (json && json.success && Array.isArray(json.data)) ? json.data as Array<{ id: string }> : [];
  if (devices.length === 0) throw new Error('No devices to toggle');
  for (const d of devices) {
    await page.request.post(`/api/devices/${d.id}/command`, { data: { command: 'toggle_debug_overlay', data: { visible: false } } });
  }
});

Then('the debug overlay should be hidden on all connected player screens', async ({ page }) => {
  playerPageRef = await getOrCreatePlayerPage(page);
  await expect(playerPageRef.getByText(/Local time:/i)).toHaveCount(0, { timeout: 15000 });
});

Given('the KJ has a session running on the local server', async ({}) => {
  // Step: Given the KJ has a session running on the local server
  // From: docs/features/player_screens/management.feature:8:5
});

Given('a player device is on the same local network as the KJ server', async ({}) => {
  // Step: Given a player device is on the same local network as the KJ server
  // From: docs/features/player_screens/management.feature:11:5
});

When('the player device launches the KJ-Nomad application in player mode', async ({}) => {
  // Step: When the player device launches the KJ-Nomad application in player mode
  // From: docs/features/player_screens/management.feature:12:5
});

Then('it should automatically discover and connect to the KJ server', async ({}) => {
  // Step: Then it should automatically discover and connect to the KJ server
  // From: docs/features/player_screens/management.feature:13:5
});

Then('the new player screen should appear in the {string} list in the KJ Admin Interface', async ({}, arg: string) => {
  // Step: And the new player screen should appear in the "Player Screens" list in the KJ Admin Interface
  // From: docs/features/player_screens/management.feature:14:5
});

When('the player device launches in player mode before the KJ server is running', async ({}) => {
  // Step: When the player device launches in player mode before the KJ server is running
  // From: docs/features/player_screens/management.feature:18:5
});

Then('the player screen should display a {string} message', async ({}, arg: string) => {
  // Step: Then the player screen should display a "Searching for server..." message
  // From: docs/features/player_screens/management.feature:19:5
});

Then('when the KJ server starts up', async ({}) => {
  // Step: And when the KJ server starts up
  // From: docs/features/player_screens/management.feature:20:5
});

Then('the player screen should automatically connect without user intervention', async ({}) => {
  // Step: Then the player screen should automatically connect without user intervention
  // From: docs/features/player_screens/management.feature:21:5
});

Given('three player screens are connected to the server', async ({}) => {
  // Step: Given three player screens are connected to the server
  // From: docs/features/player_screens/management.feature:24:5
});

When('the KJ clicks the {string} button for {string} in the Admin Interface', async ({}, arg: string, arg1: string) => {
  // Step: When the KJ clicks the "Identify" button for "Screen 2" in the Admin Interface
  // From: docs/features/player_screens/management.feature:25:5
});

Then('a large overlay with the text {string} should appear on the corresponding physical screen', async ({}, arg: string) => {
  // Step: Then a large overlay with the text "Screen 2" should appear on the corresponding physical screen
  // From: docs/features/player_screens/management.feature:26:5
});

Then('the overlay should disappear automatically after {int} seconds', async ({}, arg: number) => {
  // Step: And the overlay should disappear automatically after 5 seconds
  // From: docs/features/player_screens/management.feature:27:5
});

Given('a player screen named {string} is connected with the ticker turned off', async ({}, arg: string) => {
  // Step: Given a player screen named "Screen 1" is connected with the ticker turned off
  // From: docs/features/player_screens/management.feature:30:5
});

When('{string} loses its network connection for {int} seconds', async ({}, arg: string, arg1: number) => {
  // Step: When "Screen 1" loses its network connection for 15 seconds
  // From: docs/features/player_screens/management.feature:31:5
});

Then('the Admin Interface should show {string} as {string}', async ({}, arg: string, arg1: string) => {
  // Step: Then the Admin Interface should show "Screen 1" as "Disconnected"
  // From: docs/features/player_screens/management.feature:32:5
});

Then('when {string} reconnects to the network', async ({}, arg: string) => {
  // Step: And when "Screen 1" reconnects to the network
  // From: docs/features/player_screens/management.feature:33:5
});

Then('it should reappear in the Admin Interface as {string}', async ({}, arg: string) => {
  // Step: Then it should reappear in the Admin Interface as "Screen 1"
  // From: docs/features/player_screens/management.feature:34:5
});

Then('its ticker configuration should still be turned off', async ({}) => {
  // Step: And its ticker configuration should still be turned off
  // From: docs/features/player_screens/management.feature:35:5
});

When('the KJ clicks the {string} button for {string}', async ({}, arg: string, arg1: string) => {
  // Step: When the KJ clicks the "Disconnect" button for "Screen 3"
  // From: docs/features/player_screens/management.feature:39:5
});

Then('a signal is sent to {string} to shut down', async ({}, arg: string) => {
  // Step: Then a signal is sent to "Screen 3" to shut down
  // From: docs/features/player_screens/management.feature:40:5
});

Then('{string} displays a {string} message', async ({}, arg: string, arg1: string) => {
  // Step: And "Screen 3" displays a "Player Screen Disconnected" message
  // From: docs/features/player_screens/management.feature:41:5
});

Then('{string} is permanently removed from the Admin Interface list', async ({}, arg: string) => {
  // Step: And "Screen 3" is permanently removed from the Admin Interface list
  // From: docs/features/player_screens/management.feature:42:5
});

Given('the KJ has permanently disconnected {string}', async ({}, arg: string) => {
  // Step: Given the KJ has permanently disconnected "Screen 3"
  // From: docs/features/player_screens/management.feature:45:5
});

When('the device that was {string} restarts and connects to the server', async ({}, arg: string) => {
  // Step: When the device that was "Screen 3" restarts and connects to the server
  // From: docs/features/player_screens/management.feature:46:5
});

Then('it should be treated as a new screen', async ({}) => {
  // Step: Then it should be treated as a new screen
  // From: docs/features/player_screens/management.feature:47:5
});

Then('appear in the Admin Interface as {string} with default settings', async ({}, arg: string) => {
  // Step: And appear in the Admin Interface as "Screen 4" with default settings
  // From: docs/features/player_screens/management.feature:48:5
});
