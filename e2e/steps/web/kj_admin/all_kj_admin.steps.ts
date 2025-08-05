import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';

const { Given, When, Then } = createBdd();

// automation.steps.ts
Given('the "Auto-Start Next Singer" setting is enabled', async ({ page }) => {
  // TODO: implement step
});

Given('the current singer\'s song has just finished', async ({ page }) => {
  // TODO: implement step
});

When('there is another singer in the queue', async ({ page }) => {
  // TODO: implement step
});

Then('the system should automatically start the next singer\'s song after a {int}-second countdown', async ({ page }, arg: number) => {
  // TODO: implement step
});

Given('the "Filler Music" setting is enabled', async ({ page }) => {
  // TODO: implement step
});

When('there are no singers in the queue', async ({ page }) => {
  // TODO: implement step
});

Then('the system should automatically play the selected filler music playlist', async ({ page }) => {
  // TODO: implement step
});

When('a new singer is added to the queue', async ({ page }) => {
  // TODO: implement step
});

Then('the filler music should fade out', async ({ page }) => {
  // TODO: implement step
});

// queue_management.steps.ts
Given('the singer queue has the following singers: {string}, {string}, {string}', async ({ page }, arg: string, arg1: string, arg2: string) => {
  // TODO: implement step
});

When('the KJ drags {string} to the top of the queue', async ({ page }, arg: string) => {
  // TODO: implement step
});

Then('the queue order should be updated to: {string}, {string}, {string}', async ({ page }, arg: string, arg1: string, arg2: string) => {
  // TODO: implement step
});

When('the KJ removes {string} from the queue', async ({ page }, arg: string) => {
  // TODO: implement step
});

Then('the queue should only contain: {string}, {string}', async ({ page }, arg: string, arg1: string) => {
  // TODO: implement step
});

When('the KJ adds a new singer {string} to the queue', async ({ page }, arg: string) => {
  // TODO: implement step
});

Then('the queue should now contain: {string}, {string}, {string}, {string}', async ({ page }, arg: string, arg1: string, arg2: string, arg3: string) => {
  // TODO: implement step
});

// ticker_management.steps.ts
Given('the ticker is currently hidden', async ({ page }) => {
  // TODO: implement step
});

When('the KJ enters the message {string} and clicks "Show Ticker"', async ({ page }, arg: string) => {
  // TODO: implement step
});

Then('a scrolling ticker should appear at the bottom of all player screens with the message {string}', async ({ page }, arg: string) => {
  // TODO: implement step
});

Given('the ticker is currently showing the message {string}', async ({ page }, arg: string) => {
  // TODO: implement step
});

When('the KJ clicks "Hide Ticker"', async ({ page }) => {
  // TODO: implement step
});

Then('the ticker should be removed from all player screens', async ({ page }) => {
  // TODO: implement step
});

// youtube_management.steps.ts
Given('the KJ has authenticated their YouTube account', async ({ page }) => {
  // TODO: implement step
});

When('the KJ searches for {string} on YouTube', async ({ page }, arg: string) => {
  // TODO: implement step
});

Then('a list of relevant karaoke videos should be displayed', async ({ page }) => {
  // TODO: implement step
});

When('the KJ selects a video to add to the queue', async ({ page }) => {
  // TODO: implement step
});

Then('the video should be added to the singer queue', async ({ page }) => {
  // TODO: implement step
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

Given('the KJ is logged into the Admin Interface', async ({}) => {
  // Step: Given the KJ is logged into the Admin Interface
  // From: docs/features/kj_admin/queue_management.feature:8:5
});

Given('the KJ is running an offline session', async ({}) => {
  // Step: Given the KJ is running an offline session
  // From: docs/features/kj_admin/queue_management.feature:11:5
});

Given('the KJ receives a paper slip with {string} and {string}', async ({}, arg: string, arg1: string) => {
  // Step: And the KJ receives a paper slip with "Frank" and "My Way"
  // From: docs/features/kj_admin/queue_management.feature:12:5
});

When('the KJ uses the {string} form and enters {string} and searches for {string}', async ({}, arg: string, arg1: string, arg2: string) => {
  // Step: When the KJ uses the "Add Singer" form and enters "Frank" and searches for "My Way"
  // From: docs/features/kj_admin/queue_management.feature:13:5
});

When('selects the correct song from the local library', async ({}) => {
  // Step: And selects the correct song from the local library
  // From: docs/features/kj_admin/queue_management.feature:14:5
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

Then('{string} with the song {string} should be added to the bottom of the queue', async ({}, arg: string, arg1: string) => {
  // Step: Then "Frank" with the song "My Way" should be added to the bottom of the queue
  // From: docs/features/kj_admin/queue_management.feature:15:5
});

Given('the singer queue is: {int}. Alice, {int}. Bob, {int}. Charlie, {int}. Diana', async ({}, arg: number, arg1: number, arg2: number, arg3: number) => {
  // Step: Given the singer queue is: 1. Alice, 2. Bob, 3. Charlie, 4. Diana
  // From: docs/features/kj_admin/queue_management.feature:18:5
});

When('the KJ drags {string} from position {int} and drops them at position {int}', async ({}, arg: string, arg1: number, arg2: number) => {
  // Step: When the KJ drags "Charlie" from position 3 and drops them at position 1
  // From: docs/features/kj_admin/queue_management.feature:19:5
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

Given('at least one player screen is connected', async ({}) => {
  // Step: And at least one player screen is connected
  // From: docs/features/kj_admin/ticker_management.feature:9:5
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

When('the KJ clears the text from the ticker input', async ({}) => {
  // Step: When the KJ clears the text from the ticker input
  // From: docs/features/kj_admin/ticker_management.feature:26:5
});

Then('the scrolling ticker on all player screens should become empty and stop scrolling', async ({}) => {
  // Step: Then the scrolling ticker on all player screens should become empty and stop scrolling
  // From: docs/features/kj_admin/ticker_management.feature:28:5
});

Given('the KJ is running an online session with YouTube integration enabled', async ({}) => {
  // Step: Given the KJ is running an online session with YouTube integration enabled
  // From: docs/features/kj_admin/youtube_management.feature:8:5
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

Then('the song entry should display a real-time download progress indicator \\(e.g., {string})', async ({}, arg: string) => {
  // Step: Then the song entry should display a real-time download progress indicator (e.g., "Downloading... 45%")
  // From: docs/features/kj_admin/youtube_management.feature:14:5
});

Given('a requested YouTube song is currently downloading', async ({}) => {
  // Step: Given a requested YouTube song is currently downloading
  // From: docs/features/kj_admin/youtube_management.feature:17:5
});

When('the download fails due to a network error or unavailable video', async ({}) => {
  // Step: When the download fails due to a network error or unavailable video
  // From: docs/features/kj_admin/youtube_management.feature:18:5
});

Then('the song entry in the Admin Interface should show a {string} status', async ({}, arg: string) => {
  // Step: Then the song entry in the Admin Interface should show a "Download Failed" status
  // From: docs/features/kj_admin/youtube_management.feature:19:5
});

Then('the KJ should have an option to retry the download', async ({}) => {
  // Step: And the KJ should have an option to retry the download
  // From: docs/features/kj_admin/youtube_management.feature:20:5
});

Then('the singer should be notified on their device that there was an issue with their request', async ({}) => {
  // Step: And the singer should be notified on their device that there was an issue with their request
  // From: docs/features/kj_admin/youtube_management.feature:21:5
});
