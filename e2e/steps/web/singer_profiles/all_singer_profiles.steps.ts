import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';

const { Given, When, Then } = createBdd();

// management.steps.ts
Given('the singer "Alice" has sung the following songs in the past:', async ({ page }) => {
  // TODO: implement step
});

When('the KJ views the profile for "Alice"', async ({ page }) => {
  // TODO: implement step
});

Then('they should see a complete history of her past performances', async ({ page }) => {
  // TODO: implement step
});

When('the KJ adds a new note "Loves 80s rock" to her profile', async ({ page }) => {
  // TODO: implement step
});

Then('the note should be saved and visible on her profile', async ({ page }) => {
  // TODO: implement step
});

Given('a singer named {string} has sung at previous events', async ({}, arg: string) => {
  // Step: And a singer named "Regular Rita" has sung at previous events
  // From: docs/features/singer_profiles/management.feature:9:5
});

Given('{string} is in the current queue', async ({}, arg: string) => {
  // Step: Given "Regular Rita" is in the current queue
  // From: docs/features/singer_profiles/management.feature:12:5
});

When('the KJ views the details for {string}', async ({}, arg: string) => {
  // Step: When the KJ views the details for "Regular Rita"
  // From: docs/features/singer_profiles/management.feature:13:5
});

Then('the KJ should be able to see a list of songs {string} has sung in the past', async ({}, arg: string) => {
  // Step: Then the KJ should be able to see a list of songs "Regular Rita" has sung in the past
  // From: docs/features/singer_profiles/management.feature:14:5
});

Then('the date each song was sung', async ({}) => {
  // Step: And the date each song was sung
  // From: docs/features/singer_profiles/management.feature:15:5
});

Given('{string} is about to sing {string}', async ({}, arg: string, arg1: string) => {
  // Step: Given "Regular Rita" is about to sing "Dancing Queen"
  // From: docs/features/singer_profiles/management.feature:18:5
});

When('{string} finishes her performance', async ({}, arg: string) => {
  // Step: When "Regular Rita" finishes her performance
  // From: docs/features/singer_profiles/management.feature:19:5
});

Then('the song {string} should be added to her permanent song history', async ({}, arg: string) => {
  // Step: Then the song "Dancing Queen" should be added to her permanent song history
  // From: docs/features/singer_profiles/management.feature:20:5
});
