import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';

const { Given, When, Then } = createBdd();

// qr_code_access.steps.ts
Given('the KJ is running an online session', async ({ page }) => {
  // TODO: implement step
});

When('the KJ displays the session QR code on a player screen', async ({ page }) => {
  // TODO: implement step
});

When('a singer scans the QR code with their smartphone', async ({ page }) => {
  // TODO: implement step
});

Then('they should be taken to the Singer View for the current session in their mobile browser', async ({ page }) => {
  // TODO: implement step
});

// song_requests.steps.ts
Given('a singer is in the Singer View', async ({ page }) => {
  // TODO: implement step
});

When('they search for the song {string}', async ({ page }, arg: string) => {
  // TODO: implement step
});

Then('they should see a list of available versions of {string}', async ({ page }, arg: string) => {
  // TODO: implement step
});

When('they click the "Request" button next to a version', async ({ page }) => {
  // TODO: implement step
});

Then('the song should be added to the main queue on the KJ\'s Admin Interface', async ({ page }) => {
  // TODO: implement step
});

Then('the singer should see a confirmation message, e.g., "Your request for \'Bohemian Rhapsody\' has been sent!"', async ({ page }) => {
  // TODO: implement step
});

Given('a singer has successfully requested a song', async ({ page }) => {
  // TODO: implement step
});

Then('their position in the queue should be displayed in their Singer View', async ({ page }) => {
  // TODO: implement step
});

Given('the KJ is running an online session with ID {string}', async ({}, arg: string) => {
  // Step: Given the KJ is running an online session with ID "5678"
  // From: docs/features/singer_flow/qr_code_access.feature:7:5
});

When('the KJ enables the {string} option for player screens', async ({}, arg: string) => {
  // Step: When the KJ enables the "Show QR Code" option for player screens
  // From: docs/features/singer_flow/qr_code_access.feature:11:5
});

Then('a unique QR code for the session should be displayed as an overlay on all player screens', async ({}) => {
  // Step: Then a unique QR code for the session should be displayed as an overlay on all player screens
  // From: docs/features/singer_flow/qr_code_access.feature:12:5
});

Given('a QR code for session {string} is displayed on a player screen', async ({}, arg: string) => {
  // Step: Given a QR code for session "5678" is displayed on a player screen
  // From: docs/features/singer_flow/qr_code_access.feature:15:5
});

When('a singer scans the QR code with their mobile device', async ({}) => {
  // Step: When a singer scans the QR code with their mobile device
  // From: docs/features/singer_flow/qr_code_access.feature:16:5
});

Then('their device\'s web browser should open directly to the singer request page for session {string}', async ({}, arg: string) => {
  // Step: Then their device's web browser should open directly to the singer request page for session "5678"
  // From: docs/features/singer_flow/qr_code_access.feature:17:5
});

Then('they should not need to manually enter the Session ID', async ({}) => {
  // Step: And they should not need to manually enter the Session ID
  // From: docs/features/singer_flow/qr_code_access.feature:18:5
});

Given('the session allows requests from the local library and YouTube', async ({}) => {
  // Step: And the session allows requests from the local library and YouTube
  // From: docs/features/singer_flow/song_requests.feature:9:5
});

Given('a singer navigates to sing.nomadkaraoke.com', async ({}) => {
  // Step: Given a singer navigates to sing.nomadkaraoke.com
  // From: docs/features/singer_flow/song_requests.feature:12:5
});

When('the singer enters the session ID {string}', async ({}, arg: string) => {
  // Step: When the singer enters the session ID "1234"
  // From: docs/features/singer_flow/song_requests.feature:13:5
});

When('searches for the song {string}', async ({}, arg: string) => {
  // Step: And searches for the song "Bohemian Rhapsody"
  // From: docs/features/singer_flow/song_requests.feature:14:5
});

When('selects it from the search results', async ({}) => {
  // Step: And selects it from the search results
  // From: docs/features/singer_flow/song_requests.feature:15:5
});

When('enters their name as {string}', async ({}, arg: string) => {
  // Step: And enters their name as "Freddie"
  // From: docs/features/singer_flow/song_requests.feature:16:5
});

When('submits the request', async ({}) => {
  // Step: And submits the request
  // From: docs/features/singer_flow/song_requests.feature:17:5
});

Then('{string} should be added to the singer queue with {string}', async ({}, arg: string, arg1: string) => {
  // Step: Then "Freddie" should be added to the singer queue with "Bohemian Rhapsody"
  // From: docs/features/singer_flow/song_requests.feature:18:5
});

Then('the singer\'s phone should show their position in the queue', async ({}) => {
  // Step: And the singer's phone should show their position in the queue
  // From: docs/features/singer_flow/song_requests.feature:19:5
});

Given('a singer named {string} is in an online session', async ({}, arg: string) => {
  // Step: Given a singer named "Freddie" is in an online session
  // From: docs/features/singer_flow/song_requests.feature:22:5
});

When('{string} searches for a song that is only on YouTube', async ({}, arg: string) => {
  // Step: When "Freddie" searches for a song that is only on YouTube
  // From: docs/features/singer_flow/song_requests.feature:23:5
});

When('selects the YouTube result', async ({}) => {
  // Step: And selects the YouTube result
  // From: docs/features/singer_flow/song_requests.feature:24:5
});

Then('the song should be added to the KJ\'s queue', async ({}) => {
  // Step: Then the song should be added to the KJ's queue
  // From: docs/features/singer_flow/song_requests.feature:26:5
});

Then('the singer\'s UI should confirm the request was successful without indicating a download is in progress', async ({}) => {
  // Step: And the singer's UI should confirm the request was successful without indicating a download is in progress
  // From: docs/features/singer_flow/song_requests.feature:27:5
});

Given('a singer named {string} has already requested {string}', async ({}, arg: string, arg1: string) => {
  // Step: Given a singer named "Freddie" has already requested "Don't Stop Me Now"
  // From: docs/features/singer_flow/song_requests.feature:30:5
});

When('{string} requests a second song, {string}', async ({}, arg: string, arg1: string) => {
  // Step: When "Freddie" requests a second song, "Somebody to Love"
  // From: docs/features/singer_flow/song_requests.feature:31:5
});

Then('{string} should be added to Freddie\'s personal queue', async ({}, arg: string) => {
  // Step: Then "Somebody to Love" should be added to Freddie's personal queue
  // From: docs/features/singer_flow/song_requests.feature:32:5
});

Then('when {string} views their queue', async ({}, arg: string) => {
  // Step: And when "Freddie" views their queue
  // From: docs/features/singer_flow/song_requests.feature:33:5
});

Then('they should see both songs listed', async ({}) => {
  // Step: Then they should see both songs listed
  // From: docs/features/singer_flow/song_requests.feature:34:5
});

Then('they should have an option to remove {string}', async ({}, arg: string) => {
  // Step: And they should have an option to remove "Somebody to Love"
  // From: docs/features/singer_flow/song_requests.feature:35:5
});

Given('a singer named {string} has {string} in the main rotation and {string} in their personal queue', async ({}, arg: string, arg1: string, arg2: string) => {
  // Step: Given a singer named "Freddie" has "Don't Stop Me Now" in the main rotation and "Somebody to Love" in their personal queue
  // From: docs/features/singer_flow/song_requests.feature:38:5
});

When('{string} chooses to remove {string} from their queue', async ({}, arg: string, arg1: string) => {
  // Step: When "Freddie" chooses to remove "Somebody to Love" from their queue
  // From: docs/features/singer_flow/song_requests.feature:39:5
});

Then('{string} should be removed from their personal list', async ({}, arg: string) => {
  // Step: Then "Somebody to Love" should be removed from their personal list
  // From: docs/features/singer_flow/song_requests.feature:40:5
});

Then('it should not be added to the main rotation', async ({}) => {
  // Step: And it should not be added to the main rotation
  // From: docs/features/singer_flow/song_requests.feature:41:5
});

Given('a singer named {string} is next up in the rotation with the song {string}', async ({}, arg: string, arg1: string) => {
  // Step: Given a singer named "Freddie" is next up in the rotation with the song "Bohemian Rhapsody"
  // From: docs/features/singer_flow/song_requests.feature:44:5
});

When('{string} views their queue on their phone', async ({}, arg: string) => {
  // Step: When "Freddie" views their queue on their phone
  // From: docs/features/singer_flow/song_requests.feature:45:5
});

Then('the option to change or remove {string} should be disabled', async ({}, arg: string) => {
  // Step: Then the option to change or remove "Bohemian Rhapsody" should be disabled
  // From: docs/features/singer_flow/song_requests.feature:46:5
});
