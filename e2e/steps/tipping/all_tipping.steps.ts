import { createBdd, DataTable } from 'playwright-bdd';
import { expect } from '@playwright/test';

const { Given, When, Then } = createBdd();

// general_tipping.steps.ts
Given('the KJ has enabled tipping for the session', async ({ page }) => {
  // TODO: implement step
});

When('a singer in the Singer View clicks the "Tip the KJ" button', async ({ page }) => {
  // TODO: implement step
});

Then('they should be presented with a secure payment form', async ({ page }) => {
  // TODO: implement step
});

When('they complete a successful payment of ${int}', async ({ page }, arg: number) => {
  // TODO: implement step
});

Then('the KJ should receive a real-time notification of the tip on their Admin Interface', async ({ page }) => {
  // TODO: implement step
});

Then('the tip should be recorded in the session\'s financial records', async ({ page }) => {
  // TODO: implement step
});

// prize_raffle.steps.ts
Given('the KJ is running an online session with the "Tip Prize Raffle" enabled', async ({ page }) => {
  // TODO: implement step
});

Given('the KJ has set the prize as "A ${int} Bar Voucher"', async ({ page }, arg: number) => {
  // TODO: implement step
});

Given('three singers, "Alice", "Bob", and "Charlie", have tipped during the session', async ({ page }) => {
  // TODO: implement step
});

When('the KJ clicks the "Draw Raffle" button', async ({ page }) => {
  // TODO: implement step
});

Then('a winner should be randomly selected from the list of tippers', async ({ page }) => {
  // TODO: implement step
});

Then('a prominent overlay should be displayed on all player screens announcing the winner', async ({ page }) => {
  // TODO: implement step
});

Given('the KJ has just drawn "Charlie" as the winner', async ({ page }) => {
  // TODO: implement step
});

Given('the KJ determines that "Charlie" has already left the venue', async ({ page }) => {
  // TODO: implement step
});

When('the KJ clicks the "Draw Raffle Again" button', async ({ page }) => {
  // TODO: implement step
});

Then('a new winner should be randomly selected from the remaining tippers \\("Alice", "Bob")', async ({ page }) => {
  // TODO: implement step
});

Then('the winner announcement overlay should be updated with the new winner\'s name', async ({ page }) => {
  // TODO: implement step
});

Given('the KJ is running an online session with tipping enabled', async ({}) => {
  // Step: Given the KJ is running an online session with tipping enabled
  // From: docs/features/tipping/general_tipping.feature:7:5
});

Given('the minimum tip for a {string} is ${float}', async ({}, arg: string, arg1: number) => {
  // Step: And the minimum tip for a "Love Heart" is $2.00
  // From: docs/features/tipping/general_tipping.feature:8:5
});

Given('the KJ has configured {string} as a gated feature for tippers only', async ({}, arg: string) => {
  // Step: And the KJ has configured "YouTube Access" as a gated feature for tippers only
  // From: docs/features/tipping/general_tipping.feature:9:5
});

Given('a singer is requesting the song {string}', async ({}, arg: string) => {
  // Step: Given a singer is requesting the song "Like a Rolling Stone"
  // From: docs/features/tipping/general_tipping.feature:12:5
});

When('the singer chooses to add a ${float} tip during the request process', async ({}, arg: number) => {
  // Step: When the singer chooses to add a $5.00 tip during the request process
  // From: docs/features/tipping/general_tipping.feature:13:5
});

Then('the tip should be processed successfully', async ({}) => {
  // Step: Then the tip should be processed successfully
  // From: docs/features/tipping/general_tipping.feature:14:5
});

Then('a {string} icon should be displayed next to the singer\'s name in the queue', async ({}, arg: string) => {
  // Step: And a "Love Heart" icon should be displayed next to the singer's name in the queue
  // From: docs/features/tipping/general_tipping.feature:15:5
});

Given('a singer is viewing the main singer interface', async ({}) => {
  // Step: Given a singer is viewing the main singer interface
  // From: docs/features/tipping/general_tipping.feature:18:5
});

When('the singer uses the {string} feature to send a ${float} tip', async ({}, arg: string, arg1: number) => {
  // Step: When the singer uses the "Tip the KJ" feature to send a $10.00 tip
  // From: docs/features/tipping/general_tipping.feature:19:5
});

Then('the KJ should see the tip in their admin dashboard\'s tipping breakdown', async ({}) => {
  // Step: And the KJ should see the tip in their admin dashboard's tipping breakdown
  // From: docs/features/tipping/general_tipping.feature:21:5
});

Given('a singer is making a song request', async ({}) => {
  // Step: Given a singer is making a song request
  // From: docs/features/tipping/general_tipping.feature:24:5
});

When('the singer adds a ${float} tip', async ({}, arg: number) => {
  // Step: When the singer adds a $1.00 tip
  // From: docs/features/tipping/general_tipping.feature:25:5
});

Then('a {string} icon should not be displayed next to the singer\'s name', async ({}, arg: string) => {
  // Step: But a "Love Heart" icon should not be displayed next to the singer's name
  // From: docs/features/tipping/general_tipping.feature:27:5
});

Given('a singer has not tipped during the session', async ({}) => {
  // Step: Given a singer has not tipped during the session
  // From: docs/features/tipping/general_tipping.feature:30:5
});

When('the singer attempts to request a song from YouTube', async ({}) => {
  // Step: When the singer attempts to request a song from YouTube
  // From: docs/features/tipping/general_tipping.feature:31:5
});

Then('the UI should inform them that YouTube requests are for tippers only', async ({}) => {
  // Step: Then the UI should inform them that YouTube requests are for tippers only
  // From: docs/features/tipping/general_tipping.feature:32:5
});

Then('prompt them to add a tip to unlock the feature', async ({}) => {
  // Step: And prompt them to add a tip to unlock the feature
  // From: docs/features/tipping/general_tipping.feature:33:5
});

Given('a singer has previously tipped ${float} in the session', async ({}, arg: number) => {
  // Step: Given a singer has previously tipped $5.00 in the session
  // From: docs/features/tipping/general_tipping.feature:36:5
});

When('the singer searches for a song on YouTube', async ({}) => {
  // Step: When the singer searches for a song on YouTube
  // From: docs/features/tipping/general_tipping.feature:37:5
});

Then('they should be able to successfully request the YouTube song', async ({}) => {
  // Step: Then they should be able to successfully request the YouTube song
  // From: docs/features/tipping/general_tipping.feature:38:5
});

Given('the {string} feature is enabled', async ({}, arg: string) => {
  // Step: And the "Tip to Skip" feature is enabled
  // From: docs/features/tipping/tip_to_skip.feature:8:5
});

Given('the KJ has configured the following tiers:', async ({}, dataTable: DataTable) => {
  // Step: And the KJ has configured the following tiers:
  // From: docs/features/tipping/tip_to_skip.feature:9:5
});

Given('the cooldown period between skips is {int} songs', async ({}, arg: number) => {
  // Step: And the cooldown period between skips is 2 songs
  // From: docs/features/tipping/tip_to_skip.feature:13:5
});

Given('the per-singer skip limit is {int} per night', async ({}, arg: number) => {
  // Step: And the per-singer skip limit is 1 per night
  // From: docs/features/tipping/tip_to_skip.feature:14:5
});

Given('there are {int} singers in the queue', async ({}, arg: number) => {
  // Step: Given there are 10 singers in the queue
  // From: docs/features/tipping/tip_to_skip.feature:17:5
});

Given('a singer named {string} is at position {int}', async ({}, arg: string, arg1: number) => {
  // Step: And a singer named " impatient" is at position 8
  // From: docs/features/tipping/tip_to_skip.feature:18:5
});

When('{string} chooses to tip ${float} to skip', async ({}, arg: string, arg1: number) => {
  // Step: When "impatient" chooses to tip $5.00 to skip
  // From: docs/features/tipping/tip_to_skip.feature:19:5
});

Then('their position in the queue should change from {int} to {int}', async ({}, arg: number, arg1: number) => {
  // Step: Then their position in the queue should change from 8 to 5
  // From: docs/features/tipping/tip_to_skip.feature:20:5
});

Then('the KJ Admin Interface should reflect the new queue order', async ({}) => {
  // Step: And the KJ Admin Interface should reflect the new queue order
  // From: docs/features/tipping/tip_to_skip.feature:21:5
});

Given('a singer named {string} has already used their one skip for the night', async ({}, arg: string) => {
  // Step: Given a singer named "impatient" has already used their one skip for the night
  // From: docs/features/tipping/tip_to_skip.feature:24:5
});

When('{string} attempts to tip to skip again', async ({}, arg: string) => {
  // Step: When "impatient" attempts to tip to skip again
  // From: docs/features/tipping/tip_to_skip.feature:25:5
});

Then('the UI should show a message {string}', async ({}, arg: string) => {
  // Step: Then the UI should show a message "You have reached your skip limit for the night."
  // From: docs/features/tipping/tip_to_skip.feature:26:5
});

Then('the tip should not be processed', async ({}) => {
  // Step: And the tip should not be processed
  // From: docs/features/tipping/tip_to_skip.feature:27:5
});

Given('a singer just tipped to skip in the previous turn', async ({}) => {
  // Step: Given a singer just tipped to skip in the previous turn
  // From: docs/features/tipping/tip_to_skip.feature:30:5
});

When('{string} attempts to tip to skip', async ({}, arg: string) => {
  // Step: When "eager" attempts to tip to skip
  // From: docs/features/tipping/tip_to_skip.feature:32:5
});
